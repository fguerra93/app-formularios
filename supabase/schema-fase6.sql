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
ALTER TABLE trabajos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trabajos_public_read" ON trabajos FOR SELECT USING (activo = true);
CREATE POLICY "trabajos_admin_all" ON trabajos FOR ALL USING (true);

ALTER TABLE clientes_destacados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_dest_public_read" ON clientes_destacados FOR SELECT USING (activo = true);
CREATE POLICY "clientes_dest_admin_all" ON clientes_destacados FOR ALL USING (true);

ALTER TABLE preguntas_producto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preguntas_public_read" ON preguntas_producto FOR SELECT USING (publica = true);
CREATE POLICY "preguntas_insert" ON preguntas_producto FOR INSERT WITH CHECK (true);
CREATE POLICY "preguntas_admin_all" ON preguntas_producto FOR ALL USING (true);

ALTER TABLE suscriptores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suscriptores_insert" ON suscriptores FOR INSERT WITH CHECK (true);
CREATE POLICY "suscriptores_admin_all" ON suscriptores FOR ALL USING (true);
