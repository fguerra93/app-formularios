import { getDb } from "@/server/db";

/** Suscripciones Web Push del dueño/admin (`push_subscriptions`) — Fase F6. */
export const pushSubscriptionsRepo = {
  async upsert(values: {
    endpoint: string;
    p256dh: string;
    auth: string;
    usuario?: string | null;
    preferencias?: Record<string, boolean>;
  }): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: values.endpoint,
          p256dh: values.p256dh,
          auth: values.auth,
          usuario: values.usuario ?? null,
          ...(values.preferencias ? { preferencias: values.preferencias } : {}),
        },
        { onConflict: "endpoint" }
      )
      .select()
      .single();
    if (error || !data) {
      console.error("Error guardando suscripción push:", error);
      return null;
    }
    return data as Record<string, unknown>;
  },

  async listAll(): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb().from("push_subscriptions").select("*");
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async removeByEndpoint(endpoint: string): Promise<void> {
    const { error } = await getDb().from("push_subscriptions").delete().eq("endpoint", endpoint);
    if (error) throw new Error(error.message);
  },
};
