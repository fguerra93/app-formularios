import { getDb } from "@/server/db";
import type { ZonaEnvio } from "@/server/domain";

/** Acceso a la tabla `zonas_envio`. */
export const zonasRepo = {
  /** Zonas de envío activas (para calcular costo de despacho por comuna). */
  async listActivas(): Promise<ZonaEnvio[]> {
    const { data } = await getDb()
      .from("zonas_envio")
      .select("*")
      .eq("activa", true);
    return (data as ZonaEnvio[] | null) ?? [];
  },

  /** Zonas activas ordenadas por precio ascendente (endpoint público). */
  async listActivasOrdenadas(): Promise<ZonaEnvio[]> {
    const { data, error } = await getDb()
      .from("zonas_envio")
      .select("*")
      .eq("activa", true)
      .order("precio", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ZonaEnvio[] | null) ?? [];
  },

  // --- Admin ---
  /** Todas las zonas (sin filtrar activa), ordenadas por precio. */
  async listAllOrdenadas(): Promise<ZonaEnvio[]> {
    const { data, error } = await getDb()
      .from("zonas_envio")
      .select("*")
      .order("precio", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ZonaEnvio[] | null) ?? [];
  },

  async create(values: Record<string, unknown>): Promise<ZonaEnvio> {
    const { data, error } = await getDb()
      .from("zonas_envio")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear zona");
    return data as ZonaEnvio;
  },

  async update(id: string, values: Record<string, unknown>): Promise<ZonaEnvio> {
    const { data, error } = await getDb()
      .from("zonas_envio")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar zona");
    return data as ZonaEnvio;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("zonas_envio").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
