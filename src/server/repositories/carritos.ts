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

  /** Carrito activo (no recuperado) más reciente de un cliente, o null. */
  async getActivo(clienteId: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("carritos_guardados")
      .select("*")
      .eq("cliente_id", clienteId)
      .eq("recuperado", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  /** Crea o actualiza el carrito activo del cliente; devuelve la fila. */
  async upsertActivo(
    clienteId: string,
    email: string | null,
    items: unknown,
    cuponCodigo: string | null
  ): Promise<Record<string, unknown> | null> {
    const existing = await this.getActivo(clienteId);
    const values = {
      cliente_id: clienteId,
      email,
      items,
      cupon_codigo: cuponCodigo,
      email_enviado: false,
      recuperado: false,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { data } = await getDb()
        .from("carritos_guardados")
        .update(values)
        .eq("id", existing.id as string)
        .select()
        .single();
      return (data as Record<string, unknown> | null) ?? null;
    }
    const { data } = await getDb()
      .from("carritos_guardados")
      .insert(values)
      .select()
      .single();
    return (data as Record<string, unknown> | null) ?? null;
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
