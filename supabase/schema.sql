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
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Permitir inserts públicos en formularios (los clientes envían sin auth)
CREATE POLICY "Allow public insert" ON formularios FOR INSERT WITH CHECK (true);
-- Permitir lectura con service role (admin)
CREATE POLICY "Allow service role read" ON formularios FOR SELECT USING (true);
CREATE POLICY "Allow service role update" ON formularios FOR UPDATE USING (true);

CREATE POLICY "Allow all configuracion" ON configuracion FOR ALL USING (true);
CREATE POLICY "Allow all email_log" ON email_log FOR ALL USING (true);
