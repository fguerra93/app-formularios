import { getDb } from "@/server/db";

/** Acceso a la tabla `suscriptores` (newsletter). */
export const newsletterRepo = {
  /** Suscriptor por email (normalizado a minúsculas por el llamador). */
  async findByEmail(email: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("suscriptores")
      .select("*")
      .eq("email", email)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  /** Reactiva un suscriptor inactivo (y opcionalmente actualiza el nombre). */
  async reactivate(id: string, nombre: string | null): Promise<void> {
    const { error } = await getDb()
      .from("suscriptores")
      .update({ activo: true, nombre })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async create(values: {
    email: string;
    nombre: string | null;
    fuente: string | null;
    activo: boolean;
  }): Promise<void> {
    const { error } = await getDb().from("suscriptores").insert(values);
    if (error) throw new Error(error.message);
  },

  /** Desuscribe por email (activo=false). */
  async desuscribir(email: string): Promise<void> {
    const { error } = await getDb()
      .from("suscriptores")
      .update({ activo: false })
      .eq("email", email);
    if (error) throw new Error(error.message);
  },

  /** Lista admin, filtrable por búsqueda de email. */
  async listAdmin(search?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("suscriptores")
      .select("*")
      .order("created_at", { ascending: false });
    if (search) query = query.ilike("email", `%${search}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  /** Emails de suscriptores activos (para campañas/newsletter). */
  async listActivosEmails(): Promise<{ email: string }[]> {
    const { data, error } = await getDb()
      .from("suscriptores")
      .select("email")
      .eq("activo", true);
    if (error) throw new Error(error.message);
    return (data || []) as { email: string }[];
  },

  /** Cantidad de suscriptores activos (para preview de segmentos). */
  async countActivos(): Promise<number> {
    const { count } = await getDb()
      .from("suscriptores")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);
    return count || 0;
  },

  /** Suscriptores activos con email y nombre (campañas). `limit` opcional para preview. */
  async listActivosEmailNombre(
    limit?: number
  ): Promise<{ email: string; nombre: string | null }[]> {
    let query = getDb()
      .from("suscriptores")
      .select("email, nombre")
      .eq("activo", true);
    if (limit) {
      query = query.order("created_at", { ascending: false }).limit(limit);
    }
    const { data } = await query;
    return (data || []) as { email: string; nombre: string | null }[];
  },
};
