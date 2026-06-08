import { getDb } from "@/server/db";

/** Repos de la inteligencia de mercado (Fase F5). Coerción de `numeric`. */
const num = (v: unknown): number => Number(v) || 0;

export const competidoresRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("competidores")
      .select("*")
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },
  async create(v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb().from("competidores").insert(v).select().single();
    if (error || !data) throw new Error(error?.message || "Error al crear competidor");
    return data as Record<string, unknown>;
  },
  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("competidores").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const productosCompetenciaRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb().from("productos_competencia").select("*");
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },
  async create(v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb().from("productos_competencia").insert(v).select().single();
    if (error || !data) throw new Error(error?.message || "Error al crear mapeo");
    return data as Record<string, unknown>;
  },
  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("productos_competencia").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const preciosCompetenciaRepo = {
  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("precios_competencia")
      .select("*")
      .order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({ ...r, precio: num((r as Record<string, unknown>).precio) }));
  },
  async create(v: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb().from("precios_competencia").insert(v).select().single();
    if (error || !data) throw new Error(error?.message || "Error al registrar precio");
    return data as Record<string, unknown>;
  },
  async createMany(rows: Record<string, unknown>[]): Promise<number> {
    if (rows.length === 0) return 0;
    const { error } = await getDb().from("precios_competencia").insert(rows);
    if (error) throw new Error(error.message);
    return rows.length;
  },
};
