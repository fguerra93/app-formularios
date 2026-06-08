-- ============================================================
-- PrintUp — Inteligencia de mercado (Fase F5)
-- ¿Vendo bien? Monitoreo de competencia (carga manual/CSV) + sugerencia de
-- precio con tope de margen mínimo (usa el costo real de F4).
-- Idempotente. Ejecutar DESPUÉS de schema-fase-f4-costos.sql.
-- ============================================================

-- ── Competidores ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competidores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  url         text,
  activo      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Mapeo producto propio ↔ producto del competidor ──────────────
CREATE TABLE IF NOT EXISTS productos_competencia (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competidor_id   uuid NOT NULL REFERENCES competidores(id) ON DELETE CASCADE,
  producto_id     uuid REFERENCES productos(id) ON DELETE CASCADE,
  nombre_externo  text,                              -- nombre del producto en la competencia
  url             text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prodcomp_producto ON productos_competencia (producto_id);

-- ── Histórico de precios de la competencia ───────────────────────
CREATE TABLE IF NOT EXISTS precios_competencia (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_competencia_id  uuid NOT NULL REFERENCES productos_competencia(id) ON DELETE CASCADE,
  precio                   numeric NOT NULL,
  fecha                    date NOT NULL DEFAULT current_date,
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_precioscomp_map ON precios_competencia (producto_competencia_id, fecha DESC);
