import { getDb } from "@/server/db";

/** Acceso a la tabla `carritos_guardados` (recuperación de carritos). */
export const carritosRepo = {
  /** Carritos abandonados: sin actualizar desde `beforeISO`, no emailados ni recuperados. */
  async findAbandonados(
    beforeISO: string
  ): Promise<{ id: string; cliente_id: string | null; email: string | null; items: unknown }[]> {
    const { data, error } = await getDb()
      .from("carritos_guardados")
      .select("id, cliente_id, email, items")
      .lt("updated_at", beforeISO)
      .eq("email_enviado", false)
      .eq("recuperado", false);
    if (error) throw new Error(error.message);
    return (data || []) as {
      id: string;
      cliente_id: string | null;
      email: string | null;
      items: unknown;
    }[];
  },

  /** Marca como email_enviado=true los carritos indicados. */
  async markEmailEnviado(ids: string[]): Promise<void> {
    const { error } = await getDb()
      .from("carritos_guardados")
      .update({ email_enviado: true, updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw new Error(error.message);
  },
};
