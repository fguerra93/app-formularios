import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  pedidosRepo,
  stockRepo,
  pagosRepo,
  domainEventsRepo,
  auditRepo,
} from "@/server/repositories";
import { puedeTransicionar } from "@/server/services/pedido-fsm";

export const dynamic = "force-dynamic";

/**
 * Procesa una devolución (Fase 6): transición a 'devuelto' (FSM), repone
 * stock, emite nota de crédito (mock en sandbox) y registra el evento.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const motivo: string | null = body.motivo ?? null;

  const pedido = await pedidosRepo.findById(id);
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (!puedeTransicionar(String(pedido.estado), "devuelto")) {
    return NextResponse.json(
      { error: `No se puede devolver un pedido en estado "${pedido.estado}"` },
      { status: 400 }
    );
  }

  // 1. Estado -> devuelto.
  await pedidosRepo.update(id, {
    estado: "devuelto",
    updated_at: new Date().toISOString(),
  });

  // 2. Reposición de stock (best-effort; solo productos con controla_stock).
  try {
    const items = Array.isArray(pedido.items)
      ? (pedido.items as { producto_id?: string; cantidad?: number }[])
          .filter((i) => i.producto_id && i.cantidad)
          .map((i) => ({ producto_id: i.producto_id as string, cantidad: i.cantidad as number }))
      : [];
    if (items.length > 0) {
      await stockRepo.reponer(items, id, "devolucion");
    }
  } catch (e) {
    console.error("reponer_stock (no fatal):", e);
  }

  // 3. Nota de crédito (mock en sandbox).
  let nota: Record<string, unknown> | null = null;
  try {
    nota = await pagosRepo.crearNotaCredito({
      pedido_id: id,
      folio: `MOCK-NC-${pedido.numero_pedido ?? Date.now()}`,
      monto: Number(pedido.total) || 0,
      motivo,
      url: null,
      emitida_por: session.sub,
    });
  } catch (e) {
    console.error("crear nota de crédito (no fatal):", e);
  }

  // 4. Evento + audit.
  await domainEventsRepo.emit("pedido.estado", {
    pedido_id: id,
    numero_pedido: pedido.numero_pedido,
    estado: "devuelto",
  });
  await auditRepo.log({
    usuario: session.sub,
    accion: "pedido.devolucion",
    entidad: "pedido",
    entidad_id: id,
    datos: { numero_pedido: pedido.numero_pedido, motivo },
  });

  return NextResponse.json({ success: true, nota });
}
