-- ============================================================
-- PrintUp — Seed de DEMO para el sandbox (Fase 9)
-- Datos mínimos para que el dueño pruebe: zonas de envío de O'Higgins y
-- cupones. El catálogo de productos usa seed-shopify-products.sql.
-- Idempotente (no duplica si ya existe). Ejecutar al final.
-- ============================================================

-- ── Zonas de envío (O'Higgins) ──────────────────────────────
INSERT INTO zonas_envio (nombre, comunas, precio, envio_gratis_desde, activa)
SELECT * FROM (VALUES
  ('Doñihue y alrededores', ARRAY['Doñihue','Coltauco','Las Cabras'], 2500, 50000, true),
  ('Rancagua y Machalí',    ARRAY['Rancagua','Machalí','Graneros'],   3500, 50000, true),
  ('Resto O''Higgins',      ARRAY['San Fernando','Santa Cruz','Rengo','San Vicente'], 4500, 60000, true)
) AS v(nombre, comunas, precio, envio_gratis_desde, activa)
WHERE NOT EXISTS (SELECT 1 FROM zonas_envio WHERE nombre = v.nombre);

-- Los cupones de demo (BIENVENIDO10, ENVIOGRATIS) ya los crea schema-fase4.sql.
