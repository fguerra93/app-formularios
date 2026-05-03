-- ============================================
-- FASE 5: Cuentas de Cliente, Retencion y WhatsApp Bot
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. TABLA CLIENTES (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  direccion_default JSONB DEFAULT NULL,
  preferencias JSONB DEFAULT '{"newsletter": true, "notificaciones": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes pueden ver su propio perfil"
  ON clientes FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Clientes pueden actualizar su propio perfil"
  ON clientes FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Insertar propio perfil al registrarse"
  ON clientes FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access clientes"
  ON clientes FOR ALL
  USING (auth.role() = 'service_role');

-- 2. AGREGAR COLUMNA cliente_id A PEDIDOS
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Permitir que clientes vean sus propios pedidos
CREATE POLICY "Clientes ven sus propios pedidos"
  ON pedidos FOR SELECT
  USING (auth.uid() = cliente_id);

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

ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes ven sus propios favoritos"
  ON favoritos FOR SELECT
  USING (auth.uid() = cliente_id);

CREATE POLICY "Clientes agregan favoritos"
  ON favoritos FOR INSERT
  WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Clientes eliminan favoritos"
  ON favoritos FOR DELETE
  USING (auth.uid() = cliente_id);

CREATE POLICY "Service role full access favoritos"
  ON favoritos FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE carritos_guardados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes ven su propio carrito"
  ON carritos_guardados FOR SELECT
  USING (auth.uid() = cliente_id);

CREATE POLICY "Clientes actualizan su propio carrito"
  ON carritos_guardados FOR UPDATE
  USING (auth.uid() = cliente_id);

CREATE POLICY "Clientes insertan su propio carrito"
  ON carritos_guardados FOR INSERT
  WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Service role full access carritos"
  ON carritos_guardados FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE notificaciones_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede suscribirse a stock"
  ON notificaciones_stock FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role full access notificaciones_stock"
  ON notificaciones_stock FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE conversaciones_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access conversaciones_whatsapp"
  ON conversaciones_whatsapp FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE mensajes_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access mensajes_whatsapp"
  ON mensajes_whatsapp FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE cotizaciones_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access cotizaciones_whatsapp"
  ON cotizaciones_whatsapp FOR ALL
  USING (auth.role() = 'service_role');

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
