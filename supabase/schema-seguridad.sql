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
