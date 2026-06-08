import { getDb } from "@/server/db";

/**
 * Repos de la inteligencia de insumos/costos (Fase F4). El driver `pg` devuelve
 * `numeric` como string; se coacciona en lectura para que los cálculos de
 * costo/margen sean idénticos en Supabase y Cloud SQL.
 */
const num = (v: unknown): number => Number(v) || 0;

export const insumosRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("insumos")
      .select("*")
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ ...r, costo_actual: num((r as Record<string, unknown>).costo_actual) }));
  },
  async create(v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb().from("insumos").insert(v).select().single();
    if (error || !data) throw new Error(error?.message || "Error al crear insumo");
    return data as Record<string, unknown>;
  },
  async update(id: string, v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("insumos")
      .update({ ...v, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar insumo");
    return data as Record<string, unknown>;
  },
  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("insumos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const proveedoresRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("proveedores")
      .select("*")
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },
  async create(v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb().from("proveedores").insert(v).select().single();
    if (error || !data) throw new Error(error?.message || "Error al crear proveedor");
    return data as Record<string, unknown>;
  },
  async update(id: string, v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("proveedores")
      .update({ ...v, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar proveedor");
    return data as Record<string, unknown>;
  },
  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("proveedores").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const preciosProveedorRepo = {
  async listByInsumo(insumoId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("precios_proveedor")
      .select("*")
      .eq("insumo_id", insumoId)
      .order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ ...r, precio: num((r as Record<string, unknown>).precio) }));
  },
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("precios_proveedor")
      .select("*")
      .order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ ...r, precio: num((r as Record<string, unknown>).precio) }));
  },
  async create(v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb().from("precios_proveedor").insert(v).select().single();
    if (error || !data) throw new Error(error?.message || "Error al registrar precio");
    return data as Record<string, unknown>;
  },
};

export const bomRepo = {
  async listByProducto(productoId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("bom")
      .select("*")
      .eq("producto_id", productoId);
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ ...r, cantidad: num((r as Record<string, unknown>).cantidad) }));
  },
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb().from("bom").select("*");
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ ...r, cantidad: num((r as Record<string, unknown>).cantidad) }));
  },
  /** Inserta o actualiza la línea (producto, insumo) -> cantidad. */
  async upsert(v: { producto_id: string; insumo_id: string; cantidad: number }): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("bom")
      .upsert({ ...v, updated_at: new Date().toISOString() }, { onConflict: "producto_id,insumo_id" })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al guardar BOM");
    return data as Record<string, unknown>;
  },
  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("bom").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const ordenesCompraRepo = {
  async list(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("ordenes_compra")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ ...r, total: num((r as Record<string, unknown>).total) }));
  },
  async findById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb().from("ordenes_compra").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return { ...(data as Record<string, unknown>), total: num((data as Record<string, unknown>).total) };
  },
  async itemsByOc(ocId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("oc_items")
      .select("*")
      .eq("oc_id", ocId);
    if (error) throw new Error(error.message);
    return (data || []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        ...row,
        cantidad: num(row.cantidad),
        precio_unitario: num(row.precio_unitario),
        cantidad_recibida: num(row.cantidad_recibida),
      };
    });
  },
  async create(v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb().from("ordenes_compra").insert(v).select().single();
    if (error || !data) throw new Error(error?.message || "Error al crear OC");
    return data as Record<string, unknown>;
  },
  async addItems(items: Record<string, unknown>[]): Promise<void> {
    if (items.length === 0) return;
    const { error } = await getDb().from("oc_items").insert(items);
    if (error) throw new Error(error.message);
  },
  async update(id: string, v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("ordenes_compra")
      .update({ ...v, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar OC");
    return data as Record<string, unknown>;
  },
  async updateItem(id: string, v: Record<string, unknown>): Promise<void> {
    const { error } = await getDb().from("oc_items").update(v).eq("id", id);
    if (error) throw new Error(error.message);
  },
};
