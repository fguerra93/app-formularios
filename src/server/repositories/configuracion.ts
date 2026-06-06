import { getDb } from "@/server/db";

/**
 * Acceso a la tabla `configuracion` (pares clave/valor del negocio:
 * datos bancarios, WhatsApp, credenciales, etc.).
 */
export const configuracionRepo = {
  /** Devuelve el valor de una clave, o null si no existe. */
  async get(clave: string): Promise<string | null> {
    const { data } = await getDb()
      .from("configuracion")
      .select("valor")
      .eq("clave", clave)
      .single();
    return data?.valor ?? null;
  },

  /** Devuelve un mapa { clave: valor } para varias claves. */
  async getMany(claves: string[]): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    if (claves.length === 0) return map;
    const { data } = await getDb()
      .from("configuracion")
      .select("clave, valor")
      .in("clave", claves);
    for (const row of data ?? []) map[row.clave] = row.valor;
    return map;
  },

  /** Toda la configuración como mapa { clave: valor } (admin). */
  async getAll(): Promise<Record<string, string>> {
    const { data, error } = await getDb().from("configuracion").select("*");
    if (error) throw new Error(error.message);
    const map: Record<string, string> = {};
    for (const row of data || []) map[row.clave] = row.valor;
    return map;
  },

  /** Upsert de varias claves. Lanza error con el nombre de la clave que falle. */
  async upsertMany(entries: [string, string][]): Promise<void> {
    const db = getDb();
    for (const [clave, valor] of entries) {
      const { error } = await db
        .from("configuracion")
        .upsert(
          { clave, valor, updated_at: new Date().toISOString() },
          { onConflict: "clave" }
        );
      if (error) {
        console.error(`Error upserting config key "${clave}":`, error);
        throw new Error(`Error al guardar configuración: ${clave}`);
      }
    }
  },
};
