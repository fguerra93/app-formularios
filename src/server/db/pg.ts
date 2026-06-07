import { Pool } from "pg";
import type { PoolConfig } from "pg";

/**
 * Pool de Postgres (Cloud SQL · Variante B). Réplica del patrón de adminsmart:
 * Cloud Run habla directo al motor por driver nativo.
 *
 * Selección de transporte por entorno:
 *  - Cloud Run + `--add-cloudsql-instances`: socket unix en
 *    `/cloudsql/<CONNECTION_NAME>` → se pasa como `host` (sin SSL).
 *  - Local / pruebas: IP pública (`DB_HOST` = ip) con SSL laxo.
 *
 * Variables: DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT?, DB_SSL?.
 */
let _pool: Pool | null = null;

export function getPool(): Pool {
  if (_pool) return _pool;

  const host = process.env.DB_HOST || "";
  const isUnixSocket = host.startsWith("/cloudsql/");

  const config: PoolConfig = {
    host,
    database: process.env.DB_NAME || "printup",
    user: process.env.DB_USER || "printup",
    password: process.env.DB_PASS || "",
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };

  if (!isUnixSocket) {
    config.port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
    // Cloud SQL con IP pública usa certificado propio; en sandbox aceptamos
    // sin verificar la cadena (la conexión sigue cifrada).
    if (process.env.DB_SSL !== "false") {
      config.ssl = { rejectUnauthorized: false };
    }
  }

  _pool = new Pool(config);
  return _pool;
}

/** ¿Está configurada la BD propia (Cloud SQL)? Si no, se usa Supabase. */
export function usePg(): boolean {
  return !!process.env.DB_HOST && !!process.env.DB_USER;
}
