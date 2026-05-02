# Plan de Construccion: 3 Fases para completar el Ecosistema PrintUp

> Generado: 2026-05-01
> Cada fase es un prompt independiente para Claude Code
> Al finalizar cada fase, se verifica con Playwright que todo funcione

---

## Resumen de Fases

| Fase | Alcance | Resultado |
|------|---------|-----------|
| **1** | Tienda E-Commerce publica | Homepage, catalogo, producto, carrito, checkout, esquema BD |
| **2** | Admin Completo + Delivery | CRUD productos, pedidos, inventario, contactos, zonas envio |
| **3** | Pagos, Marketing & Polish | MercadoPago, emails pedidos, WhatsApp, SEO, test final |

---

## FASE 1: Tienda E-Commerce (Storefront Publico)

### Prompt:

```
Eres Claude Code trabajando en el proyecto app-formularios (C:\Users\guerr\OneDrive\Documentos\dev\GitHub\app-formularios). Este es un proyecto Next.js 16 + React 19 + Tailwind v4 + Supabase que actualmente tiene un sistema de formularios funcionando. Necesito que construyas la TIENDA E-COMMERCE completa.

IMPORTANTE: Antes de escribir cualquier codigo, lee la guia de Next.js en node_modules/next/dist/docs/ para respetar la version actual. Lee AGENTS.md.

## CONTEXTO DE MARCA - PrintUp.cl

PrintUp es una empresa de impresion y publicidad en Donihue, Chile.
- Slogan: "Tu impresion, nuestra huella"
- RUT: 78.114.353-7 (Servicios Graficos Spa)
- WhatsApp: +56 9 66126645
- Email: contacto@printup.cl
- Ubicacion: Errazuriz 09 / Francisco Lira 082, Donihue, Region de O'Higgins

### Paleta de colores (extraida de printup.cl):
- Navy primario: #1B2A6B (headers, botones principales, textos importantes)
- Cyan/turquesa: #00B4D8 (acentos, links, hover states)
- Magenta: #E91E8C (highlights, badges oferta)
- Amarillo: #FFD100 (CTAs secundarios, badges)
- Naranja: #F97316 (precio oferta, alerts)
- Fondo claro: #F0F7FF (fondo general de la tienda, tono celeste muy suave)
- Blanco: #FFFFFF (cards, contenido)
- Texto oscuro: #1E293B
- Texto secundario: #64748B
- Borde suave: #E2E8F0
- Gradiente hero: linear-gradient(135deg, #1B2A6B 0%, #00B4D8 50%, #E91E8C 100%)

### Tipografia:
- Font principal: system-ui, -apple-system, 'Segoe UI', sans-serif
- Headings: font-weight 800, letter-spacing -0.02em
- Body: font-weight 400, line-height 1.6

## 1. SCHEMA DE BASE DE DATOS (Supabase)

Crea el archivo supabase/schema-ecommerce.sql con las siguientes tablas:

### Tabla: categorias
- id UUID PK
- nombre TEXT NOT NULL (ej: "Articulos Publicitarios")
- slug TEXT UNIQUE NOT NULL (ej: "articulos-publicitarios")
- descripcion TEXT
- imagen_url TEXT
- orden INT DEFAULT 0
- activa BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ

### Tabla: productos
- id UUID PK
- nombre TEXT NOT NULL
- slug TEXT UNIQUE NOT NULL
- descripcion TEXT
- descripcion_corta TEXT
- precio INT NOT NULL (en CLP, sin decimales)
- precio_oferta INT (nullable, si hay descuento)
- categoria_id UUID FK -> categorias
- imagenes JSONB DEFAULT '[]' (array de {url, alt, orden})
- variantes JSONB DEFAULT '[]' (array de {nombre, opciones: [{valor, precio_extra}]})
- stock INT DEFAULT 0
- stock_minimo INT DEFAULT 0
- destacado BOOLEAN DEFAULT false
- activo BOOLEAN DEFAULT true
- tags TEXT[] DEFAULT '{}'
- peso_gramos INT
- sku TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### Tabla: pedidos
- id UUID PK
- numero_pedido SERIAL (auto-increment para mostrar al cliente, ej: #1001)
- cliente_nombre TEXT NOT NULL
- cliente_email TEXT NOT NULL
- cliente_telefono TEXT
- cliente_rut TEXT
- direccion_envio JSONB (calle, numero, comuna, ciudad, region, notas)
- tipo_entrega TEXT CHECK ('retiro_tienda', 'despacho') DEFAULT 'retiro_tienda'
- items JSONB NOT NULL (array de {producto_id, nombre, cantidad, precio_unitario, variante})
- subtotal INT NOT NULL
- costo_envio INT DEFAULT 0
- total INT NOT NULL
- estado TEXT DEFAULT 'pendiente' CHECK ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado')
- pago_estado TEXT DEFAULT 'pendiente' CHECK ('pendiente', 'pagado', 'fallido', 'reembolsado')
- pago_metodo TEXT
- pago_referencia TEXT
- notas TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### Tabla: zonas_envio
- id UUID PK
- nombre TEXT NOT NULL (ej: "Coltauco/Donihue/Coinco")
- comunas TEXT[] NOT NULL
- precio INT NOT NULL (en CLP)
- envio_gratis_desde INT (monto minimo para envio gratis)
- activa BOOLEAN DEFAULT true
- dias_despacho TEXT[] (ej: ['miercoles', 'viernes'])
- horario TEXT

Inserta datos iniciales:
- 4 categorias: Articulos Publicitarios, Grafica Publicitaria, Transferibles, Pendones y Banderas
- 6 productos de ejemplo basados en printup.cl:
  1. Impresion DTF Textil - Metro lineal ($16,660) - categoria: Transferibles
  2. Polera Personalizable DTG ($19,990) - categoria: Articulos Publicitarios
  3. Bolsa de Lona Tote Bag ($5,990) - categoria: Articulos Publicitarios
  4. Pendon Roller PVC ($46,990) - categoria: Pendones y Banderas
  5. Botella Sublimada ($7,990) - categoria: Articulos Publicitarios
  6. Impresiones B/N A4 ($100) - categoria: Grafica Publicitaria
- 2 zonas de envio:
  1. Zona 1: Coltauco, Donihue, Coinco, Lo Miranda - $3,500 - gratis sobre $50,000
  2. Zona 2: Olivar, Rancagua, Machali - $4,500 - gratis sobre $50,000

Agrega indices y RLS policies (public read para productos/categorias, service role para todo lo demas).

## 2. TIPOS TYPESCRIPT

Actualiza src/lib/types.ts agregando las interfaces para Producto, Categoria, Pedido, ZonaEnvio, ItemCarrito.

## 3. PAGINAS DE LA TIENDA

### 3.1 Homepage NUEVA (src/app/page.tsx) - REEMPLAZA EL FORMULARIO ACTUAL

El formulario actual se mueve a /contacto. La homepage ahora es la tienda.

Estructura de la homepage:
1. **Barra superior** - fondo navy (#1B2A6B), texto blanco: "Cotizaciones/Consultas al WSP +56 9 66126645 | contacto@printup.cl"
2. **Header/Navbar** - fondo blanco, sticky:
   - Logo "PrintUp" (texto gradient como el actual)
   - Links: Inicio, Productos, Categorias (dropdown), Contacto, Sube tu Archivo
   - Icono carrito con badge de cantidad
   - Mobile: hamburger menu
3. **Barra de info scrolleable** - "Despachos Miercoles y Viernes | Envio gratis sobre $50.000 | Retiro en tienda disponible"
4. **Hero Section** - gradiente de marca, titulo grande "Tu impresion, nuestra huella", subtitulo descriptivo, 2 CTAs: "Ver Productos" y "Cotizar por WhatsApp"
5. **Categorias Grid** - 4 cards con imagen de fondo, nombre overlay, hover con zoom sutil. Grid 2x2.
6. **Productos Destacados** - grid de 4 product cards con imagen, nombre, precio, badge "Oferta" si tiene precio_oferta, boton "Agregar al carrito"
7. **Banner CTA** - "Personaliza Tus Poleras" con gradiente, boton a /contacto
8. **Seccion "Como Funciona"** - 3 pasos: 1. Elige tu producto 2. Personaliza 3. Recibe en tu puerta
9. **Footer completo**:
   - Col 1: Logo + slogan + redes sociales (Facebook, Instagram)
   - Col 2: Links rapidos (Productos, Contacto, Sube archivo)
   - Col 3: Informacion (horarios, ubicacion, envios)
   - Col 4: Contacto (email, whatsapp, direccion)
   - Bottom: "© 2026 PrintUp - Servicios Graficos Spa - RUT 78.114.353-7"

### 3.2 Catalogo (src/app/productos/page.tsx)
- Grid de productos con filtros laterales (categorias, rango de precio, ordenar por)
- Product cards: imagen, nombre, precio (tachado si hay oferta), badge stock, boton agregar
- Paginacion
- Responsive: filtros colapsables en mobile

### 3.3 Categoria (src/app/productos/[categoria]/page.tsx)
- Igual que catalogo pero filtrado por categoria
- Header con nombre de categoria y descripcion
- Breadcrumb: Inicio > Productos > [Categoria]

### 3.4 Producto Individual (src/app/productos/[categoria]/[slug]/page.tsx)
- Galeria de imagenes (imagen principal + thumbnails)
- Nombre, precio, descripcion
- Selector de variantes si aplica (ej: talla, color)
- Selector de cantidad
- Boton "Agregar al Carrito" grande
- Tabs: Descripcion | Especificaciones | Envio
- "Productos Relacionados" al final

### 3.5 Carrito (src/app/carrito/page.tsx)
- Tabla/lista de items: imagen, nombre, variante, cantidad (editable), precio unitario, subtotal
- Boton eliminar item
- Resumen: subtotal, costo envio (calculado), total
- Selector tipo entrega: "Retiro en Tienda (gratis)" o "Despacho a domicilio"
- Si despacho: selector de zona/comuna
- Boton "Proceder al Checkout"
- Link "Seguir comprando"

### 3.6 Checkout (src/app/checkout/page.tsx)
- Formulario de datos del cliente: nombre, email, telefono, RUT (opcional)
- Si despacho: direccion completa (calle, numero, comuna, ciudad, region, notas)
- Resumen del pedido (items + totales)
- Boton "Confirmar Pedido" (por ahora sin pago online, genera pedido con estado pendiente)
- Redirige a pagina de confirmacion

### 3.7 Confirmacion (src/app/checkout/confirmacion/[id]/page.tsx)
- "Pedido #XXXX confirmado!"
- Resumen del pedido
- Instrucciones de pago (transferencia bancaria o pago en tienda)
- Datos de transferencia: Servicios Graficos Spa, RUT 78.114.353-7
- Link de WhatsApp para confirmar pago
- "Seguir comprando"

### 3.8 Mover formulario a /contacto (src/app/contacto/page.tsx)
- Mueve el formulario de archivos actual (page.tsx) a esta ruta
- Agrega header con titulo "Contacto y Subida de Archivos"
- Agrega info de contacto: email, telefono, WhatsApp, horario, direccion

## 4. CARRITO - Estado Global

Crea src/lib/cart.ts con un store usando React context + localStorage:
- items: ItemCarrito[]
- addItem(producto, cantidad, variante?)
- removeItem(productoId)
- updateQuantity(productoId, cantidad)
- clearCart()
- getTotal()
- getItemCount()
- Persiste en localStorage

Crea src/components/cart/cart-provider.tsx (Context Provider, se agrega en layout.tsx)
Crea src/components/cart/cart-icon.tsx (icono con badge para el navbar)
Crea src/components/cart/cart-drawer.tsx (drawer lateral que se abre al agregar producto)

## 5. API ROUTES NUEVAS

### GET /api/productos - Lista productos (public, con filtros: categoria, destacado, search, sort, page)
### GET /api/productos/[slug] - Detalle de producto (public)
### GET /api/categorias - Lista categorias activas (public)
### POST /api/pedidos - Crear pedido (public, valida datos, envia email confirmacion)
### GET /api/pedidos/[id] - Ver pedido (public, solo con el UUID)
### GET /api/zonas-envio - Lista zonas activas (public)

## 6. COMPONENTES REUTILIZABLES

- src/components/tienda/navbar.tsx - Header con navegacion y carrito
- src/components/tienda/footer.tsx - Footer completo
- src/components/tienda/product-card.tsx - Card de producto para grids
- src/components/tienda/hero.tsx - Hero section de la homepage
- src/components/tienda/category-card.tsx - Card de categoria
- src/components/tienda/price.tsx - Componente de precio (con oferta tachada)
- src/components/tienda/quantity-selector.tsx - Input de cantidad +/-
- src/components/tienda/breadcrumb.tsx - Breadcrumbs de navegacion

## 7. LAYOUT

Crea un layout especifico para la tienda (src/app/layout.tsx actualizado):
- CartProvider envuelve toda la app
- El layout de admin (/admin) mantiene su sidebar actual
- Las paginas publicas usan Navbar + Footer

## 8. DISENO Y UX

- TODAS las paginas deben ser 100% responsive (mobile-first)
- Usar transiciones suaves (transition-all duration-200)
- Hover effects en cards y botones
- Skeleton loaders mientras cargan datos
- Empty states atractivos
- Toast notifications al agregar al carrito (usar sonner que ya esta instalado)
- Las imagenes de productos se toman de Supabase Storage (bucket: productos-imagenes)
- Para productos sin imagen, usar un placeholder con el logo de PrintUp
- Usa los componentes shadcn que ya estan instalados (Button, Card, Input, etc.)
- NO instales dependencias nuevas a menos que sea estrictamente necesario

## 9. VERIFICACION CON PLAYWRIGHT

Al finalizar toda la construccion, verifica que todo funcione:

1. Navega a http://localhost:3000 y toma screenshot de la homepage
2. Verifica que el navbar muestra: Inicio, Productos, Categorias, Contacto, carrito
3. Navega a /productos y verifica que se muestran productos
4. Navega a /productos/articulos-publicitarios y verifica filtrado por categoria
5. Click en un producto, verifica que abre la pagina de detalle
6. Click "Agregar al Carrito", verifica que el badge del carrito se actualiza
7. Navega a /carrito, verifica que muestra el item agregado
8. Navega a /checkout, llena el formulario con datos de prueba
9. Confirma el pedido, verifica pagina de confirmacion
10. Navega a /contacto, verifica que el formulario de archivos esta ahi
11. Navega a /admin/login, login con admin / admin123
12. Verifica que el admin panel sigue funcionando (dashboard, historial)
13. Toma screenshots de cada pagina principal

Ejecuta: npm run dev (puerto 3000) antes de las pruebas.
```

---

## FASE 2: Admin Panel Completo + Gestion de Pedidos + Delivery

### Prompt:

```
Eres Claude Code trabajando en el proyecto app-formularios (C:\Users\guerr\OneDrive\Documentos\dev\GitHub\app-formularios). La Fase 1 ya esta completada: la tienda publica funciona con homepage, catalogo, carrito y checkout. Ahora necesito que construyas el ADMIN PANEL COMPLETO para gestionar la tienda.

IMPORTANTE: Antes de escribir cualquier codigo, lee la guia de Next.js en node_modules/next/dist/docs/ para respetar la version actual. Lee AGENTS.md. Lee el codigo existente del admin en src/app/admin/ para mantener el mismo estilo visual y patrones.

## CONTEXTO

El admin actual tiene:
- Login JWT (admin / admin123)
- Dashboard con stats de formularios
- Historial de formularios
- Detalle de formulario
- Configuracion (Email, NextCloud, General)
- Sidebar con: Dashboard, Historial, Configuracion

Colores del admin:
- Navy: #1B2A6B (sidebar activo, botones primarios)
- Cyan: #00B4D8 (acentos)
- Magenta: #E91E8C (badges)
- Amarillo: #FFD100 (warnings)
- Fondo: white con cards sobre #F8FAFC
- Textos: #1E293B (primario), #64748B (secundario)

## 1. ACTUALIZAR SIDEBAR

Agrega nuevas secciones a la sidebar (src/components/admin/sidebar.tsx):

Estructura del menu:
- Dashboard (icono LayoutDashboard) - /admin
- **TIENDA** (separador)
  - Pedidos (icono ShoppingBag) - /admin/pedidos
  - Productos (icono Package) - /admin/productos
  - Categorias (icono FolderTree) - /admin/categorias
  - Inventario (icono Warehouse) - /admin/inventario
- **FORMULARIOS** (separador)
  - Historial (icono ClipboardList) - /admin/historial
- **SISTEMA** (separador)
  - Contactos (icono Users) - /admin/contactos
  - Envios (icono Truck) - /admin/envios
  - Configuracion (icono Settings) - /admin/configuracion
- Cerrar sesion (abajo)

## 2. DASHBOARD ACTUALIZADO (src/app/admin/page.tsx)

El dashboard ahora muestra metricas de TIENDA + FORMULARIOS:

Fila 1 - Metricas principales (4 cards):
- Ventas Hoy: total en CLP de pedidos de hoy
- Pedidos Pendientes: count de pedidos con estado 'pendiente' o 'confirmado'
- Formularios Hoy: (ya existe)
- Ingresos del Mes: total CLP del mes

Fila 2 - Grafico de ventas (ultimos 7 dias) + grafico de formularios (ya existe)

Fila 3 - Dos columnas:
- Pedidos recientes (ultimos 5): numero_pedido, cliente, total, estado con badge de color
- Formularios recientes (ya existe)

Actualiza /api/stats para incluir las metricas de pedidos.

## 3. GESTION DE PEDIDOS

### 3.1 Lista de Pedidos (src/app/admin/pedidos/page.tsx)
- Tabla con columnas: #Pedido, Fecha, Cliente, Items, Total, Estado, Pago, Acciones
- Filtros: estado (todos/pendiente/confirmado/preparando/enviado/entregado/cancelado), busqueda por nombre/email, rango de fechas
- Badges de color por estado:
  - pendiente: gray
  - confirmado: blue (#00B4D8)
  - preparando: yellow (#FFD100)
  - enviado: purple
  - entregado: green (#10B981)
  - cancelado: red (#EF4444)
- Paginacion
- Boton "Exportar CSV" (descarga lista filtrada)

### 3.2 Detalle de Pedido (src/app/admin/pedidos/[id]/page.tsx)
- Card "Informacion del Pedido": numero, fecha, estado (dropdown para cambiar), pago
- Card "Cliente": nombre, email, telefono, RUT
- Card "Direccion de Envio" (si aplica): direccion completa, tipo entrega
- Card "Items del Pedido": tabla con imagen, nombre, variante, cantidad, precio, subtotal
- Card "Resumen": subtotal, envio, total
- Card "Timeline": historial de cambios de estado con timestamps
- Botones de accion: "Marcar como Confirmado", "Marcar como Enviado", "Enviar WhatsApp al cliente"
- El boton WhatsApp abre: wa.me/TELEFONO?text=Hola+NOMBRE,+tu+pedido+%23NUMERO+ha+sido+ESTADO

### 3.3 API Routes de Pedidos (admin)
- GET /api/admin/pedidos - Lista con filtros (auth requerida)
- GET /api/admin/pedidos/[id] - Detalle (auth requerida)
- PATCH /api/admin/pedidos/[id] - Actualizar estado (auth requerida)
- GET /api/admin/pedidos/export - Exportar CSV (auth requerida)

## 4. GESTION DE PRODUCTOS

### 4.1 Lista de Productos (src/app/admin/productos/page.tsx)
- Tabla: Imagen (thumb), Nombre, Categoria, Precio, Stock, Estado (activo/inactivo), Acciones
- Filtros: categoria, estado, busqueda
- Boton "Nuevo Producto"
- Acciones por fila: Editar, Duplicar, Activar/Desactivar

### 4.2 Editor de Producto (src/app/admin/productos/[id]/page.tsx Y src/app/admin/productos/nuevo/page.tsx)
- Formulario completo con tabs:
  - Tab "General": nombre, slug (auto-generado), descripcion corta, descripcion larga (textarea)
  - Tab "Precio": precio, precio oferta, SKU
  - Tab "Imagenes": upload multiple a Supabase Storage (bucket: productos-imagenes), drag to reorder, imagen principal
  - Tab "Inventario": stock, stock minimo, peso
  - Tab "Variantes": agregar variantes (nombre: "Talla", opciones: "S, M, L, XL" con precio extra opcional)
  - Tab "SEO": meta title, meta description (para futuro)
- Boton Guardar, Boton Vista Previa (abre /productos/[cat]/[slug] en nueva tab)

### 4.3 API Routes de Productos (admin)
- POST /api/admin/productos - Crear producto (auth)
- PUT /api/admin/productos/[id] - Actualizar producto (auth)
- DELETE /api/admin/productos/[id] - Eliminar/desactivar producto (auth)
- POST /api/admin/productos/upload - Upload imagen a Supabase Storage (auth)

## 5. GESTION DE CATEGORIAS

### 5.1 Lista de Categorias (src/app/admin/categorias/page.tsx)
- Cards o tabla simple: imagen, nombre, productos count, estado, orden (drag to reorder)
- Inline edit: click para editar nombre/descripcion
- Boton "Nueva Categoria"

### 5.2 API Routes
- POST /api/admin/categorias - Crear
- PUT /api/admin/categorias/[id] - Actualizar
- DELETE /api/admin/categorias/[id] - Eliminar (solo si no tiene productos)

## 6. INVENTARIO (src/app/admin/inventario/page.tsx)
- Vista de tabla con TODOS los productos y su stock
- Columnas: Producto, SKU, Stock Actual, Stock Minimo, Estado
- Estado: "OK" (verde) si stock > stock_minimo, "Bajo" (amarillo) si stock <= stock_minimo y > 0, "Agotado" (rojo) si stock = 0
- Edicion inline de stock (click en el numero para editar)
- Filtro: todos, stock bajo, agotados

## 7. CONTACTOS/CRM (src/app/admin/contactos/page.tsx)
- Lista de todos los clientes unicos extraidos de pedidos + formularios
- Tabla: Nombre, Email, Telefono, Pedidos (count), Formularios (count), Ultimo contacto
- Click en un contacto: modal con historial de pedidos + formularios
- Busqueda por nombre/email
- Boton "Enviar WhatsApp" por contacto

## 8. CONFIGURACION DE ENVIOS (src/app/admin/envios/page.tsx)
- CRUD de zonas de envio
- Por zona: nombre, comunas (multi-select o tags), precio, monto minimo para gratis
- Dias de despacho (checkboxes: Lunes-Domingo)
- Horario de entrega
- Configuracion general: envio activo si/no, texto para mostrar en tienda

## 9. EMAILS DE PEDIDOS

Cuando se crea un pedido o se cambia su estado, enviar email via Resend:
- Al cliente: confirmacion de pedido con resumen
- Al admin (notification_email): aviso de nuevo pedido
- Al cambiar estado a "enviado": email al cliente "Tu pedido esta en camino"

Reutiliza el patron existente en /api/upload/route.ts para Resend.

## 10. VERIFICACION CON PLAYWRIGHT

Al finalizar, verifica:

1. Inicia npm run dev
2. Navega a /admin/login, login con admin / admin123
3. Verifica la sidebar tiene las nuevas secciones
4. Navega a /admin (dashboard), verifica metricas de ventas y pedidos
5. Navega a /admin/pedidos, verifica que se muestra la lista
6. Navega a /admin/productos, verifica lista de productos
7. Click "Nuevo Producto", verifica formulario de creacion
8. Crea un producto de prueba: "Producto Test", precio 9990, stock 10
9. Verifica que aparece en la lista
10. Navega a /admin/categorias, verifica las 4 categorias
11. Navega a /admin/inventario, verifica vista de stock
12. Navega a /admin/contactos, verifica lista
13. Navega a /admin/envios, verifica zonas de envio
14. Vuelve a la tienda publica (/productos), verifica que el producto nuevo aparece
15. Crea un pedido desde el checkout publico
16. Vuelve a /admin/pedidos, verifica que el pedido aparece
17. Abre el detalle del pedido, cambia estado a "confirmado"
18. Verifica que el dashboard refleja el nuevo pedido
19. Toma screenshots de cada pagina admin
```

---

## FASE 3: Pagos, Marketing & Polish Final

### Prompt:

```
Eres Claude Code trabajando en el proyecto app-formularios (C:\Users\guerr\OneDrive\Documentos\dev\GitHub\app-formularios). Las Fases 1 y 2 estan completadas: la tienda publica y el admin completo funcionan. Ahora necesito la FASE FINAL: integracion de pagos, marketing, SEO y polish general.

IMPORTANTE: Antes de escribir cualquier codigo, lee la guia de Next.js en node_modules/next/dist/docs/ para respetar la version actual. Lee AGENTS.md. Lee el codigo existente para mantener consistencia.

## 1. INTEGRACION DE PAGOS - MERCADOPAGO

MercadoPago es la pasarela mas usada en Chile. Integra el SDK de MercadoPago.

### 1.1 Instalar dependencia
npm install mercadopago

### 1.2 Variables de entorno
Agrega a .env.example:
- MERCADOPAGO_ACCESS_TOKEN=
- MERCADOPAGO_PUBLIC_KEY=
- NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

### 1.3 API Route: POST /api/pagos/crear-preferencia
- Recibe: pedido_id
- Busca el pedido en BD
- Crea una preferencia de pago en MercadoPago con:
  - Items del pedido (nombre, cantidad, precio)
  - Payer info (nombre, email)
  - Back URLs: success=/checkout/confirmacion/[id]?pago=ok, failure=/checkout/confirmacion/[id]?pago=error, pending=/checkout/confirmacion/[id]?pago=pendiente
  - Notification URL: /api/pagos/webhook
  - External reference: pedido_id
- Retorna: init_point (URL de pago), preference_id

### 1.4 API Route: POST /api/pagos/webhook
- Recibe webhook de MercadoPago
- Verifica la firma del webhook
- Si payment approved: actualiza pedido pago_estado='pagado', pago_referencia=payment_id
- Si payment rejected: actualiza pago_estado='fallido'
- Envia email de confirmacion de pago al cliente
- Log del webhook en BD (nueva tabla: pagos_log)

### 1.5 Actualizar Checkout (src/app/checkout/page.tsx)
- Despues de crear el pedido, mostrar opciones de pago:
  - "Pagar con MercadoPago" (tarjetas, transferencia) - redirige a MercadoPago
  - "Transferencia Bancaria Manual" - muestra datos de cuenta
  - "Pagar al Retirar" (solo si retiro en tienda)
- Si MercadoPago no esta configurado (sin access token), solo muestra transferencia manual y pago al retirar

### 1.6 Actualizar Confirmacion
- Si viene de MercadoPago con ?pago=ok: "Pago confirmado!"
- Si ?pago=pendiente: "Pago en proceso, te avisaremos"
- Si ?pago=error: "Hubo un error con el pago, intenta nuevamente" + boton reintentar

### 1.7 Configuracion en Admin
Agrega tab "Pagos" en /admin/configuracion:
- MercadoPago Access Token (password field)
- MercadoPago Public Key
- Boton "Probar conexion" (verifica credenciales)
- Datos para transferencia manual: Banco, Tipo cuenta, Numero, Titular, RUT, Email

## 2. SEO Y METADATA

### 2.1 Metadata dinamica
- Homepage: title "PrintUp - Impresion y Publicidad en Donihue | Tu impresion, nuestra huella"
- Catalogo: title "Productos | PrintUp"
- Categoria: title "[Categoria] | PrintUp"
- Producto: title "[Producto] - $[Precio] | PrintUp", description de producto, og:image con imagen del producto
- Contacto: title "Contacto y Subida de Archivos | PrintUp"

### 2.2 Schema.org (JSON-LD)
Agrega structured data en las paginas de producto:
- @type: Product
- name, description, image, sku
- offers: price, priceCurrency: CLP, availability

### 2.3 Sitemap
Crea src/app/sitemap.ts que genera sitemap.xml automatico con todas las paginas y productos.

### 2.4 Robots
Crea src/app/robots.ts con reglas basicas.

### 2.5 Open Graph
- og:title, og:description, og:image para cada pagina
- Twitter cards

## 3. WHATSAPP INTEGRATION

### 3.1 Boton flotante de WhatsApp
Crea src/components/tienda/whatsapp-button.tsx:
- Boton fijo bottom-right, icono de WhatsApp verde
- Click abre wa.me/56966126645 con mensaje predeterminado
- Animacion sutil de entrada
- Se muestra en todas las paginas publicas

### 3.2 WhatsApp en pedidos
- En confirmacion de pedido: "Confirma tu pago por WhatsApp" con link pre-llenado
- En admin al cambiar estado: boton "Notificar por WhatsApp" que abre wa.me con mensaje del estado

## 4. EMAILS MEJORADOS

### 4.1 Email de confirmacion de pedido al CLIENTE
Template HTML profesional con:
- Header con logo PrintUp (gradiente de marca)
- "Pedido #XXXX Confirmado"
- Tabla de items con imagenes, nombres, cantidades, precios
- Totales: subtotal, envio, total
- Instrucciones de pago (segun metodo elegido)
- Datos de contacto
- Footer con redes sociales

### 4.2 Email de cambio de estado al CLIENTE
- "Tu pedido #XXXX esta [ESTADO]"
- Si enviado: "Tu pedido va en camino. Dia de entrega estimado: [dia]"
- Si entregado: "Tu pedido fue entregado. Gracias por tu compra!"

### 4.3 Email resumen diario al ADMIN (opcional, se activa en config)
- Resumen del dia: pedidos nuevos, total ventas, formularios recibidos
- Enviado automaticamente via cron o al final del dia

## 5. MEJORAS DE UX Y POLISH

### 5.1 Loading States
- Skeleton loaders en todas las paginas que cargan datos
- Shimmer effect en product cards mientras cargan
- Spinner en botones durante acciones

### 5.2 Empty States
- Carrito vacio: ilustracion + "Tu carrito esta vacio" + boton "Explorar productos"
- Sin resultados de busqueda: "No encontramos productos" + sugerencias
- Sin pedidos: "Aun no tienes pedidos"

### 5.3 Animaciones
- Framer-motion para:
  - Cards de productos: stagger animation al cargar
  - Carrito drawer: slide in/out
  - Toast de "Agregado al carrito" con bounce
  - Page transitions suaves
  - Metricas del dashboard: count-up animation

### 5.4 Accesibilidad
- Todos los botones con aria-labels
- Focus states visibles
- Alt text en imagenes
- Contraste de colores WCAG AA
- Usa el MCP de a11y (mcp__a11y__audit_webpage) para auditar la homepage y las paginas principales

### 5.5 Performance
- Lazy loading de imagenes (next/image con loading="lazy")
- Suspense boundaries en componentes que cargan datos
- Pre-fetch de paginas en links visibles

## 6. PAGINA "SOBRE NOSOTROS" (src/app/nosotros/page.tsx)
- Historia de PrintUp
- Servicios que ofrecen
- Galeria de trabajos
- Equipo (opcional)
- Ubicacion con enlace a Google Maps (Errazuriz 09, Donihue)

## 7. CONFIGURACION FINAL DEL ADMIN

Agrega a /admin/configuracion:
- Tab "Tienda": nombre tienda, slogan, logo URL, redes sociales, Google Analytics ID
- Tab "Pagos": MercadoPago config + datos transferencia (del punto 1.7)
- Tab "WhatsApp": numero, mensaje predeterminado, activar/desactivar boton flotante

## 8. VERIFICACION FINAL COMPLETA CON PLAYWRIGHT

Esta es la verificacion mas exhaustiva. Ejecuta todo el flujo:

### Flujo de Compra Completo:
1. npm run dev (asegurar que corre en localhost:3000)
2. Navega a http://localhost:3000 - screenshot homepage
3. Verifica hero, categorias, productos destacados, footer
4. Usa mcp__a11y__audit_webpage en la homepage
5. Click en "Productos" - verifica catalogo
6. Filtra por una categoria - verifica filtrado
7. Click en un producto - verifica pagina de detalle
8. Agrega al carrito (cantidad 2) - verifica toast y badge
9. Agrega otro producto diferente
10. Click en icono carrito - verifica carrito con 2 items
11. Cambia cantidad de un item - verifica totales actualizados
12. Selecciona "Despacho a domicilio" - verifica costo envio aparece
13. Click "Proceder al Checkout"
14. Llena formulario: "Felipe Guerra", "guerrafelipe93@gmail.com", "+56966126645"
15. Selecciona "Transferencia Bancaria Manual"
16. Click "Confirmar Pedido"
17. Verifica pagina de confirmacion con numero de pedido
18. Screenshot de confirmacion

### Flujo Admin Completo:
19. Navega a /admin/login
20. Login con admin / admin123
21. Verifica dashboard con metricas de ventas actualizadas
22. Navega a /admin/pedidos - verifica que aparece el pedido recien creado
23. Abre el pedido - verifica detalles correctos
24. Cambia estado a "confirmado" - verifica actualizacion
25. Navega a /admin/productos - verifica lista
26. Crea un nuevo producto: "Taza Sublimada Test", precio 4990, stock 20
27. Verifica que aparece en la lista admin
28. Navega a la tienda publica - verifica que el nuevo producto aparece
29. Navega a /admin/inventario - verifica stock del nuevo producto
30. Navega a /admin/categorias - verifica todas las categorias
31. Navega a /admin/contactos - verifica que "Felipe Guerra" aparece
32. Navega a /admin/envios - verifica zonas configuradas
33. Navega a /admin/configuracion - verifica todas las tabs

### Paginas Especiales:
34. Navega a /contacto - verifica formulario de archivos funcional
35. Navega a /nosotros - verifica contenido
36. Verifica boton flotante de WhatsApp en homepage

### Responsive:
37. Resize a 375px de ancho (mobile)
38. Verifica homepage responsive
39. Verifica navbar hamburger menu
40. Verifica catalogo responsive
41. Verifica carrito responsive
42. Screenshot mobile de homepage

### Audit Final:
43. Ejecuta mcp__a11y__audit_webpage en homepage, catalogo, y checkout
44. Toma screenshot final de TODAS las paginas:
    - Homepage, Catalogo, Categoria, Producto, Carrito, Checkout, Confirmacion
    - Contacto, Nosotros
    - Admin: Dashboard, Pedidos, Pedido detalle, Productos, Producto editor, Categorias, Inventario, Contactos, Envios, Configuracion
45. Reporta resumen final de lo construido
```

---

## Notas de Implementacion

### Orden de ejecucion
1. Ejecutar Fase 1 completa, verificar con Playwright, commit
2. Ejecutar Fase 2 completa, verificar con Playwright, commit
3. Ejecutar Fase 3 completa, verificar con Playwright, commit

### Variables de entorno necesarias
Las que ya existen (.env.local) mas:
- MERCADOPAGO_ACCESS_TOKEN (Fase 3)
- MERCADOPAGO_PUBLIC_KEY (Fase 3)
- NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY (Fase 3)

### MCP Tools utilizados
- **playwright**: Verificacion visual y funcional en cada fase
- **a11y**: Auditoria de accesibilidad en Fase 3
- **css-mcp**: Analisis de consistencia CSS si es necesario
- **image-gen**: Generacion de banners/assets si la API key se configura

### Credenciales de prueba
- Admin panel: admin / admin123
- Formulario prueba: cualquier dato valido
- MercadoPago: requiere credenciales de sandbox (configurar en Fase 3)
