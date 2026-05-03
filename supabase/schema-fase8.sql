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
