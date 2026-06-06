/**
 * Rate limiting in-memory (Patrón 10). Suficiente para el ambiente sandbox;
 * en producción multi-instancia se reemplaza por Upstash Redis o similar.
 * Edge-safe: solo usa Map + Date.now().
 *
 * Ventana deslizante simple por (clave) con contador y reinicio por ventana.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Registra un hit para `key` y devuelve si excede `limit` en `windowMs`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { limited: false, remaining: limit - 1, resetAt };
  }

  bucket.count++;
  const limited = bucket.count > limit;
  return {
    limited,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/** Limpia buckets vencidos (llamado de forma oportunista). */
export function sweepRateLimit(): void {
  const now = Date.now();
  for (const [k, b] of store) {
    if (now >= b.resetAt) store.delete(k);
  }
}
