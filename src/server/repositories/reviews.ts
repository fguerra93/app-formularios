import { getDb } from "@/server/db";

/** Acceso a la tabla `reviews` (reseñas de productos). */
export const reviewsRepo = {
  /** Lista admin de reseñas, filtrable por estado. */
  async listAdmin(estado?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("reviews")
      .select("*, producto:productos(id, nombre, slug)")
      .order("created_at", { ascending: false });

    if (estado === "pendientes") {
      query = query.eq("aprobada", false);
    } else if (estado === "aprobadas") {
      query = query.eq("aprobada", true);
    } else if (estado === "rechazadas") {
      // Rechazadas se manejan como aprobada=false pero con un campo adicional
      // o como registros eliminados. Por consistencia, filtramos las no aprobadas.
      query = query.eq("aprobada", false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("reviews")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar review");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("reviews").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // --- Público ---
  /** Reseñas aprobadas de un producto (orden reciente primero). */
  async listAprobadasByProducto(
    productoId: string
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("reviews")
      .select("*")
      .eq("producto_id", productoId)
      .eq("aprobada", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  /** Crea una reseña pública (queda no aprobada hasta moderación). */
  async createPublica(
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("reviews")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear review");
    return data as Record<string, unknown>;
  },
};
