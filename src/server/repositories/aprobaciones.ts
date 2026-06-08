import { getDb } from "@/server/db";

export type TipoAprobacion =
  | "validar_pago"
  | "aprobar_arte"
  | "enviar_cotizacion"
  | "responder_cliente";

/** Cola de aprobaciones del dueño (`aprobaciones`) — Patrón 3. */
export const aprobacionesRepo = {
  /** Crea una aprobación pendiente. Best-effort en emisores (bot/sistema). */
  async crear(values: {
    tipo: TipoAprobacion;
    titulo: string;
    descripcion?: string | null;
    payload?: unknown;
    creada_por?: string;
  }): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("aprobaciones")
      .insert({
        tipo: values.tipo,
        titulo: values.titulo,
        descripcion: values.descripcion ?? null,
        payload: values.payload ?? null,
        creada_por: values.creada_por ?? "sistema",
      })
      .select()
      .single();
    if (error || !data) {
      console.error("Error creando aprobacion:", error);
      return null;
    }
    // Push al dueño (Fase F6), best-effort. Import dinámico para no acoplar el
    // repo al servicio (evita ciclo) y no-op si VAPID no está configurado.
    try {
      const { pushNuevaAprobacion } = await import("@/server/services/push");
      await pushNuevaAprobacion(values.titulo);
    } catch {
      /* push opcional */
    }
    return data as Record<string, unknown>;
  },

  async list(estado?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("aprobaciones")
      .select("*")
      .order("created_at", { ascending: false });
    if (estado) query = query.eq("estado", estado);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("aprobaciones")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async countPendientes(): Promise<number> {
    const { count } = await getDb()
      .from("aprobaciones")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente");
    return count || 0;
  },

  /** Resuelve (aprobada|rechazada). Devuelve la fila actualizada. */
  async resolver(
    id: string,
    estado: "aprobada" | "rechazada",
    resueltaPor: string,
    nota?: string | null
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("aprobaciones")
      .update({
        estado,
        resuelta_por: resueltaPor,
        nota: nota ?? null,
        resuelta_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("estado", "pendiente") // solo resolver si sigue pendiente (idempotente)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "No se pudo resolver la aprobación");
    return data as Record<string, unknown>;
  },
};
