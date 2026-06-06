-- ============================================================
-- PrintUp — Seed de DEMO para el sandbox (Fase 9)
-- Datos mínimos para que el dueño pruebe: zonas de envío de O'Higgins y
-- cupones. El catálogo de productos usa seed-shopify-products.sql.
-- Idempotente (no duplica si ya existe). Ejecutar al final.
-- ============================================================

-- ── Zonas de envío (O'Higgins) ──────────────────────────────
INSERT INTO zonas_envio (nombre, comunas, precio, envio_gratis_desde, activa, orden)
SELECT * FROM (VALUES
  ('Doñihue y alrededores', ARRAY['Doñihue','Coltauco','Las Cabras'], 2500, 50000, true, 1),
  ('Rancagua y Machalí',    ARRAY['Rancagua','Machalí','Graneros'],   3500, 50000, true, 2),
  ('Resto O''Higgins',      ARRAY['San Fernando','Santa Cruz','Rengo','San Vicente'], 4500, 60000, true, 3)
) AS v(nombre, comunas, precio, envio_gratis_desde, activa, orden)
WHERE NOT EXISTS (SELECT 1 FROM zonas_envio WHERE nombre = v.nombre);

-- ── Cupones de demo ─────────────────────────────────────────
INSERT INTO cupones (codigo, tipo, valor, activo, usos_maximos, descripcion)
SELECT * FROM (VALUES
  ('BIENVENIDO10', 'porcentaje', 10, true, 100, '10% de descuento de bienvenida'),
  ('ENVIOGRATIS',  'envio_gratis', 0, true, 50, 'Envío gratis en tu compra')
) AS v(codigo, tipo, valor, activo, usos_maximos, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM cupones WHERE codigo = v.codigo);
