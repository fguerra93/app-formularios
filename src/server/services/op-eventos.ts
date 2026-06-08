import { domainEventsRepo } from "@/server/repositories";

/**
 * Efectos de dominio al cambiar el estado de una OP (Patrón 2). Centraliza la
 * emisión de eventos para que el admin (`/api/admin/op/[id]`) y el taller
 * (`/api/taller/op/[id]/avanzar`) disparen EXACTAMENTE los mismos avisos, sin
 * duplicar lógica ni arriesgar drift.
 *
 * Mapa estado de taller -> hito visible para el cliente (lo consume el worker
 * proactivo en cron/procesar-eventos, que envía el WhatsApp).
 */
const OP_A_CLIENTE: Record<string, string> = {
  imprimiendo: "preparando",
  listo: "listo",
  entregado: "entregado",
};

export async function emitirEfectosCambioEstadoOP(opts: {
  opId: string;
  numeroOp?: unknown;
  pedidoId?: string | null;
  estado: string;
}): Promise<void> {
  await domainEventsRepo.emit("op.estado", {
    op_id: opts.opId,
    numero_op: opts.numeroOp ?? null,
    estado: opts.estado,
  });

  const estadoCliente = OP_A_CLIENTE[opts.estado];
  if (estadoCliente && opts.pedidoId) {
    await domainEventsRepo.emit("pedido.estado", {
      pedido_id: opts.pedidoId,
      numero_pedido: null,
      estado: estadoCliente,
    });
  }
}
