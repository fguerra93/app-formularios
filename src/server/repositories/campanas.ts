import { getDb } from "@/server/db";

/**
 * Acceso a campañas de marketing (`campanas`) y sus envíos (`campana_envios`).
 * Por ahora cubre el tracking de aperturas/clics; se ampliará con el CRUD de
 * campañas en su lote correspondiente.
 */
export const campanasRepo = {
  /** Un envío por id (id, campana_id, estado), o null. */
  async getEnvio(
    id: string
  ): Promise<{ id: string; campana_id: string; estado: string } | null> {
    const { data } = await getDb()
      .from("campana_envios")
      .select("id, campana_id, estado")
      .eq("id", id)
      .single();
    return (data as { id: string; campana_id: string; estado: string } | null) ?? null;
  },

  async updateEnvio(id: string, values: Record<string, unknown>): Promise<void> {
    await getDb().from("campana_envios").update(values).eq("id", id);
  },

  /** Contadores de una campaña (total_clicks, total_abiertos), o null. */
  async getContadores(
    id: string
  ): Promise<{ total_clicks: number | null; total_abiertos: number | null } | null> {
    const { data } = await getDb()
      .from("campanas")
      .select("total_clicks, total_abiertos")
      .eq("id", id)
      .single();
    return (data as { total_clicks: number | null; total_abiertos: number | null } | null) ?? null;
  },

  async updateCampana(id: string, values: Record<string, unknown>): Promise<void> {
    await getDb().from("campanas").update(values).eq("id", id);
  },

  // --- CRUD de campañas ---
  async listCampanas(estado?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("campanas")
      .select("*")
      .order("created_at", { ascending: false });
    if (estado) query = query.eq("estado", estado);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async createCampana(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("campanas")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear campana");
    return data as Record<string, unknown>;
  },

  async findCampana(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb().from("campanas").select("*").eq("id", id).single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async updateCampanaReturning(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("campanas")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar campana");
    return data as Record<string, unknown>;
  },

  async findCampanaEstado(id: string): Promise<{ estado: string } | null> {
    const { data } = await getDb()
      .from("campanas")
      .select("estado")
      .eq("id", id)
      .single();
    return (data as { estado: string } | null) ?? null;
  },

  /** Stats resumidas de una campaña (columnas de totales), o null. */
  async findCampanaStats(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("campanas")
      .select(
        "id, nombre, asunto, estado, total_destinatarios, total_enviados, total_abiertos, total_clicks, total_errores, enviada_at, created_at"
      )
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async deleteEnviosByCampana(campanaId: string): Promise<void> {
    await getDb().from("campana_envios").delete().eq("campana_id", campanaId);
  },

  async deleteCampana(id: string): Promise<void> {
    const { error } = await getDb().from("campanas").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // --- Envíos ---
  async listEnvios(campanaId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("campana_envios")
      .select("id, email, nombre, estado, abierto_at, click_at, error_msg, created_at")
      .eq("campana_id", campanaId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  /** Crea registros de envío y devuelve { id, email, nombre } o null si falla. */
  async createEnvios(
    records: Record<string, unknown>[]
  ): Promise<{ id: string; email: string; nombre: string | null }[] | null> {
    const { data, error } = await getDb()
      .from("campana_envios")
      .insert(records)
      .select("id, email, nombre");
    if (error || !data) {
      console.error("Error creating envio records:", error);
      return null;
    }
    return data as { id: string; email: string; nombre: string | null }[];
  },
};
