-- ============================================================
-- PrintUp — Producción / taller (Fase 7)
-- Orden de Producción (OP) + estados de taller (FSM en la app).
-- Idempotente. Ejecutar DESPUÉS de schema-fase6-dte.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS ordenes_produccion (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_op        serial,
  pedido_id        uuid REFERENCES pedidos(id) ON DELETE SET NULL,
  formulario_id    uuid REFERENCES formularios(id) ON DELETE SET NULL,
  tipo             text,                          -- DTF Textil, DTF UV, ...
  cantidad         int DEFAULT 1,
  dimensiones      text,
  material         text,
  archivo_diseno_url text,
  precio_total     int DEFAULT 0,
  estado           text NOT NULL DEFAULT 'en_cola'
                   CHECK (estado IN ('en_cola','imprimiendo','acabado','control_calidad','listo','entregado')),
  prioridad        int NOT NULL DEFAULT 0,        -- mayor = más urgente
  fecha_compromiso date,
  operador         text,
  tipo_entrega     text,
  notas            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_op_estado ON ordenes_produccion (estado, prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_op_pedido ON ordenes_produccion (pedido_id);
