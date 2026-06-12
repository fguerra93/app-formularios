import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyAuth } from "@/lib/auth";
import {
  pedidosRepo,
  auditRepo,
  domainEventsRepo,
  stockRepo,
} from "@/server/repositories";
import { puedeTransicionar } from "@/server/services/pedido-fsm";
import { emailEstadoPedido } from "@/server/services/emails";
import type { Pedido } from "@/server/domain";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await pedidosRepo.findById(id);

  if (!data) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

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

  // FSM (Patrón 1): validar la transición de estado contra el estado actual.
  if (body.estado) {
    const actual = await pedidosRepo.findById(id);
    if (!actual) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (!puedeTransicionar(String(actual.estado), body.estado)) {
      return NextResponse.json(
        { error: `Transición de estado no permitida: ${actual.estado} → ${body.estado}` },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.estado) updateData.estado = body.estado;
  if (body.pago_estado) updateData.pago_estado = body.pago_estado;
  if (body.notas !== undefined) updateData.notas = body.notas;

  let data: Pedido;
  try {
    data = await pedidosRepo.update(id, updateData);
  } catch (e) {
    console.error("Error updating pedido:", e);
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }

  // Evento de dominio (Patrón 2) + liberación de reserva al cancelar.
  if (body.estado) {
    await domainEventsRepo.emit("pedido.estado", {
      pedido_id: id,
      numero_pedido: data.numero_pedido,
      estado: body.estado,
    });
    if (body.estado === "cancelado") {
      try {
        await stockRepo.liberarReserva(id);
      } catch (e) {
        console.error("liberarReserva error (no fatal):", e);
      }
    }
  }

  // Audit log de acciones sensibles (cambio de estado / validación de pago).
  if (body.estado || body.pago_estado) {
    await auditRepo.log({
      usuario: session.sub,
      accion: body.pago_estado ? "pago.validar" : "pedido.estado",
      entidad: "pedido",
      entidad_id: id,
      datos: {
        numero_pedido: data.numero_pedido,
        estado: body.estado,
        pago_estado: body.pago_estado,
      },
    });
  }

  // Email al cliente en cambios de estado relevantes — servicio único
  if (
    body.estado &&
    ["confirmado", "preparando", "enviado", "entregado"].includes(body.estado)
  ) {
    try {
      await emailEstadoPedido(data, body.estado);
    } catch (e) {
      console.error("Error sending status email:", e);
    }
  }

  return NextResponse.json(data);
}
