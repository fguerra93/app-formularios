import { getDb } from "@/server/db";

/** Plantillas de email para campañas (`email_templates`). */
export const templatesRepo = {
  async listActivos(categoria?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("email_templates")
      .select("*")
      .eq("activo", true)
      .order("updated_at", { ascending: false });
    if (categoria) query = query.eq("categoria", categoria);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("email_templates")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear template");
    return data as Record<string, unknown>;
  },

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("email_templates")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar template");
    return data as Record<string, unknown>;
  },

  async findEsPreset(id: string): Promise<{ es_preset: boolean } | null> {
    const { data } = await getDb()
      .from("email_templates")
      .select("es_preset")
      .eq("id", id)
      .single();
    return (data as { es_preset: boolean } | null) ?? null;
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await getDb()
      .from("email_templates")
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Solo el HTML de una plantilla (para componer campañas), o null. */
  async findContenidoHtml(id: string): Promise<{ contenido_html: string | null } | null> {
    const { data } = await getDb()
      .from("email_templates")
      .select("contenido_html")
      .eq("id", id)
      .single();
    return (data as { contenido_html: string | null } | null) ?? null;
  },
};
