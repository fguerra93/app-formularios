import { getDb } from "@/server/db";

/**
 * Mensajería unificada multicanal: conversaciones (`conversaciones`) y mensajes
 * (`mensajes`). La usan el webhook de Meta, el motor del bot y la bandeja admin.
 * (Distinta de `whatsappRepo`, que cubre las tablas `*_whatsapp` legadas.)
 */
export const mensajeriaRepo = {
  /** Contexto del bot de una conversación (bot_context, cliente_id, estado). */
  async getConversacionContext(
    id: string
  ): Promise<{ bot_context: unknown; cliente_id: string | null; estado: string } | null> {
    const { data } = await getDb()
      .from("conversaciones")
      .select("bot_context, cliente_id, estado")
      .eq("id", id)
      .single();
    return (
      (data as { bot_context: unknown; cliente_id: string | null; estado: string } | null) ??
      null
    );
  },

  /** Conversación más reciente para (canal, contacto), o null. */
  async findByContacto(
    canal: string,
    contactoId: string
  ): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("conversaciones")
      .select("*")
      .eq("canal", canal)
      .eq("contacto_id", contactoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  /** Crea una conversación. Devuelve { id } o null si falla. */
  async createConversacion(
    values: Record<string, unknown>
  ): Promise<{ id: string } | null> {
    const { data, error } = await getDb()
      .from("conversaciones")
      .insert(values)
      .select("id")
      .single();
    if (error || !data) {
      console.error("Error creating conversacion:", error);
      return null;
    }
    return data as { id: string };
  },

  async updateConversacion(id: string, values: Record<string, unknown>): Promise<void> {
    await getDb().from("conversaciones").update(values).eq("id", id);
  },

  /** Inserta un mensaje (entrante o saliente) en la conversación. */
  async insertMensaje(values: Record<string, unknown>): Promise<void> {
    await getDb().from("mensajes").insert(values);
  },

  /** Últimos mensajes salientes de una conversación (para el modo test). */
  async listMensajesSalientes(
    conversacionId: string,
    limit = 3
  ): Promise<Record<string, unknown>[]> {
    const { data } = await getDb()
      .from("mensajes")
      .select("contenido, tipo, created_at")
      .eq("conversacion_id", conversacionId)
      .eq("direccion", "saliente")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || []) as Record<string, unknown>[];
  },

  // --- Admin: bandeja de conversaciones ---
  async listConversaciones(opts: {
    canal?: string | null;
    estado?: string | null;
    etiqueta?: string | null;
    busqueda?: string | null;
    offset: number;
    limit: number;
  }): Promise<{ data: Record<string, unknown>[]; count: number }> {
    let query = getDb()
      .from("conversaciones")
      .select("*", { count: "exact" })
      .order("ultimo_mensaje_at", { ascending: false });
    if (opts.canal) query = query.eq("canal", opts.canal);
    if (opts.estado) query = query.eq("estado", opts.estado);
    if (opts.etiqueta) query = query.contains("etiquetas", [opts.etiqueta]);
    if (opts.busqueda)
      query = query.or(
        `contacto_nombre.ilike.%${opts.busqueda}%,contacto_telefono.ilike.%${opts.busqueda}%,contacto_username.ilike.%${opts.busqueda}%`
      );
    query = query.range(opts.offset, opts.offset + opts.limit - 1);
    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as Record<string, unknown>[], count: count || 0 };
  },

  async findConversacion(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("conversaciones")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async listMensajes(conversacionId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", conversacionId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async updateConversacionReturning(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("conversaciones")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar conversacion");
    return data as Record<string, unknown>;
  },

  async insertMensajeReturning(
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("mensajes")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al guardar mensaje");
    return data as Record<string, unknown>;
  },

  async updateMensaje(id: string, values: Record<string, unknown>): Promise<void> {
    await getDb().from("mensajes").update(values).eq("id", id);
  },

  async findMensajeById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("mensajes")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  // --- Admin: stats ---
  async listConversacionCanales(): Promise<{ canal: string | null }[]> {
    const { data } = await getDb().from("conversaciones").select("canal");
    return (data || []) as { canal: string | null }[];
  },

  async countMensajesDesde(sinceISO: string): Promise<number> {
    const { count } = await getDb()
      .from("mensajes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO);
    return count || 0;
  },

  async listConversacionesAbiertasIds(): Promise<{ id: string }[]> {
    const { data } = await getDb()
      .from("conversaciones")
      .select("id")
      .eq("estado", "abierta");
    return (data || []) as { id: string }[];
  },

  async ultimoMensajeDireccion(
    conversacionId: string
  ): Promise<{ direccion: string } | null> {
    const { data } = await getDb()
      .from("mensajes")
      .select("direccion")
      .eq("conversacion_id", conversacionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return (data as { direccion: string } | null) ?? null;
  },

  async listMensajesParaTiempo(
    limit = 1000
  ): Promise<{ conversacion_id: string; direccion: string; created_at: string }[]> {
    const { data } = await getDb()
      .from("mensajes")
      .select("conversacion_id, direccion, created_at")
      .in("direccion", ["entrante", "saliente"])
      .order("created_at", { ascending: true })
      .limit(limit);
    return (data || []) as {
      conversacion_id: string;
      direccion: string;
      created_at: string;
    }[];
  },
};

/** Plantillas de respuesta rápida del operador (`mensajes_rapidos`). */
export const mensajesRapidosRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("mensajes_rapidos")
      .select("*")
      .order("categoria", { ascending: true })
      .order("titulo", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("mensajes_rapidos")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear mensaje rapido");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("mensajes_rapidos")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar mensaje rapido");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("mensajes_rapidos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

/** Reglas de respuesta automática por palabra clave (`respuestas_automaticas`). */
export const respuestasAutomaticasRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("respuestas_automaticas")
      .select("*")
      .order("prioridad", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("respuestas_automaticas")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear respuesta automatica");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("respuestas_automaticas")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar respuesta automatica");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("respuestas_automaticas").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
