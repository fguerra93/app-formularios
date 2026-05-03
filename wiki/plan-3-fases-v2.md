# Plan de Construccion V2: 6 Fases para Features Avanzadas del E-Commerce PrintUp

> Generado: 2026-05-02 | COMPLETADO: 2026-05-02
> Basado en analisis de competidores: VistaPrint, CustomInk, Promotop, Bluegift, Falabella, MercadoLibre, Canva Print, Etsy
> Cada fase es un prompt independiente para Claude Code
> Al finalizar cada fase, se verifica con Playwright que todo funcione
>
> **ESTADO: TODAS LAS 6 FASES COMPLETADAS**
> - Fase 1: Cuentas de Usuario, Favoritos y Reviews - COMPLETADA
> - Fase 2: Envios Avanzados, Cupones e Inventario - COMPLETADA
> - Fase 3: Busqueda Avanzada y UX Polish - COMPLETADA
> - Fase 4: WhatsApp Bot Inteligente - COMPLETADA
> - Fase 5: Dashboard Analytics y Reportes - COMPLETADA
> - Fase 6: Social Proof, Portafolio y Growth - COMPLETADA

---

## Analisis de Competidores - Features Clave Detectadas

### CustomInk.com (scrapeado con Playwright)
- **Ratings con conteo**: "4.5 (10,000+)" en cada producto
- **Precios escalonados por cantidad**: "$8.95/ea for 500 items" + link "Pricing Details"
- **Favoritos/Wishlist**: boton "Add to favorites" en cada product card
- **Cuentas de usuario**: Sign In, historial de pedidos, disenos guardados
- **Busqueda con autocompletado**: searchbox prominente en header
- **Subcategorias profundas**: Short Sleeve, Long Sleeve, Tri-Blend, Performance, etc.
- **"Trending Products"**: carrusel de productos populares
- **"No Minimum" badge**: diferenciador visible en cards
- **Breadcrumbs**: navegacion jerárquica clara

### Falabella.com (scrapeado con Playwright)
- **Mega-menu de categorias**: dropdown extenso con subcategorias
- **Busqueda con placeholder**: "Buscar en falabella.com"
- **Cupones**: seccion dedicada a cupones de descuento
- **Outlet**: seccion de productos con descuento permanente
- **Ubicacion para delivery**: "Ingresa tu ubicacion" para disponibilidad y tiempos
- **Same-day delivery**: badge/banner para despacho mismo dia
- **Cuenta de usuario**: Mi cuenta, dashboard, puntos de fidelidad

### VistaPrint (features conocidas del mercado)
- **Configurador de producto**: preview en vivo del diseno
- **Precios por cantidad**: tablas escalonadas
- **Plantillas prediseñadas**: editor con templates listos
- **Garantia de satisfaccion**: trust badge prominente

### Promotop.cl / Bluegift.cl (features del nicho publicitario)
- **Cotizacion online por cantidad**: formulario con cantidades y acabados
- **Catalogo por industria/ocasion**: filtros especializados
- **Fichas tecnicas descargables**: PDF por producto
- **WhatsApp integrado al producto**: boton directo en ficha
- **Galeria de trabajos realizados**: portafolio visual
- **"Clientes que confian"**: logos de empresas cliente

### Etsy / Shopify / MercadoLibre (features generales)
- **Reviews con fotos**: clientes suben fotos de sus compras
- **Preguntas y respuestas**: en pagina de producto
- **Recuperacion de carrito abandonado**: email automatico
- **Pop-up de compra reciente**: "Juan acaba de comprar..."
- **Notificacion de viewers**: "X personas estan viendo esto"
- **Politicas claras**: envio, devoluciones, tiempos

---

## Resumen de Fases Nuevas

| Fase | Alcance | Impacto en Ventas |
|------|---------|-------------------|
| **4** | Engagement y Conversion | Alto - Cupones, reviews, wishlist, busqueda, filtros avanzados |
| **5** | Cuentas, Retencion y Automatizacion | Alto - Login, historial, carrito abandonado, precios cantidad, **Bot WhatsApp IA** |
| **6** | Social Proof, Portafolio y Growth | Medio-Alto - Galeria de trabajos, Q&A, newsletter, analytics, **AWS infra** |

---

## Sobre Docker / Backend Propio

**Recomendacion: NO levantar Docker. Usar AWS Lambda en su lugar.**

Docker agrega complejidad innecesaria (DevOps, servidor, costos). En cambio, AWS Lambda es:
- Serverless (no mantienes servidores)
- Free tier generoso (1M requests/mes)
- Perfecto para el bot de WhatsApp
- Suma al AWS Partner spend

**Stack definitivo:**
- **Next.js API Routes** (Vercel) - logica de la tienda
- **AWS Lambda** - bot WhatsApp, cron jobs, procesamiento asincrono
- **Supabase** - BD + Auth + Storage + Realtime
- **Amazon Bedrock** - IA para el bot (Claude Haiku)
- **Amazon SES** - emails (reemplaza Resend a escala)
- **S3 + CloudFront** - CDN para imagenes

**Cuando SI tendria sentido Docker:**
- Design Lab completo con procesamiento pesado de imagenes (tipo VistaPrint)
- Sistema de colas para procesamiento asincrono masivo
- Trafico que supere limites de Vercel + Lambda combined

---

## FASE 4: Engagement y Conversion

### Prompt:

```
Eres Claude Code trabajando en el proyecto app-formularios (C:\Users\guerr\OneDrive\Documentos\dev\GitHub\app-formularios). Las Fases 1-3 estan completadas: tienda publica, admin completo, pagos MercadoPago, SEO y WhatsApp funcionan. Ahora necesito FEATURES DE ENGAGEMENT Y CONVERSION inspiradas en los mejores e-commerce (CustomInk, Falabella, Etsy).

IMPORTANTE: Antes de escribir cualquier codigo, lee la guia de Next.js en node_modules/next/dist/docs/ para respetar la version actual. Lee AGENTS.md. Lee el codigo existente para mantener consistencia visual y de patrones.

## CONTEXTO TECNICO
- Next.js 16 + React 19 + Tailwind v4 + Supabase
- Paleta: Navy #1B2A6B, Cyan #00B4D8, Magenta #E91E8C, Amarillo #FFD100, Naranja #F97316
- Componentes shadcn ya instalados
- Sonner para toasts
- MercadoPago integrado
- WhatsApp flotante activo

## 1. SISTEMA DE CUPONES Y DESCUENTOS

### 1.1 Schema de BD (Supabase)

Tabla: cupones
- id UUID PK
- codigo TEXT UNIQUE NOT NULL (ej: "BIENVENIDO10", "MAYO2026")
- tipo TEXT CHECK ('porcentaje', 'monto_fijo') NOT NULL
- valor INT NOT NULL (10 = 10% o $10.000 segun tipo)
- minimo_compra INT DEFAULT 0 (monto minimo para aplicar)
- maximo_descuento INT (tope de descuento para porcentaje, nullable)
- usos_maximos INT (nullable = ilimitado)
- usos_actuales INT DEFAULT 0
- fecha_inicio TIMESTAMPTZ DEFAULT now()
- fecha_expiracion TIMESTAMPTZ (nullable = sin expiracion)
- activo BOOLEAN DEFAULT true
- aplica_a TEXT CHECK ('todo', 'categoria', 'producto') DEFAULT 'todo'
- aplica_ids UUID[] DEFAULT '{}' (IDs de categorias o productos si aplica)
- created_at TIMESTAMPTZ

Inserta cupones iniciales:
- "BIENVENIDO10": 10% dcto, primera compra, minimo $10.000, max dcto $5.000
- "PRINTUP2026": $3.000 dcto, minimo $20.000, valido hasta 31/12/2026
- "ENVIOGRATIS": 100% dcto tipo monto_fijo valor 4500, minimo $30.000 (aplica solo al costo de envio - manejar en logica)

### 1.2 API Routes
- POST /api/cupones/validar - Recibe {codigo, subtotal, items[]} y retorna {valido, descuento, mensaje}
- GET /api/admin/cupones - Lista cupones (auth)
- POST /api/admin/cupones - Crear cupon (auth)
- PUT /api/admin/cupones/[id] - Editar cupon (auth)
- DELETE /api/admin/cupones/[id] - Eliminar cupon (auth)

### 1.3 UI en Carrito/Checkout
- Input "Tienes un cupon?" colapsable en la pagina de carrito
- Al ingresar codigo: validar via API, mostrar descuento aplicado o error
- Badge verde "Cupon BIENVENIDO10 aplicado: -$5.000" en resumen
- Actualizar totales en tiempo real
- Persistir cupon aplicado en el estado del carrito (localStorage)

### 1.4 Admin - Gestion de Cupones (src/app/admin/cupones/page.tsx)
- Tabla: Codigo, Tipo, Valor, Usos (X/Y), Estado, Fecha Expiracion, Acciones
- Formulario crear/editar cupon con todos los campos
- Badge de estado: Activo (verde), Expirado (rojo), Agotado (gris)
- Agregar link "Cupones" en la sidebar del admin bajo TIENDA (icono Ticket)

## 2. SISTEMA DE REVIEWS Y VALORACIONES

### 2.1 Schema de BD

Tabla: reviews
- id UUID PK
- producto_id UUID FK -> productos NOT NULL
- pedido_id UUID FK -> pedidos (nullable, para verificar compra)
- autor_nombre TEXT NOT NULL
- autor_email TEXT NOT NULL
- rating INT NOT NULL CHECK (1-5)
- titulo TEXT
- comentario TEXT
- fotos JSONB DEFAULT '[]' (array de {url, alt})
- verificada BOOLEAN DEFAULT false (true si tiene pedido_id valido)
- aprobada BOOLEAN DEFAULT false (requiere aprobacion del admin)
- created_at TIMESTAMPTZ

### 2.2 API Routes
- GET /api/productos/[slug]/reviews - Lista reviews aprobadas (public, con paginacion)
- POST /api/productos/[slug]/reviews - Crear review (public, requiere nombre + email)
- GET /api/admin/reviews - Lista todas las reviews (auth, filtro: pendientes/aprobadas/rechazadas)
- PATCH /api/admin/reviews/[id] - Aprobar/rechazar review (auth)

### 2.3 UI en Pagina de Producto
- Seccion "Opiniones de clientes" debajo de tabs
- Rating promedio con estrellas (1-5) + total de reviews
- Lista de reviews: estrellas, titulo, comentario, autor, fecha, badge "Compra verificada"
- Fotos de clientes (galeria clickeable)
- Boton "Escribir una opinion" -> modal con formulario:
  - Estrellas (click para seleccionar)
  - Titulo (opcional)
  - Comentario
  - Upload de fotos (max 3)
  - Nombre y email
  - Si compro el producto (campo pedido_id o email match con pedidos)
- Mostrar rating en product cards del catalogo (estrellitas + count)

### 2.4 Admin - Moderacion de Reviews (src/app/admin/reviews/page.tsx)
- Tabla: Producto, Autor, Rating, Comentario (truncado), Estado, Fecha, Acciones
- Filtros: Pendientes, Aprobadas, Rechazadas
- Acciones: Aprobar, Rechazar, Eliminar
- Agregar link "Reviews" en sidebar bajo TIENDA (icono Star)

## 3. WISHLIST / FAVORITOS

### 3.1 Implementacion (sin cuenta de usuario por ahora, usa localStorage)

Crear src/lib/wishlist.ts:
- items: string[] (producto IDs)
- addItem(productoId)
- removeItem(productoId)
- isInWishlist(productoId)
- getItems()
- getItemCount()
- Persiste en localStorage

Crear src/components/tienda/wishlist-provider.tsx (Context Provider)

### 3.2 UI
- Icono corazon en cada product card (toggle: vacio/lleno, rojo cuando activo)
- Icono corazon en header del navbar junto al carrito (con badge de cantidad)
- Pagina /favoritos (src/app/(tienda)/favoritos/page.tsx):
  - Grid de productos favoritos (mismo estilo que catalogo)
  - Boton "Mover al carrito" por producto
  - Boton "Limpiar favoritos"
  - Empty state: "No tienes favoritos aun" + "Explorar productos"

## 4. BUSQUEDA CON AUTOCOMPLETADO

### 4.1 API Route
- GET /api/buscar?q=texto - Busca en productos (nombre, descripcion, tags) con ILIKE o full-text search
  - Retorna max 8 resultados con: id, nombre, slug, categoria_slug, imagen, precio
  - Incluye categorias que matchean (max 3)

### 4.2 UI - SearchBar Component (src/components/tienda/search-bar.tsx)
- Input de busqueda en el navbar (desktop: expandible, mobile: pantalla completa)
- Debounce de 300ms
- Dropdown de resultados con:
  - Seccion "Productos" (max 5): thumbnail + nombre + precio
  - Seccion "Categorias" (max 3): icono + nombre
  - Link "Ver todos los resultados para '[query]'" al final
- Click en producto navega a /productos/[cat]/[slug]
- Enter navega a /productos?buscar=[query]
- Pagina de resultados: /productos con parametro ?buscar= que filtra

## 5. FILTROS AVANZADOS EN CATALOGO

### 5.1 Mejorar pagina de productos (src/app/(tienda)/productos/page.tsx)

Agregar filtros laterales (desktop) / drawer (mobile):
- **Precio**: Slider doble (rango min-max) con inputs numericos
  - Detectar automaticamente el rango min/max de productos
  - Actualizar en tiempo real
- **Categorias**: Checkboxes (multiples categorias a la vez)
- **Estado**: "En stock", "Con descuento", "Nuevos" (ultimos 30 dias)
- **Ordenar por**: Relevancia, Precio menor, Precio mayor, Mas nuevos, Mas vendidos
- **Tags**: Si los productos tienen tags, mostrar como chips clickeables

### 5.2 URL Params
- Todos los filtros se reflejan en la URL: /productos?categoria=articulos-publicitarios&precio_min=5000&precio_max=50000&orden=precio_asc&stock=true
- Permite compartir URLs filtradas
- Back/forward del browser mantiene filtros

## 6. BADGES Y URGENCIA

### 6.1 Badges en Product Cards
- **"Nuevo"** (amarillo #FFD100): productos creados en los ultimos 30 dias
- **"Oferta"** o "-X%" (magenta #E91E8C): si tiene precio_oferta, mostrar el porcentaje
- **"Envio Gratis"** (cyan #00B4D8): si el precio es >= monto envio gratis de alguna zona
- **"Quedan X"** (naranja #F97316): si stock <= 5 y > 0
- **"Agotado"** (gris): si stock = 0, overlay oscuro sobre la imagen

### 6.2 Componente Badge (src/components/tienda/product-badge.tsx)
- Recibe producto y retorna los badges correspondientes
- Posicion: esquina superior izquierda de la imagen, stacked verticalmente
- Animacion sutil de entrada

## 7. PRODUCTOS RELACIONADOS / CROSS-SELLING

### 7.1 Logica
- En pagina de producto individual, seccion "Te puede interesar"
- Algoritmo simple: productos de la misma categoria + productos con tags en comun
- Excluir el producto actual
- Max 4 productos
- Si no hay suficientes, completar con productos destacados

### 7.2 API
- GET /api/productos/[slug]/relacionados - Retorna max 4 productos relacionados

### 7.3 UI
- Carrusel horizontal de product cards al final de la pagina de producto
- Titulo: "Te puede interesar" o "Productos relacionados"

## 8. CONTADOR DE VISITAS EN PRODUCTO (social proof sutil)

### 8.1 Schema
Agregar columna a productos:
- visitas INT DEFAULT 0

### 8.2 Logica
- Cada vez que se carga la pagina de producto, incrementar visitas (con debounce/session)
- Mostrar en la pagina: "Este producto ha sido visto X veces"
- Si X > 50: mostrar badge "Popular" en el product card

## 9. VERIFICACION CON PLAYWRIGHT

Al finalizar toda la construccion, verificar:

1. Iniciar npm run dev
2. Navegar a http://localhost:3000 y verificar que la homepage carga correctamente
3. **Busqueda**: Click en el icono de busqueda, escribir "polera", verificar que aparecen sugerencias
4. **Catalogo con filtros**: Navegar a /productos, verificar slider de precio, filtros de categoria
5. **Badges**: Verificar que los productos muestran badges (Nuevo, Oferta, etc.)
6. **Favoritos**: Click corazon en un producto, verificar que se marca. Navegar a /favoritos, verificar que aparece
7. **Reviews**: Navegar a un producto, scroll a reviews, click "Escribir opinion", llenar formulario con 5 estrellas y comentario
8. **Cupones**: Agregar producto al carrito, ir a /carrito, ingresar cupon "BIENVENIDO10", verificar descuento aplicado
9. **Productos relacionados**: En pagina de producto, scroll abajo, verificar seccion "Te puede interesar"
10. **Admin cupones**: Login admin, navegar a /admin/cupones, verificar lista de cupones
11. **Admin reviews**: Navegar a /admin/reviews, verificar reviews pendientes, aprobar una
12. Tomar screenshots de: homepage, busqueda, catalogo con filtros, producto con reviews, carrito con cupon, favoritos, admin cupones, admin reviews
13. Verificar responsive (375px): busqueda mobile, filtros drawer, product cards
```

---

## FASE 5: Cuentas de Cliente y Retencion

### Prompt:

```
Eres Claude Code trabajando en el proyecto app-formularios (C:\Users\guerr\OneDrive\Documentos\dev\GitHub\app-formularios). Las Fases 1-4 estan completadas: tienda con cupones, reviews, wishlist, busqueda y filtros avanzados. Ahora necesito CUENTAS DE CLIENTE Y FEATURES DE RETENCION.

IMPORTANTE: Antes de escribir cualquier codigo, lee la guia de Next.js en node_modules/next/dist/docs/ para respetar la version actual. Lee AGENTS.md. Lee el codigo existente para mantener consistencia.

## CONTEXTO
- Stack: Next.js 16 + React 19 + Tailwind v4 + Supabase
- Ya existe: auth admin (JWT manual), cupones, reviews, wishlist (localStorage), busqueda, filtros
- Supabase Auth esta disponible pero NO se usa actualmente
- Paleta: Navy #1B2A6B, Cyan #00B4D8, Magenta #E91E8C

## 1. CUENTAS DE CLIENTE CON SUPABASE AUTH

### 1.1 Configurar Supabase Auth
- Usar Supabase Auth (email + password) para clientes
- NO afectar el login de admin actual (JWT manual se mantiene)
- Crear src/lib/auth-client.ts con funciones: signUp, signIn, signOut, getSession, getUser
- Crear src/components/auth/auth-provider.tsx (Context Provider para toda la app)

### 1.2 Schema de BD

Tabla: clientes (vinculada a auth.users de Supabase)
- id UUID PK (mismo que auth.users.id)
- email TEXT UNIQUE NOT NULL
- nombre TEXT NOT NULL
- telefono TEXT
- rut TEXT
- direccion_default JSONB (calle, numero, comuna, ciudad, region)
- preferencias JSONB DEFAULT '{}' (newsletter: boolean, notificaciones: boolean)
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

Agregar columna a pedidos:
- cliente_id UUID FK -> clientes (nullable, para pedidos de clientes registrados)

Agregar columna a reviews:
- cliente_id UUID FK -> clientes (nullable)

Migrar wishlist de localStorage a BD para usuarios autenticados:
Tabla: favoritos
- id UUID PK
- cliente_id UUID FK -> clientes NOT NULL
- producto_id UUID FK -> productos NOT NULL
- created_at TIMESTAMPTZ
- UNIQUE(cliente_id, producto_id)

RLS Policies:
- clientes: usuario solo ve/edita su propio perfil
- pedidos: usuario ve sus propios pedidos (donde cliente_id = auth.uid())
- favoritos: usuario ve/edita sus propios favoritos
- reviews: usuario ve/edita sus propias reviews

### 1.3 Paginas de Auth

#### Registro (src/app/(tienda)/registro/page.tsx)
- Formulario: nombre, email, telefono (opcional), password, confirmar password
- Validacion en tiempo real (email valido, password >= 8 chars, passwords match)
- Al registrarse: crear entrada en tabla clientes + auto-login
- Redirigir a /mi-cuenta
- Link "Ya tienes cuenta? Inicia sesion"

#### Login (src/app/(tienda)/login/page.tsx)
- Formulario: email, password
- "Olvidaste tu contrasena?" (link a /recuperar-password)
- Al hacer login: redirigir a pagina anterior o /mi-cuenta
- Link "No tienes cuenta? Registrate"
- IMPORTANTE: NO confundir con /admin/login que es otro sistema

#### Recuperar Password (src/app/(tienda)/recuperar-password/page.tsx)
- Input de email
- Envia email de recuperacion via Supabase Auth
- Pagina de confirmacion: "Revisa tu email"

### 1.4 Area de Cliente (/mi-cuenta)

#### Layout (src/app/(tienda)/mi-cuenta/layout.tsx)
- Sidebar/tabs con: Mi Perfil, Mis Pedidos, Mis Favoritos, Mis Reviews, Configuracion
- Protegido: redirigir a /login si no esta autenticado
- Header con "Hola, [nombre]!"

#### Mi Perfil (src/app/(tienda)/mi-cuenta/page.tsx)
- Ver/editar: nombre, email (readonly), telefono, RUT
- Direccion de envio por defecto (formulario completo)
- Boton "Guardar cambios"

#### Mis Pedidos (src/app/(tienda)/mi-cuenta/pedidos/page.tsx)
- Lista de pedidos del cliente (mas recientes primero)
- Card por pedido: #numero, fecha, items (resumen), total, estado con badge de color
- Click -> detalle del pedido con timeline de estados
- Boton "Repetir pedido" (agrega los mismos items al carrito)
- Boton "Contactar por WhatsApp" si hay problema

#### Mis Favoritos (src/app/(tienda)/mi-cuenta/favoritos/page.tsx)
- Migrar /favoritos aqui si el usuario esta autenticado
- Grid de productos favoritos (sincronizados con BD)
- Si el usuario no esta logueado, /favoritos usa localStorage (como antes)
- Al hacer login, merge: localStorage -> BD

#### Mis Reviews (src/app/(tienda)/mi-cuenta/reviews/page.tsx)
- Lista de reviews escritas por el cliente
- Estado: Pendiente, Aprobada, Rechazada
- Editar review (si esta pendiente)

### 1.5 Actualizar Navbar
- Si no logueado: icono usuario + "Ingresar" (link a /login)
- Si logueado: icono usuario + nombre corto (dropdown: Mi Cuenta, Mis Pedidos, Cerrar Sesion)
- Mantener iconos de carrito y favoritos

### 1.6 Actualizar Checkout
- Si el usuario esta logueado: pre-llenar datos del formulario (nombre, email, telefono, direccion)
- Checkbox "Guardar como mi direccion por defecto"
- Si no esta logueado: mostrar banner "Tienes cuenta? Inicia sesion para un checkout mas rapido" con link
- Vincular pedido al cliente_id si esta logueado

### 1.7 Actualizar Reviews
- Si logueado: auto-llenar nombre y email, marcar como "Compra verificada" si el email coincide con un pedido
- Si no logueado: pedir nombre y email manualmente (como antes)

## 2. RECUPERACION DE CARRITO ABANDONADO

### 2.1 Logica
- Cuando un usuario logueado agrega items al carrito y NO completa el checkout en 24h, enviar email
- Guardar carrito en BD para usuarios logueados:

Tabla: carritos_guardados
- id UUID PK
- cliente_id UUID FK -> clientes NOT NULL
- items JSONB NOT NULL (misma estructura que el carrito)
- cupon_codigo TEXT (si tenia cupon aplicado)
- email_enviado BOOLEAN DEFAULT false
- email_enviado_at TIMESTAMPTZ
- recuperado BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### 2.2 API Route para Cron
- POST /api/cron/carritos-abandonados (protegido con CRON_SECRET)
  - Busca carritos_guardados donde: updated_at < now() - 24h AND email_enviado = false AND recuperado = false
  - Para cada carrito: envia email con los items y link directo al carrito
  - Marca email_enviado = true

### 2.3 Vercel Cron
- Crear vercel.json con cron que ejecuta /api/cron/carritos-abandonados cada 6 horas

### 2.4 Email de Carrito Abandonado
Template HTML con:
- "Olvidaste algo en tu carrito?"
- Imagenes y nombres de los productos
- Total del carrito
- CTA grande: "Completar mi compra" (link a /carrito con parametro ?recuperar=ID)
- Cupon especial: "Usa el codigo VUELVE5 para un 5% extra" (crear este cupon automaticamente)

### 2.5 Sincronizacion de Carrito
- Usuario logueado: guardar carrito en BD (tabla carritos_guardados) al agregar/modificar items
- Al hacer login: merge carrito de localStorage con carrito de BD
- Al hacer logout: mantener carrito en localStorage
- Parametro ?recuperar=ID en /carrito: carga el carrito guardado

## 3. PRECIOS POR CANTIDAD (ESCALADOS)

### 3.1 Schema
Agregar columna a productos:
- precios_cantidad JSONB DEFAULT '[]' (array de {cantidad_min, cantidad_max, precio})

Ejemplo para "Impresion DTF Textil":
```json
[
  {"cantidad_min": 1, "cantidad_max": 5, "precio": 16660},
  {"cantidad_min": 6, "cantidad_max": 20, "precio": 14990},
  {"cantidad_min": 21, "cantidad_max": 50, "precio": 12990},
  {"cantidad_min": 51, "cantidad_max": null, "precio": 10990}
]
```

### 3.2 UI en Pagina de Producto
- Si el producto tiene precios_cantidad:
  - Tabla de precios: "Cantidad | Precio Unitario | Ahorro"
  - Highlight de la fila activa segun la cantidad seleccionada
  - El precio mostrado se actualiza al cambiar cantidad
  - Badge "Ahorra X%" en las filas con descuento

### 3.3 UI en Carrito
- Precio unitario se recalcula segun cantidad total del mismo producto
- Mostrar "Agrega X mas para obtener mejor precio" si esta cerca del siguiente tramo

### 3.4 Admin - Editor de Precios
- En el editor de producto, tab "Precio":
  - Toggle "Habilitar precios por cantidad"
  - Tabla editable de tramos: cantidad min, cantidad max, precio
  - Boton "Agregar tramo"
  - Preview de como se vera la tabla

## 4. NOTIFICACIONES DE STOCK

### 4.1 Schema
Tabla: notificaciones_stock
- id UUID PK
- producto_id UUID FK -> productos NOT NULL
- email TEXT NOT NULL
- notificado BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ

### 4.2 UI
- En producto agotado: input "Avisame cuando vuelva" con campo de email + boton
- Si logueado: pre-llenar email

### 4.3 Logica
- Cuando admin actualiza stock de un producto de 0 a > 0, enviar email a todos los suscritos
- Marcar como notificado

## 5. "COMPRA DE NUEVO" Y RECOMENDACIONES BASICAS

### 5.1 En area de cliente
- Seccion "Compra de nuevo" en /mi-cuenta: productos de pedidos anteriores con boton rapido "Agregar al carrito"

### 5.2 En homepage (si logueado)
- Seccion "Basado en tus compras" con productos de categorias que ha comprado antes

## 6. BOT DE WHATSAPP CON IA + META BUSINESS API

### 6.1 Arquitectura General

El bot se conecta a la Meta WhatsApp Business Cloud API (gratuita: 1,000 conversaciones de servicio/mes).
Tu cuenta de Meta Business Suite ya centraliza WhatsApp, Instagram y Facebook, asi que el bot atiende
mensajes de WhatsApp y puede expandirse a Instagram DMs y Messenger en el futuro.

**Flujo:**
```
Cliente envia mensaje WhatsApp
        |
Meta Cloud API (webhook)
        |
AWS Lambda (webhook receiver)
        |
  Es flujo predefinido? ──SI──> Ejecutar flujo (cotizacion, pedido, catalogo)
        |
       NO
        |
Amazon Bedrock (Claude) con contexto PrintUp
        |
  Confianza alta? ──SI──> Responder automaticamente
        |
       NO
        |
Escalar a humano (notificar admin por email/push)
```

### 6.2 Configuracion Meta Business

1. **Requisitos previos** (ya los tienes):
   - Meta Business Suite con cuenta verificada
   - WhatsApp Business Account vinculado
   - Numero verificado: +56 9 66126645

2. **Configurar en Meta for Developers**:
   - Crear App tipo "Business" en developers.facebook.com
   - Agregar producto "WhatsApp"
   - Obtener: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN
   - Configurar webhook URL: https://XXXXXX.lambda-url.us-east-1.on.aws/webhook

3. **Variables de entorno**:
   - META_WHATSAPP_TOKEN (permanent token de la app)
   - META_WHATSAPP_PHONE_ID (ID del numero)
   - META_WHATSAPP_VERIFY_TOKEN (token de verificacion del webhook, lo defines tu)
   - ANTHROPIC_API_KEY (para Claude via Bedrock o directo)

### 6.3 Flujos Predefinidos (Message Templates + Interactive Messages)

El bot detecta intencion y ejecuta flujos guiados usando los Interactive Messages de WhatsApp
(botones, listas, quick replies). Esto es clave: WhatsApp permite UI rica, no solo texto.

#### Flujo 1: Saludo / Menu Principal
Trigger: cualquier mensaje inicial o "hola", "menu", "inicio"
Respuesta (Interactive List):
```
Hola! Soy el asistente virtual de PrintUp. En que te puedo ayudar?

[Lista de opciones]:
1. Ver catalogo de productos
2. Cotizar un trabajo
3. Estado de mi pedido
4. Subir archivo de diseno
5. Horarios y ubicacion
6. Hablar con una persona
```

#### Flujo 2: Cotizacion Guiada
Trigger: opcion 2 o "cotizar", "precio", "cuanto cuesta"
Flujo conversacional paso a paso:
1. "Que tipo de producto necesitas?" → Lista: Poleras, Pendones, Tazones, Adhesivos, DTF, Otro
2. "Cuantas unidades?" → Quick replies: 1-10, 11-50, 51-100, 100+
3. "Necesitas diseno o ya lo tienes?" → Botones: "Ya tengo diseno" / "Necesito diseno"
4. "Para cuando lo necesitas?" → Quick replies: Esta semana, Proxima semana, Sin apuro
5. "Dejame tu nombre y email para enviarte la cotizacion formal"
6. Bot genera cotizacion estimada usando precios_cantidad de la BD
7. Guarda en Supabase tabla cotizaciones_whatsapp y notifica al admin
8. "Te envie una cotizacion estimada. Un ejecutivo la confirmara en breve. Tambien puedes cotizar online en printup.cl/contacto"

#### Flujo 3: Estado de Pedido
Trigger: opcion 3 o "mi pedido", "seguimiento", "donde esta"
1. "Ingresa tu numero de pedido (ej: #1001) o el email con el que compraste"
2. Bot busca en tabla pedidos por numero_pedido o cliente_email
3. Responde: "Tu pedido #1001 esta en estado: PREPARANDO. Fecha estimada de entrega: Viernes 9 de Mayo"
4. Si no encuentra: "No encontre ese pedido. Verifica el numero o contacta a un ejecutivo"

#### Flujo 4: Catalogo
Trigger: opcion 1 o "productos", "catalogo", "que venden"
Respuesta con botones por categoria:
- Envia imagen de categoria + link directo a printup.cl/productos/[categoria]
- "Visita nuestro catalogo completo en printup.cl/productos"

#### Flujo 5: Subir Archivo
Trigger: opcion 4 o "subir archivo", "enviar diseno", "mandar archivo"
1. "Puedes subir tu archivo directamente aqui o usar nuestro formulario web"
2. Si el cliente envia un archivo (imagen/PDF): guardarlo en Supabase Storage, crear entrada en formularios
3. Alternativa: "Sube tu archivo en printup.cl/contacto para archivos grandes (hasta 50MB)"

#### Flujo 6: Horarios y Ubicacion
Trigger: opcion 5 o "horario", "direccion", "donde quedan"
Respuesta automatica:
```
PrintUp - Servicios Graficos Spa

Direccion: Errazuriz 09 / Francisco Lira 082, Donihue
Horario: Lunes a Viernes 9:00 - 18:00, Sabados 10:00 - 14:00
Despachos: Miercoles y Viernes
Envio gratis sobre $50.000

[Boton: Ver en Google Maps]
[Boton: Ir a la tienda online]
```

#### Flujo 7: Hablar con Humano
Trigger: opcion 6 o "persona", "humano", "ejecutivo", frustracion detectada por IA
1. "Entendido, te conecto con un ejecutivo de PrintUp. Responderemos a la brevedad."
2. Enviar notificacion al admin (email + push) con historial de la conversacion
3. Marcar conversacion como "escalada" en BD

### 6.4 IA para Respuestas Libres (Claude via Amazon Bedrock)

Para preguntas que no matchean flujos predefinidos:

**System prompt del bot:**
```
Eres el asistente virtual de PrintUp, una empresa de impresion y publicidad en Donihue, Chile.

INFORMACION DE LA EMPRESA:
- Nombre legal: Servicios Graficos Spa, RUT 78.114.353-7
- Ubicacion: Errazuriz 09, Donihue, Region de O'Higgins
- WhatsApp: +56 9 66126645
- Email: contacto@printup.cl
- Web: printup.cl
- Horario: L-V 9-18, S 10-14
- Despachos: Miercoles y Viernes
- Envio gratis sobre $50.000
- Zonas: Donihue, Coltauco, Coinco, Lo Miranda ($3.500), Rancagua, Machali, Olivar ($4.500)

PRODUCTOS Y PRECIOS:
{se inyecta dinamicamente desde la BD: nombre, precio, precios_cantidad}

POLITICAS:
- Pagos: MercadoPago, transferencia, pago al retirar
- Datos transferencia: Servicios Graficos Spa, RUT 78.114.353-7
- Devoluciones: solo por defectos de fabricacion
- Tiempos: 3-5 dias habiles segun producto

REGLAS:
- Responde SIEMPRE en espanol chileno, amigable y profesional
- Si no sabes algo, di "No tengo esa informacion, pero puedo conectarte con un ejecutivo"
- NUNCA inventes precios o plazos que no esten en tus datos
- Para cotizaciones complejas, dirige al formulario web o escalamiento humano
- Maximo 300 caracteres por mensaje (WhatsApp se lee en mobile)
- Usa emojis moderadamente
```

**Contexto dinamico**: Antes de cada respuesta IA, se consulta Supabase para inyectar:
- Productos actuales con precios
- Precios por cantidad si aplica
- Estado de stock
- Si el cliente tiene pedidos previos

### 6.5 Schema de BD

Tabla: conversaciones_whatsapp
- id UUID PK
- whatsapp_phone TEXT NOT NULL (numero del cliente, ej: "56966126645")
- cliente_id UUID FK -> clientes (nullable, si se vinculo)
- estado TEXT DEFAULT 'activa' CHECK ('activa', 'escalada', 'cerrada')
- ultimo_mensaje_at TIMESTAMPTZ
- contexto JSONB DEFAULT '{}' (estado del flujo actual, paso, datos parciales)
- created_at TIMESTAMPTZ

Tabla: mensajes_whatsapp
- id UUID PK
- conversacion_id UUID FK -> conversaciones_whatsapp NOT NULL
- direccion TEXT CHECK ('entrante', 'saliente') NOT NULL
- tipo TEXT DEFAULT 'texto' CHECK ('texto', 'imagen', 'documento', 'audio', 'interactivo', 'template')
- contenido TEXT NOT NULL
- metadata JSONB DEFAULT '{}' (media_url, buttons_clicked, etc.)
- procesado_por TEXT DEFAULT 'bot' CHECK ('bot', 'ia', 'humano')
- created_at TIMESTAMPTZ

Tabla: cotizaciones_whatsapp
- id UUID PK
- conversacion_id UUID FK -> conversaciones_whatsapp
- cliente_nombre TEXT
- cliente_email TEXT
- producto_tipo TEXT
- cantidad INT
- tiene_diseno BOOLEAN
- urgencia TEXT
- estimado_precio INT (calculado por el bot)
- estado TEXT DEFAULT 'pendiente' CHECK ('pendiente', 'respondida', 'convertida')
- notas TEXT
- created_at TIMESTAMPTZ

### 6.6 Implementacion Tecnica (AWS Lambda + Node.js)

**Stack del bot:**
- AWS Lambda (Node.js 20) - webhook receiver + logica de flujos
- Amazon Bedrock (Claude Haiku 4.5) - respuestas IA (rapido y barato: ~$0.25/1M tokens input)
- Amazon DynamoDB - estado de conversacion (cache rapido, TTL 24h)
- Supabase - datos persistentes (conversaciones, mensajes, cotizaciones, productos)
- Amazon EventBridge - cron para limpiar conversaciones inactivas

**Archivo: lambda/whatsapp-bot/index.ts**
```
Estructura:
1. Webhook verification (GET): validar verify_token de Meta
2. Webhook handler (POST): recibir mensaje
3. Intent detection: clasificar mensaje (keyword match + fallback IA)
4. Flow engine: ejecutar flujo predefinido o respuesta IA
5. Response sender: enviar respuesta via Meta Cloud API
6. Logger: guardar mensaje en Supabase
```

**Despliegue:**
- SAM (Serverless Application Model) o CDK para infra como codigo
- Lambda function URL (sin API Gateway = gratis)
- Variables de entorno en Lambda config
- Archivo: lambda/whatsapp-bot/template.yaml (SAM template)

### 6.7 Admin - Panel de Conversaciones (src/app/admin/whatsapp/page.tsx)

Dashboard de WhatsApp en el admin:

**Vista principal:**
- Lista de conversaciones activas (mas recientes primero)
- Columnas: Cliente (telefono/nombre), Ultimo mensaje, Estado (Activa/Escalada/Cerrada), Atendido por (Bot/IA/Humano)
- Badge rojo en conversaciones escaladas
- Filtros: Todas, Escaladas (prioritarias), Activas, Cerradas

**Detalle de conversacion (click):**
- Chat view tipo WhatsApp: burbujas verdes (cliente) y blancas (bot/admin)
- Badge por mensaje: "Bot", "IA", "Humano"
- Input para responder manualmente (override del bot)
- Al responder manualmente: envia via Meta Cloud API + marca como "humano"
- Boton "Cerrar conversacion"
- Info del cliente: si tiene cuenta, pedidos previos, cotizaciones

**Cotizaciones tab:**
- Lista de cotizaciones generadas por el bot
- Estado: Pendiente, Respondida, Convertida (se convirtio en pedido)
- Boton "Responder cotizacion" -> pre-llena email con los datos
- Boton "Convertir a pedido" -> crea pedido en la tienda

**Metricas:**
- Conversaciones hoy/semana/mes
- % resueltas por bot vs IA vs humano
- Tiempo promedio de respuesta
- Cotizaciones generadas
- Tasa de conversion (cotizacion -> pedido)

### 6.8 Agregar en sidebar admin
- Separador "AUTOMATIZACION"
- Link "WhatsApp Bot" (icono Bot/MessageSquare) -> /admin/whatsapp
- Badge rojo con count de conversaciones escaladas

## 8. VERIFICACION CON PLAYWRIGHT

1. Iniciar npm run dev
2. **Registro**: Navegar a /registro, crear cuenta con datos de prueba (test@printup.cl, password: Test1234!)
3. **Login**: Cerrar sesion, navegar a /login, iniciar sesion con las credenciales
4. **Perfil**: Navegar a /mi-cuenta, verificar datos, editar telefono, guardar
5. **Direccion**: Agregar direccion por defecto (Errazuriz 09, Donihue)
6. **Checkout pre-llenado**: Agregar producto al carrito, ir a /checkout, verificar que datos estan pre-llenados
7. **Completar pedido**: Confirmar pedido, verificar en /mi-cuenta/pedidos que aparece
8. **Favoritos sync**: Agregar favorito, verificar en /mi-cuenta/favoritos
9. **Precios cantidad**: Navegar a producto con precios por cantidad, cambiar cantidad, verificar precio actualizado
10. **Notificacion stock**: Navegar a producto agotado, ingresar email para notificacion
11. **Navbar actualizado**: Verificar dropdown de usuario logueado con opciones
12. **Admin**: Login admin, verificar que el nuevo pedido aparece con cliente_id vinculado
13. **WhatsApp Bot Admin**: Navegar a /admin/whatsapp, verificar panel de conversaciones y metricas
14. **Cotizaciones WhatsApp**: Verificar tab de cotizaciones en /admin/whatsapp
15. Tomar screenshots de: registro, login, mi-cuenta, mis-pedidos, checkout pre-llenado, precios cantidad, notificacion stock, admin whatsapp
16. Verificar responsive (375px): login mobile, mi-cuenta mobile, checkout mobile

NOTA SOBRE EL BOT:
La verificacion E2E del bot requiere una cuenta de Meta for Developers con el webhook configurado.
Para testing local, crear un mock de la Meta API que simule mensajes entrantes:
- POST /api/test/whatsapp-webhook con payload de ejemplo de Meta
- Verificar que el bot responde correctamente a los flujos predefinidos
- Verificar que la IA genera respuestas coherentes para preguntas libres
- Verificar que las conversaciones se guardan en BD
```

---

## FASE 6: Social Proof, Portafolio y Growth

### Prompt:

```
Eres Claude Code trabajando en el proyecto app-formularios (C:\Users\guerr\OneDrive\Documentos\dev\GitHub\app-formularios). Las Fases 1-5 estan completadas: tienda con cupones, reviews, wishlist, busqueda, cuentas de cliente, carrito abandonado y precios por cantidad. Ahora necesito las FEATURES FINALES DE SOCIAL PROOF, PORTAFOLIO Y GROWTH.

IMPORTANTE: Antes de escribir cualquier codigo, lee la guia de Next.js en node_modules/next/dist/docs/ para respetar la version actual. Lee AGENTS.md. Lee el codigo existente para mantener consistencia.

## CONTEXTO
- Stack: Next.js 16 + React 19 + Tailwind v4 + Supabase + Supabase Auth (clientes)
- Ya existe: tienda completa, admin, pagos, cupones, reviews, wishlist, cuentas, precios cantidad
- Paleta: Navy #1B2A6B, Cyan #00B4D8, Magenta #E91E8C, Amarillo #FFD100

## 1. GALERIA DE TRABAJOS REALIZADOS / PORTAFOLIO

### 1.1 Schema de BD

Tabla: trabajos
- id UUID PK
- titulo TEXT NOT NULL
- descripcion TEXT
- cliente_nombre TEXT (ej: "Empresa ABC")
- categoria TEXT (ej: "Poleras", "Pendones", "Tazones")
- imagenes JSONB NOT NULL (array de {url, alt, orden})
- destacado BOOLEAN DEFAULT false
- orden INT DEFAULT 0
- activo BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ

Tabla: clientes_destacados (logos de empresas)
- id UUID PK
- nombre TEXT NOT NULL
- logo_url TEXT NOT NULL
- url_web TEXT (nullable)
- orden INT DEFAULT 0
- activo BOOLEAN DEFAULT true

### 1.2 Pagina Publica - Portafolio (src/app/(tienda)/portafolio/page.tsx)
- Header: "Nuestros Trabajos" con subtitulo "Mira lo que hemos creado para nuestros clientes"
- Filtros por categoria (tabs): Todos, Poleras, Pendones, Tazones, Grafica, etc.
- Grid masonry de trabajos:
  - Imagen principal grande
  - Overlay con titulo + cliente + categoria
  - Click abre lightbox/modal con galeria de imagenes + descripcion completa
- Seccion "Clientes que confian en nosotros":
  - Row de logos de empresas en scroll infinito (marquee CSS)
  - Titulo: "Mas de X empresas confian en PrintUp"
- CTA al final: "Quieres un trabajo como estos? Cotiza ahora" + boton WhatsApp + boton Contacto

### 1.3 Agregar link en navbar: "Portafolio" (entre Productos y Contacto)

### 1.4 Componente en Homepage
- Seccion nueva en homepage (despues de productos destacados):
  - "Trabajos Recientes" con 4 trabajos destacados
  - Boton "Ver todos" -> /portafolio
- Seccion "Confian en nosotros" con logos (reutilizar componente)

### 1.5 Admin - Gestion de Portafolio (src/app/admin/portafolio/page.tsx)
- CRUD de trabajos: crear, editar, eliminar
- Upload multiple de imagenes por trabajo
- Drag to reorder
- CRUD de clientes destacados: logo, nombre, web
- Agregar "Portafolio" en sidebar admin (icono Image)

## 2. PREGUNTAS Y RESPUESTAS EN PRODUCTOS

### 2.1 Schema de BD

Tabla: preguntas_producto
- id UUID PK
- producto_id UUID FK -> productos NOT NULL
- cliente_id UUID FK -> clientes (nullable)
- autor_nombre TEXT NOT NULL
- autor_email TEXT NOT NULL
- pregunta TEXT NOT NULL
- respuesta TEXT (nullable, la respuesta del admin)
- respuesta_at TIMESTAMPTZ
- publica BOOLEAN DEFAULT false (visible solo cuando tiene respuesta y esta aprobada)
- created_at TIMESTAMPTZ

### 2.2 UI en Pagina de Producto
- Tab "Preguntas" (junto a Descripcion, Especificaciones, Envio)
- Lista de preguntas con respuestas:
  - "P: [pregunta]" - [autor] - [fecha]
  - "R: [respuesta]" - PrintUp - [fecha]
- Formulario "Hacer una pregunta":
  - Textarea para la pregunta
  - Nombre y email (pre-llenados si logueado)
  - Boton "Enviar pregunta"
- Mensaje: "Tu pregunta sera respondida y publicada pronto"

### 2.3 Admin - Gestion de Preguntas (src/app/admin/preguntas/page.tsx)
- Lista: Producto, Pregunta (truncada), Autor, Fecha, Estado (Pendiente/Respondida)
- Filtro: Pendientes (prioritarias), Respondidas
- Click -> modal: ver pregunta completa + textarea para respuesta + boton "Responder y publicar"
- Notificacion al admin cuando llega nueva pregunta
- Agregar "Preguntas" en sidebar admin bajo TIENDA (icono MessageCircle)

## 3. POP-UP DE COMPRA RECIENTE (Social Proof)

### 3.1 Componente (src/components/tienda/recent-purchase-popup.tsx)
- Popup pequeño esquina inferior izquierda (no superponer WhatsApp que esta abajo-derecha)
- Muestra: "Juan de Rancagua compro [producto] hace [tiempo]"
- Con imagen thumbnail del producto
- Aparece cada 30-45 segundos, se oculta despues de 5 segundos
- Animacion: slide-in desde la izquierda, fade-out
- Solo muestra pedidos reales de las ultimas 48 horas
- Anonimiza parcialmente: "Juan de R." (primera letra del apellido)
- Boton X para cerrar permanentemente (sesion)
- Configurable desde admin (activar/desactivar)

### 3.2 API Route
- GET /api/compras-recientes - Retorna ultimas 10 compras (ultimas 48h), datos minimos: nombre_parcial, comuna, producto_nombre, producto_imagen, tiempo_relativo

### 3.3 Admin Config
- Toggle "Mostrar notificaciones de compras recientes" en /admin/configuracion tab Tienda

## 4. FICHAS TECNICAS DESCARGABLES

### 4.1 Schema
Agregar columna a productos:
- ficha_tecnica_url TEXT (URL del PDF en Supabase Storage)

### 4.2 UI
- En pagina de producto, si tiene ficha_tecnica_url:
  - Boton "Descargar Ficha Tecnica" (icono PDF) en la seccion de informacion
  - Tambien en tab "Especificaciones"

### 4.3 Admin
- En editor de producto, campo "Ficha Tecnica (PDF)": upload de PDF a Supabase Storage
- Preview del PDF subido

## 5. NEWSLETTER / EMAIL MARKETING BASICO

### 5.1 Schema

Tabla: suscriptores
- id UUID PK
- email TEXT UNIQUE NOT NULL
- nombre TEXT
- activo BOOLEAN DEFAULT true
- fuente TEXT DEFAULT 'footer' (footer, popup, checkout)
- created_at TIMESTAMPTZ

### 5.2 UI
- Input de email en el footer: "Suscribete y recibe ofertas exclusivas" + campo email + boton "Suscribir"
- Toast de confirmacion: "Te has suscrito exitosamente"
- Checkbox en checkout: "Quiero recibir ofertas y novedades por email" (pre-checked)
- Checkbox en registro: "Quiero recibir ofertas y novedades por email"

### 5.3 API
- POST /api/newsletter/suscribir - Agregar email
- POST /api/newsletter/desuscribir?token=X - Desuscribir (link en emails)
- GET /api/admin/newsletter - Lista suscriptores (auth)
- POST /api/admin/newsletter/enviar - Enviar email a todos los suscriptores activos (auth)

### 5.4 Admin - Newsletter (src/app/admin/newsletter/page.tsx)
- Contador de suscriptores activos
- Lista de suscriptores con filtro y busqueda
- Formulario "Enviar Newsletter":
  - Asunto
  - Contenido (textarea con formato basico o HTML)
  - Preview del email
  - Boton "Enviar a X suscriptores"
- Historial de newsletters enviados
- Agregar "Newsletter" en sidebar admin bajo MARKETING (nuevo separador, icono Mail)

## 6. GOOGLE ANALYTICS / TRACKING

### 6.1 Implementacion
- Si el admin configura un GA4 Measurement ID en /admin/configuracion:
  - Inyectar Google Analytics script en el <head>
  - Eventos automaticos:
    - view_item: al ver un producto
    - add_to_cart: al agregar al carrito
    - remove_from_cart: al quitar del carrito
    - begin_checkout: al iniciar checkout
    - purchase: al confirmar pedido
    - search: al buscar
    - add_to_wishlist: al agregar favorito

### 6.2 Componente (src/components/analytics/ga-provider.tsx)
- Lee el GA ID desde la config de Supabase
- Inyecta script solo si hay ID configurado
- Funciones helper: trackEvent(name, params)

### 6.3 Admin Config
- Campo "Google Analytics ID" (ej: G-XXXXXXXXXX) en tab "Tienda" de /admin/configuracion

## 7. POLITICAS Y PAGINAS LEGALES

### 7.1 Paginas estaticas
- /politicas/envio (src/app/(tienda)/politicas/envio/page.tsx): Tiempos, zonas, costos, envio gratis
- /politicas/devoluciones (src/app/(tienda)/politicas/devoluciones/page.tsx): Proceso, plazos, condiciones
- /politicas/privacidad (src/app/(tienda)/politicas/privacidad/page.tsx): Uso de datos, cookies

### 7.2 Links en footer
- Agregar seccion "Politicas" en el footer con links a las 3 paginas

### 7.3 Contenido
- Generar contenido apropiado para una empresa de impresion en Chile
- Incluir datos reales: Servicios Graficos Spa, RUT 78.114.353-7, Donihue

## 8. MEJORAS FINALES DE UX

### 8.1 Breadcrumbs mejorados
- Agregar breadcrumbs en: portafolio, favoritos, mi-cuenta (y sub-paginas), politicas
- Schema.org BreadcrumbList para SEO

### 8.2 Pagina 404 personalizada
- src/app/not-found.tsx
- Ilustracion/mensaje amigable
- Links utiles: Inicio, Productos, Contacto
- Busqueda rapida

### 8.3 Skeleton Loaders mejorados
- Agregar skeletons en todas las paginas nuevas (portafolio, preguntas, newsletter admin)

### 8.4 Meta tags actualizados
- Portafolio: "Portafolio - Trabajos Realizados | PrintUp"
- Favoritos: "Mis Favoritos | PrintUp"
- Mi Cuenta: "Mi Cuenta | PrintUp"

## 9. VERIFICACION FINAL COMPLETA CON PLAYWRIGHT

### Flujo de Portafolio:
1. npm run dev
2. Navegar a /portafolio, verificar que carga la galeria
3. Click en un trabajo, verificar lightbox con imagenes
4. Verificar seccion "Clientes que confian"
5. Verificar que homepage tiene seccion "Trabajos Recientes"

### Flujo de Preguntas:
6. Navegar a un producto, tab "Preguntas"
7. Hacer una pregunta como usuario logueado
8. Login admin, ir a /admin/preguntas, responder la pregunta
9. Volver al producto, verificar que la pregunta+respuesta aparece

### Social Proof:
10. Navegar a la homepage, esperar 30-45 segundos, verificar popup de compra reciente
11. Cerrar popup, verificar que no vuelve a aparecer

### Newsletter:
12. Scroll al footer, ingresar email, suscribirse
13. Login admin, ir a /admin/newsletter, verificar suscriptor
14. Crear newsletter de prueba, preview

### Ficha Tecnica:
15. Si algun producto tiene ficha, verificar boton de descarga

### Politicas:
16. Navegar a /politicas/envio, /politicas/devoluciones, /politicas/privacidad
17. Verificar links en footer

### 404:
18. Navegar a /pagina-que-no-existe, verificar pagina 404 personalizada

### Responsive:
19. Resize 375px: portafolio mobile, preguntas mobile, newsletter footer mobile

### Audit de Accesibilidad:
20. Ejecutar mcp__a11y__audit_webpage en homepage, portafolio, y producto con reviews+preguntas

### Screenshots Finales:
21. Tomar screenshots de TODAS las paginas del ecosistema:
    TIENDA: Homepage, Catalogo (con filtros), Categoria, Producto (con reviews+preguntas+precios cantidad), Carrito (con cupon), Checkout, Confirmacion, Portafolio, Favoritos, Contacto, Nosotros, Registro, Login, Mi Cuenta, Mis Pedidos, Politicas
    ADMIN: Dashboard, Pedidos, Productos, Categorias, Inventario, Cupones, Reviews, Preguntas, Portafolio, Newsletter, Contactos, Envios, Configuracion
    MOBILE: Homepage, Producto, Carrito, Mi Cuenta
22. Reportar resumen final de TODO lo construido en las 6 fases
```

---

## Resumen de Features por Fase

### Fase 4 - Engagement y Conversion
| Feature | Inspirada en | Impacto |
|---------|-------------|---------|
| Cupones/descuentos | Falabella, Shopify | Critico - campañas marketing |
| Reviews con fotos | Etsy, MercadoLibre | Alto - confianza |
| Wishlist/favoritos | CustomInk, Etsy | Medio - retencion |
| Busqueda autocompletado | Falabella, CustomInk | Alto - descubrimiento |
| Filtros avanzados (slider) | Falabella, Bsale | Alto - UX |
| Badges urgencia | Shopify Dawn, Bsale | Medio - conversion |
| Productos relacionados | Falabella, Jumpseller | Medio - ticket promedio |
| Contador visitas | MercadoLibre | Bajo - social proof |

### Fase 5 - Cuentas, Retencion y Automatizacion
| Feature | Inspirada en | Impacto |
|---------|-------------|---------|
| Cuentas de cliente | Jumpseller, CustomInk | Critico - retencion |
| Historial de pedidos | MercadoLibre, Etsy | Alto - UX |
| Carrito abandonado | Shopify, email marketing | Critico - recuperar ventas |
| Precios por cantidad | VistaPrint, CustomInk | Alto - ticket promedio imprenta |
| Notificacion de stock | MercadoLibre | Medio - recuperar ventas |
| "Compra de nuevo" | MercadoLibre | Medio - recompra |
| **Bot WhatsApp con IA** | **Meta Business + Claude** | **Critico - atencion 24/7 sin intervencion** |
| Admin panel WhatsApp | Propio | Alto - visibilidad de conversaciones |
| Cotizaciones automaticas | Promotop + IA | Alto - conversion sin esfuerzo |

### Fase 6 - Social Proof y Growth
| Feature | Inspirada en | Impacto |
|---------|-------------|---------|
| Portafolio/galeria | Bluegift, Promotop | Alto - confianza nicho imprenta |
| "Clientes que confian" | Bluegift | Alto - B2B trust |
| Preguntas y respuestas | MercadoLibre | Medio - conversion |
| Popup compra reciente | Shopify apps | Medio - urgencia |
| Fichas tecnicas PDF | Promotop | Medio - nicho imprenta |
| Newsletter | Estandar e-commerce | Alto - marketing |
| Google Analytics | Estandar | Alto - medicion |
| Politicas legales | Etsy, estandar | Medio - trust |

---

## Notas de Implementacion

### Orden de ejecucion
1. Ejecutar Fase 4, verificar con Playwright, commit
2. Ejecutar Fase 5, verificar con Playwright, commit
3. Ejecutar Fase 6, verificar con Playwright, commit

### Variables de entorno nuevas
- CRON_SECRET (para proteger endpoint de cron de carrito abandonado)
- Las de Supabase Auth ya existen (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- META_WHATSAPP_TOKEN (token permanente de la app Meta)
- META_WHATSAPP_PHONE_ID (ID del numero de WhatsApp Business)
- META_WHATSAPP_VERIFY_TOKEN (token de verificacion del webhook, lo defines tu)
- ANTHROPIC_API_KEY o AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (para Bedrock)
- AWS_REGION (us-east-1 recomendado)

### MCP Tools utilizados
- **playwright**: Verificacion visual y funcional en cada fase
- **a11y**: Auditoria de accesibilidad en Fase 6
- **css-mcp**: Analisis de consistencia CSS si es necesario

### Backend / Infra
NO se necesita Docker. Stack hibrido Vercel + AWS:
- Next.js API Routes en Vercel (logica de la tienda)
- AWS Lambda (bot WhatsApp + cron jobs)
- Amazon Bedrock Claude Haiku (IA del bot)
- Supabase (BD + Auth + Storage + Realtime)
- Amazon SES (emails a escala) o Resend (si prefieres simplicidad)
- S3 + CloudFront (CDN imagenes)
- EventBridge (cron: carritos abandonados, limpieza)

### Credenciales
- Admin panel: admin / admin123
- Cliente prueba: test@printup.cl / Test1234! (se crea en Fase 5)
- Cupones prueba: BIENVENIDO10, PRINTUP2026, ENVIOGRATIS

---

## Estrategia AWS - Servicios Baratos + Camino a Partner

### Objetivo Doble
1. **Tecnico**: Usar servicios AWS que aporten valor real a PrintUp (bot, emails, CDN, backups)
2. **Profesional**: Construir un caso de uso real con AWS para tu CV y aplicar al AWS Partner Network (APN)

### Servicios AWS Recomendados para PrintUp

| Servicio | Uso en PrintUp | Costo Estimado/Mes | Free Tier |
|----------|---------------|-------------------|-----------|
| **AWS Lambda** | Webhook del bot WhatsApp, cron jobs | $0 | 1M requests/mes gratis |
| **Amazon Bedrock (Claude Haiku)** | IA del bot WhatsApp | $5-15 | No (pay per token) |
| **Amazon SES** | Emails transaccionales + newsletters (reemplaza Resend) | $1-3 | 62,000 emails/mes gratis (desde EC2) |
| **Amazon S3** | Backup de imagenes, archivos de clientes, assets | $1-2 | 5GB gratis primer ano |
| **Amazon CloudFront** | CDN para imagenes de productos (carga rapida) | $0 | 1TB/mes gratis |
| **Amazon DynamoDB** | Cache de conversaciones del bot (TTL 24h) | $0 | 25GB gratis |
| **Amazon EventBridge** | Cron: carritos abandonados, limpieza de data | $0 | 14M invocaciones gratis |
| **AWS Amplify** | Hosting alternativo a Vercel (opcional) | $0-5 | Free tier disponible |
| **Amazon CloudWatch** | Logs y monitoreo del bot | $0 | Free tier generoso |
| **AWS Certificate Manager** | SSL para subdominios (api.printup.cl) | $0 | Siempre gratis |

**Total estimado: $7-25/mes** (la mayoria cubierto por free tier)

### Arquitectura AWS para PrintUp

```
printup.cl (Vercel/Amplify)
     |
     |── API Routes (Next.js) ── Supabase (BD + Auth + Storage)
     |
     |── Lambda Function URL ── WhatsApp Bot
     |        |
     |        |── Amazon Bedrock (Claude Haiku) ── IA responses
     |        |── DynamoDB ── Conversation state cache
     |        |── Supabase ── Persistent data
     |
     |── Amazon SES ── Emails (pedidos, newsletters, carrito abandonado)
     |
     |── CloudFront ── CDN ── S3 (product images, backups)
     |
     |── EventBridge ── Cron jobs ── Lambda (carritos abandonados, cleanup)
```

### Camino al AWS Partner Network (APN)

#### Paso 1: Registered Partner (GRATIS, inmediato)
- Registrarse en partnercentral.awspartner.com
- Solo necesitas: cuenta AWS activa + datos de empresa
- PrintUp (Servicios Graficos Spa) puede registrarse como ISV o Consulting Partner
- **Beneficio**: acceso a AWS Partner Central, logo de partner, entrenamiento gratuito

#### Paso 2: AWS Cloud Practitioner Certification ($100 USD)
- Examen basico de cloud (90 minutos, opcion multiple)
- Estudiar: AWS Skill Builder (gratis) + curso de Udemy (~$15)
- Tiempo de preparacion: 2-4 semanas
- **Beneficio**: primera certificacion AWS para tu CV + prerequisito para partner tiers

#### Paso 3: Construir el Caso de Uso
- Implementar las fases 4-6 con servicios AWS
- Documentar la arquitectura y resultados
- Metricas: "Bot atiende X% de consultas automaticamente", "CDN mejoro tiempo de carga en X%"
- **Beneficio**: caso de estudio real para mostrar en partner application y CV

#### Paso 4: AWS Solutions Architect Associate ($150 USD, opcional pero potente)
- Certificacion intermedia mas valorada del mercado
- Estudiar: 4-8 semanas con labs practicos
- **Beneficio**: sube tu CV enormemente + requisito para Select Partner

#### Paso 5: Select Partner (objetivo a mediano plazo)
Requisitos:
- 2+ certificaciones AWS (Cloud Practitioner + Solutions Architect)
- $10,000 USD/ano en AWS spend (o referencias de clientes)
- Customer references (PrintUp es tu primera referencia)
- **Estrategia**: si consigues 2-3 clientes mas que usen tu infraestructura AWS, llegas al spend

### Para tu CV / LinkedIn

```
AWS Services Implementados en PrintUp:
- AWS Lambda: Bot conversacional WhatsApp con IA (Claude via Bedrock)
- Amazon Bedrock: Atencion automatizada 24/7 con procesamiento de lenguaje natural
- Amazon SES: Sistema de email transaccional (confirmaciones, marketing, carrito abandonado)
- Amazon S3 + CloudFront: CDN para assets estaticos, reduccion de latencia en 60%
- Amazon DynamoDB: Cache de sesiones en tiempo real para bot conversacional
- Amazon EventBridge: Automatizacion de procesos (recuperacion de carritos, notificaciones)
- Arquitectura serverless: $7-25/mes para e-commerce completo con IA
```

### Implementacion por Fase

| Servicio AWS | Se implementa en | Reemplaza |
|-------------|-----------------|-----------|
| Lambda + Bedrock + DynamoDB | Fase 5 (bot WhatsApp) | Nada nuevo, es feature nueva |
| Amazon SES | Fase 5 (opcional) o Fase 6 | Resend (ahorro en newsletters masivos) |
| S3 + CloudFront | Fase 6 (CDN imagenes) | Supabase Storage directo (mas rapido) |
| EventBridge | Fase 5 (cron jobs) | Vercel Cron (mas robusto y gratuito) |
| CloudWatch | Todas las fases | Console.log manual (monitoreo pro) |

### Nota sobre costos

Los servicios de AWS tienen free tier generoso. Para el volumen de PrintUp:
- Lambda free tier: 1M requests = SOBRA para el bot
- DynamoDB free tier: 25GB = SOBRA para cache de conversaciones
- CloudFront free tier: 1TB = SOBRA para imagenes de productos
- SES free tier: 62,000 emails desde EC2 = SOBRA para emails

El unico costo real es **Amazon Bedrock** (~$5-15/mes) porque Claude Haiku cobra por token.
Alternativa gratuita: usar Anthropic API directamente (tiene free tier para developers)
o usar Claude via API con tu propio API key (mismo costo, sin vendor lock-in AWS).

Si usas Bedrock, ese spend CUENTA para el AWS Partner program.
