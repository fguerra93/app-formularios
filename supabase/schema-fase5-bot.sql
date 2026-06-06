-- ============================================================
-- PrintUp — Bot pro (Fase 5)
-- Patrón 7 (bot híbrido + tool-use) + cotización automática.
-- Idempotente. Ejecutar DESPUÉS de schema-fase4-aprobaciones.sql.
-- ============================================================

-- ── 1. Planillas de precios para cotización automática ───────
-- rangos: jsonb [{ "min": 1, "max": 49, "precio_unitario": 3500 }, ...]
CREATE TABLE IF NOT EXISTS planillas_precios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_producto   text NOT NULL,                -- 'DTF Textil', 'DTF UV', 'Sublimacion', ...
  unidad          text NOT NULL DEFAULT 'unidad',
  rangos          jsonb NOT NULL DEFAULT '[]'::jsonb,
  precio_diseno   int NOT NULL DEFAULT 0,
  dias_produccion int NOT NULL DEFAULT 3,
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planillas_tipo ON planillas_precios (tipo_producto) WHERE activo;

-- ── 2. Caché de clasificación de intents (abarata Claude) ────
CREATE TABLE IF NOT EXISTS bot_intent_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto_norm  text NOT NULL UNIQUE,             -- texto normalizado (lower/trim)
  intent      text NOT NULL,
  nivel       text NOT NULL,                    -- 'verde' | 'amarillo' | 'rojo'
  hits        int NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_intent_cache_texto ON bot_intent_cache (texto_norm);

-- ── 3. Semilla mínima de planillas (ejemplos editables) ──────
INSERT INTO planillas_precios (tipo_producto, unidad, rangos, precio_diseno, dias_produccion)
SELECT * FROM (VALUES
  ('DTF Textil', 'unidad',
   '[{"min":1,"max":9,"precio_unitario":4500},{"min":10,"max":49,"precio_unitario":3200},{"min":50,"max":999999,"precio_unitario":2400}]'::jsonb,
   8000, 3),
  ('DTF UV', 'unidad',
   '[{"min":1,"max":49,"precio_unitario":3800},{"min":50,"max":999999,"precio_unitario":2900}]'::jsonb,
   8000, 4),
  ('Sublimacion', 'unidad',
   '[{"min":1,"max":49,"precio_unitario":5200},{"min":50,"max":999999,"precio_unitario":3900}]'::jsonb,
   6000, 4)
) AS v(tipo_producto, unidad, rangos, precio_diseno, dias_produccion)
WHERE NOT EXISTS (SELECT 1 FROM planillas_precios);
