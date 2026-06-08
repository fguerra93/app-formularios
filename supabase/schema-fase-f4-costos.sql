-- ============================================================
-- PrintUp — Inteligencia de insumos / costos / márgenes (Fase F4)
-- ¿Compro bien? Ficha de costos (BOM) por producto, proveedores, histórico de
-- precios de insumos y órdenes de compra con recepción.
-- Idempotente. Ejecutar DESPUÉS de schema-fase-f2-taller.sql.
-- ============================================================

-- ── Insumos (film, tinta, polera, tazón…) ─────────────────────────
CREATE TABLE IF NOT EXISTS insumos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku           text,
  nombre        text NOT NULL,
  unidad        text NOT NULL DEFAULT 'unidad',  -- unidad | m2 | ml | kg ...
  costo_actual  numeric NOT NULL DEFAULT 0,       -- CLP por unidad
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insumos_activo ON insumos (activo);

-- ── Proveedores ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  rut         text,
  contacto    text,
  telefono    text,
  email       text,
  notas       text,
  activo      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Histórico de precios por proveedor (alertas de sobreprecio) ───
CREATE TABLE IF NOT EXISTS precios_proveedor (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id     uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  proveedor_id  uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  precio        numeric NOT NULL,
  fecha         date NOT NULL DEFAULT current_date,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_precios_prov_insumo ON precios_proveedor (insumo_id, fecha DESC);

-- ── BOM: receta de insumos por producto ───────────────────────────
CREATE TABLE IF NOT EXISTS bom (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id   uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  insumo_id     uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  cantidad      numeric NOT NULL DEFAULT 1,        -- cantidad de insumo por unidad de producto
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (producto_id, insumo_id)
);
CREATE INDEX IF NOT EXISTS idx_bom_producto ON bom (producto_id);

-- ── Órdenes de compra ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_oc     serial,
  proveedor_id  uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  estado        text NOT NULL DEFAULT 'borrador'
                CHECK (estado IN ('borrador','enviada','recibida','cancelada')),
  total         numeric NOT NULL DEFAULT 0,
  notas         text,
  enviada_at    timestamptz,
  recibida_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oc_estado ON ordenes_compra (estado, created_at DESC);

-- ── Ítems de una OC (+ recepción) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS oc_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oc_id              uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  insumo_id          uuid REFERENCES insumos(id) ON DELETE SET NULL,
  nombre             text,                          -- snapshot del nombre del insumo
  cantidad           numeric NOT NULL DEFAULT 1,
  precio_unitario    numeric NOT NULL DEFAULT 0,
  cantidad_recibida  numeric NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oc_items_oc ON oc_items (oc_id);
