-- ============================================
-- MIGRACION COMPLETA PARA FASE 11
-- Ejecutar en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zynopkkubpojllkhkfsn/sql/new
-- ============================================

-- 1. TABLA CLIENTES (sin referencia a auth.users para permitir clientes de RRSS)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access clientes"
  ON clientes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Clientes ven su propio perfil"
  ON clientes FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Clientes actualizan su propio perfil"
  ON clientes FOR UPDATE
  USING (auth.uid() = auth_user_id);

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

ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access conversaciones"
  ON conversaciones FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access mensajes"
  ON mensajes FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE respuestas_automaticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access respuestas_automaticas"
  ON respuestas_automaticas FOR ALL
  USING (auth.role() = 'service_role');

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

ALTER TABLE mensajes_rapidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access mensajes_rapidos"
  ON mensajes_rapidos FOR ALL
  USING (auth.role() = 'service_role');

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
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos', 'archivos', true)
ON CONFLICT (id) DO NOTHING;

-- Politica de storage: service role puede todo
CREATE POLICY "Service role uploads archivos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'archivos' AND auth.role() = 'service_role');

-- Politica publica de lectura
CREATE POLICY "Public read archivos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'archivos');
