import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  aprobacionesRepo,
  auditRepo,
  domainEventsRepo,
  notificacionesRepo,
  pedidosRepo,
  stockRepo,
} from "@/server/repositories";
import { puedeTransicionar } from "@/server/services/pedido-fsm";
import { emitirDocumento } from "@/server/services/dte";
import type { Pedido } from "@/server/domain";

export const dynamic = "force-dynamic";

/**
 * Resuelve una aprobación: body { accion: "aprobar" | "rechazar", nota? }.
 * Al APROBAR se dispara el efecto real (Patrón 3 + 2). El sistema/bot nunca
 * ejecutó la acción; recién aquí, con el OK del dueño, ocurre.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const accion = body.accion as "aprobar" | "rechazar";
  if (accion !== "aprobar" && accion !== "rechazar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  let aprobacion;
  try {
    aprobacion = await aprobacionesRepo.resolver(
      id,
      accion === "aprobar" ? "aprobada" : "rechazada",
      session.sub,
      body.nota ?? null
    );
  } catch (e) {
    console.error("Error resolviendo aprobacion:", e);
    return NextResponse.json(
      { error: "No se pudo resolver (¿ya estaba resuelta?)" },
      { status: 409 }
    );
  }

  await auditRepo.log({
    usuario: session.sub,
    accion: `aprobacion.${accion}`,
    entidad: "aprobacion",
    entidad_id: id,
    datos: { tipo: aprobacion.tipo },
  });

  if (accion === "aprobar") {
    await ejecutarEfecto(aprobacion);
  }

  return NextResponse.json(aprobacion);
}

/** Dispara el efecto de una aprobación recién aprobada. */
async function ejecutarEfecto(aprobacion: Record<string, unknown>): Promise<void> {
  const tipo = aprobacion.tipo as string;
  const payload = (aprobacion.payload as Record<string, unknown>) || {};

  try {
    if (tipo === "validar_pago" && payload.pedido_id) {
      const pedidoId = String(payload.pedido_id);
      const pedido = await pedidosRepo.findById(pedidoId);
      if (pedido) {
        const updateData: Record<string, unknown> = {
          pago_estado: "pagado",
          updated_at: new Date().toISOString(),
        };
        // Avanzar estado solo si la FSM lo permite (pendiente -> confirmado).
        if (puedeTransicionar(String(pedido.estado), "confirmado")) {
          updateData.estado = "confirmado";
        }
        await pedidosRepo.update(pedidoId, updateData);
        try {
          await stockRepo.confirmarReserva(pedidoId);
        } catch (e) {
          console.error("confirmar_reserva (no fatal):", e);
        }
        await domainEventsRepo.emit("pedido.pagado", {
          pedido_id: pedidoId,
          numero_pedido: pedido.numero_pedido,
        });
        try {
          await emitirDocumento(pedido as Pedido);
        } catch (e) {
          console.error("emitir DTE (no fatal):", e);
        }
      }
    } else {
      // enviar_cotizacion / responder_cliente / aprobar_arte:
      // se emite un evento para que el worker/bot (Fase 5) ejecute el envío.
      await domainEventsRepo.emit(`aprobacion.${tipo}`, payload);
    }

    await notificacionesRepo.crear({
      tipo: "sistema",
      titulo: `Aprobación ejecutada: ${aprobacion.titulo}`,
      cuerpo: null,
      enlace: "/admin/aprobaciones",
    });
  } catch (e) {
    console.error("Error ejecutando efecto de aprobacion:", e);
  }
}
