-- ============================================================
-- PrintUp — Pipeline omnicanal + Comanda/KDS de taller (Fase F2)
-- Etiqueta de canal en pedido/OP para que la cola del taller muestre de dónde
-- viene cada comanda (web | whatsapp | manual). Aditivo y NO invasivo: la
-- columna tiene DEFAULT 'web', así los inserts existentes siguen funcionando
-- aunque no la especifiquen. El semáforo de SLA usa `updated_at` (momento de
-- entrada a la etapa actual) y el historial por transición vive en
-- `domain_events` (op.estado), que ya existe.
-- Idempotente. Ejecutar DESPUÉS de schema-fase-f1-gangsheet.sql.
-- ============================================================

ALTER TABLE pedidos             ADD COLUMN IF NOT EXISTS canal text DEFAULT 'web';
ALTER TABLE ordenes_produccion  ADD COLUMN IF NOT EXISTS canal text DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_pedidos_canal ON pedidos (canal);
CREATE INDEX IF NOT EXISTS idx_op_canal      ON ordenes_produccion (canal);
