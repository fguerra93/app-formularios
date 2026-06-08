
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- clientes: auth propia (password_hash), sin dependencia de auth.users.
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  email TEXT UNIQUE,
  password_hash TEXT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  tipo TEXT DEFAULT 'persona',
  razon_social TEXT,
  whatsapp_phone TEXT,
  instagram_id TEXT,
  facebook_id TEXT,
  canal_origen TEXT,
  onboarding_completo BOOLEAN DEFAULT false,
  direccion_default JSONB DEFAULT NULL,
  preferencias JSONB DEFAULT '{"newsletter": true, "notificaciones": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- bot_intent_cache: unión de columnas de las 2 versiones (texto_norm + mensaje_hash).
CREATE TABLE IF NOT EXISTS bot_intent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texto_norm TEXT UNIQUE,
  intent TEXT NOT NULL,
  nivel TEXT,
  mensaje_hash TEXT,
  confianza REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ===== schema.sql =====
-- ============================================================
-- PrintUp Formularios — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Formularios recibidos
CREATE TABLE IF NOT EXISTS formularios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  material TEXT,
  mensaje TEXT,
  archivos JSONB DEFAULT '[]',
  estado TEXT DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'revisado', 'completado')),
  nextcloud_path TEXT,
  nextcloud_synced BOOLEAN DEFAULT FALSE,
  email_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración del sistema (key-value)
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de emails enviados
CREATE TABLE IF NOT EXISTS email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID REFERENCES formularios(id) ON DELETE SET NULL,
  destinatario TEXT NOT NULL,
  asunto TEXT NOT NULL,
  estado TEXT DEFAULT 'enviado',
  error TEXT,
  proveedor TEXT DEFAULT 'resend',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_formularios_created ON formularios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_formularios_estado ON formularios(estado);
CREATE INDEX IF NOT EXISTS idx_email_log_fecha ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_formulario ON email_log(formulario_id);

-- Configuración inicial por defecto
INSERT INTO configuracion (clave, valor) VALUES
  ('proveedor_email', 'resend'),
  ('notify_to', 'guerrafelipe93@gmail.com'),
  ('from_name', 'PrintUp Formulario'),
  ('from_email', 'onboarding@resend.dev'),
  ('max_archivos', '10'),
  ('max_tamano_mb', '100')
ON CONFLICT (clave) DO NOTHING;

-- Storage bucket (crear manualmente en Supabase Dashboard > Storage)
-- Nombre: formularios-archivos
-- Público: true (para que los archivos sean accesibles via URL)

-- RLS Policies (básicas - ajustar según necesidad)




-- Permitir inserts públicos en formularios (los clientes envían sin auth)

-- Permitir lectura con service role (admin)







-- ===== schema-ecommerce.sql =====
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





-- Categorias: lectura publica



-- Productos: lectura publica



-- Pedidos: insert publico, lectura por UUID




-- Zonas envio: lectura publica



-- Pagos log (webhooks de MercadoPago)
CREATE TABLE IF NOT EXISTS pagos_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);




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


-- ===== schema-fase4.sql =====
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






-- Reviews: lectura publica (aprobadas), insercion publica, gestion service role









-- ===== schema-fase5.sql =====
-- ============================================
-- FASE 5: Cuentas de Cliente, Retencion y WhatsApp Bot
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. TABLA CLIENTES (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  direccion_default JSONB DEFAULT NULL,
  preferencias JSONB DEFAULT '{"newsletter": true, "notificaciones": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);











-- 2. AGREGAR COLUMNA cliente_id A PEDIDOS
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Permitir que clientes vean sus propios pedidos


-- 3. AGREGAR COLUMNA cliente_id A REVIEWS
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- 4. TABLA FAVORITOS (sync con BD para usuarios autenticados)
CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id, producto_id)
);











-- 5. CARRITOS GUARDADOS (para recuperacion de carrito abandonado)
CREATE TABLE IF NOT EXISTS carritos_guardados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  cupon_codigo TEXT,
  email_enviado BOOLEAN DEFAULT FALSE,
  email_enviado_at TIMESTAMPTZ,
  recuperado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);











-- 6. PRECIOS POR CANTIDAD
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precios_cantidad JSONB DEFAULT '[]';

-- 7. NOTIFICACIONES DE STOCK
CREATE TABLE IF NOT EXISTS notificaciones_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notificado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);







-- 8. WHATSAPP BOT - Conversaciones
CREATE TABLE IF NOT EXISTS conversaciones_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_phone TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'escalada', 'cerrada')),
  ultimo_mensaje_at TIMESTAMPTZ DEFAULT NOW(),
  contexto JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);





-- 9. WHATSAPP BOT - Mensajes
CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id UUID NOT NULL REFERENCES conversaciones_whatsapp(id) ON DELETE CASCADE,
  direccion TEXT NOT NULL CHECK (direccion IN ('entrante', 'saliente')),
  tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'documento', 'audio', 'interactivo', 'template')),
  contenido TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  procesado_por TEXT DEFAULT 'bot' CHECK (procesado_por IN ('bot', 'ia', 'humano')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);





-- 10. WHATSAPP BOT - Cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id UUID REFERENCES conversaciones_whatsapp(id),
  cliente_nombre TEXT,
  cliente_email TEXT,
  producto_tipo TEXT,
  cantidad INT,
  tiene_diseno BOOLEAN,
  urgencia TEXT,
  estimado_precio INT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'respondida', 'convertida')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);





-- 11. CUPON VUELVE5 para carrito abandonado
INSERT INTO cupones (codigo, tipo, valor, minimo_compra, maximo_descuento, usos_maximos, fecha_inicio, activo, aplica_a, aplica_ids)
VALUES ('VUELVE5', 'porcentaje', 5, 0, NULL, NULL, NOW(), true, 'todo', '[]')
ON CONFLICT (codigo) DO NOTHING;

-- 12. INDICES
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente_id ON favoritos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_carritos_cliente_id ON carritos_guardados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_carritos_abandonados ON carritos_guardados(email_enviado, recuperado, updated_at);
CREATE INDEX IF NOT EXISTS idx_notif_stock_producto ON notificaciones_stock(producto_id, notificado);
CREATE INDEX IF NOT EXISTS idx_conv_whatsapp_phone ON conversaciones_whatsapp(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_conv_whatsapp_estado ON conversaciones_whatsapp(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_conv ON mensajes_whatsapp(conversacion_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cotiz_whatsapp_estado ON cotizaciones_whatsapp(estado);


-- ===== schema-fase6.sql =====
-- ============================================
-- FASE 6: Social Proof, Portafolio y Growth
-- ============================================

-- 1. Tabla: trabajos (portafolio)
CREATE TABLE IF NOT EXISTS trabajos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  cliente_nombre TEXT,
  categoria TEXT,
  imagenes JSONB NOT NULL DEFAULT '[]',
  destacado BOOLEAN DEFAULT false,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla: clientes_destacados (logos de empresas)
CREATE TABLE IF NOT EXISTS clientes_destacados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  url_web TEXT,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true
);

-- 3. Tabla: preguntas_producto
CREATE TABLE IF NOT EXISTS preguntas_producto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  autor_nombre TEXT NOT NULL,
  autor_email TEXT NOT NULL,
  pregunta TEXT NOT NULL,
  respuesta TEXT,
  respuesta_at TIMESTAMPTZ,
  publica BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla: suscriptores (newsletter)
CREATE TABLE IF NOT EXISTS suscriptores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT,
  activo BOOLEAN DEFAULT true,
  fuente TEXT DEFAULT 'footer',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Columna ficha_tecnica_url en productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS ficha_tecnica_url TEXT;

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_trabajos_activo ON trabajos(activo, orden);
CREATE INDEX IF NOT EXISTS idx_trabajos_destacado ON trabajos(destacado, activo);
CREATE INDEX IF NOT EXISTS idx_clientes_destacados_activo ON clientes_destacados(activo, orden);
CREATE INDEX IF NOT EXISTS idx_preguntas_producto ON preguntas_producto(producto_id, publica);
CREATE INDEX IF NOT EXISTS idx_suscriptores_activo ON suscriptores(activo);
CREATE INDEX IF NOT EXISTS idx_suscriptores_email ON suscriptores(email);

-- 7. RLS


















-- ===== schema-fase7.sql =====
-- ============================================
-- Fase 7: Bandeja Unificada de Mensajes + Bot Multi-Canal
-- ============================================

-- Tabla unificada de conversaciones multi-canal
CREATE TABLE conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'instagram', 'facebook', 'email')),
  contacto_id TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_avatar TEXT,
  contacto_telefono TEXT,
  contacto_username TEXT,
  estado TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'archivada')),
  etiquetas TEXT[] DEFAULT '{}',
  asignado_a TEXT,
  ultimo_mensaje TEXT,
  ultimo_mensaje_at TIMESTAMPTZ,
  no_leidos INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mensajes individuales
CREATE TABLE mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
  direccion TEXT NOT NULL CHECK (direccion IN ('entrante', 'saliente')),
  tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'audio', 'video', 'documento', 'sticker', 'ubicacion', 'template')),
  contenido TEXT,
  media_url TEXT,
  media_type TEXT,
  meta_message_id TEXT,
  estado_envio TEXT DEFAULT 'enviado' CHECK (estado_envio IN ('pendiente', 'enviado', 'entregado', 'leido', 'fallido')),
  respuesta_automatica BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Respuestas automaticas configurables por canal
CREATE TABLE respuestas_automaticas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  canales TEXT[] DEFAULT '{whatsapp,instagram,facebook}',
  palabras_clave TEXT[] NOT NULL,
  respuesta TEXT NOT NULL,
  tipo_respuesta TEXT DEFAULT 'texto' CHECK (tipo_respuesta IN ('texto', 'imagen', 'template')),
  media_url TEXT,
  activo BOOLEAN DEFAULT true,
  prioridad INT DEFAULT 0,
  horario_inicio TIME,
  horario_fin TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plantillas de mensaje rapido
CREATE TABLE mensajes_rapidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT,
  atajo TEXT,
  canales TEXT[] DEFAULT '{whatsapp,instagram,facebook}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversaciones_canal ON conversaciones(canal);
CREATE INDEX idx_conversaciones_estado ON conversaciones(estado);
CREATE INDEX idx_conversaciones_ultimo ON conversaciones(ultimo_mensaje_at DESC);
CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id, created_at);
CREATE INDEX idx_respuestas_auto_activo ON respuestas_automaticas(activo);


-- ===== schema-fase8.sql =====
-- ============================================
-- Fase 8: Campanas de Marketing con Template Builder
-- ============================================

-- Templates de email reutilizables
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT DEFAULT 'general',
  contenido_json JSONB NOT NULL,
  contenido_html TEXT,
  thumbnail_url TEXT,
  es_preset BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campanas de marketing
CREATE TABLE campanas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  contenido_html TEXT,
  segmento JSONB DEFAULT '{}',
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programada', 'enviando', 'enviada', 'cancelada')),
  programada_para TIMESTAMPTZ,
  enviada_at TIMESTAMPTZ,
  total_destinatarios INT DEFAULT 0,
  total_enviados INT DEFAULT 0,
  total_abiertos INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  total_errores INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Log de envio por destinatario
CREATE TABLE campana_envios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campana_id UUID REFERENCES campanas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'abierto', 'click', 'rebotado', 'error')),
  abierto_at TIMESTAMPTZ,
  click_at TIMESTAMPTZ,
  error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campanas_estado ON campanas(estado);
CREATE INDEX idx_campana_envios_campana ON campana_envios(campana_id);
CREATE INDEX idx_email_templates_categoria ON email_templates(categoria);


-- ===== schema-fase9.sql =====
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


-- ===== schema-fase11.sql =====
-- ============================================
-- Fase 11: Bot de Bienvenida + Onboarding
-- ============================================

-- Agregar columnas a la tabla clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'persona';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS instagram_id TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS facebook_id TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS canal_origen TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS onboarding_completo BOOLEAN DEFAULT false;

-- Indices para busqueda rapida del bot
CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp_phone ON clientes(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_clientes_instagram_id ON clientes(instagram_id);
CREATE INDEX IF NOT EXISTS idx_clientes_facebook_id ON clientes(facebook_id);

-- Agregar contexto de bot a conversaciones
ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS bot_context JSONB DEFAULT '{}';
ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS cliente_id UUID;

-- Cache de intenciones IA
CREATE TABLE IF NOT EXISTS bot_intent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_hash TEXT UNIQUE NOT NULL,
  intent TEXT NOT NULL,
  confianza REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_intent_cache_created ON bot_intent_cache(created_at);


-- ===== migration-calculadora-m2.sql =====
-- Migracion: Agregar campos de calculadora por m² a productos
-- Fecha: 2026-05-15

-- Campos de precio por m² y calculadora
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_m2 INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS ancho_max_cm INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS alto_max_cm INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS area_min_cm2 INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS materiales_calculadora JSONB DEFAULT '[]';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS acabados_calculadora JSONB DEFAULT '[]';

-- Campos de contenido enriquecido
ALTER TABLE productos ADD COLUMN IF NOT EXISTS incluye TEXT[] DEFAULT '{}';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS usos TEXT[] DEFAULT '{}';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS caracteristicas TEXT[] DEFAULT '{}';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS especificaciones JSONB DEFAULT '[]';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precios_cantidad JSONB DEFAULT '[]';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS ficha_tecnica_url TEXT;

-- Actualizar Tela PVC 10oz como producto de ejemplo con calculadora m²
UPDATE productos
SET
  precio_m2 = 7500,
  ancho_max_cm = 150,
  alto_max_cm = 0,
  area_min_cm2 = 2500,
  materiales_calculadora = '[
    {"nombre": "Tela PVC 10oz Estandar", "multiplicador": 1},
    {"nombre": "Tela PVC 13oz Heavy Duty", "multiplicador": 1.35},
    {"nombre": "Tela Mesh Microperforada", "multiplicador": 1.2}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin terminacion", "precioExtra": 0},
    {"nombre": "Ojetillos cada 30cm", "precioExtra": 1200},
    {"nombre": "Bolsillo para tubo", "precioExtra": 1500},
    {"nombre": "Bastidor aluminio", "precioExtra": 4500},
    {"nombre": "Sellado perimetral", "precioExtra": 800}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion full color alta resolucion 1440dpi',
    'Material PVC 10oz resistente UV e intemperie',
    'Corte a medida exacta'
  ],
  usos = ARRAY[
    'Pendones y lienzos publicitarios',
    'Telones para eventos',
    'Señaletica exterior de gran formato',
    'Cierres perimetrales de obra',
    'Decoracion de fachadas'
  ],
  caracteristicas = ARRAY[
    'Impresion ecosolvente a 1440 DPI',
    'Resistente a rayos UV y lluvia',
    'Material flexible y enrollable',
    'Colores vibrantes que no se destiñen',
    'Hasta 150cm de ancho sin empalme',
    'Ideal para interior y exterior'
  ]
WHERE slug = 'tela-pvc-10oz-servicio-de-impresion';

-- Actualizar Pendon Roller como producto m² tambien
UPDATE productos
SET
  precio_m2 = 12000,
  ancho_max_cm = 85,
  alto_max_cm = 200,
  area_min_cm2 = 5000,
  materiales_calculadora = '[
    {"nombre": "Tela PVC 10oz", "multiplicador": 1},
    {"nombre": "Tela Backlight traslucida", "multiplicador": 1.5}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin terminacion extra", "precioExtra": 0},
    {"nombre": "Laminado mate protector", "precioExtra": 2000},
    {"nombre": "Laminado brillante", "precioExtra": 2000}
  ]'::jsonb,
  incluye = ARRAY[
    'Estructura de aluminio porta-banner',
    'Varilla telescopica superior',
    'Bolso de transporte incluido',
    'Impresion en alta resolucion',
    'Base retractil con pie estabilizador'
  ],
  usos = ARRAY[
    'Ferias y exposiciones',
    'Stands de venta',
    'Recepciones y lobbies',
    'Eventos corporativos',
    'Puntos de venta'
  ],
  caracteristicas = ARRAY[
    'Estructura de aluminio liviana y resistente',
    'Armado en 30 segundos sin herramientas',
    'Impresion full color a 1440 DPI',
    'Portatil: incluye bolso de transporte',
    'Base retractil de facil almacenamiento'
  ]
WHERE slug = 'pendon-roller-pvc';


-- ===== migration-calculadora-mas-productos.sql =====
-- Migracion: Agregar campos de calculadora m2 a DTF Textil, DTF UV y Foam Board
-- Fecha: 2026-05-15
-- Ejecutar en Supabase Dashboard > SQL Editor

-- DTF Textil - Metro Lineal (58x100cm) - Se vende por metro lineal
UPDATE productos
SET
  precio_m2 = 16660,
  ancho_max_cm = 58,
  alto_max_cm = 0,
  area_min_cm2 = 1000,
  materiales_calculadora = '[
    {"nombre": "DTF Textil Estandar", "multiplicador": 1},
    {"nombre": "DTF Textil Premium (mas opaco)", "multiplicador": 1.25}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin acabado extra", "precioExtra": 0},
    {"nombre": "Corte por unidad (troquelado)", "precioExtra": 500},
    {"nombre": "Pre-cortado en plancha A3", "precioExtra": 800}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion DTF full color + blanco',
    'Lamina de transferencia lista para planchar',
    'Instrucciones de aplicacion'
  ],
  usos = ARRAY[
    'Poleras y camisetas',
    'Buzos y polerones',
    'Tote bags y bolsas de tela',
    'Gorros y accesorios textiles',
    'Ropa de trabajo personalizada'
  ],
  caracteristicas = ARRAY[
    'Impresion full color + blanco simultaneo',
    'Adherencia a algodon, poliester y mezclas',
    'Resiste hasta 60 lavados sin degradarse',
    'Textura suave y flexible al tacto',
    'Ancho maximo de impresion: 58 cm',
    'Se puede aplicar con plancha termica o industrial'
  ]
WHERE slug = 'dtf-textil-metro-lineal';

-- DTF UV - Metro Lineal (30x100cm) - Se vende por metro lineal
UPDATE productos
SET
  precio_m2 = 21420,
  ancho_max_cm = 30,
  alto_max_cm = 0,
  area_min_cm2 = 500,
  materiales_calculadora = '[
    {"nombre": "DTF UV Transparente", "multiplicador": 1},
    {"nombre": "DTF UV Blanco (sobre superficie oscura)", "multiplicador": 1.15}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin acabado extra", "precioExtra": 0},
    {"nombre": "Corte por unidad", "precioExtra": 500},
    {"nombre": "Laminado UV protector", "precioExtra": 1000}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion DTF UV full color',
    'Lamina transfer lista para aplicar',
    'Se adhiere en frio (sin calor)'
  ],
  usos = ARRAY[
    'Vasos y botellas',
    'Carcasas de celular',
    'Superficies rigidas (madera, acrilico, metal)',
    'Packaging y cajas',
    'Stickers troquelados premium'
  ],
  caracteristicas = ARRAY[
    'Adhesion en frio: no necesita calor',
    'Funciona sobre cualquier superficie lisa',
    'Full color con efecto brillante',
    'Resistente al agua y rayado',
    'Ancho maximo: 30 cm',
    'Ideal para objetos que no soportan calor'
  ]
WHERE slug = 'impresion-dtf-uv-metro-lineal';

-- Foam Board con Adhesivo 5mm - Se vende por pieza/m2
UPDATE productos
SET
  precio_m2 = 17820,
  ancho_max_cm = 120,
  alto_max_cm = 240,
  area_min_cm2 = 2000,
  materiales_calculadora = '[
    {"nombre": "Foam Board 5mm Blanco", "multiplicador": 1},
    {"nombre": "Foam Board 5mm Negro", "multiplicador": 1.1},
    {"nombre": "Foam Board 10mm Blanco", "multiplicador": 1.6}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Corte recto", "precioExtra": 0},
    {"nombre": "Corte con forma (troquel)", "precioExtra": 2500},
    {"nombre": "Laminado mate protector", "precioExtra": 1500},
    {"nombre": "Laminado brillante", "precioExtra": 1500},
    {"nombre": "Soporte trasero autoadhesivo", "precioExtra": 800}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion full color en adhesivo vinilico',
    'Montaje sobre Foam Board 5mm',
    'Corte a medida'
  ],
  usos = ARRAY[
    'Letreros y senaletica interior',
    'Displays para punto de venta',
    'Decoracion de tiendas y oficinas',
    'Presentaciones y exposiciones',
    'Fotografia montada para cuadros'
  ],
  caracteristicas = ARRAY[
    'Foam Board liviano y rigido',
    'Impresion full color en alta resolucion',
    'Ideal para interior (no resiste agua)',
    'Facil de colgar o montar con cinta doble faz',
    'Tamano maximo: 120 x 240 cm',
    'Corte recto o con forma personalizada'
  ]
WHERE slug = 'foam-board-foamex-con-adhesivo-5mm';


-- ===== migration-fase11-completa.sql =====
-- ============================================
-- MIGRACION COMPLETA PARA FASE 11
-- Ejecutar en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zynopkkubpojllkhkfsn/sql/new
-- ============================================

-- 1. TABLA CLIENTES (sin referencia a auth.users para permitir clientes de RRSS)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  email TEXT UNIQUE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  tipo TEXT DEFAULT 'persona',
  razon_social TEXT,
  whatsapp_phone TEXT,
  instagram_id TEXT,
  facebook_id TEXT,
  canal_origen TEXT,
  onboarding_completo BOOLEAN DEFAULT false,
  direccion_default JSONB DEFAULT NULL,
  preferencias JSONB DEFAULT '{"newsletter": true, "notificaciones": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);









CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp_phone ON clientes(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_clientes_instagram_id ON clientes(instagram_id);
CREATE INDEX IF NOT EXISTS idx_clientes_facebook_id ON clientes(facebook_id);
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user ON clientes(auth_user_id);

-- 2. CONVERSACIONES MULTI-CANAL (Fase 7)
CREATE TABLE IF NOT EXISTS conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'instagram', 'facebook', 'email')),
  contacto_id TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_avatar TEXT,
  contacto_telefono TEXT,
  contacto_username TEXT,
  estado TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'archivada', 'escalada')),
  etiquetas TEXT[] DEFAULT '{}',
  asignado_a TEXT,
  ultimo_mensaje TEXT,
  ultimo_mensaje_at TIMESTAMPTZ,
  no_leidos INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  bot_context JSONB DEFAULT '{}',
  cliente_id UUID REFERENCES clientes(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);





CREATE INDEX IF NOT EXISTS idx_conversaciones_canal ON conversaciones(canal);
CREATE INDEX IF NOT EXISTS idx_conversaciones_estado ON conversaciones(estado);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultimo ON conversaciones(ultimo_mensaje_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversaciones_contacto ON conversaciones(canal, contacto_id);

-- 3. MENSAJES
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
  direccion TEXT NOT NULL CHECK (direccion IN ('entrante', 'saliente')),
  tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'audio', 'video', 'documento', 'sticker', 'ubicacion', 'template')),
  contenido TEXT,
  media_url TEXT,
  media_type TEXT,
  meta_message_id TEXT,
  estado_envio TEXT DEFAULT 'enviado' CHECK (estado_envio IN ('pendiente', 'enviado', 'entregado', 'leido', 'fallido')),
  respuesta_automatica BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);





CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id, created_at);

-- 4. RESPUESTAS AUTOMATICAS
CREATE TABLE IF NOT EXISTS respuestas_automaticas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  canales TEXT[] DEFAULT '{whatsapp,instagram,facebook}',
  palabras_clave TEXT[] NOT NULL,
  respuesta TEXT NOT NULL,
  tipo_respuesta TEXT DEFAULT 'texto' CHECK (tipo_respuesta IN ('texto', 'imagen', 'template')),
  media_url TEXT,
  activo BOOLEAN DEFAULT true,
  prioridad INT DEFAULT 0,
  horario_inicio TIME,
  horario_fin TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);





CREATE INDEX IF NOT EXISTS idx_respuestas_auto_activo ON respuestas_automaticas(activo);

-- 5. MENSAJES RAPIDOS
CREATE TABLE IF NOT EXISTS mensajes_rapidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT,
  atajo TEXT,
  canales TEXT[] DEFAULT '{whatsapp,instagram,facebook}',
  created_at TIMESTAMPTZ DEFAULT now()
);





-- 6. CACHE DE INTENCIONES IA
CREATE TABLE IF NOT EXISTS bot_intent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_hash TEXT UNIQUE NOT NULL,
  intent TEXT NOT NULL,
  confianza REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_intent_cache_created ON bot_intent_cache(created_at);

-- 7. STORAGE BUCKET para archivos (si no existe)


-- Politica de storage: service role puede todo


-- Politica publica de lectura



-- ===== schema-inventario.sql =====
-- ============================================================
-- PrintUp — Inventario real + seguridad de pedidos
-- Fases 1, 2 y 10 del Plan Maestro.
-- Ejecutar en Supabase > SQL Editor DESPUES de schema-ecommerce.sql.
-- Es idempotente (IF NOT EXISTS / OR REPLACE): se puede re-ejecutar.
-- ============================================================

-- ── 1. Control de stock por producto ────────────────────────
-- Una imprenta vende productos "bajo pedido" (sin limite de stock)
-- y productos con stock fisico. Solo se controla stock cuando
-- controla_stock = true. Por defecto false (bajo pedido) para no
-- romper el catalogo existente de impresion a pedido.
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS controla_stock BOOLEAN DEFAULT false;

-- ── 2. Movimientos de stock (trazabilidad) ──────────────────
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('venta','reposicion','ajuste','reserva','liberacion','devolucion')),
  cantidad INT NOT NULL,            -- negativo descuenta, positivo repone
  stock_resultante INT NOT NULL,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  motivo TEXT,
  usuario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movstock_producto ON movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movstock_pedido ON movimientos_stock(pedido_id);
CREATE INDEX IF NOT EXISTS idx_movstock_created ON movimientos_stock(created_at DESC);





-- ── 3. Funcion atomica para descontar stock ─────────────────
-- Bloquea las filas (FOR UPDATE), valida, descuenta y registra el
-- movimiento en UNA transaccion. Evita la condicion de carrera de
-- dos compras simultaneas del ultimo item.
-- Recibe: p_items = jsonb [{ "producto_id": "...", "cantidad": N }]
-- Devuelve: jsonb { ok: bool, faltantes: [...] }
CREATE OR REPLACE FUNCTION descontar_stock(p_items jsonb, p_pedido uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_item jsonb;
  v_prod RECORD;
  v_cant INT;
  v_faltantes jsonb := '[]'::jsonb;
BEGIN
  -- Primera pasada: validar stock con bloqueo de fila.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::INT;

    SELECT id, nombre, stock, controla_stock
      INTO v_prod
      FROM productos
     WHERE id = (v_item->>'producto_id')::uuid
     FOR UPDATE;

    IF v_prod.id IS NULL THEN
      CONTINUE; -- producto inexistente, se ignora
    END IF;

    IF v_prod.controla_stock AND v_prod.stock < v_cant THEN
      v_faltantes := v_faltantes || jsonb_build_object(
        'producto_id', v_prod.id,
        'nombre', v_prod.nombre,
        'disponible', v_prod.stock,
        'solicitado', v_cant
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_faltantes) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'faltantes', v_faltantes);
  END IF;

  -- Segunda pasada: descontar y registrar movimiento.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::INT;

    SELECT id, stock, controla_stock
      INTO v_prod
      FROM productos
     WHERE id = (v_item->>'producto_id')::uuid
     FOR UPDATE;

    IF v_prod.id IS NULL OR NOT v_prod.controla_stock THEN
      CONTINUE; -- bajo pedido: no descuenta stock
    END IF;

    UPDATE productos
       SET stock = stock - v_cant,
           updated_at = NOW()
     WHERE id = v_prod.id;

    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    VALUES (v_prod.id, 'venta', -v_cant, v_prod.stock - v_cant, p_pedido, 'Venta pedido');
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'faltantes', '[]'::jsonb);
END;
$$;

-- ── 4. Funcion para reponer stock (cancelacion / devolucion) ─
CREATE OR REPLACE FUNCTION reponer_stock(p_items jsonb, p_pedido uuid, p_tipo text DEFAULT 'devolucion')
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_item jsonb;
  v_prod RECORD;
  v_cant INT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::INT;

    SELECT id, stock, controla_stock
      INTO v_prod
      FROM productos
     WHERE id = (v_item->>'producto_id')::uuid
     FOR UPDATE;

    IF v_prod.id IS NULL OR NOT v_prod.controla_stock THEN
      CONTINUE;
    END IF;

    UPDATE productos
       SET stock = stock + v_cant,
           updated_at = NOW()
     WHERE id = v_prod.id;

    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    VALUES (v_prod.id, p_tipo, v_cant, v_prod.stock + v_cant, p_pedido, 'Reposicion por ' || p_tipo);
  END LOOP;
END;
$$;

-- ── 5. Indexes de pago faltantes (Fase 4) ───────────────────
CREATE INDEX IF NOT EXISTS idx_pedidos_pago_referencia ON pedidos(pago_referencia);
CREATE INDEX IF NOT EXISTS idx_pedidos_pago_estado ON pedidos(pago_estado);

-- ── 6. RLS de pedidos corregida (Fase 10) ───────────────────
-- ANTES: "Public read own pedido USING (true)" => cualquiera leia
-- TODOS los pedidos. Se reemplaza por: el cliente autenticado ve
-- solo los suyos; el backend (service_role) ve todo.




-- El insert publico se mantiene (checkout de invitados) y el
-- service_role conserva acceso total via "Service role all pedidos".


-- ===== schema-seguridad.sql =====
-- ============================================================
-- PrintUp — Esquema de seguridad (Fase 2: blindaje)
-- Patrones 4 (idempotencia + firma), 6 (RBAC), 10 (audit log).
-- Idempotente: usa IF NOT EXISTS. Ejecutar en Supabase/Postgres.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Idempotencia de webhooks (Patrón 4)
--    Cada evento de proveedor se registra una sola vez. Un reintento
--    con el mismo (proveedor, evento_id) se ignora -> no reprocesa
--    stock ni emails.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_eventos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor     text NOT NULL,                 -- 'mercadopago' | 'meta'
  evento_id     text NOT NULL,                 -- id del evento en el proveedor
  payload       jsonb,
  procesado_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proveedor, evento_id)
);

-- ------------------------------------------------------------
-- 2. RBAC multiusuario (Patrón 6) — cierra punto ciego #1
--    Reemplaza el admin único (ADMIN_USER/ADMIN_PASSWORD) por usuarios
--    con rol. Roles: admin (todo), vendedor (ventas/mensajería),
--    bodega (inventario/producción).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_admin (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text NOT NULL UNIQUE,
  password_hash  text NOT NULL,                -- scrypt: scrypt$<saltHex>$<hashHex>
  nombre         text,
  rol            text NOT NULL DEFAULT 'admin'
                 CHECK (rol IN ('admin', 'vendedor', 'bodega')),
  activo         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin (email);

-- ------------------------------------------------------------
-- 3. Audit log (Patrón 10)
--    Registra acciones sensibles del admin: cambiar estado de pedido,
--    validar pago, ajustar stock, crear/editar usuario, etc.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario     text,                            -- email/sub del actor
  accion      text NOT NULL,                   -- 'pedido.estado', 'pago.validar', ...
  entidad     text,                            -- 'pedido' | 'producto' | 'usuario' ...
  entidad_id  text,
  datos       jsonb,                           -- detalle (antes/después, etc.)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad ON audit_log (entidad, entidad_id);


-- ===== schema-fase3-nucleo.sql =====
-- ============================================================
-- PrintUp — Núcleo robusto (Fase 3)
-- Patrón 1 (FSM en la app), 2 (eventos + outbox), 9 (reserva stock TTL).
-- Idempotente. Ejecutar DESPUÉS de schema-inventario.sql.
-- ============================================================

-- ── 1. Outbox de eventos de dominio (Patrón 2) ───────────────
-- Cada cambio relevante (pedido pagado, estado cambiado, etc.) inserta un
-- evento. Un worker (cron) los procesa y dispara efectos (notificación
-- in-app, email, WhatsApp) con reintentos. Idempotente por estado.
CREATE TABLE IF NOT EXISTS domain_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text NOT NULL,                 -- 'pedido.creado' | 'pedido.pagado' | ...
  payload       jsonb,
  estado        text NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'procesado', 'error')),
  intentos      int NOT NULL DEFAULT 0,
  error_msg     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  procesado_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_domain_events_pendientes
  ON domain_events (created_at) WHERE estado = 'pendiente';

-- ── 2. Notificaciones in-app (centro de notificaciones) ──────
CREATE TABLE IF NOT EXISTS notificaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text NOT NULL,                   -- 'pedido' | 'pago' | 'sistema' ...
  titulo      text NOT NULL,
  cuerpo      text,
  enlace      text,                            -- ruta admin asociada
  leida       boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_no_leidas
  ON notificaciones (created_at DESC) WHERE leida = false;

-- ── 3. Reserva de stock con TTL (Patrón 9) ───────────────────
-- Modelo: al iniciar el pedido se RESERVA (descuenta stock + movimiento
-- 'reserva'). Si no se paga en N minutos, un cron LIBERA (repone stock +
-- 'liberacion'). Al pagar, se CONFIRMA (marca 'venta', sin tocar stock:
-- ya estaba reservado). Solo afecta productos con controla_stock = true.

-- Reserva: valida disponibilidad, descuenta y registra 'reserva'.
CREATE OR REPLACE FUNCTION reservar_stock(p_items jsonb, p_pedido uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_item jsonb;
  v_prod RECORD;
  v_cant INT;
  v_faltantes jsonb := '[]'::jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::INT;
    SELECT id, nombre, stock, controla_stock INTO v_prod
      FROM productos WHERE id = (v_item->>'producto_id')::uuid FOR UPDATE;
    IF v_prod.id IS NULL THEN CONTINUE; END IF;
    IF v_prod.controla_stock AND v_prod.stock < v_cant THEN
      v_faltantes := v_faltantes || jsonb_build_object(
        'producto_id', v_prod.id, 'nombre', v_prod.nombre,
        'disponible', v_prod.stock, 'solicitado', v_cant);
    END IF;
  END LOOP;

  IF jsonb_array_length(v_faltantes) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'faltantes', v_faltantes);
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::INT;
    SELECT id, stock, controla_stock INTO v_prod
      FROM productos WHERE id = (v_item->>'producto_id')::uuid FOR UPDATE;
    IF v_prod.id IS NULL OR NOT v_prod.controla_stock THEN CONTINUE; END IF;
    UPDATE productos SET stock = stock - v_cant, updated_at = NOW() WHERE id = v_prod.id;
    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    VALUES (v_prod.id, 'reserva', -v_cant, v_prod.stock - v_cant, p_pedido, 'Reserva checkout');
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'faltantes', '[]'::jsonb);
END;
$$;

-- Confirma la reserva al pagar: marca 'venta' (cantidad 0, sin tocar stock).
CREATE OR REPLACE FUNCTION confirmar_reserva(p_pedido uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo si hay reserva y no se confirmó/liberó antes (idempotente).
  IF EXISTS (SELECT 1 FROM movimientos_stock WHERE pedido_id = p_pedido AND tipo = 'reserva')
     AND NOT EXISTS (SELECT 1 FROM movimientos_stock WHERE pedido_id = p_pedido AND tipo IN ('venta','liberacion'))
  THEN
    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    SELECT producto_id, 'venta', 0,
           (SELECT stock FROM productos WHERE id = ms.producto_id),
           p_pedido, 'Confirmación de reserva (pago)'
      FROM movimientos_stock ms
     WHERE ms.pedido_id = p_pedido AND ms.tipo = 'reserva';
  END IF;
END;
$$;

-- Libera la reserva de un pedido (repone stock + 'liberacion'). Idempotente.
CREATE OR REPLACE FUNCTION liberar_reserva(p_pedido uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_mov RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM movimientos_stock WHERE pedido_id = p_pedido AND tipo IN ('venta','liberacion')) THEN
    RETURN; -- ya confirmado o liberado
  END IF;
  FOR v_mov IN
    SELECT producto_id, cantidad FROM movimientos_stock
     WHERE pedido_id = p_pedido AND tipo = 'reserva'
  LOOP
    -- cantidad de la reserva es negativa: reponer su valor absoluto.
    UPDATE productos SET stock = stock + ABS(v_mov.cantidad), updated_at = NOW()
     WHERE id = v_mov.producto_id;
    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    SELECT v_mov.producto_id, 'liberacion', ABS(v_mov.cantidad),
           (SELECT stock FROM productos WHERE id = v_mov.producto_id),
           p_pedido, 'Liberación de reserva (TTL/cancelación)';
  END LOOP;
END;
$$;

-- Libera todas las reservas vencidas (pago pendiente y antiguas). Devuelve el
-- número de pedidos liberados. La llama el cron /api/cron/liberar-reservas.
CREATE OR REPLACE FUNCTION liberar_reservas_vencidas(p_minutos int DEFAULT 30)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_pedido uuid;
  v_count int := 0;
BEGIN
  FOR v_pedido IN
    SELECT DISTINCT ms.pedido_id
      FROM movimientos_stock ms
      JOIN pedidos p ON p.id = ms.pedido_id
     WHERE ms.tipo = 'reserva'
       AND p.pago_estado = 'pendiente'
       AND p.created_at < NOW() - (p_minutos || ' minutes')::interval
       AND NOT EXISTS (
         SELECT 1 FROM movimientos_stock m2
          WHERE m2.pedido_id = ms.pedido_id AND m2.tipo IN ('venta','liberacion'))
  LOOP
    PERFORM liberar_reserva(v_pedido);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;


-- ===== schema-fase4-aprobaciones.sql =====
-- ============================================================
-- PrintUp — Operación del dueño (Fase 4)
-- Patrón 3 (cola de aprobación human-in-the-loop) + Patrón 8 (read models).
-- Idempotente. Ejecutar DESPUÉS de schema-fase3-nucleo.sql.
-- ============================================================

-- ── 1. Cola de aprobaciones (Patrón 3) ──────────────────────
-- El bot / sistema NUNCA ejecuta acciones sensibles: insertan una aprobación
-- PENDIENTE. El dueño la aprueba o rechaza desde /admin/aprobaciones; al
-- aprobar se dispara el efecto (vía domain_event / acción directa).
CREATE TABLE IF NOT EXISTS aprobaciones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text NOT NULL
               CHECK (tipo IN ('validar_pago', 'aprobar_arte', 'enviar_cotizacion', 'responder_cliente')),
  titulo       text NOT NULL,
  descripcion  text,
  payload      jsonb,                          -- datos para ejecutar el efecto
  estado       text NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  creada_por   text NOT NULL DEFAULT 'sistema',-- 'bot' | 'sistema'
  resuelta_por text,                            -- email del admin que resolvió
  nota         text,                            -- nota/edición al resolver
  created_at   timestamptz NOT NULL DEFAULT now(),
  resuelta_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_aprobaciones_pendientes
  ON aprobaciones (created_at DESC) WHERE estado = 'pendiente';

-- ── 2. Read model: ventas por día (Patrón 8) ────────────────
-- Vista para el dashboard (últimos pedidos pagados agregados por día).
CREATE OR REPLACE VIEW vw_ventas_por_dia AS
SELECT
  date_trunc('day', created_at)::date AS dia,
  count(*)                            AS pedidos,
  coalesce(sum(total), 0)             AS total
FROM pedidos
WHERE pago_estado = 'pagado'
GROUP BY 1
ORDER BY 1 DESC;


-- ===== schema-fase5-bot.sql =====
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


-- ===== schema-fase6-dte.sql =====
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


-- ===== schema-fase7-produccion.sql =====
-- ============================================================
-- PrintUp — Producción / taller (Fase 7)
-- Orden de Producción (OP) + estados de taller (FSM en la app).
-- Idempotente. Ejecutar DESPUÉS de schema-fase6-dte.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS ordenes_produccion (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_op        serial,
  pedido_id        uuid REFERENCES pedidos(id) ON DELETE SET NULL,
  formulario_id    uuid REFERENCES formularios(id) ON DELETE SET NULL,
  tipo             text,                          -- DTF Textil, DTF UV, ...
  cantidad         int DEFAULT 1,
  dimensiones      text,
  material         text,
  archivo_diseno_url text,
  precio_total     int DEFAULT 0,
  estado           text NOT NULL DEFAULT 'en_cola'
                   CHECK (estado IN ('en_cola','imprimiendo','acabado','control_calidad','listo','entregado')),
  prioridad        int NOT NULL DEFAULT 0,        -- mayor = más urgente
  fecha_compromiso date,
  operador         text,
  tipo_entrega     text,
  notas            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_op_estado ON ordenes_produccion (estado, prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_op_pedido ON ordenes_produccion (pedido_id);


-- ===== schema-fase-f1-gangsheet.sql =====
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


-- ===== schema-fase-f2-taller.sql =====
-- ============================================================
-- PrintUp — Pipeline omnicanal + Comanda/KDS de taller (Fase F2)
-- Etiqueta de canal en pedido/OP para que la cola del taller muestre de dónde
-- viene cada comanda (web | whatsapp | manual). Aditivo y NO invasivo: la
-- columna tiene DEFAULT 'web', así los inserts existentes siguen funcionando
-- aunque no la especifiquen. El semáforo de SLA usa `updated_at` (momento de
-- entrada a la etapa actual) y el historial por transición vive en
-- `domain_events` (op.estado), que ya existe.
-- Idempotente. Ejecutar DESPUÉS de schema-fase-f1-gangsheet.sql.
-- ============================================================

ALTER TABLE pedidos             ADD COLUMN IF NOT EXISTS canal text DEFAULT 'web';
ALTER TABLE ordenes_produccion  ADD COLUMN IF NOT EXISTS canal text DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_pedidos_canal ON pedidos (canal);
CREATE INDEX IF NOT EXISTS idx_op_canal      ON ordenes_produccion (canal);


-- ===== schema-fase-f4-costos.sql =====
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


-- ===== schema-fase-f5-mercado.sql =====
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


-- ===== schema-fase-f6-push.sql =====
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

