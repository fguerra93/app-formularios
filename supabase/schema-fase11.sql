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
