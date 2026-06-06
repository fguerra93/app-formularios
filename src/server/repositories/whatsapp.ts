import { getDb } from "@/server/db";

/**
 * Acceso a la mensajería WhatsApp: conversaciones (`conversaciones_whatsapp`),
 * mensajes (`mensajes_whatsapp`) y cotizaciones (`cotizaciones_whatsapp`).
 * Lo usan tanto el admin como el bot y el webhook de Meta.
 */
export const whatsappRepo = {
  // --- Conversaciones ---
  async listConversaciones(opts: {
    estado?: string | null;
    offset: number;
    limit: number;
  }): Promise<{ data: Record<string, unknown>[]; count: number }> {
    let query = getDb()
      .from("conversaciones_whatsapp")
      .select("*", { count: "exact" })
      .order("ultimo_mensaje_at", { ascending: false });
    if (opts.estado) query = query.eq("estado", opts.estado);
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as Record<string, unknown>[], count: count || 0 };
  },

  async findConversacion(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("conversaciones_whatsapp")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async findConversacionBasica(
    id: string
  ): Promise<{ id: string; telefono: string } | null> {
    const { data } = await getDb()
      .from("conversaciones_whatsapp")
      .select("id, telefono")
      .eq("id", id)
      .single();
    return (data as { id: string; telefono: string } | null) ?? null;
  },

  async updateConversacion(id: string, values: Record<string, unknown>): Promise<void> {
    const { error } = await getDb()
      .from("conversaciones_whatsapp")
      .update(values)
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  // --- Mensajes ---
  async countMensajes(conversacionId: string): Promise<number> {
    const { count } = await getDb()
      .from("mensajes_whatsapp")
      .select("*", { count: "exact", head: true })
      .eq("conversacion_id", conversacionId);
    return count || 0;
  },

  async ultimoMensaje(
    conversacionId: string
  ): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("mensajes_whatsapp")
      .select("contenido, direccion, created_at")
      .eq("conversacion_id", conversacionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async listMensajes(conversacionId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("mensajes_whatsapp")
      .select("*")
      .eq("conversacion_id", conversacionId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async insertMensaje(
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("mensajes_whatsapp")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al insertar mensaje");
    return data as Record<string, unknown>;
  },

  // --- Cotizaciones ---
  async listCotizaciones(opts: {
    estado?: string | null;
    offset: number;
    limit: number;
  }): Promise<{ data: Record<string, unknown>[]; count: number }> {
    let query = getDb()
      .from("cotizaciones_whatsapp")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (opts.estado) query = query.eq("estado", opts.estado);
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as Record<string, unknown>[], count: count || 0 };
  },

  async updateCotizacion(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("cotizaciones_whatsapp")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return null;
    return data as Record<string, unknown>;
  },

  // --- Stats ---
  async countConversaciones(): Promise<number> {
    const { count } = await getDb()
      .from("conversaciones_whatsapp")
      .select("*", { count: "exact", head: true });
    return count || 0;
  },

  async listConversacionEstados(): Promise<{ estado: string | null }[]> {
    const { data } = await getDb().from("conversaciones_whatsapp").select("estado");
    return (data || []) as { estado: string | null }[];
  },

  async countMensajesDesde(sinceISO: string): Promise<number> {
    const { count } = await getDb()
      .from("mensajes_whatsapp")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO);
    return count || 0;
  },

  async listMensajesSalientesProcesador(): Promise<{ procesado_por: string | null }[]> {
    const { data } = await getDb()
      .from("mensajes_whatsapp")
      .select("procesado_por")
      .eq("direccion", "saliente");
    return (data || []) as { procesado_por: string | null }[];
  },

  async countCotizaciones(): Promise<number> {
    const { count } = await getDb()
      .from("cotizaciones_whatsapp")
      .select("*", { count: "exact", head: true });
    return count || 0;
  },

  async listCotizacionEstados(): Promise<{ estado: string | null }[]> {
    const { data } = await getDb().from("cotizaciones_whatsapp").select("estado");
    return (data || []) as { estado: string | null }[];
  },
};
