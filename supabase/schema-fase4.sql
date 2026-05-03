-- ================================================
-- FASE 4: Engagement y Conversion
-- Ejecutar en Supabase SQL Editor
-- ================================================

-- 1. TABLA DE CUPONES
CREATE TABLE IF NOT EXISTS cupones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'monto_fijo')),
  valor INT NOT NULL,
  minimo_compra INT DEFAULT 0,
  maximo_descuento INT,
  usos_maximos INT,
  usos_actuales INT DEFAULT 0,
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_expiracion TIMESTAMPTZ,
  activo BOOLEAN DEFAULT true,
  aplica_a TEXT DEFAULT 'todo' CHECK (aplica_a IN ('todo', 'categoria', 'producto')),
  aplica_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cupones iniciales
INSERT INTO cupones (codigo, tipo, valor, minimo_compra, maximo_descuento, activo) VALUES
  ('BIENVENIDO10', 'porcentaje', 10, 10000, 5000, true),
  ('PRINTUP2026', 'monto_fijo', 3000, 20000, NULL, true),
  ('ENVIOGRATIS', 'monto_fijo', 4500, 30000, NULL, true)
ON CONFLICT (codigo) DO NOTHING;

UPDATE cupones SET fecha_expiracion = '2026-12-31T23:59:59Z' WHERE codigo = 'PRINTUP2026';

-- 2. TABLA DE REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  autor_nombre TEXT NOT NULL,
  autor_email TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  titulo TEXT,
  comentario TEXT,
  fotos JSONB DEFAULT '[]',
  verificada BOOLEAN DEFAULT false,
  aprobada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_producto ON reviews(producto_id);
CREATE INDEX IF NOT EXISTS idx_reviews_aprobada ON reviews(aprobada);

-- 3. COLUMNA DE VISITAS EN PRODUCTOS
ALTER TABLE productos ADD COLUMN IF NOT EXISTS visitas INT DEFAULT 0;

-- 4. RLS POLICIES

-- Cupones: lectura publica para validacion, escritura solo service role
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "cupones_public_read" ON cupones
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "cupones_service_write" ON cupones
  FOR ALL USING (auth.role() = 'service_role');

-- Reviews: lectura publica (aprobadas), insercion publica, gestion service role
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "reviews_public_read" ON reviews
  FOR SELECT USING (aprobada = true);

CREATE POLICY IF NOT EXISTS "reviews_public_insert" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "reviews_service_all" ON reviews
  FOR ALL USING (auth.role() = 'service_role');
