-- ============================================================
-- Etapa 4 — Pedido grupal de generación + base B2B
-- Ejecutar en: Supabase Dashboard > SQL Editor (y Cloud SQL prod)
-- ============================================================

-- Pedido grupal: el delegado crea el grupo, cada apoderado paga SU parte
-- como pedido individual (pedidos.grupo_id) vía Webpay.
CREATE TABLE IF NOT EXISTS grupos_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,              -- código corto del link compartible
  nombre TEXT NOT NULL,                     -- "4°B Colegio San José 2026"
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  organizador_nombre TEXT NOT NULL,
  organizador_email TEXT NOT NULL,
  organizador_telefono TEXT,
  precio_referencia INT NOT NULL DEFAULT 0, -- informativo en la landing
  meta_unidades INT NOT NULL DEFAULT 10,
  fecha_limite DATE,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','completado','cerrado','vencido')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grupos_codigo ON grupos_pedido(codigo);

ALTER TABLE grupos_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read grupos" ON grupos_pedido FOR SELECT USING (true);
CREATE POLICY "Service role all grupos" ON grupos_pedido FOR ALL USING (true);

-- Cada aporte es un pedido normal vinculado al grupo.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos_pedido(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_grupo ON pedidos(grupo_id);

-- Base B2B: descuento especial por cliente (se aplica en el servidor).
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS es_empresa BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS descuento_pct INT DEFAULT 0 CHECK (descuento_pct >= 0 AND descuento_pct <= 50);
