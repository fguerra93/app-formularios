import { getDb } from "@/server/db";

const MAX_INTENTOS = 5;

/** Outbox de eventos de dominio (`domain_events`) — Patrón 2. */
export const domainEventsRepo = {
  /** Emite un evento (estado pendiente). Best-effort: no rompe el flujo. */
  async emit(tipo: string, payload: unknown): Promise<void> {
    try {
      await getDb().from("domain_events").insert({ tipo, payload });
    } catch (e) {
      console.error("domain_events emit error:", e);
    }
  },

  async listPendientes(limit = 50): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("domain_events")
      .select("*")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async marcarProcesado(id: string): Promise<void> {
    await getDb()
      .from("domain_events")
      .update({ estado: "procesado", procesado_at: new Date().toISOString() })
      .eq("id", id);
  },

  /** Marca un fallo; pasa a 'error' al superar el máximo de intentos. */
  async marcarFallo(id: string, intentos: number, msg: string): Promise<void> {
    const nuevos = intentos + 1;
    await getDb()
      .from("domain_events")
      .update({
        intentos: nuevos,
        error_msg: msg.slice(0, 500),
        estado: nuevos >= MAX_INTENTOS ? "error" : "pendiente",
      })
      .eq("id", id);
  },
};
