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
