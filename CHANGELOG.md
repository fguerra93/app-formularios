# Changelog

Todos los cambios notables de este proyecto se documentan aqui.

## [2.0.0] - 2026-05-02

### Tienda Online Completa (E-Commerce)

- **Catalogo de productos**: pagina publica con busqueda, filtros por categoria, ordenamiento y paginacion
- **Pagina de producto**: detalle con imagenes, variantes (talla, color, tamanio), selector de cantidad, productos relacionados
- **Carrito de compras**: agregar/quitar items, modificar cantidades, tipo de entrega (retiro o despacho), calculo de envio en tiempo real
- **Checkout**: datos del cliente, direccion de envio, seleccion de metodo de pago, resumen del pedido
- **5 categorias de productos**: Articulos Publicitarios, Grafica Publicitaria, Poleras Personalizadas, Transferibles, Pendones y Banderas

### Pagos

- **MercadoPago**: integracion completa con redirect, webhook para confirmacion automatica, email al cliente, boton de reintentar pago
- **Transferencia Bancaria**: muestra datos bancarios, boton copiar, confirmacion por WhatsApp
- **Pago al Retirar**: para retiro en tienda, pago al momento
- **Confirmacion inteligente**: detecta estado del pago (?pago=ok/error/pendiente) y muestra mensaje apropiado

### Panel de Administracion Ampliado

- **Dashboard**: ventas hoy, pedidos pendientes, formularios hoy, ingresos del mes, graficos de ventas 7 dias
- **Pedidos**: lista con filtros (estado, busqueda, fecha), detalle, cambio de estado con email automatico, exportar CSV
- **Productos**: CRUD completo, subir imagenes, variantes con precios, SEO (meta title/description)
- **Categorias**: CRUD con conteo de productos
- **Inventario**: vista de stock con alertas bajo/agotado, edicion inline
- **Contactos (CRM)**: clientes unificados de pedidos y formularios, historial, WhatsApp directo
- **Zonas de envio**: CRUD con comunas, precios, envio gratis, dias de despacho

### Configuracion Extendida

- **Tab Tienda**: nombre, slogan, logo, redes sociales
- **Tab Pagos**: MercadoPago credentials + datos transferencia bancaria
- **Tab WhatsApp**: numero, mensaje, activar/desactivar boton flotante

### SEO y Metadata

- **sitemap.xml dinamico**: URLs de paginas, categorias y productos
- **robots.txt**: bloquea /admin, /api, /checkout
- **Metadata por pagina**: Open Graph, Twitter Cards, titulo template
- **JSON-LD**: Schema.org en productos (Product, Offer)

### WhatsApp

- **Boton flotante** en toda la tienda con animacion
- **En confirmacion de pedido**: link directo con mensaje pre-llenado
- **En admin**: boton para contactar clientes

### Pagina Sobre Nosotros

- Historia de PrintUp, servicios, Google Maps, contacto

### UX y Polish

- Animaciones stagger en grids con framer-motion
- Empty states mejorados con iconos
- Accesibilidad: aria-labels, focus rings
- Emails de confirmacion mejorados

## [1.2.0] - 2026-04-27

### NextCloud Sync Integration

- **Integracion NextCloud via WebDAV**: Sincronizacion automatica de archivos de formularios a NextCloud self-hosted mediante patron store-and-forward
- **Sync Worker (Docker)**: Servicio independiente que polling cada 30s a Supabase, descarga archivos, los sube a NextCloud via WebDAV y libera storage de Supabase
- **Upload directo a Supabase Storage desde frontend**: Los archivos se suben directamente desde el navegador a Supabase Storage via REST API, eliminando el limite de 4.5MB de Vercel API routes
- **Group Folders con ACL**: Configuracion de permisos granulares por grupo en NextCloud para control de acceso a carpetas de formularios
- **Link directo a NextCloud en email**: Notificacion incluye boton que lleva a la carpeta exacta del formulario en NextCloud (accesible en LAN)
- **Limites de archivos**: Max 50MB por archivo, max 5 archivos por formulario (validacion frontend + backend)
- **Panel admin NextCloud activo**: Tab de configuracion NextCloud habilitada con campos editables
- **Auto-limpieza Supabase Storage**: Archivos se eliminan de Supabase tras sincronizarse a NextCloud, manteniendo el uso bajo el free tier (1GB)

## [1.1.0] - 2026-04-25

### Accessibility & UX

- Mejoras de accesibilidad: contraste WCAG AA, landmarks semanticos

## [1.0.0] - 2026-04-24

### Plataforma Full-Stack

- Rebuild completo como plataforma Next.js 16 full-stack
- Formulario publico con drag & drop de archivos
- Panel admin protegido con JWT: dashboard, historial, detalle, configuracion
- Supabase como BD (PostgreSQL) y Storage
- Notificaciones por email via Resend con HTML personalizado
- Sistema de estados: nuevo > revisado > completado
- Busqueda, filtros y paginacion en historial
- Metricas en dashboard: formularios hoy/mes/total, tasa de exito email
