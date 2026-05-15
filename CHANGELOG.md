# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue el estandar [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Versionado Semantico](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-05-15 - Mega Visual Upgrade + Calculadora m2

### Agregado

- Hero homepage premium con collage de 3 productos reales (DTF Textil, Pendon Roller, Gran Formato), badges flotantes glassmorphic y video background
- Sistema decorativo CSS-only: FloatingCircles, RotatingRing, PulsingDots, GlowIcon, AccentLine, GlassmorphCard, DotPattern con 17 variantes de gradiente
- Navbar con top bar de estado abierto/cerrado en tiempo real (timezone America/Santiago), busqueda AJAX con debounce y thumbnails
- Boton WhatsApp en cada card de producto para cotizacion directa
- Layout dual en pagina de producto: full-width para productos m2, 2 columnas para estandar
- Calculadora de precios por m2 con visualizacion SVG del pano, nesting inteligente, materiales y acabados dinamicos
- Cotizador rapido inline en homepage con envio a WhatsApp
- Pagina de Sucursales/Taller (`/sucursales`) con info, horarios en tiempo real y mapa
- Contadores animados con IntersectionObserver para stats
- Carousel de testimonios con auto-play
- FAQ accordion animado
- Lightbox para galeria de imagenes en detalle de producto
- Tabla de especificaciones tecnicas por producto
- Module hero decorativo reutilizable por seccion
- Facebook Pixel analytics component

### Mejorado

- Footer rediseñado con 4 columnas, newsletter glassmorphic y certificaciones
- Pagina de Contacto con module hero, grid 2 columnas y mapa embed
- Pagina Nosotros con timeline animado, stats y glassmorphism cards
- Product cards con hover glow, rating con estrellas y badges mejorados
- Cotizador cambiado de gradiente verde a navy brand
- `next.config.ts`: remote patterns para cdn.shopify.com

### Migraciones SQL

- `migration-calculadora-m2.sql`: campos base para calculadora (precio_m2, ancho_max_cm, etc.)
- `migration-calculadora-mas-productos.sql`: datos calculadora para DTF Textil, DTF UV y Foam Board

### Documentacion

- `wiki/PROPUESTA-PRINTUP-HOSTING.md` - Propuesta comercial de hosting
- `wiki/CV-FELIPE-GUERRA.md` - CV actualizado con logros del proyecto

---

## [2.0.0] - 2026-05-02 - Fase 6: Social Proof, Portafolio y Growth

### Agregado

- Galeria de Portafolio publica (`/portafolio`) con filtros por categoria, grid responsive y lightbox con navegacion
- Pagina admin de Portafolio con CRUD de trabajos y clientes destacados
- Sistema de Preguntas y Respuestas (Q&A) en productos con tab dedicado
- Panel admin de Preguntas con filtros por estado pendiente/respondida
- Newsletter completo: suscripcion en footer, opt-in en checkout y registro, y panel admin con envio masivo via Resend
- Popup de compras recientes (social proof) configurable desde el panel admin
- Integracion Google Analytics 4 dinamica, configurable desde admin sin necesidad de modificar codigo
- Ficha tecnica descargable en formato PDF en paginas de producto
- Paginas legales: Politica de Envio, Politica de Devoluciones y Politica de Privacidad
- Pagina 404 personalizada con buscador integrado y links de navegacion
- Seccion "Trabajos Recientes" en la homepage
- Seccion "Confian en Nosotros" con marquee de logos en la homepage
- Link a Portafolio en la barra de navegacion principal
- Links a paginas de politicas en el footer
- Barra de suscripcion a newsletter en el footer
- Seccion MARKETING en el sidebar del panel admin (Newsletter, Portafolio)
- API publica de configuracion para GA4 y social proof
- Schema SQL fase 6: tablas `trabajos`, `clientes_destacados`, `preguntas_producto`, `suscriptores`

---

## [1.5.0] - 2026-05-02 - Fase 5: WhatsApp Bot, NextCloud Sync y Analytics

### Agregado

- Bot de WhatsApp con respuestas automaticas para saludo, catalogo, precios, estado de pedido, horario y ubicacion
- Panel admin de WhatsApp con configuracion de respuestas, modo IA y registro de conversaciones
- Sincronizacion automatica con NextCloud: los pedidos se guardan como archivos JSON en una carpeta configurable
- Dashboard de analytics avanzado con graficos de ventas, productos mas vendidos y clientes frecuentes
- Exportacion de pedidos en formato CSV
- Seccion de Configuracion NextCloud en el panel admin
- API de webhook para WhatsApp con pattern matching de mensajes entrantes

---

## [1.4.0] - 2026-05-02 - Fase 4: Envios Avanzados y Cupones

### Agregado

- Sistema de cupones de descuento con soporte para porcentaje, monto fijo y envio gratis
- Panel admin de cupones con CRUD completo, fechas de vigencia y uso maximo configurable
- Aplicacion de cupones en el checkout con validacion en tiempo real
- Gestion de inventario con alertas de stock bajo y productos agotados
- Panel admin de inventario con edicion rapida de cantidades
- Validacion de stock disponible al momento del checkout
- Banner superior informativo con datos de despachos, condicion de envio gratis y opcion de retiro en tienda

---

## [1.3.0] - 2026-05-02 - Fase 3: Cuentas de Usuario

### Agregado

- Registro e inicio de sesion de clientes mediante Supabase Auth
- Pagina Mi Cuenta (`/mi-cuenta`) con historial de pedidos, datos personales y gestion de direcciones
- Sistema de favoritos/wishlist con boton de corazon en cada tarjeta de producto
- Reviews de productos con calificacion de estrellas (1-5), campo de texto y gestion desde admin
- Panel admin de reviews con flujo de aprobacion y rechazo
- `AuthProvider` global con contexto de usuario disponible en toda la aplicacion
- Nuevas paginas: `/login`, `/registro`, `/mi-cuenta`, `/favoritos`

---

## [1.2.0] - 2026-05-02 - Fase 2: Pagos y Pedidos

### Agregado

- Integracion con MercadoPago mediante checkout redirect con generacion de preferencias
- Metodo de pago por transferencia bancaria con datos de cuenta mostrados al cliente
- Metodo de pago al retirar en tienda
- Webhook de confirmacion automatica de pagos desde MercadoPago
- Pagina de confirmacion de pedido con visualizacion del estado del pago
- Panel admin de pedidos con filtros por estado, busqueda y timeline de seguimiento
- Emails automaticos: notificacion de nuevo pedido al admin, confirmacion al cliente y aviso de cambio de estado
- Pagina de confirmacion con opcion de reintento de pago en caso de fallo
- Sistema de estados de pedido: pendiente, confirmado, preparando, enviado, entregado, cancelado

---

## [1.1.0] - 2026-05-02 - Fase 1: E-Commerce Core

### Agregado

- Catalogo de productos con busqueda por texto y filtros por categoria
- Pagina de detalle de producto con galeria de imagenes, selector de variantes (talla, color, tamanio) y tabs de informacion
- Carrito de compras persistente mediante `localStorage`
- Flujo de checkout con formulario de datos del cliente, seleccion de zona de envio y resumen del pedido
- Panel admin de productos con CRUD completo, carga de imagenes, gestion de variantes y precios
- Panel admin de categorias
- Zonas de envio configurables con precios diferenciados por zona geografica
- SEO: sitemap dinamico, `robots.txt`, datos estructurados JSON-LD por producto y etiquetas Open Graph
- Pagina "Sobre Nosotros" con informacion institucional de PrintUp

---

## [1.0.0] - 2026-04-XX - Sistema Base

### Agregado

- Formularios de contacto con subida de archivos (hasta 5 archivos, 50 MB cada uno)
- Panel de administracion con dashboard e historial de formularios recibidos
- Sincronizacion de archivos adjuntos a NextCloud
- Emails de notificacion via Resend
- Autenticacion de administrador con JWT
- Configuracion general del sistema desde el panel admin
