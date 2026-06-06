import { getDb } from "@/server/db";

/** Acceso a la tabla `pagos_log` (bitácora de webhooks de pago). */
export const pagosRepo = {
  /** Registra un webhook entrante (best-effort, no lanza). */
  async logWebhook(values: Record<string, unknown>): Promise<void> {
    await getDb().from("pagos_log").insert(values);
  },

  /** Crea una nota de crédito (devolución/reembolso). */
  async crearNotaCredito(values: {
    pedido_id: string;
    folio: string;
    monto: number;
    motivo?: string | null;
    url?: string | null;
    emitida_por?: string | null;
  }): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("notas_credito")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear nota de crédito");
    return data as Record<string, unknown>;
  },
};
