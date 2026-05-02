-- ============================================================
-- PrintUp E-Commerce — Datos reales sincronizados desde Shopify
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- IMPORTANTE: Ejecutar DESPUES del schema-ecommerce.sql
-- ============================================================

-- Limpiar datos de prueba
DELETE FROM productos;
DELETE FROM categorias;

-- ============================================================
-- CATEGORIAS (desde colecciones de Shopify)
-- ============================================================
INSERT INTO categorias (nombre, slug, descripcion, orden) VALUES
  ('Articulos Publicitarios', 'articulos-publicitarios', 'Tazones, botellas, bolsas y productos personalizados para promocionar tu marca', 1),
  ('Grafica Publicitaria', 'grafica-publicitaria', 'Impresion en PVC, foam board, adhesivos y mas para tu negocio', 2),
  ('Poleras Personalizadas', 'poleras-personalizadas', 'Poleras con impresion DTF y DTG de alta calidad', 3),
  ('Transferibles', 'transferibles', 'Transferencias DTF UV y DTF Textil por metro lineal', 4),
  ('Pendones y Banderas', 'pendones-y-banderas', 'Pendones roller, banderas y senaletica publicitaria', 5);

-- ============================================================
-- PRODUCTOS (13 productos reales de Shopify)
-- ============================================================

-- 1. Tazon Sublimado Personalizable (11 oz)
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Tazon Sublimado Personalizable (11 oz)',
  'tazon-sublimado-personalizable-11-oz',
  'Nuestros tazones sublimados personalizables son ideales para regalos, merchandising y uso diario. La sublimacion permite un acabado a todo color, con excelente definicion y una imagen integrada al recubrimiento del tazon, logrando un resultado duradero y de calidad.

Como comprar:
- Una vez realizado el pago envianos tu imagen en tamano real de 9x20 cm a contacto@printup.cl con el detalle de tu compra. Nosotros te contactaremos para aprobar tu imagen y realizar el estampado.
- Para otros requerimientos especificos escribenos para realizarte cotizacion personalizada.',
  'Tazon sublimado full color, ideal para regalos y merchandising',
  5000,
  (SELECT id FROM categorias WHERE slug = 'articulos-publicitarios'),
  100, true, 'TAZ-SUB-11OZ',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/TAZA_dc6b2fa2-4fc5-444f-9d95-1720ed49ea6c.png", "alt": "Tazon Sublimado 11oz", "orden": 0}]',
  '[{"nombre": "Cantidad", "opciones": [{"valor": "1 unidad", "precio_extra": 0}, {"valor": "Pack 6 unidades ($3.750 c/u)", "precio_extra": -1250}, {"valor": "Pack 12 unidades ($3.250 c/u)", "precio_extra": -1750}]}]',
  ARRAY['sublimacion', 'tazon', 'personalizado', 'regalo']
);

-- 2. Impresion en Adhesivo + Foam Board (Foamex) 5mm
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Impresion en Adhesivo + Foam Board (Foamex) 5mm',
  'foam-board-foamex-con-adhesivo-5mm',
  'Impresion full color en adhesivo de alta calidad montado sobre Foam Board (Foamex) de 5mm. Ideal para senaletica interior, displays en punto de venta, decoracion de eventos y montajes fotograficos. Acabado profesional y liviano.',
  'Adhesivo full color montado en Foam Board 5mm - Retiro en Tienda',
  17820,
  (SELECT id FROM categorias WHERE slug = 'grafica-publicitaria'),
  50, false, 'FB-ADH-5MM',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20260320_191028_1.jpg?v=1774368659", "alt": "Foam Board con Adhesivo 5mm", "orden": 0}]',
  '[{"nombre": "Tamano", "opciones": [{"valor": "60x90 cm", "precio_extra": 0}, {"valor": "100x100 cm", "precio_extra": 15180}, {"valor": "90x120 cm", "precio_extra": 17820}]}]',
  ARRAY['foam board', 'adhesivo', 'senaletica', 'display']
);

-- 3. Impresion Tela PVC 10 oz - Metro Lineal
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Impresion Tela PVC 10 oz - Metro Lineal (150x100cm)',
  'tela-pvc-10oz-servicio-de-impresion',
  'Impresion full color sobre tela PVC de 10 oz por metro lineal (150x100cm). Material resistente a la intemperie, ideal para pendones, lienzos publicitarios, senaletica exterior y decoracion de eventos.',
  'Tela PVC 10oz impresa full color por metro lineal - Retiro en Tienda',
  10990,
  (SELECT id FROM categorias WHERE slug = 'grafica-publicitaria'),
  100, false, 'PVC-10OZ-ML',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20250515_103817.jpg?v=1773951352", "alt": "Tela PVC 10oz", "orden": 0}]',
  '[]',
  ARRAY['pvc', 'tela', 'impresion', 'exterior']
);

-- 4. Servicio de Impresion Full Color - Carta/Oficio
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Servicio de Impresion Full Color - Carta/Oficio',
  'servicio-impresion-full-color-carta-oficio',
  'Servicio de impresion full color en tamano carta u oficio. Ideal para presentaciones, afiches, folletos y material publicitario. Papel de alta calidad con colores vibrantes.',
  'Impresion a color en tamano carta u oficio - Retiro en Tienda',
  250,
  (SELECT id FROM categorias WHERE slug = 'grafica-publicitaria'),
  9999, false, 'IMP-FC-CO',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/ChatGPTImageMar19_2026_08_08_08PM.png?v=17739", "alt": "Impresion Full Color", "orden": 0}]',
  '[{"nombre": "Tamano", "opciones": [{"valor": "Carta", "precio_extra": 0}, {"valor": "Oficio", "precio_extra": 0}]}]',
  ARRAY['impresion', 'color', 'carta', 'oficio']
);

-- 5. Servicio de Impresion Blanco y Negro - Carta/Oficio
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Servicio de Impresion Blanco y Negro - Carta/Oficio',
  'servicio-impresion-blanco-y-negro-carta-oficio',
  'Impresiones en blanco y negro tamano carta u oficio. Ideal para documentos, informes, copias y material de estudio. Papel bond de alta calidad.',
  'Impresion B/N carta u oficio - Retiro en Tienda',
  100,
  (SELECT id FROM categorias WHERE slug = 'grafica-publicitaria'),
  9999, false, 'IMP-BN-CO',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/ChatGPTImageMar19_2026_08_08_08PM.png?v=17739", "alt": "Impresion Blanco y Negro", "orden": 0}]',
  '[{"nombre": "Tamano", "opciones": [{"valor": "Carta", "precio_extra": 0}, {"valor": "Oficio", "precio_extra": 0}]}]',
  ARRAY['impresion', 'blanco y negro', 'carta', 'oficio']
);

-- 6. Impresion DTF UV - Metro lineal (30x100 cm)
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Impresion DTF UV - Metro lineal (30x100 cm)',
  'impresion-dtf-uv-metro-lineal',
  'Impresion DTF UV por metro lineal (30x100 cm). Tecnologia de vanguardia para transferir disenos a superficies rigidas como madera, metal, vidrio, acrilico y mas. Excelente adherencia y durabilidad.',
  'DTF UV para superficies rigidas, metro lineal - Retiro en Tienda',
  21420,
  (SELECT id FROM categorias WHERE slug = 'transferibles'),
  100, true, 'DTF-UV-ML',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20251211_164637.jpg?v=1773951868", "alt": "DTF UV Metro Lineal", "orden": 0}, {"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20251009_175754.jpg?v=1773951868", "alt": "DTF UV Ejemplo", "orden": 1}]',
  '[]',
  ARRAY['dtf', 'uv', 'transferible', 'rigido']
);

-- 7. Botella Personalizada Sublimada 650 ml
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Botella Personalizada Sublimada 650 ml',
  'botella-personalizada-sublimada-650-ml',
  'Botella de acero inoxidable de 650ml con sublimacion full color. Doble pared para mantener temperatura. Personaliza con tu diseno, logo o foto. Ideal para regalos corporativos y uso diario.',
  'Botella acero inoxidable sublimada 650ml',
  7990,
  (SELECT id FROM categorias WHERE slug = 'articulos-publicitarios'),
  80, true, 'BOT-SUB-650',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/BOTELLA-MODELO-2.png?v=1770159452", "alt": "Botella Sublimada 650ml", "orden": 0}]',
  '[]',
  ARRAY['botella', 'sublimacion', 'personalizado', 'regalo']
);

-- 8. Botella Personalizada Sublimada Tapa Rosca 600 ml
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Botella Personalizada Sublimada Tapa Rosca 600 ml',
  'botella-personalizada-sublimada-tapa-rosca-600-ml',
  'Botella de acero inoxidable de 600ml con tapa rosca y sublimacion full color. Doble pared termica. Personaliza con tu diseno, logo o foto. Perfecta para merchandising y regalos empresariales.',
  'Botella acero inoxidable tapa rosca sublimada 600ml',
  7990,
  (SELECT id FROM categorias WHERE slug = 'articulos-publicitarios'),
  80, false, 'BOT-SUB-600',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/BOTELLA-MODELO-1.png?v=1770158506", "alt": "Botella Sublimada Tapa Rosca 600ml", "orden": 0}, {"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/BOTELLAS_SUBLIMADAS_MUNI_DO_IHUE.jpg?v=177126", "alt": "Botellas Sublimadas ejemplo", "orden": 1}]',
  '[]',
  ARRAY['botella', 'sublimacion', 'tapa rosca', 'personalizado']
);

-- 9. Polera Personalizable DTF
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Polera Personalizable DTF',
  'polera-personalizable-dtf',
  'Polera personalizada con tecnologia DTF (Direct to Film). Estampado de alta calidad con colores vibrantes y excelente durabilidad al lavado. Ideal para merchandising, equipos de trabajo y regalos personalizados.',
  'Polera con estampado DTF de alta calidad',
  16990,
  (SELECT id FROM categorias WHERE slug = 'poleras-personalizadas'),
  50, true, 'POL-DTF-001',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/POLERA.png?v=1768926587", "alt": "Polera DTF Personalizable", "orden": 0}]',
  '[]',
  ARRAY['polera', 'dtf', 'personalizado', 'textil']
);

-- 10. Impresion DTF Textil - Metro lineal (58x100cm)
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Impresion DTF Textil - Metro lineal (58x100cm)',
  'dtf-textil-metro-lineal',
  'Impresion DTF (Direct to Film) textil por metro lineal (58x100cm). Ideal para estampar poleras, bolsos, cojines y todo tipo de textiles. Alta durabilidad, colores vibrantes y excelente elasticidad.',
  'DTF textil por metro lineal para estampado - Retiro en Tienda',
  16660,
  (SELECT id FROM categorias WHERE slug = 'transferibles'),
  100, true, 'DTF-TXT-ML',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/DTFTEXTIL2.jpg?v=1768931472", "alt": "DTF Textil", "orden": 0}, {"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20260127_170932.jpg?v=1773946577", "alt": "DTF Textil ejemplo", "orden": 1}]',
  '[]',
  ARRAY['dtf', 'textil', 'transferible', 'estampado']
);

-- 11. Bolsa de Lona Personalizable (Tote Bag)
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Bolsa de Lona Personalizable (Tote Bag)',
  'bolsa-de-lona-personalizable-tote-bag',
  'Bolsa de lona reutilizable tipo Tote Bag, ideal para ferias, eventos o merchandising. Personalizable con tu logo o diseno. Material resistente y ecologico.',
  'Tote bag personalizable de lona para eventos y merchandising',
  5990,
  (SELECT id FROM categorias WHERE slug = 'articulos-publicitarios'),
  200, true, 'BOL-TB-001',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/TOTEBAG.png?v=1768928001", "alt": "Bolsa Tote Bag", "orden": 0}]',
  '[]',
  ARRAY['bolsa', 'tote bag', 'lona', 'ecologico']
);

-- 12. Pendon Roller PVC
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Pendon Roller PVC',
  'pendon-roller-pvc',
  'Pendon roller de PVC con estructura de aluminio. Incluye bolso de transporte. Ideal para ferias, eventos, puntos de venta y oficinas. Impresion full color en alta resolucion.',
  'Pendon roller con estructura de aluminio incluida',
  46990,
  (SELECT id FROM categorias WHERE slug = 'pendones-y-banderas'),
  30, true, 'PEN-RL-001',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/Pendongenerico-tumarcaaqui.png?v=1768931843", "alt": "Pendon Roller PVC", "orden": 0}]',
  '[{"nombre": "Tamano", "opciones": [{"valor": "80x200 cm", "precio_extra": 0}, {"valor": "100x200 cm", "precio_extra": 10000}]}]',
  ARRAY['pendon', 'roller', 'pvc', 'publicidad']
);

-- 13. Polera Personalizable DTG
INSERT INTO productos (nombre, slug, descripcion, descripcion_corta, precio, categoria_id, stock, destacado, sku, imagenes, variantes, tags) VALUES
(
  'Polera Personalizable DTG',
  'polera-personalizable-dtg',
  'Polera 100% algodon con impresion DTG (Direct to Garment). Colores ilimitados, ideal para disenos complejos con degradados y fotografias. Maxima calidad y suavidad al tacto.',
  'Polera con impresion directa a la prenda DTG',
  19990,
  (SELECT id FROM categorias WHERE slug = 'poleras-personalizadas'),
  50, true, 'POL-DTG-001',
  '[{"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/POLERA.png?v=1768926587", "alt": "Polera DTG Personalizable", "orden": 0}, {"url": "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20250819_210942.jpg?v=1773948743", "alt": "Polera DTG ejemplo", "orden": 1}]',
  '[]',
  ARRAY['polera', 'dtg', 'personalizado', 'algodon']
);

-- ============================================================
-- Verificacion
-- ============================================================
SELECT
  c.nombre as categoria,
  COUNT(p.id) as productos,
  COUNT(CASE WHEN p.destacado THEN 1 END) as destacados
FROM categorias c
LEFT JOIN productos p ON p.categoria_id = c.id
GROUP BY c.nombre, c.orden
ORDER BY c.orden;
