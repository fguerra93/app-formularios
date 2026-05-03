# Plan V3: 4 Fases - Meta Integration, Campanas, Designer Studio y UX Polish

> Generado: 2026-05-03
> Prerequisito: Todas las 6 fases anteriores completadas (plan-3-fases-v2.md)
> Cada fase es un prompt independiente para Claude Code
> Al finalizar cada fase, se verifica con Playwright que todo funcione

---

## Fase 7: Bandeja Unificada de Mensajes + Bot Multi-Canal (Meta Business API)

### Objetivo
Centralizar TODOS los mensajes de WhatsApp, Instagram y Facebook Messenger en un solo panel admin. Configurar respuestas automaticas predeterminadas que funcionen en todos los canales simultaneamente.

### Contexto tecnico
- Meta Business Platform unifica WhatsApp Business API, Instagram Messaging API y Facebook Messenger bajo una sola integracion (Graph API v21+)
- Se necesita: Facebook App, Business Verification, webhook endpoint unificado
- El bot actual de WhatsApp (admin/whatsapp) se migra a esta nueva bandeja unificada

### 7.1 Base de datos

```sql
-- Tabla unificada de conversaciones multi-canal
CREATE TABLE conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'instagram', 'facebook', 'email')),
  contacto_id TEXT NOT NULL,          -- ID del contacto en la plataforma
  contacto_nombre TEXT,
  contacto_avatar TEXT,
  contacto_telefono TEXT,             -- Solo WhatsApp
  contacto_username TEXT,             -- Solo Instagram/Facebook
  estado TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'archivada')),
  etiquetas TEXT[] DEFAULT '{}',      -- Tags: "venta", "soporte", "cotizacion"
  asignado_a TEXT,                    -- Para futuro multi-agente
  ultimo_mensaje TEXT,
  ultimo_mensaje_at TIMESTAMPTZ,
  no_leidos INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mensajes individuales
CREATE TABLE mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
  direccion TEXT NOT NULL CHECK (direccion IN ('entrante', 'saliente')),
  tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'audio', 'video', 'documento', 'sticker', 'ubicacion', 'template')),
  contenido TEXT,
  media_url TEXT,
  media_type TEXT,
  meta_message_id TEXT,               -- ID del mensaje en Meta
  estado_envio TEXT DEFAULT 'enviado' CHECK (estado_envio IN ('pendiente', 'enviado', 'entregado', 'leido', 'fallido')),
  respuesta_automatica BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Respuestas automaticas configurables por canal
CREATE TABLE respuestas_automaticas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,                -- "Saludo", "Horario", "Precios"
  canales TEXT[] DEFAULT '{whatsapp,instagram,facebook}',
  palabras_clave TEXT[] NOT NULL,      -- {"hola", "buenos dias", "hi"}
  respuesta TEXT NOT NULL,
  tipo_respuesta TEXT DEFAULT 'texto' CHECK (tipo_respuesta IN ('texto', 'imagen', 'template')),
  media_url TEXT,                      -- Para respuestas con imagen
  activo BOOLEAN DEFAULT true,
  prioridad INT DEFAULT 0,
  horario_inicio TIME,                 -- NULL = siempre activo
  horario_fin TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plantillas de mensaje rapido (para responder manualmente rapido)
CREATE TABLE mensajes_rapidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,                -- "Confirmacion de pedido"
  contenido TEXT NOT NULL,             -- "Hola {{nombre}}, tu pedido #{{pedido}} esta..."
  categoria TEXT,                      -- "ventas", "soporte", "envios"
  atajo TEXT,                          -- "/confirmar" para escribir rapido
  canales TEXT[] DEFAULT '{whatsapp,instagram,facebook}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversaciones_canal ON conversaciones(canal);
CREATE INDEX idx_conversaciones_estado ON conversaciones(estado);
CREATE INDEX idx_conversaciones_ultimo ON conversaciones(ultimo_mensaje_at DESC);
CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id, created_at);
CREATE INDEX idx_respuestas_auto_activo ON respuestas_automaticas(activo);
```

### 7.2 API Routes

```
POST   /api/webhooks/meta                    -- Webhook unificado de Meta (recibe mensajes de WA/IG/FB)
GET    /api/webhooks/meta                    -- Verificacion del webhook de Meta (challenge)

GET    /api/admin/mensajeria/conversaciones  -- Lista conversaciones con filtros (canal, estado, etiqueta)
GET    /api/admin/mensajeria/conversaciones/[id]  -- Detalle con todos los mensajes
POST   /api/admin/mensajeria/conversaciones/[id]/enviar  -- Enviar mensaje (texto/imagen/template)
PATCH  /api/admin/mensajeria/conversaciones/[id]  -- Cerrar, archivar, etiquetar, asignar
GET    /api/admin/mensajeria/stats           -- Metricas: msgs/dia, tiempo respuesta, por canal

GET    /api/admin/mensajeria/respuestas-automaticas       -- CRUD respuestas automaticas
POST   /api/admin/mensajeria/respuestas-automaticas
PUT    /api/admin/mensajeria/respuestas-automaticas/[id]
DELETE /api/admin/mensajeria/respuestas-automaticas/[id]

GET    /api/admin/mensajeria/mensajes-rapidos              -- CRUD mensajes rapidos
POST   /api/admin/mensajeria/mensajes-rapidos
PUT    /api/admin/mensajeria/mensajes-rapidos/[id]
DELETE /api/admin/mensajeria/mensajes-rapidos/[id]
```

### 7.3 Paginas Admin

**`/admin/mensajeria`** - Bandeja unificada estilo WhatsApp Web / Intercom:
- Layout 3 columnas: lista conversaciones | chat activo | info contacto
- Lista izquierda: avatar, nombre, ultimo mensaje, badge canal (WA verde, IG degradado, FB azul), timestamp, no leidos
- Filtros por canal (Todos, WhatsApp, Instagram, Facebook), estado (Abiertas, Cerradas), etiquetas
- Busqueda por nombre/telefono/username
- Chat central: burbujas de mensaje con hora, estado (enviado/entregado/leido con checks), soporte multimedia (imagenes, audio, video)
- Input de mensaje con: texto, adjuntar imagen, mensajes rapidos (dropdown con /atajos), enviar
- Panel derecho: datos del contacto, historial de pedidos si existe, etiquetas, notas

**`/admin/mensajeria/configuracion`** - O tab en `/admin/configuracion`:
- Conexion Meta Business: App ID, App Secret, Access Token, Page ID, IG Business Account ID, Verify Token
- Estado de conexion por canal (conectado/desconectado con indicador visual)
- Respuestas automaticas: tabla editable con nombre, palabras clave, respuesta, canales activos (checkboxes WA/IG/FB), horario, on/off toggle
- Mensajes rapidos: tabla editable con titulo, contenido (con variables {{nombre}}, {{pedido}}), atajo, categoria
- Configuracion general: responder automaticamente fuera de horario (si/no), mensaje fuera de horario, tiempo maximo antes de marcar como "sin respuesta"

**Sidebar admin**: Reemplazar "WhatsApp Bot" por "Mensajeria" con icono MessageSquare. Mover bajo seccion COMUNICACION (nueva seccion que reemplaza la actual de WhatsApp en AUTOMATIZACION).

### 7.4 Logica del webhook unificado

```
Llega mensaje a /api/webhooks/meta
  -> Identificar canal (whatsapp/instagram/messenger) por estructura del payload
  -> Buscar o crear conversacion en BD
  -> Guardar mensaje entrante
  -> Buscar respuesta automatica que matchee (por palabras clave + canal + horario)
  -> Si hay match: enviar respuesta via Meta API + guardar como saliente + marcar respuesta_automatica=true
  -> Si no hay match: solo notificar al admin (badge en sidebar)
  -> Actualizar conversacion (ultimo_mensaje, no_leidos, updated_at)
```

### 7.5 Configuracion en Admin > Configuracion

Agregar tab "Meta / Mensajeria" con:
- `meta_app_id` - Facebook App ID
- `meta_app_secret` - Facebook App Secret
- `meta_page_access_token` - Page Access Token (long-lived)
- `meta_page_id` - Facebook Page ID
- `meta_ig_account_id` - Instagram Business Account ID
- `meta_webhook_verify_token` - Token de verificacion del webhook
- `meta_mensajeria_activa` - Toggle on/off

### 7.6 Verificacion Playwright
1. Abrir /admin/mensajeria - verificar layout 3 columnas, filtros de canal
2. Abrir /admin/mensajeria/configuracion - verificar campos Meta, tabla de respuestas automaticas
3. Crear una respuesta automatica con palabras clave "hola,buenos dias" para los 3 canales
4. Verificar que aparece en la tabla con toggles de canal
5. Verificar sidebar muestra "Mensajeria" en vez de "WhatsApp Bot"

---

## Fase 8: Campanas de Marketing con Template Builder Drag & Drop

### Objetivo
Crear un constructor visual de templates de email (drag & drop) y un sistema de campanas que permite enviar emails diseñados a segmentos de la base de clientes.

### 8.1 Base de datos

```sql
-- Templates de email reutilizables
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT DEFAULT 'general',    -- "promocion", "newsletter", "bienvenida", "abandono"
  contenido_json JSONB NOT NULL,       -- Estructura del template (bloques drag&drop)
  contenido_html TEXT,                 -- HTML renderizado (se genera del JSON)
  thumbnail_url TEXT,                  -- Preview image
  es_preset BOOLEAN DEFAULT false,     -- Templates pre-hechos vs creados por usuario
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campanas de marketing
CREATE TABLE campanas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT NOT NULL,                -- Subject del email
  template_id UUID REFERENCES email_templates(id),
  contenido_html TEXT,                 -- HTML final (snapshot del template al momento de enviar)
  segmento JSONB DEFAULT '{}',         -- Filtros: {"tipo": "todos"} o {"compro_categoria": "poleras", "ultimo_pedido_dias": 30}
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programada', 'enviando', 'enviada', 'cancelada')),
  programada_para TIMESTAMPTZ,         -- NULL = envio manual
  enviada_at TIMESTAMPTZ,
  total_destinatarios INT DEFAULT 0,
  total_enviados INT DEFAULT 0,
  total_abiertos INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  total_errores INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Log de envio por destinatario
CREATE TABLE campana_envios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campana_id UUID REFERENCES campanas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'abierto', 'click', 'rebotado', 'error')),
  abierto_at TIMESTAMPTZ,
  click_at TIMESTAMPTZ,
  error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campanas_estado ON campanas(estado);
CREATE INDEX idx_campana_envios_campana ON campana_envios(campana_id);
CREATE INDEX idx_email_templates_categoria ON email_templates(categoria);
```

### 8.2 Template Builder (Editor Drag & Drop)

Pagina: `/admin/campanas/editor/[id]` (o `/admin/campanas/editor/nuevo`)

**Arquitectura del editor:**
- Usar una libreria como `@craftjs/core` o construir un sistema de bloques propio basado en un array JSON de bloques
- Cada template es un array JSON de bloques ordenados que se renderiza a HTML

**Bloques disponibles (panel izquierdo):**

| Bloque | Descripcion | Propiedades editables |
|--------|-------------|----------------------|
| Header | Logo + titulo | Logo URL, titulo, color fondo, padding |
| Texto | Parrafo libre | Contenido (rich text basico: bold, italic, link), alineacion, color, tamanio fuente |
| Imagen | Imagen con link | URL imagen, alt text, link destino, ancho (%), bordes |
| Boton CTA | Boton de accion | Texto, URL destino, color fondo, color texto, bordes, tamanio |
| Separador | Linea divisoria | Color, grosor, margen |
| Columnas 2 | Dos columnas | Contenido izq/der (cada uno acepta texto o imagen) |
| Producto | Card de producto | Seleccionar producto de la BD -> muestra imagen, nombre, precio, boton "Ver" |
| Cupon | Bloque de cupon | Seleccionar cupon existente -> muestra codigo, descuento, fecha expiracion |
| Social | Links de redes | Iconos de Facebook, Instagram, WhatsApp con links |
| Footer | Pie con legal | Texto legal, link desuscribir (obligatorio), direccion |
| Espaciador | Espacio vacio | Altura en px |

**Interaccion drag & drop:**
- Panel izquierdo: bloques arrastrables
- Centro: canvas con preview del email (ancho 600px, fondo gris simulando inbox)
- Click en bloque del canvas: panel derecho muestra propiedades editables
- Drag para reordenar bloques
- Boton eliminar en cada bloque (hover)
- Undo/Redo
- Preview: boton "Vista previa" abre modal con el HTML renderizado
- Boton "Enviar email de prueba" envia a tu correo para verificar como se ve en Gmail/Outlook

**Variables dinamicas en textos:**
- `{{nombre}}` - Nombre del suscriptor
- `{{email}}` - Email
- `{{link_desuscribir}}` - Link para desuscribirse (obligatorio)

**Templates pre-hechos (presets):**
Incluir 4-5 templates de ejemplo listos para usar:
1. "Promocion Simple" - Header con logo, imagen hero, texto promo, boton CTA, footer
2. "Nuevo Producto" - Header, imagen producto, descripcion, precio, boton comprar, footer
3. "Newsletter Mensual" - Header, texto intro, 3 productos destacados, cupon, redes, footer
4. "Cupon de Descuento" - Header, texto grande con codigo, condiciones, boton, footer
5. "Bienvenida" - Header, saludo personalizado, que ofrecemos, boton catalogo, redes, footer

### 8.3 Paginas Admin

**`/admin/campanas`** - Lista de campanas:
- Stats cards: campanas enviadas este mes, emails enviados, tasa apertura promedio
- Tabla: nombre, estado (badge color), destinatarios, enviados, abiertos (%), fecha, acciones
- Boton "Nueva Campana"
- Filtros: estado (todas, borrador, programadas, enviadas)

**`/admin/campanas/nueva`** - Wizard de nueva campana:
- Paso 1: Nombre + Asunto del email
- Paso 2: Segmento (todos los suscriptores, compraron en ultimos 30 dias, por categoria, custom)
- Paso 3: Seleccionar template existente o crear nuevo -> abre editor
- Paso 4: Preview + programar o enviar ahora
- Preview muestra: template renderizado + lista de destinatarios + conteo

**`/admin/campanas/[id]`** - Detalle de campana enviada:
- Metricas: enviados, abiertos, clicks, rebotados, errores (con graficos/barras)
- Tabla de destinatarios con estado individual
- Preview del email enviado

**`/admin/campanas/templates`** - Biblioteca de templates:
- Grid de cards con thumbnail preview de cada template
- Badge "Preset" para los pre-hechos
- Boton "Nuevo Template" -> abre editor
- Duplicar, editar, eliminar

**`/admin/campanas/editor/[id]`** - Editor drag & drop (descrito en 8.2)

**Sidebar admin**: Agregar "Campanas" bajo MARKETING (entre Newsletter y Portafolio), con icono Megaphone.

### 8.4 API Routes

```
GET/POST        /api/admin/campanas                    -- Lista/crear campanas
GET/PUT/DELETE  /api/admin/campanas/[id]               -- Detalle/editar/eliminar
POST            /api/admin/campanas/[id]/enviar        -- Enviar campana (o programar)
POST            /api/admin/campanas/[id]/test          -- Enviar email de prueba
GET             /api/admin/campanas/[id]/stats         -- Metricas de la campana

GET/POST        /api/admin/campanas/templates          -- CRUD templates
GET/PUT/DELETE  /api/admin/campanas/templates/[id]
POST            /api/admin/campanas/templates/[id]/render  -- Renderizar JSON a HTML
POST            /api/admin/campanas/templates/[id]/duplicate

GET             /api/admin/campanas/segmentos/preview  -- Preview de cuantos destinatarios matchean un filtro

GET             /api/email/track/open/[envio_id]       -- Pixel de tracking (1x1 transparent gif)
GET             /api/email/track/click/[envio_id]      -- Redirect con tracking de click
GET             /api/newsletter/desuscribir?email=X    -- Landing de desuscripcion (ya existe, reutilizar)
```

### 8.5 Verificacion Playwright
1. Abrir /admin/campanas - verificar lista vacia, stats cards, boton nueva campana
2. Abrir /admin/campanas/templates - verificar 5 templates preset con thumbnails
3. Abrir editor de un template preset - verificar panel de bloques, canvas, panel propiedades
4. Arrastrar un bloque "Texto" al canvas - verificar que aparece
5. Seleccionar bloque - verificar panel de propiedades a la derecha
6. Vista previa - verificar modal con HTML renderizado
7. Crear campana nueva - verificar wizard de 4 pasos
8. Sidebar muestra "Campanas" bajo MARKETING

---

## Fase 9: Product Designer Studio (Personalizador Visual de Productos)

### Objetivo
Crear un editor visual estilo VistaPrint Studio donde el cliente puede personalizar productos (poleras, tazones, bolsas, etc.) directamente en la tienda: agregar texto, subir imagenes, elegir colores, posicionar elementos y ver un preview realista de como queda.

### Referencia: VistaPrint Studio
El editor de VistaPrint permite:
- Seleccionar un producto base (polera, taza, bolsa)
- Ver un mockup 3D/realista del producto
- Agregar texto con fuentes, tamanios, colores
- Subir imagenes/logos y posicionarlos
- Clipart/iconos predefinidos
- Vista frente/espalda/laterales
- Zoom y pan en el area de diseno
- Guardar diseno para despues
- Agregar al carrito con el diseno personalizado

### 9.1 Base de datos

```sql
-- Configuracion de areas personalizables por producto
CREATE TABLE producto_areas_diseno (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,                -- "Frente", "Espalda", "Manga Izquierda"
  mockup_url TEXT NOT NULL,            -- Imagen base del mockup (polera blanca frente, etc.)
  area_x FLOAT NOT NULL,              -- Posicion X del area editable (% desde izquierda)
  area_y FLOAT NOT NULL,              -- Posicion Y del area editable (% desde arriba)
  area_width FLOAT NOT NULL,          -- Ancho del area editable (% del mockup)
  area_height FLOAT NOT NULL,         -- Alto del area editable (% del mockup)
  dpi_recomendado INT DEFAULT 300,
  max_colores INT,                    -- NULL = sin limite
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disenos guardados del cliente
CREATE TABLE disenos_cliente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID,                     -- NULL si es anonimo (se guarda en localStorage)
  producto_id UUID REFERENCES productos(id),
  nombre TEXT DEFAULT 'Mi diseno',
  diseno_json JSONB NOT NULL,          -- Datos completos del diseno (elementos, posiciones, etc.)
  preview_url TEXT,                    -- Screenshot/render del diseno
  variante JSONB,                     -- {talla: "L", color: "Negro"}
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_carrito', 'pedido')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clipart/elementos predefinidos
CREATE TABLE clipart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,             -- "deportes", "naturaleza", "texto", "logos", "formas"
  url TEXT NOT NULL,
  tags TEXT[],
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fuentes personalizadas
CREATE TABLE fuentes_diseno (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,                -- "Montserrat", "Playfair Display", etc.
  familia TEXT NOT NULL,               -- CSS font-family
  url TEXT,                            -- URL del font file (Google Fonts o custom)
  categoria TEXT DEFAULT 'sans-serif', -- "serif", "sans-serif", "display", "handwriting"
  popular BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_producto_areas_producto ON producto_areas_diseno(producto_id);
CREATE INDEX idx_disenos_cliente ON disenos_cliente(cliente_id);
CREATE INDEX idx_clipart_categoria ON clipart(categoria);
```

### 9.2 Editor Visual (Canvas)

Pagina: `/productos/[categoria]/[slug]/personalizar` (o modal en la pagina de producto)

**Arquitectura del editor:**
- Canvas principal usando HTML5 Canvas (via `fabric.js` o `konva.js` - libreria JS para canvas interactivo)
- Mockup del producto como imagen de fondo
- Area de diseno delimitada con guias visuales
- Elementos arrastrables, escalables, rotables

**Layout del editor:**

```
[Panel Herramientas]  [Canvas con Mockup]  [Panel Propiedades]
     Izquierdo            Centro               Derecho

[Barra inferior: Vistas - Frente | Espalda | Preview Final]
```

**Panel izquierdo - Herramientas:**
- Texto: click para agregar cuadro de texto
  - Fuentes: 20+ fuentes de Google Fonts
  - Tamanio: slider o input numerico
  - Color: color picker
  - Bold, Italic, alineacion
  - Arco/curva (texto curvado)
- Subir imagen: drag & drop o file picker
  - Formatos: PNG, JPG, SVG
  - Auto-remove background (opcional, usando API)
  - Ajustar opacidad, filtros basicos
- Clipart: galeria organizada por categoria
  - Busqueda por nombre/tag
  - Grid de iconos/ilustraciones
  - Click para agregar al canvas
- Formas: circulo, rectangulo, estrella, corazon, linea
  - Color relleno, borde, tamanio
- Capas: lista de elementos con orden z-index
  - Drag para reordenar
  - Visibilidad on/off
  - Eliminar

**Canvas central:**
- Mockup del producto (ej: polera blanca plana)
- Area de diseno marcada con borde punteado
- Elementos dentro del area son arrastrables
- Handles en esquinas para escalar/rotar
- Snap-to-grid sutil
- Zoom con scroll o botones +/-
- El color del mockup cambia segun variante seleccionada (polera negra, azul, etc.)

**Panel derecho - Propiedades del elemento seleccionado:**
- Posicion X, Y (inputs numericos)
- Tamanio W, H
- Rotacion (grados)
- Opacidad
- Duplicar / Eliminar
- Propiedades especificas del tipo (color de texto, fuente, etc.)

**Barra inferior:**
- Tabs de vistas: "Frente", "Espalda", etc. (segun areas definidas)
- Boton "Preview 3D" - muestra el mockup final renderizado
- Boton "Guardar Diseno" - guarda en BD (si logueado) o localStorage
- Boton "Agregar al Carrito" - agrega producto + diseno al carrito

### 9.3 Integracion con carrito y checkout

Cuando el cliente agrega un producto personalizado al carrito:
- Se genera un preview (screenshot del canvas)
- Se guarda el JSON del diseno en `disenos_cliente`
- El item del carrito incluye: producto + variante + diseno_id + preview_url
- En el checkout, se muestra el preview junto al producto
- Al crear el pedido, el diseno_json queda asociado al pedido
- En admin, el detalle del pedido muestra el preview y permite descargar el diseno en alta resolucion

### 9.4 Admin - Configurar areas de diseno

En **Admin > Productos > Editar producto**, agregar tab "Personalizacion":
- Toggle "Producto personalizable" (activa/desactiva el boton "Personalizar" en la tienda)
- Lista de areas de diseno (Frente, Espalda, etc.)
- Para cada area: subir mockup base, definir area editable (x, y, width, height en % con preview visual)
- Subir mockups por color de variante (mockup blanco, negro, azul, etc.)

En **Admin > Configuracion** o seccion dedicada:
- Gestion de clipart: subir, categorizar, activar/desactivar
- Gestion de fuentes: agregar fuentes de Google Fonts

### 9.5 API Routes

```
GET    /api/productos/[slug]/areas-diseno     -- Areas personalizables del producto
GET    /api/designer/clipart                  -- Lista clipart por categoria
GET    /api/designer/fuentes                  -- Lista fuentes disponibles
POST   /api/designer/disenos                  -- Guardar diseno
GET    /api/designer/disenos/[id]             -- Cargar diseno guardado
PUT    /api/designer/disenos/[id]             -- Actualizar diseno
POST   /api/designer/render                   -- Renderizar preview del diseno (server-side)

POST   /api/admin/productos/[id]/areas-diseno           -- CRUD areas de diseno
PUT    /api/admin/productos/[id]/areas-diseno/[areaId]
DELETE /api/admin/productos/[id]/areas-diseno/[areaId]
GET/POST   /api/admin/designer/clipart                  -- CRUD clipart
DELETE     /api/admin/designer/clipart/[id]
GET/POST   /api/admin/designer/fuentes                  -- CRUD fuentes
```

### 9.6 Verificacion Playwright
1. Abrir producto personalizable -> verificar boton "Personalizar"
2. Abrir editor -> verificar canvas con mockup, panel herramientas, panel propiedades
3. Agregar texto "PRINTUP" -> verificar que aparece en el canvas
4. Cambiar fuente y color del texto -> verificar cambios visuales
5. Subir una imagen -> verificar que aparece en el area de diseno
6. Cambiar vista Frente/Espalda -> verificar que el mockup cambia
7. Click "Agregar al Carrito" -> verificar que el carrito muestra preview del diseno
8. Admin > Productos > Editar -> verificar tab "Personalizacion" con areas de diseno

---

## Fase 10: UX/UI Polish - Rediseno del Frontend

### Objetivo
Auditar y mejorar el frontend completo del e-commerce usando las herramientas MCP de UI/UX. Incorporar elementos del sitio original printup.cl que funcionan bien. Actualizar el logo. Mejorar responsividad, accesibilidad, micro-interacciones y coherencia visual.

### 10.1 Analisis con herramientas MCP UX

Usar las siguientes herramientas MCP para auditar el sitio actual:
- `mcp__ux-best-practices__review_usability` - Revision general de usabilidad
- `mcp__ux-best-practices__analyze_accessibility` - Accesibilidad WCAG
- `mcp__ux-best-practices__check_responsive` - Responsividad en multiples breakpoints
- `mcp__ux-best-practices__check_contrast` - Contraste de colores
- `mcp__ux-best-practices__analyze_information_architecture` - Arquitectura de informacion
- `mcp__ux-best-practices__suggest_microinteraction` - Micro-interacciones
- `mcp__ux-best-practices__suggest_animation` - Animaciones
- `mcp__ux-best-practices__detect_dark_patterns` - Patrones oscuros
- `mcp__ui-expert__analyze_ui` - Analisis de UI completo
- `mcp__a11y__audit_webpage` - Auditoria de accesibilidad
- `mcp__css-mcp__analyze_project_css` - Analisis de CSS del proyecto

### 10.2 Elementos a incorporar de printup.cl original

Del sitio original (Shopify) que funcionan bien y hay que replicar/mejorar:

1. **Logo animado (GIF)**: El logo actual es un GIF animado en `//printup.cl/cdn/shop/files/LOGO-2.gif`. Usar este logo real en nuestra tienda (navbar + footer + favicon).

2. **Hero con formas organicas**: El hero de printup.cl tiene circulos/semicirculos de color naranja y navy como elementos decorativos detras de las fotos de producto. Replicar este estilo con formas CSS o SVG.

3. **"Compra por coleccion" con cards grandes**: Las cards de categoria en printup.cl son grandes, 2x2, con fotos reales de productos con el branding PrintUp. Mucho mas atractivas que nuestras cards actuales con iconos.

4. **Seccion "Personaliza Tus Poleras"**: CTA prominente con foto de polera real estampada. Nuestro CTA actual es minimalista, mejorar con foto real.

5. **Paleta de colores original**: Navy (#000657), Naranja (#FF9710), Teal (#00998E), fondo claro.

6. **"Siguenos en nuestras Redes Sociales"**: Seccion con iconos grandes de redes sociales antes del footer.

7. **Banner de info de envio con scroll**: El banner superior con detalles de envio/horarios hace scroll horizontal.

### 10.3 Mejoras especificas a implementar

**Homepage:**
- Reemplazar hero generico por uno con fotos reales de productos PrintUp + formas decorativas (circulos navy/naranja)
- Cards de categoria mas grandes con fotos reales (2 columnas, formato tarjeta horizontal grande)
- Seccion "Siguenos en Redes" con iconos de Facebook, Instagram, TikTok
- Testimonios/reviews destacados como seccion separada
- Animaciones de entrada (scroll reveal) en cada seccion

**Navbar:**
- Usar el logo real de PrintUp (GIF o PNG del logo oficial)
- Mega-menu de categorias con preview de imagen al hacer hover
- Indicador de pagina activa mas visible
- Animacion suave al abrir menu mobile

**Product Cards:**
- Hover effect: zoom suave de imagen + overlay con "Ver detalles"
- Badge de descuento si tiene cupon activo
- Quick view modal (click en ojo para preview rapido sin ir a la pagina)
- Transicion suave al agregar al carrito (animacion del boton)

**Product Detail:**
- Gallery con zoom on hover (lupa)
- Sticky sidebar con precio y boton en desktop (que acompane el scroll)
- Tabs mejorados con animacion de slide
- Breadcrumb mejorado con iconos

**Checkout:**
- Progress bar visual (Paso 1/2/3)
- Animacion de confirmacion (checkmark animado)
- Formulario con validacion inline mas clara

**Footer:**
- Logo oficial de PrintUp
- Seccion de redes sociales mas prominente
- Badge de ChileCompra si aplica (como en printup.cl original)
- Mapa o imagen de ubicacion

**Global:**
- Loading skeletons en todas las paginas (ya existen en algunas, estandarizar)
- Scroll-to-top button animado
- Page transitions suaves
- Focus states mejorados para accesibilidad
- Mejorar contraste donde el audit lo indique

### 10.4 Verificacion Playwright
1. Screenshot de homepage completa - comparar con printup.cl original
2. Mobile viewport (390px) - verificar responsividad
3. Tablet viewport (768px) - verificar responsividad
4. Verificar logo correcto en navbar y footer
5. Hover en product cards - verificar efecto zoom
6. Abrir mega-menu - verificar imagenes de preview
7. Checkout - verificar progress bar
8. Lighthouse audit via MCP - score > 80 en todas las categorias
9. Accessibility audit - sin errores criticos

---

## Resumen de las 4 fases

| Fase | Nombre | Archivos nuevos aprox | Complejidad |
|------|--------|----------------------|-------------|
| 7 | Bandeja Unificada Meta + Bot Multi-Canal | ~25 | Alta (API externa Meta) |
| 8 | Campanas de Marketing + Template Builder | ~30 | Alta (editor drag&drop) |
| 9 | Product Designer Studio | ~20 | Muy alta (canvas interactivo) |
| 10 | UX/UI Polish | ~15 (mayoria ediciones) | Media (mejoras incrementales) |

### Orden recomendado
1. **Fase 10 primero** (UX Polish) - Es la mas rapida y da resultados visuales inmediatos
2. **Fase 7** (Meta Mensajeria) - Alto impacto en operacion diaria
3. **Fase 8** (Campanas) - Complementa el newsletter existente
4. **Fase 9** (Designer Studio) - La mas compleja, requiere mas desarrollo

### Prerequisitos externos
- **Fase 7**: Crear Facebook App en developers.facebook.com, verificar business, conectar pagina de Facebook e Instagram Business
- **Fase 8**: Resend ya esta integrado (solo escalar si necesario)
- **Fase 9**: Imagenes de mockup de productos (polera frente/espalda en blanco, etc.)
- **Fase 10**: Logo oficial de PrintUp en alta resolucion (PNG/SVG)
