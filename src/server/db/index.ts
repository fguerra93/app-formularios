import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { usePg } from "./pg";
import { createPgDb } from "./adapter";

/**
 * Único punto de acceso a datos del backend (chokepoint).
 *
 * Variante B (Cloud SQL Postgres): si `DB_HOST`+`DB_USER` están definidos
 * (Cloud Run con `--add-cloudsql-instances`), devuelve el adaptador `pg`
 * (réplica del patrón de adminsmart: driver directo al motor). En su ausencia
 * cae a Supabase (dev local / Variante A), SIN tocar los ~29 repositorios.
 *
 * Regla del proyecto: `supabase.from(` y `.storage.from(` SOLO pueden aparecer
 * dentro de `src/server/`. El resto del código habla con los repositorios.
 */
let _pgDb: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (usePg()) {
    if (!_pgDb) _pgDb = createPgDb();
    return _pgDb;
  }
  return getSupabaseAdmin();
}
