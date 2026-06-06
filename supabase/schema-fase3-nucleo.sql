-- ============================================================
-- PrintUp — Núcleo robusto (Fase 3)
-- Patrón 1 (FSM en la app), 2 (eventos + outbox), 9 (reserva stock TTL).
-- Idempotente. Ejecutar DESPUÉS de schema-inventario.sql.
-- ============================================================

-- ── 1. Outbox de eventos de dominio (Patrón 2) ───────────────
-- Cada cambio relevante (pedido pagado, estado cambiado, etc.) inserta un
-- evento. Un worker (cron) los procesa y dispara efectos (notificación
-- in-app, email, WhatsApp) con reintentos. Idempotente por estado.
CREATE TABLE IF NOT EXISTS domain_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text NOT NULL,                 -- 'pedido.creado' | 'pedido.pagado' | ...
  payload       jsonb,
  estado        text NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente', 'procesado', 'error')),
  intentos      int NOT NULL DEFAULT 0,
  error_msg     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  procesado_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_domain_events_pendientes
  ON domain_events (created_at) WHERE estado = 'pendiente';

-- ── 2. Notificaciones in-app (centro de notificaciones) ──────
CREATE TABLE IF NOT EXISTS notificaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text NOT NULL,                   -- 'pedido' | 'pago' | 'sistema' ...
  titulo      text NOT NULL,
  cuerpo      text,
  enlace      text,                            -- ruta admin asociada
  leida       boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_no_leidas
  ON notificaciones (created_at DESC) WHERE leida = false;

-- ── 3. Reserva de stock con TTL (Patrón 9) ───────────────────
-- Modelo: al iniciar el pedido se RESERVA (descuenta stock + movimiento
-- 'reserva'). Si no se paga en N minutos, un cron LIBERA (repone stock +
-- 'liberacion'). Al pagar, se CONFIRMA (marca 'venta', sin tocar stock:
-- ya estaba reservado). Solo afecta productos con controla_stock = true.

-- Reserva: valida disponibilidad, descuenta y registra 'reserva'.
CREATE OR REPLACE FUNCTION reservar_stock(p_items jsonb, p_pedido uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_item jsonb;
  v_prod RECORD;
  v_cant INT;
  v_faltantes jsonb := '[]'::jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::INT;
    SELECT id, nombre, stock, controla_stock INTO v_prod
      FROM productos WHERE id = (v_item->>'producto_id')::uuid FOR UPDATE;
    IF v_prod.id IS NULL THEN CONTINUE; END IF;
    IF v_prod.controla_stock AND v_prod.stock < v_cant THEN
      v_faltantes := v_faltantes || jsonb_build_object(
        'producto_id', v_prod.id, 'nombre', v_prod.nombre,
        'disponible', v_prod.stock, 'solicitado', v_cant);
    END IF;
  END LOOP;

  IF jsonb_array_length(v_faltantes) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'faltantes', v_faltantes);
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_cant := (v_item->>'cantidad')::INT;
    SELECT id, stock, controla_stock INTO v_prod
      FROM productos WHERE id = (v_item->>'producto_id')::uuid FOR UPDATE;
    IF v_prod.id IS NULL OR NOT v_prod.controla_stock THEN CONTINUE; END IF;
    UPDATE productos SET stock = stock - v_cant, updated_at = NOW() WHERE id = v_prod.id;
    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    VALUES (v_prod.id, 'reserva', -v_cant, v_prod.stock - v_cant, p_pedido, 'Reserva checkout');
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'faltantes', '[]'::jsonb);
END;
$$;

-- Confirma la reserva al pagar: marca 'venta' (cantidad 0, sin tocar stock).
CREATE OR REPLACE FUNCTION confirmar_reserva(p_pedido uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo si hay reserva y no se confirmó/liberó antes (idempotente).
  IF EXISTS (SELECT 1 FROM movimientos_stock WHERE pedido_id = p_pedido AND tipo = 'reserva')
     AND NOT EXISTS (SELECT 1 FROM movimientos_stock WHERE pedido_id = p_pedido AND tipo IN ('venta','liberacion'))
  THEN
    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    SELECT producto_id, 'venta', 0,
           (SELECT stock FROM productos WHERE id = ms.producto_id),
           p_pedido, 'Confirmación de reserva (pago)'
      FROM movimientos_stock ms
     WHERE ms.pedido_id = p_pedido AND ms.tipo = 'reserva';
  END IF;
END;
$$;

-- Libera la reserva de un pedido (repone stock + 'liberacion'). Idempotente.
CREATE OR REPLACE FUNCTION liberar_reserva(p_pedido uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_mov RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM movimientos_stock WHERE pedido_id = p_pedido AND tipo IN ('venta','liberacion')) THEN
    RETURN; -- ya confirmado o liberado
  END IF;
  FOR v_mov IN
    SELECT producto_id, cantidad FROM movimientos_stock
     WHERE pedido_id = p_pedido AND tipo = 'reserva'
  LOOP
    -- cantidad de la reserva es negativa: reponer su valor absoluto.
    UPDATE productos SET stock = stock + ABS(v_mov.cantidad), updated_at = NOW()
     WHERE id = v_mov.producto_id;
    INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, motivo)
    SELECT v_mov.producto_id, 'liberacion', ABS(v_mov.cantidad),
           (SELECT stock FROM productos WHERE id = v_mov.producto_id),
           p_pedido, 'Liberación de reserva (TTL/cancelación)';
  END LOOP;
END;
$$;

-- Libera todas las reservas vencidas (pago pendiente y antiguas). Devuelve el
-- número de pedidos liberados. La llama el cron /api/cron/liberar-reservas.
CREATE OR REPLACE FUNCTION liberar_reservas_vencidas(p_minutos int DEFAULT 30)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_pedido uuid;
  v_count int := 0;
BEGIN
  FOR v_pedido IN
    SELECT DISTINCT ms.pedido_id
      FROM movimientos_stock ms
      JOIN pedidos p ON p.id = ms.pedido_id
     WHERE ms.tipo = 'reserva'
       AND p.pago_estado = 'pendiente'
       AND p.created_at < NOW() - (p_minutos || ' minutes')::interval
       AND NOT EXISTS (
         SELECT 1 FROM movimientos_stock m2
          WHERE m2.pedido_id = ms.pedido_id AND m2.tipo IN ('venta','liberacion'))
  LOOP
    PERFORM liberar_reserva(v_pedido);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
