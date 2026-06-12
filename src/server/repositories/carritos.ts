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
      .update({ email_enviado: true, email_enviado_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw new Error(error.message);
  },

  /**
   * Captura temprana de un carrito de INVITADO (email tipeado en el checkout,
   * compra aún no concretada). Upsert por email sobre el carrito activo.
   */
  async capturarAbandonado(input: {
    email: string;
    telefono?: string | null;
    items: unknown;
    total: number;
    cliente_id?: string | null;
  }): Promise<void> {
    const db = getDb();
    const values = {
      email: input.email,
      telefono: input.telefono ?? null,
      items: input.items,
      total: input.total,
      cliente_id: input.cliente_id ?? null,
      email_enviado: false,
      recuperado: false,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await db
      .from("carritos_guardados")
      .select("id")
      .eq("email", input.email)
      .eq("recuperado", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await db.from("carritos_guardados").update(values).eq("id", existing.id);
      if (error) throw new Error(error.message);
      return;
    }
    const { error } = await db.from("carritos_guardados").insert(values);
    if (error) throw new Error(error.message);
  },

  /** Carrito por token de recuperación (link del email). */
  async findByToken(token: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("carritos_guardados")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  },

  /** Marca un carrito como recuperado (el cliente volvió por el link). */
  async markRecuperado(id: string): Promise<void> {
    const { error } = await getDb()
      .from("carritos_guardados")
      .update({ recuperado: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Marca como recuperados los carritos activos de un email (compró). */
  async markRecuperadoPorEmail(email: string): Promise<void> {
    const { error } = await getDb()
      .from("carritos_guardados")
      .update({ recuperado: true, updated_at: new Date().toISOString() })
      .eq("email", email)
      .eq("recuperado", false);
    if (error) throw new Error(error.message);
  },

  /** Abandonados con datos para el recordatorio (ventana desde→hasta). */
  async findParaRecordatorio(opts: {
    antesDeISO: string;
    despuesDeISO: string;
    limit?: number;
  }): Promise<
    { id: string; email: string | null; token: string | null; items: unknown; total: number | null }[]
  > {
    const { data, error } = await getDb()
      .from("carritos_guardados")
      .select("id, email, token, items, total")
      .lt("updated_at", opts.antesDeISO)
      .gt("updated_at", opts.despuesDeISO)
      .eq("email_enviado", false)
      .eq("recuperado", false)
      .not("email", "is", null)
      .limit(opts.limit ?? 50);
    if (error) throw new Error(error.message);
    return (data || []) as {
      id: string;
      email: string | null;
      token: string | null;
      items: unknown;
      total: number | null;
    }[];
  },
};
