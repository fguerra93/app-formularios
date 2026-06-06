-- ============================================================
-- PrintUp — Operación del dueño (Fase 4)
-- Patrón 3 (cola de aprobación human-in-the-loop) + Patrón 8 (read models).
-- Idempotente. Ejecutar DESPUÉS de schema-fase3-nucleo.sql.
-- ============================================================

-- ── 1. Cola de aprobaciones (Patrón 3) ──────────────────────
-- El bot / sistema NUNCA ejecuta acciones sensibles: insertan una aprobación
-- PENDIENTE. El dueño la aprueba o rechaza desde /admin/aprobaciones; al
-- aprobar se dispara el efecto (vía domain_event / acción directa).
CREATE TABLE IF NOT EXISTS aprobaciones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text NOT NULL
               CHECK (tipo IN ('validar_pago', 'aprobar_arte', 'enviar_cotizacion', 'responder_cliente')),
  titulo       text NOT NULL,
  descripcion  text,
  payload      jsonb,                          -- datos para ejecutar el efecto
  estado       text NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  creada_por   text NOT NULL DEFAULT 'sistema',-- 'bot' | 'sistema'
  resuelta_por text,                            -- email del admin que resolvió
  nota         text,                            -- nota/edición al resolver
  created_at   timestamptz NOT NULL DEFAULT now(),
  resuelta_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_aprobaciones_pendientes
  ON aprobaciones (created_at DESC) WHERE estado = 'pendiente';

-- ── 2. Read model: ventas por día (Patrón 8) ────────────────
-- Vista para el dashboard (últimos pedidos pagados agregados por día).
CREATE OR REPLACE VIEW vw_ventas_por_dia AS
SELECT
  date_trunc('day', created_at)::date AS dia,
  count(*)                            AS pedidos,
  coalesce(sum(total), 0)             AS total
FROM pedidos
WHERE pago_estado = 'pagado'
GROUP BY 1
ORDER BY 1 DESC;
