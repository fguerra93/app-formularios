import { getDb } from "@/server/db";

/**
 * Acceso al portafolio. Ojo: el sitio público lee la tabla `trabajos`, mientras
 * que el admin gestiona `portafolio_trabajos` (tablas distintas en el esquema actual).
 */
export const portafolioRepo = {
  /** Trabajos públicos (tabla `trabajos`), con filtros opcionales. */
  async listPublic(opts: {
    categoria?: string | null;
    destacado?: boolean;
    limit?: number | null;
  }): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("trabajos")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (opts.categoria) query = query.eq("categoria", opts.categoria);
    if (opts.destacado) query = query.eq("destacado", true);
    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  // --- Admin: tabla `portafolio_trabajos` ---
  async listAdmin(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("portafolio_trabajos")
      .select("*")
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("portafolio_trabajos")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear trabajo");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("portafolio_trabajos")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar trabajo");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb()
      .from("portafolio_trabajos")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

/** Acceso a la tabla `clientes_destacados`. */
export const clientesDestacadosRepo = {
  /** Activos y ordenados (sitio público). */
  async listActivos(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("clientes_destacados")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  /** Todos, ordenados (admin). */
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("clientes_destacados")
      .select("*")
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("clientes_destacados")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear cliente destacado");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("clientes_destacados")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar cliente destacado");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb()
      .from("clientes_destacados")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
