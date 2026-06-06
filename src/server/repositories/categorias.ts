import { getDb } from "@/server/db";

/** Acceso a la tabla `categorias`. */
export const categoriasRepo = {
  /** Categorías activas con conteo de productos (con fallback si el join falla). */
  async listActivasConConteo(): Promise<Record<string, unknown>[]> {
    const db = getDb();
    const { data, error } = await db
      .from("categorias")
      .select("*, productos(count)")
      .eq("activa", true)
      .order("orden", { ascending: true });

    if (error) {
      // Fallback sin conteo si el join falla.
      const { data: fallback, error: err2 } = await db
        .from("categorias")
        .select("*")
        .eq("activa", true)
        .order("orden", { ascending: true });
      if (err2) throw new Error(err2.message);
      return (fallback || []) as Record<string, unknown>[];
    }

    return (data || []).map((cat) => {
      const countData = cat.productos as unknown as { count: number }[] | undefined;
      const productCount = countData?.[0]?.count ?? 0;
      const rest = { ...cat } as Record<string, unknown>;
      delete rest.productos;
      return { ...rest, product_count: productCount };
    });
  },

  /** Búsqueda de categorías por nombre (best-effort, degrada a []). */
  async searchByNombre(term: string, limit = 3): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("categorias")
      .select("id, nombre, slug, imagen_url")
      .eq("activa", true)
      .ilike("nombre", `%${term}%`)
      .limit(limit);
    if (error) {
      console.error("Error searching categorias:", error);
      return [];
    }
    return (data as Record<string, unknown>[] | null) ?? [];
  },

  // --- Admin ---
  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("categorias")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear categoria");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("categorias")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar categoria");
    return data as Record<string, unknown>;
  },

  /** Baja lógica (activa=false). */
  async softDelete(id: string): Promise<void> {
    const { error } = await getDb()
      .from("categorias")
      .update({ activa: false })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Cantidad de productos activos en una categoría (para validar borrado). */
  async countProductosActivos(categoriaId: string): Promise<number> {
    const { count } = await getDb()
      .from("productos")
      .select("*", { count: "exact", head: true })
      .eq("categoria_id", categoriaId)
      .eq("activo", true);
    return count ?? 0;
  },

  /** Categorías activas para el sitemap (slug, created_at). */
  async listActivasParaSitemap(): Promise<{ slug: string; created_at: string }[]> {
    const { data } = await getDb()
      .from("categorias")
      .select("slug, created_at")
      .eq("activa", true);
    return (data || []) as { slug: string; created_at: string }[];
  },
};
