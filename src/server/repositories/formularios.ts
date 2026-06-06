import { getDb } from "@/server/db";

/** Acceso a la tabla `formularios` (cotizaciones/contacto con archivos). */
export const formulariosRepo = {
  /** Listado admin paginado, con filtros de estado y búsqueda. */
  async listAdmin(opts: {
    page: number;
    limit: number;
    estado?: string | null;
    search?: string | null;
  }): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const from = (opts.page - 1) * opts.limit;
    const to = from + opts.limit - 1;

    let query = getDb()
      .from("formularios")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (opts.estado) query = query.eq("estado", opts.estado);
    if (opts.search)
      query = query.or(`nombre.ilike.%${opts.search}%,email.ilike.%${opts.search}%`);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as Record<string, unknown>[], total: count || 0 };
  },

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("formularios")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  /** Actualiza el estado (y updated_at). Devuelve la fila o null si falla. */
  async updateEstado(
    id: string,
    estado: string
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("formularios")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return null;
    return data as Record<string, unknown>;
  },

  /** Inserta un formulario. Devuelve la fila creada o null si falla. */
  async create(values: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("formularios")
      .insert(values)
      .select()
      .single();
    if (error || !data) {
      console.error("Error inserting formulario:", error);
      return null;
    }
    return data as Record<string, unknown>;
  },

  /** Marca email_enviado=true (best-effort). */
  async markEmailEnviado(id: string): Promise<void> {
    await getDb().from("formularios").update({ email_enviado: true }).eq("id", id);
  },

  /** Inserta un registro en `email_log` (best-effort). */
  async logEmail(values: Record<string, unknown>): Promise<void> {
    await getDb().from("email_log").insert(values);
  },

  /** Formularios de un email (Cliente 360), recientes primero. */
  async listByEmail(email: string): Promise<Record<string, unknown>[]> {
    const { data } = await getDb()
      .from("formularios")
      .select("*")
      .ilike("email", email)
      .order("created_at", { ascending: false });
    return (data || []) as Record<string, unknown>[];
  },

  /** Cuenta formularios en estado 'nuevo' más antiguos que `horas` (alertas). */
  async countNuevosAntiguos(horas: number): Promise<number> {
    const limite = new Date(Date.now() - horas * 3600_000).toISOString();
    const { count } = await getDb()
      .from("formularios")
      .select("*", { count: "exact", head: true })
      .eq("estado", "nuevo")
      .lt("created_at", limite);
    return count || 0;
  },

  /** Contactos derivados de formularios (para la vista de contactos). */
  async listContactos(
    search?: string | null
  ): Promise<{ nombre: string; email: string; telefono: string | null; created_at: string }[]> {
    let query = getDb()
      .from("formularios")
      .select("nombre, email, telefono, created_at");
    if (search) query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
    const { data } = await query;
    return (data || []) as {
      nombre: string;
      email: string;
      telefono: string | null;
      created_at: string;
    }[];
  },
};
