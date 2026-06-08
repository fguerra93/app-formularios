-- ============================================================
-- PrintUp — Cerebro de precios + Gang Sheet (Fase F1 / Automatización)
-- Tarifas por área (cm²) y pliegos self-service con auto-acomodo.
-- Idempotente. Ejecutar DESPUÉS de schema-fase7-produccion.sql.
-- ============================================================

-- ── 1. Tarifas por material (precio por cm² + tramos de descuento) ──
-- tramos: jsonb [{ "min_cm2": 0, "max_cm2": 2000, "descuento_pct": 0 }, ...]
--   El descuento se aplica por ÁREA total cobrada del pliego.
CREATE TABLE IF NOT EXISTS tarifas_gang_sheet (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material        text NOT NULL,                 -- 'DTF Textil', 'DTF UV', 'Sublimacion'
  ancho_pliego_cm numeric NOT NULL DEFAULT 58,   -- ancho útil del rollo/pliego
  tarifa_por_cm2  numeric NOT NULL DEFAULT 6,    -- CLP por cm² (área cobrada)
  merma_pct       numeric NOT NULL DEFAULT 8,    -- % extra de film (márgenes/sangrado)
  precio_minimo   int NOT NULL DEFAULT 3000,     -- piso de cobro por pliego
  tramos          jsonb NOT NULL DEFAULT '[]'::jsonb,
  dias_produccion int NOT NULL DEFAULT 3,
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tarifas_gs_material
  ON tarifas_gang_sheet (material) WHERE activo;

-- ── 2. Pliegos (gang sheets) guardados por clientes / bot ──────────
-- items: jsonb [{ "arte_url": "...", "x": 0, "y": 0, "w_cm": 10, "h_cm": 8,
--                 "rot": 0, "cantidad": 1 }, ...]  (x/y/rot los pone el nesting)
-- desglose: jsonb con el detalle del cálculo (área, merma, tramo, total).
CREATE TABLE IF NOT EXISTS gang_sheets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id       uuid REFERENCES clientes(id) ON DELETE SET NULL,
  nombre           text,
  material         text NOT NULL,
  ancho_pliego_cm  numeric NOT NULL DEFAULT 58,
  alto_pliego_cm   numeric NOT NULL DEFAULT 0,    -- alto resultante del auto-acomodo
  items            jsonb NOT NULL DEFAULT '[]'::jsonb,
  area_usada_cm2   numeric NOT NULL DEFAULT 0,    -- Σ(w·h) de los artes
  area_pliego_cm2  numeric NOT NULL DEFAULT 0,    -- ancho · alto del pliego
  merma_cm2        numeric NOT NULL DEFAULT 0,
  precio           int NOT NULL DEFAULT 0,
  desglose         jsonb,
  preview_url      text,
  estado           text NOT NULL DEFAULT 'borrador'
                   CHECK (estado IN ('borrador','en_carrito','en_op','anulado')),
  pedido_id        uuid REFERENCES pedidos(id) ON DELETE SET NULL,
  op_id            uuid REFERENCES ordenes_produccion(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gang_sheets_cliente ON gang_sheets (cliente_id);
CREATE INDEX IF NOT EXISTS idx_gang_sheets_pedido  ON gang_sheets (pedido_id);

-- ── 3. Semilla de tarifas (editables) ─────────────────────────────
INSERT INTO tarifas_gang_sheet
  (material, ancho_pliego_cm, tarifa_por_cm2, merma_pct, precio_minimo, tramos, dias_produccion)
SELECT * FROM (VALUES
  ('DTF Textil', 58::numeric, 6.0::numeric, 8::numeric, 3000,
   '[{"min_cm2":0,"max_cm2":2000,"descuento_pct":0},{"min_cm2":2000,"max_cm2":6000,"descuento_pct":10},{"min_cm2":6000,"max_cm2":999999999,"descuento_pct":20}]'::jsonb,
   3),
  ('DTF UV', 60::numeric, 8.0::numeric, 10::numeric, 4000,
   '[{"min_cm2":0,"max_cm2":2000,"descuento_pct":0},{"min_cm2":2000,"max_cm2":6000,"descuento_pct":8},{"min_cm2":6000,"max_cm2":999999999,"descuento_pct":15}]'::jsonb,
   4),
  ('Sublimacion', 100::numeric, 4.5::numeric, 6::numeric, 3000,
   '[{"min_cm2":0,"max_cm2":3000,"descuento_pct":0},{"min_cm2":3000,"max_cm2":10000,"descuento_pct":12},{"min_cm2":10000,"max_cm2":999999999,"descuento_pct":22}]'::jsonb,
   4)
) AS v(material, ancho_pliego_cm, tarifa_por_cm2, merma_pct, precio_minimo, tramos, dias_produccion)
WHERE NOT EXISTS (SELECT 1 FROM tarifas_gang_sheet);
