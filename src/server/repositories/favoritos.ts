import { getDb } from "@/server/db";

/** Acceso a la tabla `favoritos` (productos guardados por el cliente). */
export const favoritosRepo = {
  /** Favoritos de un cliente con el producto embebido. */
  async listByCliente(clienteId: string): Promise<Record<string, unknown>[]> {
    const { data } = await getDb()
      .from("favoritos")
      .select("*, productos(*)")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    return (data || []) as Record<string, unknown>[];
  },

  /** Agrega un favorito (idempotente por par cliente/producto). */
  async add(clienteId: string, productoId: string): Promise<void> {
    await getDb()
      .from("favoritos")
      .upsert(
        { cliente_id: clienteId, producto_id: productoId },
        { onConflict: "cliente_id,producto_id" }
      );
  },

  /** Quita un favorito por su id (validando el dueño). */
  async remove(id: string, clienteId: string): Promise<void> {
    await getDb().from("favoritos").delete().eq("id", id).eq("cliente_id", clienteId);
  },
};
