-- ============================================
-- Fase 9: Product Designer Studio
-- ============================================

-- Configuracion de areas personalizables por producto
CREATE TABLE producto_areas_diseno (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  mockup_url TEXT NOT NULL,
  area_x FLOAT NOT NULL,
  area_y FLOAT NOT NULL,
  area_width FLOAT NOT NULL,
  area_height FLOAT NOT NULL,
  dpi_recomendado INT DEFAULT 300,
  max_colores INT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disenos guardados del cliente
CREATE TABLE disenos_cliente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID,
  producto_id UUID REFERENCES productos(id),
  nombre TEXT DEFAULT 'Mi diseno',
  diseno_json JSONB NOT NULL,
  preview_url TEXT,
  variante JSONB,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_carrito', 'pedido')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clipart/elementos predefinidos
CREATE TABLE clipart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  url TEXT NOT NULL,
  tags TEXT[],
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fuentes personalizadas
CREATE TABLE fuentes_diseno (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  familia TEXT NOT NULL,
  url TEXT,
  categoria TEXT DEFAULT 'sans-serif',
  popular BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_producto_areas_producto ON producto_areas_diseno(producto_id);
CREATE INDEX idx_disenos_cliente ON disenos_cliente(cliente_id);
CREATE INDEX idx_clipart_categoria ON clipart(categoria);
