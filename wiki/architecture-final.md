# PrintUp - Arquitectura del Ecosistema

> Ultima actualizacion: 2026-05-02 | Version: 2.0.0

---

## STEP 1: Entender el Problema & Definir Scope

### Estado Actual (AS-IS) - v2.0.0

| Componente | Tecnologia | Estado |
|---|---|---|
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui, framer-motion | Funcional |
| Backend | Next.js API Routes (serverless) | Funcional |
| DB | Supabase (PostgreSQL) | 8 tablas: formularios, configuracion, email_log, productos, categorias, pedidos, zonas_envio, pagos_log |
| Storage | Supabase Storage (imagenes productos + archivos) + Nextcloud (sync local) | Funcional |
| Auth | JWT con jose + middleware | Funcional |
| Email | Resend (transaccional) | Funcional |
| Pagos | MercadoPago SDK (checkout redirect + webhooks) | Funcional |
| SEO | sitemap.xml dinamico, robots.txt, JSON-LD, Open Graph | Funcional |
| Infra | Vercel (hosting) + Supabase (DB/Storage) + Nextcloud (archivos locales) | Funcional |

### Requirements Funcionales (Confirmados)

**Bloque A - Core (existente):**
1. **Formularios**: recepcion publica, gestion admin, estados, archivos adjuntos
2. **Admin Panel**: dashboard con metricas, historial, ver contenido, configuracion

**Bloque B - Marketing Automation:**
3. **Template Builder**: drag & drop para crear plantillas de marketing personalizadas
4. **Campanas de Marketing**: envio masivo de emails con plantillas diseadas
5. **Integracion Canva**: conexion a corto plazo para diseno de piezas graficas
6. **Agente IA Orquestador**: generacion automatizada de campanas (copy, diseno, distribucion)
7. **Multi-canal futuro**: Meta Ads, TikTok, WhatsApp Business

**Bloque C - Ecommerce & Delivery:**
8. **Tienda Online**: catalogo de productos personalizados, carrito, checkout, pagos
9. **Personalizador de Productos**: el cliente sube su diseno o usa plantillas para personalizar (tazas, camisetas, etc.)
10. **Gestion de Pedidos**: flujo completo desde pago hasta entrega (estados, notificaciones)
11. **Delivery & Logistica**: conexion con repartidores locales, tracking, calculo de envio
12. **Inventario basico**: stock de materiales base (tazas blancas, camisetas, etc.)
13. **Pasarela de Pagos**: MercadoPago / Stripe para LATAM con menor comision

### Requirements No-Funcionales

| Requisito | Target |
|---|---|
| Costo mensual (inicio) | < $30 USD |
| Costo mensual (escala) | < $150 USD |
| Usuarios concurrentes | 10-50 (inicio), 500-2000 (escala) |
| Emails masivos | 1,000/mes (inicio), 100,000/mes (escala) |
| Pedidos ecommerce | 50/mes (inicio), 5,000/mes (escala) |
| Latencia p95 | < 500ms API, < 2s page load, < 3s checkout |
| Disponibilidad | 99.5% (inicio), 99.9% (escala) |
| Storage | 10GB (inicio), 1TB+ (escala) |
| Seguridad | WAF, HTTPS, RLS, rate limiting, PCI compliance (via pasarela) |

### Assumptions

- A1: El negocio es una PYME (PrintUp) que imprime productos personalizados
- A2: Pocos clientes hoy (~50-100), pero el crecimiento puede explotar con marketing
- A3: Server local disponible para Nextcloud y servicios self-hosted
- A4: Presupuesto limitado: priorizar open-source y tiers gratuitos
- A5: Un solo desarrollador/admin mantiene el sistema
- A6: Region principal: LATAM (single-region, CDN para estaticos)
- A7: PrintUp vende productos personalizados (tazas, camisetas, llaveros, etc.) - necesita ecommerce
- A8: Delivery inicialmente local/regional, con opcion de expandir a nacional
- A9: No se almacena data de tarjetas - se delega 100% a pasarela de pagos (PCI compliance via tercero)
- A10: El inventario es de materiales base, no de productos terminados (se producen bajo demanda)

---

## STEP 2: High-Level Design & Blueprint

### Diagrama de Arquitectura General - Ecosistema Completo

```
                                     INTERNET
                                        |
                               [Cloudflare DNS + WAF]
                               (Free tier: DDoS, WAF rules,
                                SSL, caching estaticos, CDN)
                                        |
                     +------------------+-------------------+
                     |                                      |
             [Vercel / VPS]                          [Server Local]
             Next.js 16 App                           (tu server)
             +-- Tienda Publica (/tienda)                   |
             +-- Formulario Publico (/)           +---------+---------+
             +-- Admin Panel (/admin)             |         |         |
             +-- API Routes (/api)           [Nextcloud] [n8n OSS] [Minio]
             +-- Middleware Auth              Storage    Orquestador S3-compat
                     |                       privado    de flujos   backup
                     |
             +-------+-------+-------+
             |               |       |
       [Supabase]    [Redis/Upstash] |
       PostgreSQL     Cache + Rate   |
       Auth RLS       Limiting       |
       Realtime       Queue (BullMQ) |
       Storage        Cart sessions  |
             |                       |
       [Integraciones Externas]------+
       |
       +-- EMAIL
       |   +-- Resend (transaccional: confirmaciones de pedido, etc.)
       |   +-- Amazon SES (masivo: campanas marketing)
       |
       +-- PAGOS
       |   +-- MercadoPago (LATAM, menor comision: 3.49% + IVA)
       |   +-- Stripe (internacional, fallback)
       |   +-- Webhooks de confirmacion de pago
       |
       +-- DELIVERY & LOGISTICA
       |   +-- WhatsApp Business API (notificar repartidores)
       |   +-- Google Maps API (calculo distancia/costo, free $200/mes)
       |   +-- Repartidores propios (app simple / WhatsApp)
       |   +-- [Futuro] APIs de couriers (99Minutos, Skydropx, Envia.com)
       |
       +-- DISENO & MARKETING
       |   +-- Canva Connect API (corto plazo)
       |   +-- Meta Graph API (ads)
       |   +-- Anthropic API (Claude - orquestador IA)
       |   +-- DeepSeek API (worker IA barato)
       |
       +-- PERSONALIZACION DE PRODUCTOS
           +-- Fabric.js (editor canvas en browser)
           +-- Sharp (procesamiento de imagenes server-side)
           +-- Nextcloud (almacenar disenos del cliente)
```

### Trade-offs Clave (Step 2)

| Decision | Opcion A | Opcion B | Elegida | Razon |
|---|---|---|---|---|
| Hosting | Vercel (serverless) | VPS self-hosted | **Vercel free tier** inicio, **VPS** escala | Vercel gratis hasta limites; VPS cuando se justifique |
| Email masivo | Resend ($20/10k) | Amazon SES ($0.10/1k) | **SES para masivo**, Resend transaccional | SES es 200x mas barato para volumen |
| Template builder | Custom React DnD | GrapesJS (open-source) | **GrapesJS** | No reinventar; GrapesJS es maduro, MIT license |
| Storage primario | Supabase Storage | Nextcloud local | **Hibrido**: Nextcloud primario + Supabase backup | Control total + redundancia |
| Cache | Redis self-hosted | Upstash (serverless) | **Upstash free tier** inicio, Redis escala | 10k req/dia gratis |
| WAF | Cloudflare Free | AWS WAF ($5/mes+) | **Cloudflare Free** | DDoS + WAF rules + CDN gratis |
| IA Orquestador | LangChain code | n8n visual | **n8n self-hosted** | Visual, maintainable por no-devs, gratis self-hosted |
| IA cerebro | Solo Claude | Claude + DeepSeek | **Dual**: Claude ruta, DeepSeek ejecuta | Claude $3/M tok vs DeepSeek $0.27/M tok |
| DB | Supabase + otra | Solo Supabase | **Solo Supabase** | Free tier generoso, Realtime incluido, simplifica |
| Diseno grafico | Canva API ($$$) | Custom builder | **Canva Connect** corto plazo, **custom** largo plazo | Canva es caro a escala; construir gradualmente |
| Ecommerce | Shopify ($39/mes) + comisiones | Custom en Next.js | **Custom Next.js** | Sin comisiones extras, control total, ya tienes el stack |
| Pasarela pagos | Stripe (3.6%+$3 MXN) | MercadoPago (3.49%+IVA) | **MercadoPago** primario, Stripe fallback | MP tiene menor comision en LATAM y mayor adopcion |
| Delivery | API courier (Skydropx $$$) | Repartidores propios + WhatsApp | **Propios + WhatsApp** inicio, APIs courier escala | Costo $0 al inicio; courier APIs cuando volumen justifique |
| Personalizador | Canva SDK embebido | Fabric.js (open-source) | **Fabric.js** | MIT license, 28k stars, cero costo, funciona offline |
| Carrito | DB persistent | Redis session | **Redis session** + DB para pedidos confirmados | Redis rapido para carrito temporal; DB solo al confirmar |
| Inventario | ERP completo | Tabla simple en Supabase | **Tabla simple** inicio, ERP si escala | PYME no necesita ERP; una tabla con stock y alertas basta |
| Calculo envio | API Google Maps ($$$) | Zonas fijas con precio | **Zonas fijas** inicio, Google Maps escala | $0 vs $200/mes credit (que igual puede servir despues) |

### Estimacion Back-of-Envelope

**Inicio (6 meses):**
- Supabase: Free tier (500MB DB, 1GB storage, 50k auth) = $0
- Vercel: Free tier (100GB bandwidth) = $0
- Cloudflare: Free tier = $0
- Upstash Redis: Free tier (10k/dia) = $0
- Resend: Free tier (100 emails/dia) = $0
- n8n: Self-hosted en server local = $0
- Nextcloud: Self-hosted en server local = $0
- Dominio: ~$12/ano = $1/mes
- **Total: ~$1/mes**

**Escala (12-24 meses, ~10k users, ~50k emails/mes, ~500 pedidos/mes):**
- Supabase Pro: $25/mes
- Vercel Pro o VPS: $20/mes
- Amazon SES: $5/mes (50k emails)
- Cloudflare: Free = $0
- Anthropic API (Claude): ~$15/mes (uso moderado)
- DeepSeek API: ~$3/mes (worker tasks)
- MercadoPago: $0 fijo (solo comision 3.49%+IVA por venta)
- Google Maps API: $0 (free $200/mes credit cubre ~40k requests)
- WhatsApp Business API: ~$5/mes (~500 conversaciones)
- **Total fijo: ~$73/mes** + comisiones de venta (variable)

---

## STEP 3: Deep Dive por Componentes

### 3.1 Arquitectura de Base de Datos (Evolucion del Schema)

```sql
-- ============================================================
-- FASE 1: Evolucion del schema actual
-- ============================================================

-- Tabla de contactos/clientes (nueva)
CREATE TABLE IF NOT EXISTS contactos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  empresa TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  opt_in BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de listas de contactos
CREATE TABLE IF NOT EXISTS listas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'manual' CHECK (tipo IN ('manual', 'dinamica')),
  filtros JSONB DEFAULT '{}', -- para listas dinamicas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lista_contactos (
  lista_id UUID REFERENCES listas(id) ON DELETE CASCADE,
  contacto_id UUID REFERENCES contactos(id) ON DELETE CASCADE,
  PRIMARY KEY (lista_id, contacto_id)
);

-- Plantillas de marketing
CREATE TABLE IF NOT EXISTS plantillas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'email' CHECK (tipo IN ('email', 'landing', 'social')),
  contenido_json JSONB NOT NULL, -- estructura GrapesJS
  contenido_html TEXT, -- HTML compilado
  thumbnail_url TEXT,
  es_publica BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campanas de marketing
CREATE TABLE IF NOT EXISTS campanas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'email' CHECK (tipo IN ('email', 'social', 'multi')),
  estado TEXT DEFAULT 'borrador' CHECK (estado IN (
    'borrador', 'programada', 'enviando', 'completada', 'pausada', 'error'
  )),
  plantilla_id UUID REFERENCES plantillas(id),
  lista_id UUID REFERENCES listas(id),
  asunto TEXT,
  contenido_html TEXT,
  variables JSONB DEFAULT '{}', -- variables de personalizacion
  programada_para TIMESTAMPTZ,
  completada_en TIMESTAMPTZ,
  stats JSONB DEFAULT '{"enviados":0,"abiertos":0,"clicks":0,"rebotes":0}',
  generada_por_ia BOOLEAN DEFAULT FALSE,
  ia_prompt TEXT, -- prompt original si fue generada por IA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de envios por campana (granular)
CREATE TABLE IF NOT EXISTS campana_envios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campana_id UUID REFERENCES campanas(id) ON DELETE CASCADE,
  contacto_id UUID REFERENCES contactos(id),
  email TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente', 'enviado', 'abierto', 'click', 'rebote', 'error'
  )),
  proveedor TEXT DEFAULT 'ses',
  message_id TEXT, -- ID del proveedor de email
  error TEXT,
  abierto_en TIMESTAMPTZ,
  click_en TIMESTAMPTZ,
  enviado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Activos (imagenes, archivos para campanas)
CREATE TABLE IF NOT EXISTS activos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'image/png', 'image/jpg', etc
  url TEXT NOT NULL,
  storage_provider TEXT DEFAULT 'nextcloud' CHECK (storage_provider IN ('nextcloud', 'supabase', 'minio')),
  tamano_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FASE ECOMMERCE: Tienda, pedidos, delivery
-- ============================================================

-- Categorias de productos
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  imagen_url TEXT,
  orden INT DEFAULT 0,
  activa BOOLEAN DEFAULT TRUE,
  parent_id UUID REFERENCES categorias(id), -- subcategorias
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos base (taza, camiseta, llavero, etc.)
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  descripcion_corta TEXT,
  categoria_id UUID REFERENCES categorias(id),
  precio DECIMAL(10,2) NOT NULL,
  precio_comparacion DECIMAL(10,2), -- precio tachado (antes $X)
  costo DECIMAL(10,2), -- costo de produccion (para calcular margen)
  moneda TEXT DEFAULT 'MXN',
  imagenes JSONB DEFAULT '[]', -- [{url, alt, orden}]
  es_personalizable BOOLEAN DEFAULT TRUE,
  opciones_personalizacion JSONB DEFAULT '{}',
  -- ejemplo: {"areas": [{"nombre":"frente","ancho":800,"alto":600}], "formatos":["png","jpg","svg"]}
  variantes JSONB DEFAULT '[]',
  -- ejemplo: [{"nombre":"Talla","opciones":["S","M","L","XL"],"precios_extra":{"XL":50}}]
  seo JSONB DEFAULT '{}', -- {title, description, keywords}
  activo BOOLEAN DEFAULT TRUE,
  destacado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventario de materiales base
CREATE TABLE IF NOT EXISTS inventario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  variante TEXT DEFAULT 'default', -- 'default', 'S', 'M', 'L', 'Rojo', etc.
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT DEFAULT 5, -- alerta cuando stock <= stock_minimo
  proveedor TEXT,
  costo_unitario DECIMAL(10,2),
  ubicacion TEXT, -- ubicacion fisica en almacen
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disenos personalizados del cliente
CREATE TABLE IF NOT EXISTS disenos_cliente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contacto_id UUID REFERENCES contactos(id),
  producto_id UUID REFERENCES productos(id),
  nombre TEXT,
  canvas_json JSONB NOT NULL, -- estructura Fabric.js
  preview_url TEXT, -- thumbnail del diseno
  archivos_originales JSONB DEFAULT '[]', -- archivos subidos por el cliente
  storage_provider TEXT DEFAULT 'nextcloud',
  es_publico BOOLEAN DEFAULT FALSE, -- para galeria de disenos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT NOT NULL UNIQUE, -- PU-2025-00001 (legible)
  contacto_id UUID REFERENCES contactos(id),
  -- datos del comprador (snapshot al momento de compra)
  comprador JSONB NOT NULL, -- {nombre, email, telefono}
  direccion_envio JSONB, -- {calle, numero, colonia, cp, ciudad, estado, pais, referencias}
  -- estado del pedido
  estado TEXT DEFAULT 'pendiente_pago' CHECK (estado IN (
    'pendiente_pago', 'pagado', 'en_produccion', 'producido',
    'en_camino', 'entregado', 'cancelado', 'reembolsado'
  )),
  -- financiero
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  costo_envio DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  moneda TEXT DEFAULT 'MXN',
  -- pago
  metodo_pago TEXT, -- 'mercadopago', 'stripe', 'transferencia', 'efectivo'
  pago_id TEXT, -- ID de la pasarela (MP preference_id, Stripe payment_intent)
  pago_status TEXT DEFAULT 'pendiente',
  pago_metadata JSONB DEFAULT '{}', -- respuesta completa de la pasarela
  -- delivery
  metodo_envio TEXT DEFAULT 'local' CHECK (metodo_envio IN (
    'local', 'repartidor_propio', 'courier', 'recoger_tienda'
  )),
  zona_envio TEXT, -- 'zona_1', 'zona_2', etc.
  delivery_id UUID, -- ref a tabla deliveries
  tracking_url TEXT,
  -- metadata
  notas_cliente TEXT,
  notas_admin TEXT,
  cupon_codigo TEXT,
  origen TEXT DEFAULT 'tienda', -- 'tienda', 'formulario', 'whatsapp', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items del pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  diseno_id UUID REFERENCES disenos_cliente(id),
  nombre_producto TEXT NOT NULL, -- snapshot del nombre
  variante TEXT, -- 'M', 'Rojo', etc.
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  personalizacion JSONB DEFAULT '{}', -- datos de personalizacion del item
  preview_url TEXT, -- preview del producto personalizado
  estado_produccion TEXT DEFAULT 'pendiente' CHECK (estado_produccion IN (
    'pendiente', 'en_proceso', 'listo', 'error'
  ))
);

-- Cupones de descuento
CREATE TABLE IF NOT EXISTS cupones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT DEFAULT 'porcentaje' CHECK (tipo IN ('porcentaje', 'monto_fijo', 'envio_gratis')),
  valor DECIMAL(10,2) NOT NULL, -- 15 = 15% o $15 segun tipo
  minimo_compra DECIMAL(10,2) DEFAULT 0,
  max_usos INT, -- NULL = ilimitado
  usos_actuales INT DEFAULT 0,
  productos_aplicables JSONB DEFAULT '[]', -- [] = todos
  valido_desde TIMESTAMPTZ DEFAULT NOW(),
  valido_hasta TIMESTAMPTZ,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zonas de envio y tarifas
CREATE TABLE IF NOT EXISTS zonas_envio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL, -- 'Centro', 'Norte', 'Foranea', etc.
  descripcion TEXT,
  tipo TEXT DEFAULT 'local' CHECK (tipo IN ('local', 'regional', 'nacional')),
  codigos_postales JSONB DEFAULT '[]', -- ["06000","06010"...] o rangos ["06000-06999"]
  precio DECIMAL(10,2) NOT NULL,
  precio_kg_extra DECIMAL(10,2) DEFAULT 0, -- costo adicional por kg
  tiempo_estimado TEXT, -- '1-2 dias', 'mismo dia'
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries (entregas)
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id),
  repartidor_id UUID, -- ref a tabla repartidores
  -- estado
  estado TEXT DEFAULT 'asignado' CHECK (estado IN (
    'pendiente', 'asignado', 'recogido', 'en_camino', 'entregado',
    'fallido', 'devuelto'
  )),
  -- direcciones
  origen JSONB, -- {lat, lng, direccion} (ubicacion de PrintUp)
  destino JSONB, -- {lat, lng, direccion} (direccion del cliente)
  distancia_km DECIMAL(6,2),
  -- tiempos
  estimado_entrega TIMESTAMPTZ,
  recogido_en TIMESTAMPTZ,
  entregado_en TIMESTAMPTZ,
  -- evidencia
  foto_entrega_url TEXT,
  firma_url TEXT,
  notas TEXT,
  -- courier externo (si aplica)
  courier_nombre TEXT, -- '99Minutos', 'Estafeta', etc.
  courier_tracking TEXT,
  courier_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repartidores (propios)
CREATE TABLE IF NOT EXISTS repartidores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT, -- numero con codigo pais
  vehiculo TEXT, -- 'moto', 'bicicleta', 'auto'
  zona_cobertura JSONB DEFAULT '[]', -- zonas que cubre
  disponible BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 5.00,
  entregas_totales INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de estados del pedido (audit trail)
CREATE TABLE IF NOT EXISTS pedido_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  nota TEXT,
  actor TEXT DEFAULT 'sistema', -- 'sistema', 'admin', 'cliente', 'repartidor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices adicionales
CREATE INDEX idx_contactos_email ON contactos(email);
CREATE INDEX idx_contactos_tags ON contactos USING GIN(tags);
CREATE INDEX idx_campanas_estado ON campanas(estado);
CREATE INDEX idx_campana_envios_campana ON campana_envios(campana_id);
CREATE INDEX idx_campana_envios_estado ON campana_envios(estado);
CREATE INDEX idx_plantillas_tipo ON plantillas(tipo);
CREATE INDEX idx_productos_slug ON productos(slug);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo) WHERE activo = TRUE;
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_contacto ON pedidos(contacto_id);
CREATE INDEX idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX idx_deliveries_estado ON deliveries(estado);
CREATE INDEX idx_deliveries_repartidor ON deliveries(repartidor_id);
CREATE INDEX idx_inventario_stock ON inventario(stock) WHERE stock <= 5;
CREATE INDEX idx_categorias_slug ON categorias(slug);
```

### 3.2 Arquitectura de Microservicios / Modulos

En lugar de microservicios separados (over-engineering para PYME), usamos **modulos dentro de Next.js** con separacion clara:

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                    # [EXISTENTE] Login, logout, me
│   │   ├── formularios/             # [EXISTENTE] CRUD formularios
│   │   ├── config/                  # [EXISTENTE] Config sistema
│   │   ├── stats/                   # [EXISTENTE] Metricas dashboard
│   │   ├── upload/                  # [EXISTENTE] Upload archivos
│   │   ├── contactos/               # [NUEVO] CRUD contactos
│   │   │   ├── route.ts             # GET (list), POST (create)
│   │   │   ├── [id]/route.ts        # GET, PUT, DELETE
│   │   │   └── import/route.ts      # POST (bulk import CSV)
│   │   ├── listas/                  # [NUEVO] Listas de contactos
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── plantillas/              # [NUEVO] Template CRUD
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── campanas/                # [NUEVO] Campanas de marketing
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   ├── [id]/enviar/route.ts # POST trigger envio
│   │   │   └── [id]/stats/route.ts  # GET estadisticas
│   │   ├── ia/                      # [NUEVO] Endpoints IA
│   │   │   ├── generar-campana/route.ts
│   │   │   ├── generar-copy/route.ts
│   │   │   └── sugerir-asunto/route.ts
│   │   ├── webhooks/                # [NUEVO] Webhooks entrantes
│   │   │   ├── email-events/route.ts # SES/Resend bounce/open tracking
│   │   │   ├── mercadopago/route.ts  # MP payment notifications (IPN)
│   │   │   ├── stripe/route.ts       # Stripe webhooks
│   │   │   └── n8n/route.ts          # Callbacks de n8n
│   │   │
│   │   ├── tienda/                  # [NUEVO] Ecommerce API
│   │   │   ├── productos/route.ts   # GET catalogo (public, cached)
│   │   │   ├── productos/[slug]/route.ts # GET detalle producto
│   │   │   ├── carrito/route.ts     # GET, POST, PUT, DELETE (session-based)
│   │   │   ├── checkout/route.ts    # POST crear pedido + pago
│   │   │   ├── cupones/validar/route.ts # POST validar cupon
│   │   │   └── envio/calcular/route.ts  # POST calcular costo envio
│   │   │
│   │   ├── pedidos/                 # [NUEVO] Gestion pedidos API
│   │   │   ├── route.ts             # GET (admin list), POST (crear manual)
│   │   │   ├── [id]/route.ts        # GET, PUT (actualizar estado)
│   │   │   └── [id]/tracking/route.ts # GET tracking publico
│   │   │
│   │   ├── delivery/                # [NUEVO] Delivery API
│   │   │   ├── route.ts             # GET list, POST asignar
│   │   │   ├── [id]/route.ts        # PUT actualizar estado
│   │   │   ├── zonas/route.ts       # CRUD zonas de envio
│   │   │   └── repartidores/route.ts # CRUD repartidores
│   │   │
│   │   ├── inventario/              # [NUEVO] Inventario API
│   │   │   ├── route.ts             # GET stock, PUT actualizar
│   │   │   └── alertas/route.ts     # GET items con stock bajo
│   │   │
│   │   └── personalizador/          # [NUEVO] Personalizacion API
│   │       ├── disenos/route.ts     # CRUD disenos del cliente
│   │       └── preview/route.ts     # POST generar preview (Sharp)
│   │
│   ├── admin/                       # [EXISTENTE + EXPANDIR]
│   │   ├── page.tsx                 # Dashboard (unificado: forms + ecommerce)
│   │   ├── formularios/             # Gestion formularios
│   │   ├── historial/               # Historial
│   │   ├── configuracion/           # Config
│   │   ├── contactos/               # [NUEVO] Gestion contactos
│   │   │   └── page.tsx
│   │   ├── plantillas/              # [NUEVO] Editor de plantillas
│   │   │   ├── page.tsx             # Lista plantillas
│   │   │   └── [id]/page.tsx        # Editor DnD (GrapesJS)
│   │   ├── campanas/                # [NUEVO] Gestion campanas
│   │   │   ├── page.tsx             # Lista campanas
│   │   │   ├── nueva/page.tsx       # Wizard creacion
│   │   │   └── [id]/page.tsx        # Detalle + stats
│   │   ├── ia/                      # [NUEVO] Panel agente IA
│   │   │   └── page.tsx
│   │   ├── productos/               # [NUEVO] CRUD productos
│   │   │   ├── page.tsx             # Lista con filtros
│   │   │   ├── nuevo/page.tsx       # Crear producto
│   │   │   └── [id]/page.tsx        # Editar producto
│   │   ├── pedidos/                 # [NUEVO] Gestion pedidos
│   │   │   ├── page.tsx             # Lista pedidos (Kanban por estado)
│   │   │   └── [id]/page.tsx        # Detalle pedido + timeline
│   │   ├── inventario/              # [NUEVO] Control de stock
│   │   │   └── page.tsx             # Tabla stock + alertas
│   │   └── delivery/                # [NUEVO] Gestion delivery
│   │       ├── page.tsx             # Panel de entregas activas
│   │       ├── repartidores/page.tsx # CRUD repartidores
│   │       └── zonas/page.tsx       # Configurar zonas + tarifas
│   │
│   ├── tienda/                      # [NUEVO] Storefront publico
│   │   ├── layout.tsx               # Layout tienda (nav, cart icon, footer)
│   │   ├── page.tsx                 # Home tienda (featured, categorias)
│   │   ├── [categoria]/page.tsx     # Listado por categoria
│   │   ├── producto/[slug]/page.tsx # Detalle producto + personalizador
│   │   ├── carrito/page.tsx         # Carrito de compras
│   │   ├── checkout/page.tsx        # Checkout (datos + pago)
│   │   ├── pedido/[id]/page.tsx     # Confirmacion + tracking
│   │   └── buscar/page.tsx          # Busqueda de productos
│   │
│   └── page.tsx                     # [EXISTENTE] Formulario publico
│
├── components/
│   ├── ui/                          # [EXISTENTE] shadcn components
│   ├── admin/                       # [NUEVO] Componentes admin
│   │   ├── contact-table.tsx
│   │   ├── campaign-wizard.tsx
│   │   ├── order-kanban.tsx         # Kanban de pedidos por estado
│   │   ├── inventory-table.tsx
│   │   ├── delivery-map.tsx         # Mapa de entregas activas (Leaflet)
│   │   └── stats-cards.tsx
│   ├── editor/                      # [NUEVO] Template editor
│   │   ├── template-editor.tsx      # Wrapper GrapesJS
│   │   ├── blocks/                  # Bloques custom para DnD
│   │   └── panels/                  # Paneles del editor
│   └── tienda/                      # [NUEVO] Componentes storefront
│       ├── product-card.tsx         # Card de producto
│       ├── product-grid.tsx         # Grid responsive de productos
│       ├── product-customizer.tsx   # Wrapper Fabric.js (personalizador)
│       ├── cart-drawer.tsx          # Carrito lateral (drawer)
│       ├── cart-item.tsx
│       ├── checkout-form.tsx        # Formulario de checkout
│       ├── payment-button.tsx       # Boton MP / Stripe
│       ├── shipping-calculator.tsx  # Calculadora de envio
│       ├── order-tracker.tsx        # Timeline de estado del pedido
│       └── search-bar.tsx           # Busqueda de productos
│
├── lib/
│   ├── supabase.ts                  # [EXISTENTE]
│   ├── auth.ts                      # [EXISTENTE]
│   ├── nextcloud.ts                 # [EXISTENTE]
│   ├── email/                       # [NUEVO] Abstraccion email
│   │   ├── provider.ts             # Interface comun
│   │   ├── resend.ts               # Adapter Resend (transaccional)
│   │   └── ses.ts                  # Adapter SES (masivo)
│   ├── ai/                          # [NUEVO] Clientes IA
│   │   ├── orchestrator.ts          # Cliente Claude (decision maker)
│   │   └── worker.ts               # Cliente DeepSeek (ejecucion)
│   ├── queue/                       # [NUEVO] Cola de tareas
│   │   └── email-queue.ts          # Queue para envio masivo
│   ├── storage/                     # [NUEVO] Abstraccion storage
│   │   ├── provider.ts
│   │   ├── nextcloud.ts
│   │   └── supabase.ts
│   ├── payments/                    # [NUEVO] Abstraccion pagos
│   │   ├── provider.ts             # Interface: createPayment, verifyPayment, refund
│   │   ├── mercadopago.ts          # Adapter MercadoPago (SDK oficial)
│   │   └── stripe.ts               # Adapter Stripe (fallback)
│   ├── delivery/                    # [NUEVO] Logistica
│   │   ├── provider.ts             # Interface: calculateShipping, assignDriver, track
│   │   ├── zonas.ts                # Calculo por zonas fijas
│   │   ├── google-maps.ts          # Calculo por distancia (futuro)
│   │   ├── whatsapp.ts             # Notificar repartidores via WA
│   │   └── courier/                # Adapters courier (futuro)
│   │       ├── provider.ts
│   │       ├── skydropx.ts
│   │       └── envia.ts
│   ├── cart/                        # [NUEVO] Carrito
│   │   └── cart.ts                 # Logica de carrito (Redis sessions)
│   └── personalizador/             # [NUEVO] Personalizacion
│       ├── canvas-config.ts        # Config Fabric.js por producto
│       └── preview-generator.ts    # Generar preview con Sharp
│
└── middleware.ts                     # [EXISTENTE] + rate limiting
```

### 3.3 Template Builder (GrapesJS)

**Por que GrapesJS:**
- Open-source (BSD license), 20k+ GitHub stars
- Drag & drop visual completo
- Exporta HTML limpio
- Extensible con bloques custom
- Peso: ~300KB gzipped (carga lazy en admin)

**Flujo:**
1. Admin abre `/admin/plantillas/nueva`
2. GrapesJS carga con bloques predefinidos para marketing (header, hero, CTA, footer, product grid)
3. Admin arrastra, personaliza colores/textos/imagenes
4. Al guardar: `contenido_json` (estructura GrapesJS) + `contenido_html` (compilado) se persisten en Supabase
5. Al crear campana, selecciona plantilla -> se inyectan variables ({{nombre}}, {{empresa}})
6. Preview con datos reales antes de enviar

**Bloques Custom para PrintUp:**
- Bloque "Producto": imagen + nombre + precio + CTA
- Bloque "Galeria": grid de productos
- Bloque "Testimonio": quote + avatar
- Bloque "Cupon": codigo de descuento destacado
- Bloque "Social": links a redes sociales

### 3.4 Sistema de Envio Masivo de Emails

```
[Admin crea campana]
        |
   [Selecciona lista + plantilla]
        |
   [Preview con merge tags]
        |
   [Click "Enviar" o "Programar"]
        |
   [API /campanas/[id]/enviar]
        |
   [Email Queue (BullMQ + Upstash Redis)]
        |
   +----+----+
   |         |
[Batch 1] [Batch 2] ... [Batch N]
   |         |              |
   [Amazon SES API]  (rate: 14 emails/seg free tier)
        |
   [SES Webhooks -> /webhooks/email-events]
        |
   [Actualizar campana_envios: abierto, click, rebote]
        |
   [Stats en tiempo real via Supabase Realtime]
```

**Rate Limiting de SES Free Tier:**
- 200 emails/dia en sandbox
- Solicitar produccion: 50,000/dia (gratis si estas en EC2, o $0.10/1000)
- Estrategia: batch de 10 emails cada 1 segundo
- Retry automatico con backoff exponencial para rebotes temporales

**Tracking:**
- Open tracking: pixel 1x1 en HTML (SES lo inyecta automaticamente)
- Click tracking: SES reescribe URLs automaticamente
- Bounce handling: webhook de SES actualiza estado en `campana_envios`

### 3.5 Agente IA Orquestador (n8n + Claude + DeepSeek)

**Arquitectura del flujo en n8n:**

```
[Webhook: POST /api/webhooks/n8n]
  Input: { prompt: "Crea campana Dia de la Madre para tazones" }
        |
  [Nodo Claude API (Orchestrator)]
  - Analiza el prompt
  - Decide plan de accion:
    1. Generar copy (DeepSeek)
    2. Generar diseño (Canva API o template)
    3. Preparar campana (API interna)
        |
  [Nodo DeepSeek API (Worker)]
  - Genera 3 variantes de copy email
  - Genera 3 variantes de asunto
  - Genera textos para redes sociales
  - Output: JSON estructurado
        |
  [Nodo Canva Connect API] (corto plazo)
  OR
  [Nodo Template Engine interno] (largo plazo)
  - Inyecta textos en plantilla
  - Genera imagenes/HTML
        |
  [Nodo HTTP: POST /api/campanas]
  - Crea campana en borrador
  - Asocia plantilla + lista + contenido
        |
  [Nodo Notificacion]
  - Notifica al admin via Sonner/email
  - "Campana lista para revision"
```

**Costos IA estimados por campana:**
- Claude (orquestacion): ~500 tokens input + 200 output = ~$0.005
- DeepSeek (generacion): ~2000 tokens input + 3000 output = ~$0.001
- **Total por campana: ~$0.006** (~170 campanas por dolar)

### 3.6 Integracion Canva (Corto Plazo) -> Custom (Largo Plazo)

**Corto plazo (Fase 2-3): Canva Connect API**
- Crear plantillas base en Canva
- Usar Canva Autofill API para inyectar texto/imagenes dinamicamente
- Costo: Canva Pro $13/mes (1 usuario) incluye API basica
- Limitacion: rate limits, dependencia externa

**Largo plazo (Fase 4+): Motor de Plantillas Propio**
- GrapesJS ya genera HTML
- Agregar generacion de imagenes con Sharp (Node.js) para social media
- Puppeteer/Playwright para screenshot de HTML -> imagen
- Alternativa IA: integrar modelo de generacion de imagenes (Stable Diffusion self-hosted o DALL-E API)

**Interfaz comun (Adapter Pattern):**
```typescript
// src/lib/design/provider.ts
interface DesignProvider {
  fillTemplate(templateId: string, variables: Record<string, string>): Promise<DesignResult>;
  generateImage(html: string, options: ImageOptions): Promise<Buffer>;
}

// Facil de swappear:
// new CanvaProvider() -> new InternalProvider()
```

### 3.7 Ecommerce: Tienda Online de Productos Personalizados

**Flujo completo de compra:**

```
[Cliente visita /tienda]
        |
   [Navega catalogo / busca producto]
        |
   [Selecciona producto (ej: "Taza personalizada")]
        |
   [Personalizador Fabric.js]
   +-- Sube su imagen/logo (drag & drop)
   +-- O selecciona plantilla prediseada
   +-- Ajusta posicion, tamano, texto
   +-- Preview en tiempo real (mockup 3D CSS)
        |
   [Agrega al carrito (Redis session)]
   +-- Puede seguir comprando
   +-- Cart persiste 7 dias (TTL en Redis)
        |
   [Checkout /tienda/checkout]
   +-- Datos personales (auto-fill si es contacto existente)
   +-- Direccion de envio
   +-- Calcula costo de envio (por zona/CP)
   +-- Aplica cupon (opcional)
   +-- Selecciona metodo de pago
        |
   [Pago via MercadoPago / Stripe]
   +-- Redirect a MP Checkout Pro (hosted)
   +-- O Stripe Elements (embedded)
   +-- NUNCA tocamos datos de tarjeta (PCI compliance via pasarela)
        |
   [Webhook confirma pago]
   +-- Estado: pendiente_pago -> pagado
   +-- Descuenta inventario
   +-- Envia email confirmacion (Resend)
   +-- Notifica admin (Sonner + email)
   +-- Crea registro en pedido_historial
        |
   [Admin ve pedido en /admin/pedidos]
   +-- Kanban: Pagado -> En Produccion -> Producido -> En Camino -> Entregado
   +-- Descarga diseno del cliente para produccion
   +-- Marca items como producidos
        |
   [Asigna delivery]
   +-- Selecciona repartidor propio o courier
   +-- Notifica repartidor via WhatsApp
   +-- Cliente recibe link de tracking
        |
   [Entrega confirmada]
   +-- Repartidor marca como entregado (foto evidencia)
   +-- Email de "Tu pedido fue entregado"
   +-- Solicita review/calificacion
```

**Personalizador de Productos (Fabric.js):**

Por que Fabric.js y no Canva SDK embebido:
- Open-source (MIT), 28k+ stars, maduro y estable
- Funciona 100% en el browser (no depende de API externa)
- Soporta: drag & drop imagenes, texto editable, formas, filtros
- Exporta como JSON (para editar despues) y como PNG/SVG (para produccion)
- Peso: ~300KB (carga lazy solo en pagina de producto)
- Costo: $0

```typescript
// src/lib/personalizador/canvas-config.ts
interface ProductCanvasConfig {
  areas: {
    nombre: string;       // "frente", "atras", "manga"
    ancho: number;        // px del area de diseno
    alto: number;         // px del area de diseno
    clipPath?: string;    // forma del area (circulo para tazas, rect para camisetas)
    mockupPosition: {     // donde colocar el diseno en el mockup
      x: number; y: number; scale: number; rotation: number;
    };
  }[];
  mockupImage: string;    // URL de la imagen mockup del producto
  maxFileSize: number;    // MB maximo por archivo subido
  allowedFormats: string[];
}

// Ejemplo para taza:
const tazaConfig: ProductCanvasConfig = {
  areas: [{
    nombre: "frente",
    ancho: 800,
    alto: 400,
    clipPath: "rect",
    mockupPosition: { x: 120, y: 80, scale: 0.45, rotation: 0 }
  }],
  mockupImage: "/mockups/taza-blanca.png",
  maxFileSize: 10,
  allowedFormats: ["png", "jpg", "svg"]
};
```

**Pasarela de Pagos - Comparativa LATAM:**

| Pasarela | Comision | Liquidacion | Metodos | Ideal para |
|---|---|---|---|---|
| MercadoPago | 3.49% + IVA | 14 dias (o instant $) | Tarjeta, OXXO, SPEI, wallet | LATAM, mayor adopcion |
| Stripe | 3.6% + $3 MXN | 2 dias | Tarjeta, OXXO | Internacional, developers |
| PayPal | 3.95% + $4 MXN | 3-5 dias | PayPal, tarjeta | Internacional |
| Conekta | 2.9% + $2.50 MXN | 2 dias | Tarjeta, OXXO, SPEI | Mexico enfocado |

**Eleccion: MercadoPago primario** porque:
- Mayor adopcion en LATAM (wallet + OXXO + tarjetas)
- Checkout Pro (hosted) = 0 esfuerzo PCI compliance
- Split payments (futuro: marketplace)
- MP Point para cobros presenciales en tienda fisica
- SDK oficial para Node.js bien mantenido

**Adapter Pattern para facil cambio:**
```typescript
// src/lib/payments/provider.ts
interface PaymentProvider {
  createPayment(order: Order): Promise<{ redirectUrl: string; paymentId: string }>;
  verifyPayment(paymentId: string): Promise<PaymentStatus>;
  refund(paymentId: string, amount?: number): Promise<RefundResult>;
}
// Implementaciones: MercadoPagoProvider, StripeProvider
```

### 3.8 Delivery & Logistica - Analisis de Menores Costos

**Comparativa de opciones de delivery para PYME:**

| Opcion | Costo por envio | Setup | Cobertura | Mejor para |
|---|---|---|---|---|
| **Repartidor propio (moto)** | $30-80 MXN (gasolina) | $0 | Local (< 15km) | Inicio, zona local |
| **Repartidor propio (bici)** | $0-20 MXN | $0 | Ultra-local (< 5km) | Entregas rapidas cercanas |
| **Uber Flash / DiDi Envios** | $50-150 MXN | $0 | Urbano | Bajo demanda, sin repartidor fijo |
| **99Minutos** | $70-120 MXN | API gratis | Mexico principales | Same-day, volumen medio |
| **Skydropx** (multi-courier) | $80-200 MXN | API gratis | Nacional MX | Compara DHL/Estafeta/Fedex |
| **Envia.com** (multi-courier) | $60-180 MXN | API gratis | LATAM | Similar a Skydropx |
| **Estafeta directo** | $120-250 MXN | Contrato | Nacional MX | Volumen alto, contrato |
| **Recoger en tienda** | $0 | $0 | N/A | Siempre ofrecerlo |

**Estrategia recomendada por fase:**

**Fase 1 (0-100 pedidos/mes): Costo ~$0 fijo**
- Recoger en tienda (gratis)
- Repartidor propio para zona local (pagar gasolina ~$50/viaje)
- Notificacion al repartidor via WhatsApp (gratis, 1000 conversaciones/mes free tier)
- Calculo de envio: tabla de zonas fijas en Supabase

**Fase 2 (100-500 pedidos/mes): Agregar couriers API**
- Integrar Skydropx o Envia.com (ambos tienen API gratis, pagas por guia)
- Agregar Uber Flash / DiDi para entregas same-day
- Google Maps API para calculo preciso de distancia ($200/mes free credit = ~40k requests)

**Fase 3 (500+ pedidos/mes): Optimizacion**
- Negociar tarifas corporativas con Estafeta/DHL (descuentos por volumen)
- Ruta optimizada para repartidores propios (Google Routes API)
- App simple PWA para repartidores (marcar entregado + foto)

**Flujo tecnico de delivery:**

```
[Pedido marcado como "producido"]
        |
   [Admin selecciona metodo de envio]
        |
   +----+----+----+----+
   |         |         |
[Propio]  [Courier] [Recoger]
   |         |         |
   |    [API Skydropx/ |
   |     Envia.com]    |
   |    - Genera guia   |
   |    - Obtiene label  |
   |    - Tracking auto  |
   |         |         |
[WhatsApp   |    [Email:
 al         |     "Tu pedido
 repartidor]|      esta listo
   |         |      para recoger"]
   |         |         |
[Repartidor recoge paquete]
   |         |
[Actualiza estado: "en_camino"]
   |         |
[Cliente recibe notificacion + link tracking]
   |         |
[Repartidor marca "entregado" + foto]
OR
[Webhook courier: delivered]
   |
[Email: "Tu pedido fue entregado"]
[Solicitar review]
```

**WhatsApp Business API para repartidores (menor costo):**

Opcion 1 - WhatsApp Business API oficial (via Meta):
- 1,000 conversaciones/mes GRATIS (service conversations)
- Despues: ~$0.05 USD por conversacion
- Requiere: Meta Business verification + proveedor BSP

Opcion 2 - WhatsApp via n8n (no-oficial pero funcional):
- Usar nodo de WhatsApp en n8n (gratis, self-hosted)
- Limitacion: no es API oficial, puede ser bloqueado
- Util para MVP/testing

Opcion 3 - Telegram Bot (gratis 100%):
- API gratis sin limites
- Crear bot @PrintUpDeliveryBot
- Repartidores reciben notificaciones
- Pueden marcar entregas desde Telegram
- **Recomendado como complemento/fallback**

**Implementacion de zonas de envio (sistema simple y efectivo):**

```
Zona 1: Centro (CP 06000-06999) = $50 MXN, mismo dia
Zona 2: Cercana (CP 07000-09999) = $80 MXN, 1 dia
Zona 3: Metropolitana (Estado de Mexico) = $120 MXN, 1-2 dias
Zona 4: Nacional (resto) = via courier, precio dinamico
Zona 5: Recoger en tienda = $0
```

El admin configura las zonas desde `/admin/delivery/zonas` con una UI simple:
- Nombre de zona
- Rangos de codigos postales (o seleccion en mapa)
- Precio fijo
- Tiempo estimado

Al hacer checkout, el cliente ingresa su CP -> match con zona -> precio.

### 3.9 Infraestructura & Seguridad

```
[Internet] -> [Cloudflare] -> [Origin Server]

Cloudflare (FREE tier):
+-- DNS management
+-- DDoS protection (automatic)
+-- WAF rules (5 custom rules free)
    +-- Rate limit: 100 req/10s por IP en /api/*
    +-- Block: known bad bots
    +-- Challenge: suspicious IPs en /admin/*
+-- SSL/TLS (Full Strict)
+-- Static asset caching (CDN global)
+-- Page Rules:
    +-- /api/* -> no cache
    +-- /_next/static/* -> cache 30 dias
    +-- /images/* -> cache 7 dias

Server Local (Nextcloud + n8n):
+-- Cloudflare Tunnel (zero-trust, no abrir puertos)
    +-- Expone Nextcloud y n8n sin IP publica
    +-- Auth adicional en Cloudflare Access (free 50 users)
+-- Firewall local: solo permite Cloudflare IPs
+-- Backups automaticos:
    +-- Nextcloud -> Minio (server local) diario
    +-- Supabase -> pg_dump semanal (cron en n8n)

Seguridad en la App:
+-- CORS: solo dominio propio
+-- CSP headers estrictos
+-- Rate limiting en middleware (token bucket)
+-- Input sanitization (zod validation)
+-- RLS en Supabase (row-level security)
+-- JWT rotation (access 15min + refresh 7d)
+-- Audit log de acciones admin
```

### 3.10 Storage & Crecimiento

**Estrategia de tiering:**

| Tier | Storage | Uso | Costo |
|---|---|---|---|
| Hot | Supabase Storage | Archivos recientes (<30 dias), thumbnails | Free 1GB, $0.021/GB extra |
| Warm | Nextcloud (server local) | Archivos de formularios, plantillas | $0 (tu hardware) |
| Cold | Minio (server local) | Backups, archivos >6 meses | $0 (tu hardware) |

**Politica de lifecycle:**
1. Upload -> Supabase Storage (acceso rapido via CDN)
2. Despues de 30 dias -> mover a Nextcloud (cron job en n8n)
3. Despues de 6 meses -> comprimir y mover a Minio
4. Nextcloud mantiene indice de busqueda

**Proyeccion de crecimiento:**
- Mes 1-6: ~5GB (100 formularios/mes, ~50MB cada uno)
- Mes 6-12: ~25GB (500 formularios/mes + campanas)
- Mes 12-24: ~100GB (crecimiento con marketing)
- Mes 24+: ~500GB-1TB (campanas masivas + historico)

Tu server local con 2TB de disco cubre tranquilamente los primeros 3 anos.

---

## STEP 4: Wrap Up - Bottlenecks, Mejoras & Escala

### Bottlenecks Identificados

1. **Email masivo**: SES free tier limitado a 200/dia en sandbox. Solucion: solicitar produccion (gratis).
2. **Next.js serverless cold starts**: Si usas Vercel free tier, los cold starts pueden ser ~1-3s. Solucion: VPS con `next start` persistente cuando crezca.
3. **GrapesJS + Fabric.js bundle size**: ~600KB combinados puede impactar carga. Solucion: dynamic import con `next/dynamic`, cargar solo en paginas que lo usan.
4. **n8n single point of failure**: Si tu server local cae, los flujos IA y delivery notifications se detienen. Solucion: health check + notificacion + fallback directo a API.
5. **Supabase free tier limits**: 500MB DB y 2GB bandwidth/mes. Monitor y upgrade a Pro ($25/mes) cuando se acerque.
6. **Checkout concurrente**: Si 2 clientes compran el ultimo item al mismo tiempo. Solucion: reserva de stock con TTL en Redis (15 min) + transaccion SQL con `FOR UPDATE`.
7. **Imagenes de productos pesadas**: Muchas fotos degradan performance. Solucion: next/image auto-optimiza + Cloudflare Polish + WebP.
8. **WhatsApp Business API limits**: 1000 conversaciones gratis/mes. Solucion: Telegram bot como fallback gratuito.
9. **MercadoPago webhook reliability**: MP a veces reintenta o falla. Solucion: idempotency key en webhook handler + reconciliacion periodica via API.

### Si Escalamos 10x (de 500 a 5000 usuarios activos, 5000 pedidos/mes)

| Componente | Cambio |
|---|---|
| Hosting | Vercel -> VPS con Docker Compose (Next.js + Redis + workers) |
| DB | Supabase Pro -> Supabase Team o self-hosted PostgreSQL |
| Email | SES produccion + dedicated IP ($24.95/mes) para deliverability |
| Pagos | MercadoPago + Stripe + Conekta (ofrecer multiples opciones) |
| Delivery | Contratos corporativos con couriers + rutas optimizadas |
| Storage | Agregar Cloudflare R2 ($0.015/GB, sin egress fees) como tier adicional |
| Cache | Upstash -> Redis self-hosted en VPS |
| IA | Agregar cache de respuestas IA frecuentes |
| CDN | Cloudflare Pro ($20/mes) para analytics + WAF avanzado |
| Monitoreo | Agregar Grafana + Prometheus self-hosted |
| Catalogo | Full SSG con revalidacion on-demand + search con Meilisearch |
| Produccion | Integrar cola de produccion con prioridades y deadlines |

### Mejoras Futuras (Backlog)

- [ ] A/B testing de asuntos de email
- [ ] Segmentacion avanzada de contactos (RFM analysis)
- [ ] Landing page builder (extension de GrapesJS)
- [ ] WhatsApp Commerce (catalogo + compra via WA)
- [ ] Formularios multi-step con logica condicional
- [ ] White-label: ofrecer la plataforma a otras PYMEs
- [ ] Analytics propios (Plausible self-hosted)
- [ ] Multi-tenancy para escalar como SaaS
- [ ] Reviews y calificaciones de productos
- [ ] Wishlist / lista de deseos
- [ ] Programa de lealtad / puntos
- [ ] Galeria de disenos publicos (comunidad)
- [ ] Print-on-demand marketplace (otros diseadores venden en tu tienda)
- [ ] App PWA para clientes (notificaciones push de ofertas y tracking)
- [ ] Integracion contable (facturas CFDI via Facturapi, $0.40 MXN/factura)
- [ ] Dashboard de rentabilidad por producto (costo vs precio vs envio)

---

## ROADMAP POR FASES

### FASE 0: Fundaciones & Seguridad (Semanas 1-2)
> Prioridad: CRITICA. Sin esto, todo lo demas es inseguro.

- [ ] Configurar Cloudflare DNS + WAF (free tier)
  - Migrar DNS del dominio a Cloudflare
  - Activar "Under Attack Mode" rules
  - Configurar WAF rules basicas (rate limiting, bot protection)
  - SSL Full Strict
- [ ] Configurar Cloudflare Tunnel para server local
  - Nextcloud accesible sin abrir puertos
  - n8n accesible via tunnel con Cloudflare Access
- [ ] Hardening de middleware existente
  - Agregar rate limiting (token bucket) en middleware.ts
  - Agregar CSP, CORS, security headers
  - Validacion con Zod en todos los API routes
- [ ] Setup Supabase RLS policies correctas
  - Revisar las policies actuales (actualmente muy permisivas)
  - Separar service_role de anon key correctamente
- [ ] Backups automaticos
  - Cron en n8n: backup Supabase (pg_dump) semanal
  - Cron local: snapshot Nextcloud diario

### FASE 1: Evolucion del Core (Semanas 3-6)
> Extender lo que ya funciona sin romperlo.

- [ ] Migrar schema de DB (agregar tablas de contactos, listas, activos)
- [ ] Modulo de Contactos
  - CRUD API completo
  - UI admin: tabla con busqueda, filtros, tags
  - Import/export CSV
  - Auto-crear contacto cuando llega un formulario
- [ ] Modulo de Listas
  - Crear listas manuales y dinamicas (por tags)
  - Asociar contactos a listas
- [ ] Mejorar dashboard admin
  - Graficos de crecimiento de contactos
  - Metricas de formularios por periodo
- [ ] Abstraccion de Storage (provider pattern)
  - Refactor nextcloud.ts a lib/storage/
  - Agregar Supabase Storage adapter
- [ ] Abstraccion de Email (provider pattern)
  - Refactor a lib/email/
  - Mantener Resend como default

### FASE 2: Template Builder & Campanas Basicas (Semanas 7-12)
> El corazon de la expansion: crear y enviar campanas.

- [ ] Integrar GrapesJS como editor de plantillas
  - Pagina /admin/plantillas con lista y editor
  - Bloques custom para PrintUp (producto, galeria, CTA, cupon)
  - Guardar como JSON + HTML compilado
  - Preview responsive (mobile/desktop)
- [ ] Modulo de Campanas (email)
  - Wizard: seleccionar lista -> plantilla -> personalizar -> preview -> enviar
  - Merge tags: {{nombre}}, {{email}}, {{empresa}}
  - Programar envio futuro
- [ ] Integrar Amazon SES
  - Setup cuenta AWS + salir de sandbox
  - Implementar adapter SES en lib/email/ses.ts
  - Verificar dominio (DKIM, SPF, DMARC)
- [ ] Cola de envio masivo
  - BullMQ + Upstash Redis
  - Batch processing con rate limiting
  - Retry con backoff exponencial
- [ ] Tracking basico
  - Webhook handler para eventos SES
  - Actualizar stats de campana en tiempo real
  - Pagina de stats por campana

### FASE 3: Integracion IA & Canva (Semanas 13-18)
> Automatizacion inteligente + diseno profesional.

- [ ] Setup n8n en server local
  - Docker Compose con n8n + PostgreSQL (para n8n)
  - Exponer via Cloudflare Tunnel
  - Crear credenciales para APIs
- [ ] Integrar Anthropic API (Claude)
  - Endpoint /api/ia/generar-campana
  - Claude como orquestador: analiza prompt, genera plan
  - UI: chat/prompt en /admin/ia
- [ ] Integrar DeepSeek API
  - Worker para generacion masiva de copy
  - Generar variantes de asunto, cuerpo, CTA
- [ ] Integrar Canva Connect API
  - Crear plantillas base en Canva
  - Autofill API para inyectar contenido dinamico
  - Adapter pattern para facil reemplazo futuro
- [ ] Flujo completo en n8n
  - Webhook trigger -> Claude orquesta -> DeepSeek genera -> Canva diseña -> campana en borrador
  - Notificacion al admin para revision
- [ ] Sugerencias IA en UI
  - Sugerir asuntos de email (3 variantes)
  - Sugerir mejoras al copy
  - Sugerir mejor hora de envio

### FASE 4: Ecommerce - Tienda Online (Semanas 19-28)
> El salto de "servicio de formularios" a "plataforma de ventas".

- [ ] Schema de DB: productos, categorias, inventario, pedidos, pedido_items, cupones
- [ ] Modulo de Productos (Admin)
  - CRUD completo con imagenes multiples
  - Editor de variantes (talla, color, etc.)
  - Gestion de opciones de personalizacion por producto
  - SEO fields (slug, meta description)
- [ ] Catalogo publico (/tienda)
  - Pagina home con productos destacados y categorias
  - Grid responsive con filtros y busqueda
  - Pagina de detalle con galeria de imagenes
  - SSG/ISR para performance (cache en Cloudflare)
- [ ] Personalizador de Productos (Fabric.js)
  - Canvas interactivo por producto
  - Upload de imagenes del cliente (drag & drop)
  - Plantillas prediseadas seleccionables
  - Texto editable con fuentes custom
  - Preview en mockup del producto
  - Guardar diseno como JSON + exportar PNG para produccion
- [ ] Carrito de compras
  - Cart drawer lateral (no pagina completa)
  - Session-based en Redis (TTL 7 dias)
  - Persistir en Supabase si usuario tiene cuenta
  - Actualizar cantidades, eliminar items
- [ ] Inventario basico
  - Tabla de stock por producto + variante
  - Alertas de stock bajo (email + sonner en admin)
  - Descontar stock al confirmar pago
  - Reservar stock al iniciar checkout (TTL 15 min)
- [ ] Cupones de descuento
  - CRUD admin
  - Validacion en checkout (tipo, vigencia, usos, minimo)
  - Aplicar en UI con feedback inmediato

### FASE 5: Pagos & Checkout (Semanas 29-34)
> Conectar el dinero: de carrito a pedido pagado.

- [ ] Integrar MercadoPago
  - SDK oficial `mercadopago` para Node.js
  - Checkout Pro (redirect) para maxima compatibilidad
  - Webhook IPN para confirmacion de pago
  - Soportar: tarjeta, OXXO, SPEI, wallet MP
- [ ] Integrar Stripe (fallback)
  - Stripe Checkout (hosted) para simplicidad
  - Webhook handler
- [ ] Flujo de checkout completo
  - Step 1: Datos personales (auto-crear contacto)
  - Step 2: Direccion de envio + calculo costo
  - Step 3: Resumen + cupon + metodo de pago
  - Step 4: Redirect a pasarela -> webhook -> confirmacion
- [ ] Gestion de pedidos (Admin)
  - Vista Kanban: Pagado -> En Produccion -> Producido -> En Camino -> Entregado
  - Timeline de historial por pedido
  - Descargar disenos del cliente para produccion
  - Actualizar estado con notificacion automatica al cliente
  - Notas internas por pedido
- [ ] Emails transaccionales del ecommerce
  - Confirmacion de pedido
  - Pedido en produccion
  - Pedido enviado (con tracking)
  - Pedido entregado + solicitar review
  - Templates en GrapesJS (reutilizar modulo de plantillas)
- [ ] Generador de numero de pedido legible (PU-2025-00001)

### FASE 6: Delivery & Logistica (Semanas 35-40)
> Llevar el producto al cliente con el menor costo.

- [ ] Schema de DB: zonas_envio, deliveries, repartidores, pedido_historial
- [ ] Configuracion de zonas de envio
  - UI admin para CRUD de zonas
  - Rangos de codigos postales por zona
  - Precio fijo + precio por kg extra
  - Tiempo estimado por zona
- [ ] Calculo de envio en checkout
  - Cliente ingresa CP -> match con zona -> precio
  - Opcion "Recoger en tienda" ($0) siempre visible
- [ ] Gestion de repartidores propios
  - CRUD de repartidores (nombre, telefono, WhatsApp, vehiculo, zona)
  - Dashboard de disponibilidad
- [ ] Asignacion de deliveries
  - Admin asigna repartidor a pedido producido
  - Notificacion automatica al repartidor via WhatsApp Business API
  - Mensaje template: "Nuevo envio: [direccion]. Recoger en [hora]. Confirma con SI"
- [ ] Tracking para el cliente
  - Pagina publica /tienda/pedido/[id] con timeline
  - Link de tracking en email de "pedido enviado"
  - Estados en tiempo real via Supabase Realtime
- [ ] Confirmacion de entrega
  - Repartidor confirma via WhatsApp (responde "ENTREGADO" + foto)
  - n8n parsea el mensaje y actualiza DB
  - Alternativa: link web simple que abre camara + geolocalizacion
- [ ] [Futuro] Integracion courier APIs
  - Adapter pattern listo en lib/delivery/courier/
  - Conectar Skydropx o Envia.com cuando volumen > 100 envios/mes
  - Generar guias, labels e imprimir desde admin

### FASE 7: Escala, Multi-Canal & Optimizacion (Semanas 41-52)
> Preparar para el crecimiento explosivo.

- [ ] Motor de plantillas interno (reemplazar dependencia de Canva)
  - Generacion de imagenes con Sharp
  - HTML -> imagen con Playwright
  - Templates pre-diseñados internos
- [ ] Multi-canal: Meta Ads
  - Integracion Meta Graph API via n8n
  - Crear anuncios en borrador desde campana
  - Sync de metricas
- [ ] A/B testing de emails
  - Enviar variante A al 10%, variante B al 10%
  - Ganador al 80% restante
- [ ] Segmentacion avanzada
  - Scoring de contactos (engagement + compras)
  - Listas dinamicas por comportamiento
  - RFM analysis (Recency, Frequency, Monetary)
- [ ] Analytics unificado
  - Dashboard que cruza: formularios + ventas + campanas + delivery
  - Metricas clave: CAC, LTV, conversion rate, AOV
  - Grafana + Prometheus en server local para infra
  - Alertas por Telegram/Discord si algo falla
- [ ] SEO para tienda
  - Sitemap dinamico
  - Schema.org structured data (Product, BreadcrumbList)
  - Open Graph tags para compartir productos
- [ ] Optimizacion de performance
  - Evaluar migracion a VPS si Vercel limita
  - ISR/SSG para catalogo de productos
  - Edge caching con Cloudflare
  - Image optimization con next/image + Cloudflare Polish

### FASE 8: Ecosistema Completo & SaaS (Semanas 52+)
> De herramienta interna a producto vendible.

- [ ] Multi-tenancy
  - Tenant isolation en DB (schema por tenant o RLS)
  - Subdominio por cliente
- [ ] Billing / Planes
  - Free: 50 productos, 100 emails/mes, sin IA
  - Starter ($15/mes): 500 productos, 5k emails, IA basica
  - Pro ($45/mes): ilimitado, IA completa, multi-canal, API
  - Integracion Stripe o MercadoPago para billing
- [ ] White-label
  - Customizar logo, colores, dominio
  - Cada PYME tiene su propia tienda + admin
- [ ] Marketplace (futuro)
  - Multiples vendedores en una plataforma
  - Split payments con MP (pagos divididos)
  - Comision por venta
- [ ] API publica
  - Documentacion OpenAPI
  - API keys por tenant
  - Rate limiting por plan
- [ ] App PWA para repartidores
  - Ver entregas asignadas
  - Navegar con Maps
  - Confirmar entrega + foto
  - Funciona offline (sync cuando hay red)

---

## PROMPT MAESTRO PARA TRANSFORMACION

> Usa este prompt para iniciar la implementacion con Claude Code o cualquier AI assistant:

```
Eres un arquitecto de software senior. Tu tarea es transformar una aplicacion Next.js 16
existente (formularios + admin panel) en un ecosistema completo para PYME de productos
personalizados: ecommerce + marketing automation + delivery, siguiendo esta arquitectura:

ESTADO ACTUAL:
- Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui
- Supabase (PostgreSQL) con 3 tablas: formularios, configuracion, email_log
- Nextcloud en server local para storage de archivos
- JWT auth con jose + middleware
- Resend para email transaccional

OBJETIVO:
Construir un ecosistema que permita:

A) CORE (existente):
1. Recibir formularios publicos (ya existe)
2. Panel admin con metricas e historial

B) MARKETING AUTOMATION:
3. Gestionar contactos y listas de mailing
4. Crear plantillas de email/marketing con drag & drop (GrapesJS)
5. Enviar campanas masivas de email (Amazon SES)
6. Orquestar generacion de campanas con IA (n8n + Claude API + DeepSeek)
7. Conectar con Canva API para diseño grafico (corto plazo)
8. Tracking de emails (opens, clicks, bounces)

C) ECOMMERCE:
9. Tienda online con catalogo de productos personalizados
10. Personalizador visual de productos (Fabric.js: el cliente sube su diseno)
11. Carrito + checkout + pagos (MercadoPago primario, Stripe fallback)
12. Gestion de pedidos (Kanban: pagado -> produccion -> enviado -> entregado)
13. Inventario basico de materiales base
14. Cupones de descuento

D) DELIVERY & LOGISTICA:
15. Zonas de envio con precios fijos por CP
16. Repartidores propios notificados via WhatsApp Business API
17. Tracking de entregas para el cliente
18. Confirmacion de entrega con foto
19. [Futuro] APIs de couriers (Skydropx, Envia.com)

PRINCIPIOS:
- Costo minimo: priorizar free tiers y self-hosting ($1/mes inicio)
- Adapter Pattern para providers intercambiables (email, storage, pagos, delivery, IA)
- No microservicios: modulos dentro de Next.js con separacion clara
- Seguridad: Cloudflare WAF (free), rate limiting, RLS, JWT, CSP
- PCI compliance via pasarela (nunca tocar datos de tarjeta)
- Preparado para escala pero sin over-engineering
- Produccion bajo demanda (no stock de productos terminados)

STACK FINAL:
- Frontend: Next.js 16, React 19, Tailwind v4, shadcn/ui, GrapesJS, Fabric.js, Recharts
- Backend: Next.js API Routes, BullMQ (queue)
- DB: Supabase PostgreSQL
- Cache: Upstash Redis (free tier) - carrito + rate limiting
- Email: Resend (transaccional) + Amazon SES (masivo)
- Pagos: MercadoPago (primario LATAM) + Stripe (fallback)
- Storage: Nextcloud (primario) + Supabase Storage (CDN) + Minio (backup)
- IA: Claude API (orquestador) + DeepSeek API (worker) + n8n (flujos)
- Delivery: WhatsApp Business API + zonas fijas + [futuro] Skydropx/Envia.com
- Infra: Cloudflare (DNS, WAF, CDN, Tunnel), Vercel (hosting), server local

FASE ACTUAL: [especificar fase del roadmap: 0-8]

INSTRUCCIONES:
1. Lee los archivos existentes antes de modificar
2. Usa el Adapter Pattern para toda integracion externa
3. Valida inputs con Zod en cada API route
4. Mantiene backward compatibility con el schema actual de formularios
5. Agrega migraciones SQL incrementales (no reescribir schema.sql)
6. Server Components por defecto, Client Components solo cuando sea necesario
7. Tests para logica critica (pagos, envio emails, queue, auth, inventario)
8. ISR/SSG para paginas de catalogo (performance + SEO)
9. Nunca almacenar datos de tarjeta — delegar a pasarela
10. Imagenes de productos y disenos van a Nextcloud, thumbnails a Supabase Storage
```

---

## RESUMEN DE COSTOS MENSUALES

| Fase | Costo Fijo Estimado | Servicios |
|---|---|---|
| Fase 0-1 | ~$1-5/mes | Cloudflare free, Supabase free, Vercel free, dominio |
| Fase 2 | ~$5-15/mes | + SES (~$1-5), Canva Pro ($13 opcional) |
| Fase 3 | ~$15-30/mes | + Claude API (~$15), DeepSeek (~$3) |
| Fase 4-5 | ~$30-50/mes | + MercadoPago ($0 fijo, comision variable), WhatsApp (~$5) |
| Fase 6 | ~$50-80/mes | + Supabase Pro ($25), Google Maps (free credit) |
| Fase 7 | ~$80-120/mes | + VPS ($20), Grafana, couriers API |
| Fase 8 | ~$120-200/mes | + Multi-tenancy, dedicated IPs, scaling |

**Costos variables (ecommerce):**
- MercadoPago: 3.49% + IVA por transaccion (no hay costo fijo)
- Ejemplo: 100 ventas/mes x $500 MXN promedio = ~$2,000 MXN en comisiones
- Delivery propio: ~$50 MXN gasolina por envio local
- Courier: $70-200 MXN por guia (solo cuando se use)

**Comparativa: Custom vs Shopify vs WooCommerce**

| | Custom (esta arquitectura) | Shopify | WooCommerce |
|---|---|---|---|
| Costo fijo/mes | ~$1-50 (fases 0-5) | $39-399 USD | ~$20 (hosting) |
| Comision ventas | Solo MP (3.49%) | MP + Shopify (2%) | Solo MP (3.49%) |
| Personalizador | Fabric.js (custom, $0) | Apps de pago ($10-50/mes) | Plugins ($0-30) |
| Marketing/email | Integrado (SES: $0.10/1k) | Apps ($10-80/mes) | Plugins + servicio |
| Control total | 100% | Limitado | Alto (PHP) |
| IA integrada | Claude + DeepSeek ($18/mes) | Apps IA ($20-100/mes) | Plugins + API |
| Delivery custom | Integrado | Apps ($10-30/mes) | Plugins |
| **Total 1 ano** | **~$200-600 USD** | **~$1,200-5,000 USD** | **~$600-1,500 USD** |

Todos los costos asumen self-hosting maximo en server local. Si el server local falla, migrar n8n/Nextcloud a VPS agrega ~$20-40/mes extra.

---

## DIAGRAMA DEL ECOSISTEMA COMPLETO

```
+================================================================+
|                    ECOSISTEMA PRINTUP                            |
|                                                                  |
|  +------------------+  +------------------+  +--------------+   |
|  |   FORMULARIOS    |  |     TIENDA       |  |  MARKETING   |   |
|  |   (existente)    |  |   (ecommerce)    |  | (automation) |   |
|  |                  |  |                  |  |              |   |
|  | - Form publico   |  | - Catalogo       |  | - Plantillas |   |
|  | - Archivos       |  | - Personalizador |  | - Campanas   |   |
|  | - Notificaciones |  | - Carrito        |  | - IA Agent   |   |
|  +--------+---------+  | - Checkout       |  | - Multi-canal|   |
|           |             | - Pagos (MP)     |  +------+-------+   |
|           |             +--------+---------+         |           |
|           |                      |                   |           |
|           +----------+-----------+-------------------+           |
|                      |                                           |
|              +-------v--------+                                  |
|              |  ADMIN PANEL   |                                  |
|              |  (unificado)   |                                  |
|              |                |                                  |
|              | - Dashboard    |     +------------------+         |
|              | - Pedidos      +----->   DELIVERY       |         |
|              | - Inventario   |     |                  |         |
|              | - Contactos    |     | - Zonas/tarifas  |         |
|              | - Campanas     |     | - Repartidores   |         |
|              | - Config       |     | - WhatsApp notif |         |
|              +-------+--------+     | - Tracking       |         |
|                      |              | - Foto entrega   |         |
|                      |              +------------------+         |
|                      |                                           |
|  +-------------------v---------------------------------------+   |
|  |                    INFRAESTRUCTURA                         |   |
|  |                                                           |   |
|  |  Cloudflare (WAF+CDN) | Supabase (DB) | Redis (cache)    |   |
|  |  Nextcloud (storage)  | n8n (flujos)  | Minio (backup)   |   |
|  |  MercadoPago (pagos)  | SES (email)   | WhatsApp (notif) |   |
|  |  Claude+DeepSeek (IA) | Vercel (host) | Server local     |   |
|  +-----------------------------------------------------------+   |
+==================================================================+
```
