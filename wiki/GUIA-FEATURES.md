# PrintUp - Guia de Features por Fase

> Resumen rapido de todo lo que se agrego en cada fase del desarrollo.

---

## PLAN V1: Base del E-Commerce (Fases 1-3)

### Fase 1 - Tienda Publica
- **Homepage** con hero, categorias destacadas, productos populares
- **Catalogo** de productos con filtros por categoria
- **Detalle de producto** con galeria de imagenes, variantes (talla/color), descripcion
- **Carrito de compras** persistente (localStorage)
- **Checkout** con formulario de datos + seleccion de envio
- **Pagina de contacto** con formulario
- **Base de datos** Supabase (productos, categorias, pedidos, zonas_envio)

### Fase 2 - Panel de Administracion
- **Dashboard** con metricas (ventas, pedidos, ingresos)
- **CRUD Productos** (crear, editar, eliminar, subir imagenes)
- **CRUD Categorias**
- **Gestion de Pedidos** (ver detalle, cambiar estado, timeline)
- **Zonas de Envio** (configurar regiones + precios)
- **Contactos/Formularios** recibidos
- **Inventario** basico
- **Login admin** con JWT

### Fase 3 - Pagos, Emails y SEO
- **MercadoPago** integrado (crear preferencia, webhook de confirmacion)
- **Emails automaticos** con Resend (confirmacion de pedido, cambio de estado)
- **WhatsApp** boton flotante en toda la tienda
- **SEO** completo: sitemap.xml, robots.txt, JSON-LD, meta tags por pagina
- **Accesibilidad** basica (aria labels, contraste)

---

## PLAN V2: Features Avanzadas (Fases 4-6)

### Fase 4 - Cuentas de Usuario, Favoritos y Reviews
- **Registro/Login** de clientes (Supabase Auth con email+password)
- **Mi Cuenta** con datos personales editables
- **Historial de pedidos** del cliente (mis compras anteriores)
- **Favoritos/Wishlist** - guardar productos que te gustan
- **Reviews** - dejar opiniones con estrellas (1-5) y fotos en productos
- **Admin Reviews** - aprobar/rechazar reviews desde el panel

### Fase 5 - Envios Avanzados, Cupones e Inventario
- **Cupones de descuento** - porcentaje, monto fijo, envio gratis
  - Codigos: BIENVENIDO10, PRINTUP2026, ENVIOGRATIS (de ejemplo)
- **Admin Cupones** - crear/editar/desactivar cupones con fecha expiracion y usos maximos
- **Inventario avanzado** - alertas de stock bajo, edicion rapida de cantidades
- **Busqueda con autocompletado** - buscar productos en tiempo real desde el header
- **Productos relacionados** - sugerencias en detalle de producto

### Fase 6 - Social Proof, Portafolio y Growth
- **Portafolio publico** - galeria de trabajos realizados (/portafolio)
- **Admin Portafolio** - subir fotos de trabajos con categoria y descripcion
- **Newsletter** - formulario de suscripcion + envio de emails masivos desde admin
- **Preguntas y Respuestas (Q&A)** - los clientes preguntan en la pagina del producto, admin responde
- **Social Proof popup** - notificacion "X compro Y hace Z minutos"
- **Google Analytics 4** - tracking configurado desde admin
- **Paginas legales** - Politica de envio, devoluciones, privacidad
- **Pagina 404** personalizada
- **WhatsApp Bot** - bot automatico con respuestas predefinidas (via AWS Lambda)
- **Dashboard Analytics** - graficos de ventas, pedidos por periodo, productos top

---

## PLAN V3: Features Premium (Fases 7-10)

### Fase 7 - Bandeja Unificada de Mensajeria
- **Inbox multi-canal** estilo WhatsApp Web (/admin/mensajeria)
  - Recibe mensajes de WhatsApp, Instagram y Facebook Messenger en un solo lugar
  - Layout 3 columnas: conversaciones | chat | info contacto
- **Filtros por canal** (WhatsApp, Instagram, Facebook) y estado (abierta/cerrada)
- **Respuestas automaticas** configurables por palabras clave y horario
- **Mensajes rapidos** - plantillas con atajos (/confirmar, /precio, etc.)
- **Configuracion Meta** - conectar Facebook App, tokens, verificar webhook
- **Webhook unificado** /api/webhooks/meta para los 3 canales

### Fase 8 - Campanas de Marketing
- **Editor de emails drag & drop** (/admin/campanas/editor)
  - Bloques: Header, Texto, Imagen, Boton CTA, Producto, Cupon, Columnas, Social, Footer
  - Arrastrar, reordenar, editar propiedades de cada bloque
  - Preview en tiempo real + enviar email de prueba
- **Templates pre-hechos** - 5 disenos listos para usar (promo, newsletter, bienvenida, etc.)
- **Campanas** - crear, segmentar destinatarios, programar envio
  - Wizard: nombre > segmento > template > preview/enviar
- **Metricas** - enviados, abiertos, clicks, rebotes por campana
- **Tracking** - pixel de apertura + redirect de clicks
- **Biblioteca de templates** (/admin/campanas/templates)

### Fase 9 - Designer Studio (Personalizador de Productos)
- **Editor visual en canvas** (/productos/.../personalizar)
  - El cliente puede personalizar poleras, tazas, bolsas, etc.
  - Agregar texto con 20+ fuentes, colores, tamanos
  - Subir imagenes/logos y posicionarlos
  - Clipart/iconos predefinidos por categoria
  - Formas geometricas (circulo, rectangulo, estrella)
  - Panel de capas (z-index, visibilidad)
- **Vistas multiples** - Frente, Espalda, mangas (segun producto)
- **Mockup en vivo** - ve como queda el diseno sobre el producto real
- **Guardar diseno** - para retomarlo despues
- **Agregar al carrito con diseno** - el preview se guarda y va al pedido
- **Admin: Configurar areas** - definir zonas editables por producto (/admin/productos/[id]/personalizacion)
- **Admin: Clipart y fuentes** - gestionar recursos del editor (/admin/designer)

### Fase 10 - UX/UI Polish
- **Hero rediseñado** con formas decorativas (circulos navy/naranja estilo printup.cl)
- **Cards de categoria grandes** con fotos reales
- **Animaciones de scroll** (scroll reveal en secciones)
- **Hover effects** en product cards (zoom + overlay)
- **Mega-menu** de categorias con imagenes
- **Progress bar** en checkout (paso 1/2/3)
- **Scroll-to-top** button animado
- **Seccion redes sociales** antes del footer
- **Loading skeletons** estandarizados
- **Mejoras de contraste y accesibilidad**

---

## Rutas principales

### Tienda (publica)
| Ruta | Que es |
|------|--------|
| `/` | Homepage |
| `/productos` | Catalogo completo |
| `/productos/[categoria]` | Productos de una categoria |
| `/productos/[categoria]/[slug]` | Detalle de producto |
| `/productos/[categoria]/[slug]/personalizar` | Designer Studio |
| `/carrito` | Carrito de compras |
| `/checkout` | Pagar pedido |
| `/checkout/confirmacion/[id]` | Confirmacion post-pago |
| `/portafolio` | Galeria de trabajos |
| `/nosotros` | Sobre PrintUp |
| `/contacto` | Formulario de contacto |
| `/favoritos` | Wishlist del cliente |
| `/login` | Iniciar sesion |
| `/registro` | Crear cuenta |
| `/mi-cuenta` | Panel del cliente |
| `/mi-cuenta/pedidos` | Mis pedidos |
| `/mi-cuenta/favoritos` | Mis favoritos |
| `/mi-cuenta/reviews` | Mis reviews |
| `/politicas/envio` | Politica de envio |
| `/politicas/devoluciones` | Politica de devoluciones |
| `/politicas/privacidad` | Politica de privacidad |

### Admin (/admin)
| Ruta | Que es |
|------|--------|
| `/admin` | Dashboard con metricas |
| `/admin/pedidos` | Lista de pedidos |
| `/admin/productos` | CRUD productos |
| `/admin/categorias` | CRUD categorias |
| `/admin/inventario` | Stock y alertas |
| `/admin/envios` | Zonas de envio |
| `/admin/cupones` | Cupones de descuento |
| `/admin/reviews` | Moderar reviews |
| `/admin/contactos` | Formularios recibidos |
| `/admin/mensajeria` | Bandeja unificada (WA/IG/FB) |
| `/admin/mensajeria/configuracion` | Config Meta + respuestas auto |
| `/admin/campanas` | Campanas de email marketing |
| `/admin/campanas/templates` | Biblioteca de templates |
| `/admin/campanas/editor/[id]` | Editor drag & drop |
| `/admin/campanas/nueva` | Wizard nueva campana |
| `/admin/newsletter` | Suscriptores + envio |
| `/admin/portafolio` | Gestionar trabajos |
| `/admin/preguntas` | Q&A de productos |
| `/admin/designer` | Clipart y fuentes |
| `/admin/whatsapp` | Bot WhatsApp (legacy) |
| `/admin/configuracion` | Config general de la tienda |

---

## Credenciales de prueba

- **Admin**: usuario `admin` / password `admin123`
- **Cliente test**: `test@printup.cl` / `Test1234!`
- **Cupones**: `BIENVENIDO10`, `PRINTUP2026`, `ENVIOGRATIS`

---

## Como levantar el proyecto

```bash
npm install
npm run dev
```

Abrir http://localhost:3000 (tienda) y http://localhost:3000/admin (panel admin).

Requiere archivo `.env.local` con las variables de Supabase, Resend y MercadoPago.
