-- ============================================================
-- PrintUp — Legal y cobro (Fase 6)
-- IVA (informativo en la app), documento tributario (DTE) y notas de crédito.
-- Idempotente. Ejecutar DESPUÉS de schema-fase5-bot.sql.
-- ============================================================

-- ── 1. Documento tributario en el pedido ────────────────────
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dte_tipo        text;   -- 'boleta' | 'factura'
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dte_folio       text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dte_url         text;   -- PDF (real o mock)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dte_emitido_at  timestamptz;

-- ── 2. Notas de crédito (devoluciones / reembolsos) ─────────
CREATE TABLE IF NOT EXISTS notas_credito (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   uuid REFERENCES pedidos(id) ON DELETE SET NULL,
  folio       text,
  monto       int NOT NULL DEFAULT 0,
  motivo      text,
  url         text,                              -- PDF (real o mock)
  emitida_por text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_credito_pedido ON notas_credito (pedido_id);
