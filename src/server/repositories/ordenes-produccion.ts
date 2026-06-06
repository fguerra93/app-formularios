import { getDb } from "@/server/db";

/** Órdenes de producción del taller (`ordenes_produccion`). */
export const ordenesProduccionRepo = {
  async list(estado?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("ordenes_produccion")
      .select("*")
      .order("prioridad", { ascending: false })
      .order("created_at", { ascending: true });
    if (estado) query = query.eq("estado", estado);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("ordenes_produccion")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async existePorPedido(pedidoId: string): Promise<boolean> {
    const { data } = await getDb()
      .from("ordenes_produccion")
      .select("id")
      .eq("pedido_id", pedidoId)
      .maybeSingle();
    return !!data;
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("ordenes_produccion")
      .insert(values)
      .select()
      .single();
    if (error || !data) {
      console.error("Error creando OP:", error);
      return null;
    }
    return data as Record<string, unknown>;
  },

  async update(id: string, values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("ordenes_produccion")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar OP");
    return data as Record<string, unknown>;
  },
};
