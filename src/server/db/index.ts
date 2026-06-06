import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Único punto de acceso a datos del backend (chokepoint).
 *
 * HOY (Variante B · Fase 1): devuelve el cliente service-role de Supabase.
 * MAÑANA (Fase 8B): aquí se reemplaza por un pool de `pg` contra Cloud SQL
 * Postgres, SIN tocar los repositorios que lo consumen ni las ~95 rutas.
 *
 * Regla del proyecto: `supabase.from(` y `.storage.from(` SOLO pueden aparecer
 * dentro de `src/server/`. El resto del código habla con los repositorios.
 */
export function getDb(): SupabaseClient {
  return getSupabaseAdmin();
}
