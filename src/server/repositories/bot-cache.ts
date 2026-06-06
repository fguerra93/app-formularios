import { getDb } from "@/server/db";

/** Caché de clasificación de intents del bot (`bot_intent_cache`) — Patrón 7. */
export const botCacheRepo = {
  async get(
    textoNorm: string
  ): Promise<{ intent: string; nivel: string } | null> {
    const { data } = await getDb()
      .from("bot_intent_cache")
      .select("intent, nivel")
      .eq("texto_norm", textoNorm)
      .maybeSingle();
    return (data as { intent: string; nivel: string } | null) ?? null;
  },

  async set(textoNorm: string, intent: string, nivel: string): Promise<void> {
    try {
      await getDb()
        .from("bot_intent_cache")
        .upsert(
          { texto_norm: textoNorm, intent, nivel },
          { onConflict: "texto_norm" }
        );
    } catch {
      // best-effort
    }
  },
};
