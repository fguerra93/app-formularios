# Guia de Despliegue en Produccion — PrintUp.cl

> Ultima actualizacion: 2026-05-17

---

## Infraestructura elegida

| Servicio | Plan | Costo USD/mes |
|----------|------|------------:|
| Vercel (hosting sitio) | Pro | $20 |
| Supabase (BD + storage + auth) | Pro | $25 |
| Resend (emails) | Pro 50k/mes | $20 |
| Cloudflare (CDN + seguridad) | Free | $0 |
| Dominio printup.cl (NIC) | -- | Lo paga PrintUp (~$1.250/mes) |
| **Total infraestructura** | | **$65 USD/mes** |
| | | **~$60.000 CLP/mes** |

---

## PASO 1: Preparar Supabase (Base de datos)

### 1.1 Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) > New Project
2. Nombre: `printup-produccion`
3. Region: **South America (Sao Paulo)** — la mas cercana a Chile
4. Plan: **Pro ($25/mes)**
5. Guardar las credenciales que genera:
   - `Project URL` > sera tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` > sera tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` > sera tu `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 Ejecutar migraciones SQL (en orden)

Ir a **SQL Editor** en Supabase y ejecutar estos archivos del repo uno por uno:

```
1.  supabase/schema.sql                              <- Tabla formularios + configuracion
2.  supabase/schema-ecommerce.sql                    <- Productos, pedidos, categorias, zonas envio
3.  supabase/schema-fase4.sql                        <- Cupones
4.  supabase/schema-fase5.sql                        <- Cuentas cliente, reviews, favoritos
5.  supabase/schema-fase6.sql                        <- Portafolio, Q&A, newsletter, suscriptores
6.  supabase/schema-fase7.sql                        <- Analytics y logging
7.  supabase/schema-fase8.sql                        <- Pagos log
8.  supabase/schema-fase9.sql                        <- WhatsApp conversaciones
9.  supabase/migration-fase11-completa.sql           <- WhatsApp bot completo
10. supabase/migration-calculadora-m2.sql            <- Campos calculadora m2
11. supabase/migration-calculadora-mas-productos.sql <- Mas datos calculadora
```

### 1.3 Verificar tablas creadas

En **Table Editor** confirmar que existen todas estas tablas:

- `formularios`
- `configuracion`
- `email_log`
- `productos`
- `categorias`
- `pedidos`
- `zonas_envio`
- `cupones`
- `clientes`
- `reviews`
- `trabajos`
- `clientes_destacados`
- `preguntas_producto`
- `suscriptores`
- `conversaciones_whatsapp`
- `mensajes_whatsapp`
- `cotizaciones_whatsapp`
- `carrito_abandonado`
- `pagos_log`

### 1.4 Crear bucket de Storage

1. Ir a **Storage** > New Bucket
2. Nombre: `formularios-archivos`
3. Public: **Si** (para que las imagenes de productos sean accesibles)

---

## PASO 2: Configurar Resend (Emails)

1. Ir a [resend.com](https://resend.com) > crear cuenta > Plan Pro
2. **Verificar dominio**: Agregar `printup.cl` como dominio de envio
   - Resend te dara registros DNS (SPF, DKIM, DMARC)
   - Agregar esos registros en Cloudflare (ver paso 4)
3. Crear API Key > guardar como `RESEND_API_KEY`
4. Configurar el "From" como: `PrintUp <pedidos@printup.cl>`

---

## PASO 3: Configurar MercadoPago

1. Ir a [mercadopago.cl/developers](https://www.mercadopago.cl/developers) > Tu aplicacion
2. **Cambiar de Sandbox a Produccion**
3. Copiar:
   - `Access Token` (produccion) > `MERCADOPAGO_ACCESS_TOKEN`
   - `Public Key` (produccion) > `MERCADOPAGO_PUBLIC_KEY` y `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
4. **Configurar Webhook** (despues del deploy):
   - URL: `https://printup.cl/api/pagos/webhook`
   - Eventos: `payment` (pagos)

---

## PASO 4: Configurar Cloudflare (DNS + CDN)

1. Crear cuenta en [cloudflare.com](https://cloudflare.com) (Free)
2. Agregar sitio `printup.cl`
3. En **NIC Chile**, cambiar los nameservers a los que te da Cloudflare
4. En Cloudflare DNS agregar:

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| CNAME | `printup.cl` | `cname.vercel-dns.com` | ON |
| CNAME | `www` | `cname.vercel-dns.com` | ON |
| TXT | (los que da Resend para SPF) | ... | OFF |
| TXT | (los que da Resend para DKIM) | ... | OFF |
| TXT | (DMARC) | ... | OFF |

5. En **SSL/TLS**: Modo **Full (strict)**
6. Activar **Always Use HTTPS**
7. Activar **Auto Minify** (HTML, CSS, JS)

---

## PASO 5: Desplegar en Vercel

### 5.1 Conectar repositorio

1. Ir a [vercel.com](https://vercel.com) > New Project
2. Importar repo GitHub: `fguerra93/app-formularios`
3. Framework: **Next.js** (auto-detectado)
4. Branch de produccion: **master**
5. Plan: **Pro ($20/mes)**

### 5.2 Configurar variables de entorno

En Vercel > Settings > Environment Variables, agregar **TODAS**:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Auth Admin (CAMBIAR ESTOS - CRITICO)
ADMIN_USER=daniela
ADMIN_PASSWORD=PrintUp-Segura-2026!MuyLarga
JWT_SECRET=<generar con: openssl rand -hex 32>

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFY_TO=pedidos@printup.cl
FROM_EMAIL=pedidos@printup.cl
FROM_NAME=PrintUp

# MercadoPago (PRODUCCION, no sandbox)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxx
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxx

# App
NEXT_PUBLIC_APP_URL=https://printup.cl

# NextCloud (si usan sync de formularios)
NEXTCLOUD_URL=https://printup.internos
NEXTCLOUD_USER=bot-formularios
NEXTCLOUD_PASSWORD=xxxx
NEXTCLOUD_FOLDER=/PrintUp/Pedidos_Nuevos
```

### 5.3 Agregar dominio

1. En Vercel > Settings > Domains
2. Agregar `printup.cl` y `www.printup.cl`
3. Vercel mostrara los registros DNS necesarios (ya los configuramos en Cloudflare)

### 5.4 Deploy

1. Hacer merge de `develop` > `master`
2. Vercel hace deploy automatico al detectar push a master
3. Verificar en Vercel Dashboard que el build sea exitoso

---

## PASO 6: Configuracion post-deploy

### 6.1 Probar el sitio

- [ ] `https://printup.cl` carga correctamente
- [ ] `https://printup.cl/admin/login` funciona con las nuevas credenciales
- [ ] Las imagenes de Supabase cargan (verificar en productos)

### 6.2 Cargar contenido inicial desde el Admin Panel

1. **Categorias**: `/admin/categorias` > crear las categorias de productos
2. **Productos**: `/admin/productos/nuevo` > cargar catalogo real con fotos, precios, stock
3. **Zonas de envio**: `/admin/envios` > configurar comunas, precios, dias de despacho
4. **Portafolio**: `/admin/portafolio` > subir trabajos realizados + logos de clientes
5. **Configuracion**: `/admin/configuracion` >
   - Tab **Tienda**: nombre, slogan, logo, redes sociales
   - Tab **Pagos**: credenciales MercadoPago + datos para transferencia bancaria
   - Tab **WhatsApp**: numero de contacto
   - Tab **Analytics**: ID de Google Analytics 4
   - Tab **Email**: verificar API key y direcciones

### 6.3 Probar flujo completo de compra

1. Agregar producto al carrito
2. Ir a checkout
3. Completar datos del cliente
4. Seleccionar zona de envio
5. Pagar con MercadoPago (usar tarjeta de prueba si aun esta en test)
6. Verificar que:
   - Se crea el pedido en `/admin/pedidos`
   - Llega email de confirmacion al cliente
   - Llega notificacion al email del admin (`NOTIFY_TO`)
   - El webhook de MercadoPago actualiza el estado del pago

### 6.4 Registrar en Google Search Console

1. Ir a [search.google.com/search-console](https://search.google.com/search-console)
2. Agregar propiedad `https://printup.cl`
3. Verificar con registro DNS TXT en Cloudflare
4. Enviar sitemap: `https://printup.cl/sitemap.xml`

### 6.5 Configurar webhook de MercadoPago

1. En MercadoPago Developer > Tu App > Webhooks
2. URL: `https://printup.cl/api/pagos/webhook`
3. Eventos: `payment`

---

## PASO 7: Sync Worker de NextCloud (opcional)

Si PrintUp usa NextCloud para recibir archivos de formularios:

1. En el servidor local de PrintUp (o un VPS):

```bash
cd sync-worker
cp .env.example .env
# Editar .env con credenciales reales de Supabase y NextCloud
docker-compose up -d
```

2. El worker sincroniza archivos de Supabase > NextCloud cada 30 segundos

---

---

# Checklist: Lo que falta para dejar de depender de Shopify

---

## CRITICO — Hacer ANTES de lanzar

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 1 | Variables de entorno de produccion | Pendiente | Todas las credenciales reales en Vercel |
| 2 | Cambiar credenciales admin | Pendiente | `admin/admin123` > credenciales seguras |
| 3 | Quitar fallback `onboarding@resend.dev` | Pendiente | 4 archivos usan email de prueba como fallback |
| 4 | Quitar fallback `localhost:3000` | Pendiente | 2 archivos usan localhost como URL base |
| 5 | Ejecutar TODAS las migraciones SQL | Pendiente | 11 archivos SQL en orden |
| 6 | Verificar dominio en Resend | Pendiente | Para enviar desde `@printup.cl` |
| 7 | MercadoPago en modo produccion | Pendiente | Cambiar de sandbox a produccion |
| 8 | Cargar productos reales | Pendiente | Migrar catalogo de Shopify al admin |
| 9 | Configurar zonas de envio | Pendiente | Comunas, precios, dias de despacho |

---

## IMPORTANTE — Primera semana post-lanzamiento

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 10 | Verificacion de firma webhook MercadoPago | Pendiente | Cualquiera puede falsear un pago sin esto |
| 11 | Validar precios server-side | Pendiente | El checkout envia precios del browser, se pueden manipular |
| 12 | Verificar stock al crear pedido | Pendiente | Se puede comprar productos agotados |
| 13 | Restringir RLS de tabla `pedidos` | Pendiente | Cualquiera puede leer TODOS los pedidos hoy |
| 14 | Agregar indexes faltantes | Pendiente | `pago_referencia` y `pago_estado` |
| 15 | Rate limiting en endpoints publicos | Pendiente | `/api/pedidos`, `/api/upload`, `/api/pagos/webhook` |
| 16 | WhatsApp hardcodeado en confirmacion | Pendiente | Numero fijo en `checkout/confirmacion` |

---

## MEJORAS PARA INDEPENDENCIA TOTAL DE SHOPIFY

| # | Feature | Estado actual | Que falta |
|---|---------|--------------|-----------|
| 17 | **Multi-usuario admin** | No existe | Tabla `admin_users` con roles (admin, vendedor, bodega) |
| 18 | **Impuestos / IVA** | No existe | Calculo de IVA (19% Chile), mostrar desglose en boleta |
| 19 | **Boleta/Factura electronica** | No existe | Integrar con SII o servicio como Bsale/Haulmer |
| 20 | **Multiples medios de pago** | Solo MercadoPago | Agregar Transbank (Webpay), Flow, transferencia verificada |
| 21 | **Integracion con courier** | Manual | Integrar API de Starken, Chilexpress o BlueExpress para tracking |
| 22 | **Notificaciones push/realtime** | No existe | Alerta sonora cuando llega pedido nuevo (Supabase Realtime) |
| 23 | **Importador de productos desde Shopify** | No existe | Script para migrar catalogo, imagenes y variantes desde Shopify |
| 24 | **Reportes PDF exportables** | Solo CSV | Generar reportes de ventas/inventario en PDF |
| 25 | **Filtro por precio en tienda** | No existe | Slider de rango de precio en catalogo |
| 26 | **Notificacion "volvio al stock"** | No existe | Email automatico cuando un producto agotado vuelve |
| 27 | **Devoluciones y reembolsos** | No existe | Flujo de solicitud de devolucion + reembolso parcial/total |
| 28 | **Blog / contenido SEO** | No existe | CMS simple para posts que atraigan trafico organico |
| 29 | **App movil o PWA** | No existe | Progressive Web App para instalar en celular |
| 30 | **Backup automatizado** | Solo Supabase Pro | Configurar pg_dump adicional o Supabase daily backups |

---

## Prioridades sugeridas para reemplazar Shopify al 100%

### Fase 1 — Lanzamiento (Semana 1)

Items 1-9: Configurar infraestructura + cargar contenido

**Resultado: PrintUp ya puede vender**

### Fase 2 — Seguridad (Semana 2-3)

Items 10-16: Blindar pagos, stock, rate limiting

**Resultado: Operacion segura**

### Fase 3 — Independencia total (Mes 2-3)

Items 17-21: Multi-usuario, IVA, facturacion, mas medios de pago, courier

**Resultado: Adios Shopify**

### Fase 4 — Crecimiento (Mes 4+)

Items 22-30: Notificaciones, blog, PWA, devoluciones

**Resultado: Superar a Shopify**

---

## Resumen ejecutivo

El 90% del trabajo ya esta hecho. Los pasos 1-9 toman aproximadamente una tarde de trabajo. PrintUp puede empezar a vender desde el dia 1 del deploy. Las mejoras de seguridad (10-16) se hacen en la primera semana. Las features para independencia total de Shopify (17-21) son el trabajo del mes 2.

### Stack completo del ecosistema

| Componente | Tecnologia | Version |
|---|---|---|
| Frontend + API | Next.js | 16.2.4 |
| UI Framework | React | 19.2.4 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Componentes UI | shadcn/ui | Latest |
| Animaciones | Framer Motion | 12.38.0 |
| Graficos | Recharts | 3.8.1 |
| Base de datos | Supabase (PostgreSQL) | Pro |
| Auth clientes | Supabase Auth | 2.104.0 |
| Auth admin | JWT (jose) | 6.2.2 |
| Emails | Resend | 6.12.2 |
| Pagos | MercadoPago SDK | 2.12.0 |
| CDN + Seguridad | Cloudflare | Free |
| Hosting | Vercel | Pro |
| Storage archivos | Supabase Storage + NextCloud | - |

### Paginas del admin panel (30+ secciones)

- `/admin` — Dashboard con metricas en tiempo real
- `/admin/productos` — CRUD completo de productos + calculadora m2
- `/admin/categorias` — Gestion de categorias
- `/admin/pedidos` — Gestion de pedidos con filtros y exportacion CSV
- `/admin/inventario` — Control de stock con alertas
- `/admin/envios` — Zonas de envio y precios
- `/admin/cupones` — Sistema de descuentos
- `/admin/campanas` — Campanas de email marketing con editor de templates
- `/admin/newsletter` — Suscriptores y envio masivo
- `/admin/mensajeria` — Bandeja unificada WhatsApp/Instagram/Facebook
- `/admin/whatsapp` — Bot de WhatsApp con cotizaciones
- `/admin/contactos` — CRM de contactos
- `/admin/reviews` — Moderacion de resenas
- `/admin/preguntas` — Q&A de productos
- `/admin/portafolio` — Trabajos + clientes destacados
- `/admin/designer` — Estudio de diseno (clipart + fuentes)
- `/admin/configuracion` — 9 tabs de configuracion del sistema
- `/admin/historial` — Historial de formularios

### API Routes (100+)

- Autenticacion (login, logout, me)
- CRUD de productos, categorias, pedidos, cupones, envios
- Pagos MercadoPago (preferencia + webhook)
- Newsletter (suscribir, desuscribir, enviar)
- Campanas de marketing (CRUD + envio + stats)
- WhatsApp (conversaciones, respuestas, cotizaciones)
- Mensajeria multi-canal
- Upload de archivos
- Busqueda de productos
- Portafolio y clientes destacados
- Reviews y preguntas
- Email tracking (opens + clicks)
- Cron jobs (carritos abandonados cada 6 horas)
- Cliente (perfil, pedidos, carrito)
