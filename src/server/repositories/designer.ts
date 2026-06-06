import { getDb } from "@/server/db";

/** Áreas de diseño de un producto (`producto_areas_diseno`). */
export const areasDisenoRepo = {
  async listByProducto(productoId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("producto_areas_diseno")
      .select("*")
      .eq("producto_id", productoId)
      .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("producto_areas_diseno")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear area de diseno");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("producto_areas_diseno")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar area de diseno");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb()
      .from("producto_areas_diseno")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

/** Galería de clipart del editor (`clipart`). */
export const clipartRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("clipart")
      .select("*")
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("clipart")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear clipart");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("clipart")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar clipart");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("clipart").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Clipart activo (público), filtrable por categoría. */
  async listActivos(categoria?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("clipart")
      .select("*")
      .eq("activo", true)
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true });
    if (categoria) query = query.eq("categoria", categoria);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },
};

/** Catálogo de fuentes del editor (`fuentes_diseno`). */
export const fuentesRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("fuentes_diseno")
      .select("*")
      .order("popular", { ascending: false })
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("fuentes_diseno")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear fuente");
    return data as Record<string, unknown>;
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("fuentes_diseno")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar fuente");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("fuentes_diseno").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Fuentes activas (público). */
  async listActivas(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("fuentes_diseno")
      .select("*")
      .eq("activo", true)
      .order("popular", { ascending: false })
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },
};

/** Diseños guardados por clientes en el editor (`disenos_cliente`). */
export const disenosRepo = {
  async create(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("disenos_cliente")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al guardar diseno");
    return data as Record<string, unknown>;
  },

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("disenos_cliente")
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
      .from("disenos_cliente")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar diseno");
    return data as Record<string, unknown>;
  },
};
