-- ============================================================
-- PrintUp — App del dueño (PWA + Web Push) (Fase F6)
-- Suscripciones Web Push (VAPID) + preferencias de alerta.
-- Idempotente. Ejecutar DESPUÉS de schema-fase-f5-mercado.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint      text UNIQUE NOT NULL,
  p256dh        text NOT NULL,
  auth          text NOT NULL,
  usuario       text,                              -- email del dueño/admin
  preferencias  jsonb NOT NULL DEFAULT '{"aprobaciones":true,"margen":true,"stock":true,"op":true}',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_usuario ON push_subscriptions (usuario);
