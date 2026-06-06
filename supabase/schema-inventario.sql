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

ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role movimientos" ON movimientos_stock;
CREATE POLICY "Service role movimientos" ON movimientos_stock FOR ALL USING (true);

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
DROP POLICY IF EXISTS "Public read own pedido" ON pedidos;
DROP POLICY IF EXISTS "Cliente ve sus pedidos" ON pedidos;
CREATE POLICY "Cliente ve sus pedidos" ON pedidos
  FOR SELECT
  USING (
    cliente_id = auth.uid()
    OR cliente_email = (auth.jwt() ->> 'email')
  );

-- El insert publico se mantiene (checkout de invitados) y el
-- service_role conserva acceso total via "Service role all pedidos".
