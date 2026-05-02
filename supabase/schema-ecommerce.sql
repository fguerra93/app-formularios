-- ============================================================
-- PrintUp E-Commerce — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Categorias de productos
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  orden INT DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  descripcion_corta TEXT,
  precio INT NOT NULL,
  precio_oferta INT,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  imagenes JSONB DEFAULT '[]',
  variantes JSONB DEFAULT '[]',
  stock INT DEFAULT 0,
  stock_minimo INT DEFAULT 0,
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  peso_gramos INT,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido SERIAL,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_telefono TEXT,
  cliente_rut TEXT,
  direccion_envio JSONB,
  tipo_entrega TEXT DEFAULT 'retiro_tienda' CHECK (tipo_entrega IN ('retiro_tienda', 'despacho')),
  items JSONB NOT NULL,
  subtotal INT NOT NULL,
  costo_envio INT DEFAULT 0,
  total INT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado')),
  pago_estado TEXT DEFAULT 'pendiente' CHECK (pago_estado IN ('pendiente', 'pagado', 'fallido', 'reembolsado')),
  pago_metodo TEXT,
  pago_referencia TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zonas de envio
CREATE TABLE IF NOT EXISTS zonas_envio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  comunas TEXT[] NOT NULL,
  precio INT NOT NULL,
  envio_gratis_desde INT,
  activa BOOLEAN DEFAULT true,
  dias_despacho TEXT[],
  horario TEXT
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_slug ON productos(slug);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON categorias(slug);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos(cliente_email);

-- RLS Policies
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_envio ENABLE ROW LEVEL SECURITY;

-- Categorias: lectura publica
CREATE POLICY "Public read categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Service role all categorias" ON categorias FOR ALL USING (true);

-- Productos: lectura publica
CREATE POLICY "Public read productos" ON productos FOR SELECT USING (true);
CREATE POLICY "Service role all productos" ON productos FOR ALL USING (true);

-- Pedidos: insert publico, lectura por UUID
CREATE POLICY "Public insert pedidos" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own pedido" ON pedidos FOR SELECT USING (true);
CREATE POLICY "Service role all pedidos" ON pedidos FOR ALL USING (true);

-- Zonas envio: lectura publica
CREATE POLICY "Public read zonas_envio" ON zonas_envio FOR SELECT USING (true);
CREATE POLICY "Service role all zonas_envio" ON zonas_envio FOR ALL USING (true);

-- Pagos log (webhooks de MercadoPago)
CREATE TABLE IF NOT EXISTS pagos_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pagos_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role all pagos_log" ON pagos_log FOR ALL USING (true);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Categorias
INSERT INTO categorias (nombre, slug, descripcion, orden) VALUES
  ('Articulos Publicitarios', 'articulos-publicitarios', 'Productos personalizados para promocionar tu marca', 1),
  ('Grafica Publicitaria', 'grafica-publicitaria', 'Impresiones de alta calidad para todo tipo de graficas', 2),
  ('Transferibles', 'transferibles', 'Transferencias DTF y tecnologias de impresion textil', 3),
  ('Pendones y Banderas', 'pendones-y-banderas', 'Pendones, roller banners y banderas publicitarias', 4)
ON CONFLICT (slug) DO NOTHING;

-- Productos
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes) VALUES
  (
    'Impresion DTF Textil - Metro Lineal',
    'impresion-dtf-textil-metro-lineal',
    'Impresion DTF (Direct to Film) por metro lineal. Ideal para estampar poleras, bolsos, cojines y todo tipo de textiles. Alta durabilidad, colores vibrantes y excelente elasticidad. Ancho maximo de impresion: 60cm.',
    'Impresion DTF por metro lineal para textiles',
    16660,
    (SELECT id FROM categorias WHERE slug = 'transferibles'),
    100, true, 'DTF-ML-001',
    '[{"url": "", "alt": "DTF Textil Metro Lineal", "orden": 0}]',
    '[{"nombre": "Ancho", "opciones": [{"valor": "30cm", "precio_extra": 0}, {"valor": "60cm", "precio_extra": 5000}]}]'
  ),
  (
    'Polera Personalizable DTG',
    'polera-personalizable-dtg',
    'Polera 100% algodon con impresion DTG (Direct to Garment). Colores ilimitados, ideal para disenos complejos con degradados y fotografias. Disponible en multiples tallas.',
    'Polera con impresion directa a la prenda',
    19990,
    (SELECT id FROM categorias WHERE slug = 'articulos-publicitarios'),
    50, true, 'POL-DTG-001',
    '[{"url": "", "alt": "Polera DTG Personalizable", "orden": 0}]',
    '[{"nombre": "Talla", "opciones": [{"valor": "S", "precio_extra": 0}, {"valor": "M", "precio_extra": 0}, {"valor": "L", "precio_extra": 0}, {"valor": "XL", "precio_extra": 1000}, {"valor": "XXL", "precio_extra": 2000}]}]'
  ),
  (
    'Bolsa de Lona Tote Bag',
    'bolsa-lona-tote-bag',
    'Bolsa de lona reutilizable tipo Tote Bag, ideal para ferias, eventos o merchandising. Personalizable con tu logo o diseno. Material resistente y ecologico.',
    'Tote bag personalizable de lona',
    5990,
    (SELECT id FROM categorias WHERE slug = 'articulos-publicitarios'),
    200, true, 'BOL-TB-001',
    '[{"url": "", "alt": "Bolsa Tote Bag", "orden": 0}]',
    '[]'
  ),
  (
    'Pendon Roller PVC',
    'pendon-roller-pvc',
    'Pendon roller de PVC con estructura de aluminio. Incluye bolso de transporte. Ideal para ferias, eventos, puntos de venta y oficinas. Impresion full color en alta resolucion.',
    'Pendon roller con estructura incluida',
    46990,
    (SELECT id FROM categorias WHERE slug = 'pendones-y-banderas'),
    30, true, 'PEN-RL-001',
    '[{"url": "", "alt": "Pendon Roller PVC", "orden": 0}]',
    '[{"nombre": "Tamano", "opciones": [{"valor": "80x200cm", "precio_extra": 0}, {"valor": "100x200cm", "precio_extra": 8000}, {"valor": "120x200cm", "precio_extra": 15000}]}]'
  ),
  (
    'Botella Sublimada',
    'botella-sublimada',
    'Botella de acero inoxidable de 750ml con sublimacion full color. Doble pared para mantener temperatura. Personaliza con tu diseno, logo o foto.',
    'Botella acero inoxidable sublimada 750ml',
    7990,
    (SELECT id FROM categorias WHERE slug = 'articulos-publicitarios'),
    80, false, 'BOT-SUB-001',
    '[{"url": "", "alt": "Botella Sublimada", "orden": 0}]',
    '[{"nombre": "Color base", "opciones": [{"valor": "Blanco", "precio_extra": 0}, {"valor": "Negro", "precio_extra": 500}]}]'
  ),
  (
    'Impresiones B/N A4',
    'impresiones-bn-a4',
    'Impresiones en blanco y negro tamano carta (A4). Ideal para documentos, informes, copias y material de estudio. Papel bond 75g.',
    'Impresiones blanco y negro tamano A4',
    100,
    (SELECT id FROM categorias WHERE slug = 'grafica-publicitaria'),
    9999, false, 'IMP-BN-A4',
    '[{"url": "", "alt": "Impresiones B/N A4", "orden": 0}]',
    '[]'
  )
ON CONFLICT (slug) DO NOTHING;

-- Zonas de envio
INSERT INTO zonas_envio (nombre, comunas, precio, envio_gratis_desde, dias_despacho, horario) VALUES
  ('Zona 1 - Coltauco/Donihue/Coinco', ARRAY['Coltauco', 'Donihue', 'Coinco', 'Lo Miranda'], 3500, 50000, ARRAY['miercoles', 'viernes'], '10:00 - 18:00'),
  ('Zona 2 - Olivar/Rancagua/Machali', ARRAY['Olivar', 'Rancagua', 'Machali'], 4500, 50000, ARRAY['miercoles', 'viernes'], '10:00 - 18:00');
