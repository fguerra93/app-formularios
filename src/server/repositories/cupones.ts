import { getDb } from "@/server/db";
import type { Cupon } from "@/server/domain";

/** Acceso a la tabla `cupones`. */
export const cuponesRepo = {
  /** Busca un cupón por código (case-insensitive), o null. */
  async findByCodigo(codigo: string): Promise<Cupon | null> {
    const { data } = await getDb()
      .from("cupones")
      .select("*")
      .ilike("codigo", codigo)
      .single();
    return (data as Cupon | null) ?? null;
  },

  // --- Admin ---
  async listAll(): Promise<Cupon[]> {
    const { data, error } = await getDb()
      .from("cupones")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Cupon[] | null) ?? [];
  },

  async create(values: Record<string, unknown>): Promise<Cupon> {
    const { data, error } = await getDb()
      .from("cupones")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear cupon");
    return data as Cupon;
  },

  async update(id: string, values: Record<string, unknown>): Promise<Cupon> {
    const { data, error } = await getDb()
      .from("cupones")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar cupon");
    return data as Cupon;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("cupones").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
