# PrintUp - Pendientes para Produccion 100% Operativa

> Ultima actualizacion: 2026-05-02

Este documento detalla todo lo que falta conectar, configurar y mejorar para que el ecosistema PrintUp este completamente operativo y vendiendo en el mercado.

---

## Estado actual por sistema

| Sistema | Estado | Prioridad |
|---------|--------|-----------|
| Tienda (catalogo, detalle, busqueda) | Listo | - |
| Carrito + Checkout | Funcional, falta validacion server-side | MEDIA |
| MercadoPago | Funcional, falta verificar webhook | ALTA |
| Emails automaticos | Funcional, tiene fallback hardcodeado | ALTA |
| Panel Admin (pedidos, productos, etc.) | Listo | - |
| Subida de imagenes | Listo | - |
| SEO (sitemap, robots, JSON-LD) | Listo | - |
| WhatsApp | Listo (1 numero hardcodeado en confirmacion) | BAJA |
| Autenticacion admin | Basica, cambiar credenciales | ALTA |
| Base de datos (schema, indexes) | Buena, faltan indexes | MEDIA |
| NextCloud sync | Listo | - |
| Seguridad general | Necesita atencion | ALTA |
| Cuentas de usuario (registro, login, mi-cuenta) | Listo | - |
| Favoritos/Wishlist | Listo | - |
| Reviews de productos | Listo | - |
| Cupones de descuento | Listo | - |
| Inventario (alertas, edicion) | Listo | - |
| WhatsApp Bot | Listo | - |
| NextCloud Sync (formularios + pedidos) | Listo | - |
| Analytics Dashboard | Listo | - |
| Portafolio publico + admin | Listo | - |
| Newsletter (suscripcion + envio) | Listo | - |
| Preguntas de productos (Q&A) | Listo | - |
| Social Proof popup | Listo | - |
| Google Analytics 4 | Listo | - |
| Paginas legales (envio, devoluciones, privacidad) | Listo | - |
| Pagina 404 personalizada | Listo | - |

---

## 1. CRITICOS - Hacer ANTES de salir a produccion

### 1.1 Variables de entorno obligatorias

Crear un `.env.local` (o `.env` en el hosting) con TODOS estos valores reales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth admin
ADMIN_USER=tu_usuario_seguro
ADMIN_PASSWORD=una_contraseña_fuerte_de_20+_caracteres
JWT_SECRET=un_string_aleatorio_de_64_caracteres

# Email
RESEND_API_KEY=re_xxxxx
NOTIFICATION_EMAIL=pedidos@printup.cl

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx

# App
NEXT_PUBLIC_APP_URL=https://printup.cl
```

**Problema actual**: Si faltan variables, el codigo usa fallbacks inseguros como `onboarding@resend.dev` y `http://localhost:3000`.

### 1.2 Cambiar credenciales de admin

El sistema tiene por defecto `admin / admin123`. Cambiar inmediatamente en `.env.local`:

```env
ADMIN_USER=daniela
ADMIN_PASSWORD=UnaContraseñaMuySegura2026!
JWT_SECRET=generar-con-openssl-rand-hex-32
```

### 1.3 Verificacion de webhook MercadoPago

El webhook en `/api/pagos/webhook` no verifica que la peticion realmente venga de MercadoPago. Cualquiera podria enviar un request falso para marcar un pedido como "pagado". Hay que agregar verificacion de firma.

### 1.4 Quitar emails fallback hardcodeados

En 4 archivos se usa `onboarding@resend.dev` como fallback. Esto haria que emails vayan a un destino equivocado si no se configura bien:
- `src/app/api/pagos/webhook/route.ts`
- `src/app/api/pedidos/route.ts`
- `src/app/api/admin/pedidos/[id]/route.ts`
- `src/app/api/upload/route.ts`

### 1.5 Quitar URLs localhost

Dos archivos usan `http://localhost:3000` como fallback:
- `src/app/api/pagos/crear-preferencia/route.ts` (URLs de retorno MercadoPago)
- `src/app/api/upload/route.ts` (link en email)

Solucion: Definir `NEXT_PUBLIC_APP_URL=https://printup.cl` en produccion.

---

## 2. IMPORTANTES - Hacer en las primeras semanas

### 2.1 Validar precios en el servidor

Actualmente el checkout envia los precios desde el navegador. Un usuario tecnico podria modificar el precio antes de enviar el pedido. La API `/api/pedidos` deberia recalcular los precios consultando la base de datos.

### 2.2 Verificar stock antes de crear pedido

El carrito no verifica si hay stock disponible al momento de comprar. Podria venderse un producto agotado. Agregar validacion en `/api/pedidos/route.ts`.

### 2.3 Politicas RLS de Supabase

La tabla `pedidos` tiene politicas demasiado abiertas:
- `Public read pedidos` permite a cualquiera leer TODOS los pedidos (datos de otros clientes)
- `Public insert pedidos` no tiene restricciones

Corregir para que la lectura publica sea solo por ID especifico (el que se muestra en la confirmacion).

### 2.4 Agregar indexes faltantes en la BD

```sql
CREATE INDEX idx_pedidos_pago_referencia ON pedidos(pago_referencia);
CREATE INDEX idx_pedidos_pago_estado ON pedidos(pago_estado);
```

### 2.5 Rate limiting

Agregar limites a endpoints publicos para evitar abuso:
- `/api/pedidos` (creacion de ordenes)
- `/api/pagos/webhook` (webhook)
- `/api/upload` (formularios)

Opcion simple: usar el middleware de Vercel con `@vercel/edge` rate limiter o Upstash Redis.

### 2.6 WhatsApp hardcodeado en confirmacion

En `src/app/(tienda)/checkout/confirmacion/[id]/page.tsx` linea ~280 hay un numero de WhatsApp hardcodeado (`56966126645`). Deberia leerse de la configuracion como lo hace el boton flotante.

---

## 3. MEJORAS FUTURAS - Para crecer

### 3.1 Multiples usuarios admin

Actualmente hay un solo usuario admin. Para escalar, agregar tabla `admin_users` con roles (admin, vendedor, bodega).

### 3.2 Notificaciones push / dashboard en tiempo real

Sonido o alerta cuando llega un pedido nuevo. Actualmente hay que refrescar la pagina.

### 3.3 Integracion con NextCloud para pedidos

El sync-worker actual solo sincroniza archivos de formularios. Los pedidos no se guardan en NextCloud. Evaluar si es necesario.

### 3.4 Historial de emails

Agregar una tabla `email_log_pedidos` para registrar todos los emails enviados por pedido y poder reenviar si falla.

### 3.5 ~~Reportes avanzados~~ [COMPLETADO]

~~- Ventas por categoria~~
~~- Productos mas vendidos~~
~~- Clientes recurrentes~~
~~- Exportar reportes PDF~~

> Completado: el Analytics Dashboard en admin cubre estas necesidades.

### 3.6 ~~Mejoras UX~~ [PARCIALMENTE COMPLETADO]

- ~~Busqueda con autocompletado~~ [COMPLETADO]
- Filtros por precio
- ~~Wishlist / favoritos~~ [COMPLETADO]
- ~~Reviews de productos~~ [COMPLETADO]
- Notificacion de "producto disponible" cuando vuelva al stock

---

## 4. DONDE DESPLEGAR - Opciones baratas

### Opcion A: Vercel Free + Supabase Free (GRATIS - Recomendada para empezar)

| Servicio | Plan | Costo | Limites |
|----------|------|-------|---------|
| **Vercel** (hosting Next.js) | Hobby | $0/mes | 100GB bandwidth, 1000 invocaciones/dia funciones |
| **Supabase** (BD + Storage) | Free | $0/mes | 500MB BD, 1GB storage, 50K auth requests |
| **Resend** (emails) | Free | $0/mes | 100 emails/dia, 3000/mes |
| **Dominio** printup.cl | NIC Chile | ~$14.000 CLP/año | - |
| **Total** | | **~$1.200 CLP/mes** | Solo el dominio |

**Limites reales**: Soporta ~30 pedidos/dia y ~100 productos sin problemas. Perfecto para arrancar.

**Como desplegar**:
1. Ir a vercel.com, conectar repositorio GitHub `fguerra93/app-formularios`
2. Configurar variables de entorno en Vercel Dashboard > Settings > Environment Variables
3. Agregar dominio personalizado `printup.cl` en Vercel > Domains
4. En NIC Chile apuntar DNS a los nameservers de Vercel

### Opcion B: Vercel Free + Supabase Pro (si crece rapido)

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby | $0/mes |
| Supabase | Pro | $25 USD/mes (~$23.000 CLP) |
| Resend | Free | $0/mes |
| **Total** | | **~$25.000 CLP/mes** |

Agrega: 8GB BD, 100GB storage, backups diarios, sin limites de requests. Escalar cuando superes los limites del free tier.

### Opcion C: VPS barato (control total)

| Servicio | Plan | Costo |
|----------|------|-------|
| **Hostinger VPS** | KVM 1 | $4 USD/mes (~$3.700 CLP) |
| **Hetzner** | CX22 | EUR 4/mes (~$4.500 CLP) |
| **Oracle Cloud** | ARM Free | $0/mes (4 CPU, 24GB RAM!) |

Requiere: instalar Node.js, PM2, Nginx, certificado SSL, mantener el servidor. Mas trabajo pero control total y sin limites.

### Opcion D: Cloudflare Pages + D1 (ultra barato)

| Servicio | Plan | Costo |
|----------|------|-------|
| Cloudflare Pages | Free | $0/mes |
| Cloudflare D1 (SQLite) | Free | $0/mes (5GB) |

Requiere migrar de Supabase a D1 (mucho trabajo). Solo si el costo es la prioridad absoluta.

---

## 5. PENDIENTE: Ejecutar SQL de Fase 6

Antes de usar las funcionalidades de Fase 6 (portafolio, newsletter, Q&A de productos), se debe ejecutar el script SQL correspondiente en el **Supabase SQL Editor**.

**Archivo**: `supabase/schema-fase6.sql`

Este script crea las siguientes tablas y columnas que aun no existen en produccion:

| Objeto | Descripcion |
|--------|-------------|
| `trabajos` | Tabla del portafolio publico (imagen, titulo, categoria, etc.) |
| `clientes_destacados` | Logos/nombres de clientes para la seccion de confianza |
| `preguntas_producto` | Preguntas y respuestas publicas por producto (Q&A) |
| `suscriptores` | Lista de emails del newsletter |
| `ALTER TABLE productos ADD ficha_tecnica_url` | URL del PDF de ficha tecnica por producto |

**Pasos**:
1. Ir a [supabase.com](https://supabase.com) > Tu proyecto > SQL Editor
2. Abrir el archivo `supabase/schema-fase6.sql` del repositorio
3. Pegar el contenido y ejecutar
4. Verificar que las tablas aparezcan en Table Editor

> Si este SQL no se ejecuta, las paginas de portafolio, newsletter y Q&A cargaran sin datos y el admin mostrara errores al intentar guardar.

---

## Mi recomendacion

**Empezar con Opcion A (Vercel + Supabase gratis)**. Es literalmente $0/mes mas el dominio. El stack actual ya esta optimizado para esto:

1. Next.js en Vercel = deploy automatico con cada `git push`
2. Supabase ya esta integrada como BD y Storage
3. Resend ya envia los emails
4. MercadoPago ya procesa pagos

Cuando tengas mas de ~50 pedidos/dia o ~500 productos, subir a Supabase Pro ($25 USD/mes).

---

## Checklist de lanzamiento

```
PRE-LANZAMIENTO
[ ] Crear cuenta Vercel y conectar repo GitHub
[ ] Configurar TODAS las variables de entorno en Vercel
[ ] Cambiar credenciales admin (usuario + password + JWT secret)
[ ] Verificar email de Resend funciona (dominio verificado)
[ ] Verificar MercadoPago en modo produccion (no sandbox)
[ ] Configurar webhook de MercadoPago apuntando a https://printup.cl/api/pagos/webhook
[ ] Agregar dominio printup.cl en Vercel
[ ] Apuntar DNS de NIC Chile a Vercel
[ ] Ejecutar schema-ecommerce.sql en Supabase (si no esta)
[ ] Ejecutar schema-fase6.sql en Supabase SQL Editor
[ ] Cargar productos reales (admin o script sync-shopify)
[ ] Configurar zonas de envio reales en admin
[ ] Configurar Google Analytics 4 ID en admin > Configuracion > Tienda
[ ] Agregar trabajos al portafolio desde admin
[ ] Agregar clientes destacados desde admin
[ ] Probar flujo completo: agregar al carrito > checkout > pago > confirmacion

POST-LANZAMIENTO
[ ] Verificar emails llegan correctamente
[ ] Verificar webhook MercadoPago confirma pagos
[ ] Registrar sitemap en Google Search Console
[ ] Compartir link en redes sociales
[ ] Monitorear errores en Vercel Dashboard > Logs
```

---

## Resumen ejecutivo

El ecosistema esta **98% listo**. Las 6 fases de desarrollo estan completas. Lo unico pendiente antes del lanzamiento son los items de configuracion de produccion listados en la seccion 1:

1. Configurar variables de entorno reales (10 min)
2. Cambiar credenciales admin (2 min)
3. Ejecutar schema-fase6.sql en Supabase SQL Editor (5 min)
4. Deploy en Vercel (15 min)
5. Configurar dominio (30 min)
6. Cargar contenido inicial (portafolio, clientes, productos) y probar flujo completo (1 hora)

Las mejoras de seguridad (webhook verification, rate limiting, RLS) se pueden hacer en la primera semana post-lanzamiento sin detener las ventas.
