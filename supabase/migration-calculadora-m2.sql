-- Migracion: Agregar campos de calculadora por m² a productos
-- Fecha: 2026-05-15

-- Campos de precio por m² y calculadora
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_m2 INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS ancho_max_cm INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS alto_max_cm INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS area_min_cm2 INT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS materiales_calculadora JSONB DEFAULT '[]';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS acabados_calculadora JSONB DEFAULT '[]';

-- Campos de contenido enriquecido
ALTER TABLE productos ADD COLUMN IF NOT EXISTS incluye TEXT[] DEFAULT '{}';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS usos TEXT[] DEFAULT '{}';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS caracteristicas TEXT[] DEFAULT '{}';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS especificaciones JSONB DEFAULT '[]';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precios_cantidad JSONB DEFAULT '[]';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS ficha_tecnica_url TEXT;

-- Actualizar Tela PVC 10oz como producto de ejemplo con calculadora m²
UPDATE productos
SET
  precio_m2 = 7500,
  ancho_max_cm = 150,
  alto_max_cm = 0,
  area_min_cm2 = 2500,
  materiales_calculadora = '[
    {"nombre": "Tela PVC 10oz Estandar", "multiplicador": 1},
    {"nombre": "Tela PVC 13oz Heavy Duty", "multiplicador": 1.35},
    {"nombre": "Tela Mesh Microperforada", "multiplicador": 1.2}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin terminacion", "precioExtra": 0},
    {"nombre": "Ojetillos cada 30cm", "precioExtra": 1200},
    {"nombre": "Bolsillo para tubo", "precioExtra": 1500},
    {"nombre": "Bastidor aluminio", "precioExtra": 4500},
    {"nombre": "Sellado perimetral", "precioExtra": 800}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion full color alta resolucion 1440dpi',
    'Material PVC 10oz resistente UV e intemperie',
    'Corte a medida exacta'
  ],
  usos = ARRAY[
    'Pendones y lienzos publicitarios',
    'Telones para eventos',
    'Señaletica exterior de gran formato',
    'Cierres perimetrales de obra',
    'Decoracion de fachadas'
  ],
  caracteristicas = ARRAY[
    'Impresion ecosolvente a 1440 DPI',
    'Resistente a rayos UV y lluvia',
    'Material flexible y enrollable',
    'Colores vibrantes que no se destiñen',
    'Hasta 150cm de ancho sin empalme',
    'Ideal para interior y exterior'
  ]
WHERE slug = 'tela-pvc-10oz-servicio-de-impresion';

-- Actualizar Pendon Roller como producto m² tambien
UPDATE productos
SET
  precio_m2 = 12000,
  ancho_max_cm = 85,
  alto_max_cm = 200,
  area_min_cm2 = 5000,
  materiales_calculadora = '[
    {"nombre": "Tela PVC 10oz", "multiplicador": 1},
    {"nombre": "Tela Backlight traslucida", "multiplicador": 1.5}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin terminacion extra", "precioExtra": 0},
    {"nombre": "Laminado mate protector", "precioExtra": 2000},
    {"nombre": "Laminado brillante", "precioExtra": 2000}
  ]'::jsonb,
  incluye = ARRAY[
    'Estructura de aluminio porta-banner',
    'Varilla telescopica superior',
    'Bolso de transporte incluido',
    'Impresion en alta resolucion',
    'Base retractil con pie estabilizador'
  ],
  usos = ARRAY[
    'Ferias y exposiciones',
    'Stands de venta',
    'Recepciones y lobbies',
    'Eventos corporativos',
    'Puntos de venta'
  ],
  caracteristicas = ARRAY[
    'Estructura de aluminio liviana y resistente',
    'Armado en 30 segundos sin herramientas',
    'Impresion full color a 1440 DPI',
    'Portatil: incluye bolso de transporte',
    'Base retractil de facil almacenamiento'
  ]
WHERE slug = 'pendon-roller-pvc';
