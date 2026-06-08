import {
  ordenesProduccionRepo,
  pedidosRepo,
  gangSheetsRepo,
} from "@/server/repositories";
import type { Pedido, ItemPedido } from "@/server/domain";

/**
 * Crea la Orden de Producción de un pedido (idempotente). Centralizado para que
 * lo usen TANTO el worker del outbox (cron/procesar-eventos, al pagar) COMO el
 * bot que cierra pedidos (Fase F3) — misma comanda, venga de donde venga.
 *
 * Si el pedido incluye un pliego (gang sheet, Fase F1), la OP nace con su
 * archivo listo, material y dimensiones. Etiqueta el canal del pedido en la OP
 * (best-effort: no rompe si la columna `canal` aún no está migrada).
 */
export async function crearOPDesdePedido(pedidoId: string): Promise<Record<string, unknown> | null> {
  try {
    if (await ordenesProduccionRepo.existePorPedido(pedidoId)) return null;
    const pedido = (await pedidosRepo.findById(pedidoId)) as Pedido | null;
    if (!pedido) return null;
    const items = (Array.isArray(pedido.items) ? pedido.items : []) as ItemPedido[];
    const cantidad = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0) || 1;
    let tipo = items[0]?.nombre || "Trabajo";

    const datosOP: Record<string, unknown> = {
      pedido_id: pedidoId,
      cantidad,
      precio_total: pedido.total,
      tipo_entrega: pedido.tipo_entrega,
      estado: "en_cola",
    };

    const itemPliego = items.find(
      (i) => (i.variante as Record<string, string> | null)?.gang_sheet_id
    );
    const gangSheetId = (itemPliego?.variante as Record<string, string> | null)?.gang_sheet_id;
    let gangSheet: Record<string, unknown> | null = null;
    if (gangSheetId) {
      gangSheet = await gangSheetsRepo.findById(gangSheetId);
      if (gangSheet) {
        const mat = String(gangSheet.material || "");
        tipo = `Pliego ${mat}`;
        datosOP.material = mat;
        datosOP.dimensiones = `${String(gangSheet.ancho_pliego_cm)}×${String(gangSheet.alto_pliego_cm)} cm`;
        datosOP.archivo_diseno_url = `/api/gang-sheets/${gangSheetId}/pliego`;
      }
    }
    datosOP.tipo = tipo;

    const op = await ordenesProduccionRepo.create(datosOP);

    // Etiqueta el canal del pedido en la OP (web|whatsapp|manual). Best-effort.
    if (op) {
      const canal = (pedido as { canal?: string }).canal || "web";
      try {
        await ordenesProduccionRepo.update(String(op.id), { canal });
      } catch {
        /* columna canal no aplicada todavía: ignorar */
      }
    }

    // Enlaza el pliego a su OP/pedido (trazabilidad).
    if (gangSheet && op) {
      await gangSheetsRepo.update(String(gangSheet.id), {
        pedido_id: pedidoId,
        op_id: op.id,
        estado: "en_op",
      });
    }

    return op;
  } catch (e) {
    console.error("crear OP (no fatal):", e);
    return null;
  }
}
