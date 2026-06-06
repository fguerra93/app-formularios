import { getDb } from "@/server/db";

/** Centro de notificaciones in-app del admin (`notificaciones`). */
export const notificacionesRepo = {
  async crear(values: {
    tipo: string;
    titulo: string;
    cuerpo?: string | null;
    enlace?: string | null;
  }): Promise<void> {
    await getDb().from("notificaciones").insert({
      tipo: values.tipo,
      titulo: values.titulo,
      cuerpo: values.cuerpo ?? null,
      enlace: values.enlace ?? null,
    });
  },

  async listRecientes(limit = 50): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("notificaciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async countNoLeidas(): Promise<number> {
    const { count } = await getDb()
      .from("notificaciones")
      .select("*", { count: "exact", head: true })
      .eq("leida", false);
    return count || 0;
  },

  async marcarLeida(id: string): Promise<void> {
    const { error } = await getDb()
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async marcarTodasLeidas(): Promise<void> {
    const { error } = await getDb()
      .from("notificaciones")
      .update({ leida: true })
      .eq("leida", false);
    if (error) throw new Error(error.message);
  },
};
