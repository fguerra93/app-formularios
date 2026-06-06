import { getDb } from "@/server/db";

interface ReservaResult {
  ok: boolean;
  faltantes: { producto_id: string; nombre: string; disponible: number; solicitado: number }[];
}

/**
 * Reserva de stock con TTL (Patrón 9) — envuelve las funciones plpgsql
 * reservar_stock / confirmar_reserva / liberar_reserva / liberar_reservas_vencidas
 * (ver supabase/schema-fase3-nucleo.sql). Solo afecta productos con
 * controla_stock = true; los "bajo pedido" no mueven stock.
 */
export const stockRepo = {
  async reservar(
    items: { producto_id: string; cantidad: number }[],
    pedidoId: string
  ): Promise<ReservaResult> {
    const { data, error } = await getDb().rpc("reservar_stock", {
      p_items: items,
      p_pedido: pedidoId,
    });
    if (error) throw new Error(error.message);
    return (data as ReservaResult) ?? { ok: true, faltantes: [] };
  },

  async confirmarReserva(pedidoId: string): Promise<void> {
    const { error } = await getDb().rpc("confirmar_reserva", { p_pedido: pedidoId });
    if (error) throw new Error(error.message);
  },

  async liberarReserva(pedidoId: string): Promise<void> {
    const { error } = await getDb().rpc("liberar_reserva", { p_pedido: pedidoId });
    if (error) throw new Error(error.message);
  },

  /** Libera reservas de pedidos sin pagar más antiguos que `minutos`. Devuelve cuántos. */
  async liberarVencidas(minutos = 30): Promise<number> {
    const { data, error } = await getDb().rpc("liberar_reservas_vencidas", {
      p_minutos: minutos,
    });
    if (error) throw new Error(error.message);
    return (data as number) ?? 0;
  },

  /** Repone stock (devolución/cancelación) vía reponer_stock. */
  async reponer(
    items: { producto_id: string; cantidad: number }[],
    pedidoId: string,
    tipo = "devolucion"
  ): Promise<void> {
    const { error } = await getDb().rpc("reponer_stock", {
      p_items: items,
      p_pedido: pedidoId,
      p_tipo: tipo,
    });
    if (error) throw new Error(error.message);
  },
};
