-- ============================================================
-- Etapa 3 — Carrito abandonado para invitados
-- Ejecutar en: Supabase Dashboard > SQL Editor (y Cloud SQL prod)
-- ============================================================

-- El carrito abandonado ya no exige cliente con cuenta: basta el email
-- capturado temprano en el checkout.
ALTER TABLE carritos_guardados ALTER COLUMN cliente_id DROP NOT NULL;
ALTER TABLE carritos_guardados ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE carritos_guardados ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE carritos_guardados ADD COLUMN IF NOT EXISTS total INT DEFAULT 0;
-- Token de recuperación: link con capacidad (no requiere login).
ALTER TABLE carritos_guardados ADD COLUMN IF NOT EXISTS token UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_carritos_token ON carritos_guardados(token);
CREATE INDEX IF NOT EXISTS idx_carritos_email ON carritos_guardados(email);
CREATE INDEX IF NOT EXISTS idx_carritos_abandono
  ON carritos_guardados(updated_at) WHERE email_enviado = false AND recuperado = false;

-- (reviews.fotos JSONB ya existe desde fase 4 — sin cambios)
