-- Migracion: Agregar campos de calculadora m2 a DTF Textil, DTF UV y Foam Board
-- Fecha: 2026-05-15
-- Ejecutar en Supabase Dashboard > SQL Editor

-- DTF Textil - Metro Lineal (58x100cm) - Se vende por metro lineal
UPDATE productos
SET
  precio_m2 = 16660,
  ancho_max_cm = 58,
  alto_max_cm = 0,
  area_min_cm2 = 1000,
  materiales_calculadora = '[
    {"nombre": "DTF Textil Estandar", "multiplicador": 1},
    {"nombre": "DTF Textil Premium (mas opaco)", "multiplicador": 1.25}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin acabado extra", "precioExtra": 0},
    {"nombre": "Corte por unidad (troquelado)", "precioExtra": 500},
    {"nombre": "Pre-cortado en plancha A3", "precioExtra": 800}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion DTF full color + blanco',
    'Lamina de transferencia lista para planchar',
    'Instrucciones de aplicacion'
  ],
  usos = ARRAY[
    'Poleras y camisetas',
    'Buzos y polerones',
    'Tote bags y bolsas de tela',
    'Gorros y accesorios textiles',
    'Ropa de trabajo personalizada'
  ],
  caracteristicas = ARRAY[
    'Impresion full color + blanco simultaneo',
    'Adherencia a algodon, poliester y mezclas',
    'Resiste hasta 60 lavados sin degradarse',
    'Textura suave y flexible al tacto',
    'Ancho maximo de impresion: 58 cm',
    'Se puede aplicar con plancha termica o industrial'
  ]
WHERE slug = 'dtf-textil-metro-lineal';

-- DTF UV - Metro Lineal (30x100cm) - Se vende por metro lineal
UPDATE productos
SET
  precio_m2 = 21420,
  ancho_max_cm = 30,
  alto_max_cm = 0,
  area_min_cm2 = 500,
  materiales_calculadora = '[
    {"nombre": "DTF UV Transparente", "multiplicador": 1},
    {"nombre": "DTF UV Blanco (sobre superficie oscura)", "multiplicador": 1.15}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Sin acabado extra", "precioExtra": 0},
    {"nombre": "Corte por unidad", "precioExtra": 500},
    {"nombre": "Laminado UV protector", "precioExtra": 1000}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion DTF UV full color',
    'Lamina transfer lista para aplicar',
    'Se adhiere en frio (sin calor)'
  ],
  usos = ARRAY[
    'Vasos y botellas',
    'Carcasas de celular',
    'Superficies rigidas (madera, acrilico, metal)',
    'Packaging y cajas',
    'Stickers troquelados premium'
  ],
  caracteristicas = ARRAY[
    'Adhesion en frio: no necesita calor',
    'Funciona sobre cualquier superficie lisa',
    'Full color con efecto brillante',
    'Resistente al agua y rayado',
    'Ancho maximo: 30 cm',
    'Ideal para objetos que no soportan calor'
  ]
WHERE slug = 'impresion-dtf-uv-metro-lineal';

-- Foam Board con Adhesivo 5mm - Se vende por pieza/m2
UPDATE productos
SET
  precio_m2 = 17820,
  ancho_max_cm = 120,
  alto_max_cm = 240,
  area_min_cm2 = 2000,
  materiales_calculadora = '[
    {"nombre": "Foam Board 5mm Blanco", "multiplicador": 1},
    {"nombre": "Foam Board 5mm Negro", "multiplicador": 1.1},
    {"nombre": "Foam Board 10mm Blanco", "multiplicador": 1.6}
  ]'::jsonb,
  acabados_calculadora = '[
    {"nombre": "Corte recto", "precioExtra": 0},
    {"nombre": "Corte con forma (troquel)", "precioExtra": 2500},
    {"nombre": "Laminado mate protector", "precioExtra": 1500},
    {"nombre": "Laminado brillante", "precioExtra": 1500},
    {"nombre": "Soporte trasero autoadhesivo", "precioExtra": 800}
  ]'::jsonb,
  incluye = ARRAY[
    'Impresion full color en adhesivo vinilico',
    'Montaje sobre Foam Board 5mm',
    'Corte a medida'
  ],
  usos = ARRAY[
    'Letreros y senaletica interior',
    'Displays para punto de venta',
    'Decoracion de tiendas y oficinas',
    'Presentaciones y exposiciones',
    'Fotografia montada para cuadros'
  ],
  caracteristicas = ARRAY[
    'Foam Board liviano y rigido',
    'Impresion full color en alta resolucion',
    'Ideal para interior (no resiste agua)',
    'Facil de colgar o montar con cinta doble faz',
    'Tamano maximo: 120 x 240 cm',
    'Corte recto o con forma personalizada'
  ]
WHERE slug = 'foam-board-foamex-con-adhesivo-5mm';
