# PrintUp - Plan de Despliegue SaaS

> Arquitectura, infraestructura y plan de migracion progresiva
> para desplegar PrintUp como plataforma SaaS profesional.

---

## 1. Contexto Actual

| Componente | Tecnologia | Estado |
|---|---|---|
| Frontend + API | Next.js 16.2.4 (Turbopack) | Desarrollo local |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) | Cloud (free tier) |
| Emails | Resend | Cloud (free tier) |
| Pagos | MercadoPago (Chile) | Integrado |
| Archivos | NextCloud (self-hosted) | Docker en server propio |
| Bot WhatsApp | Lambda AWS (no desplegado) | Codigo listo |
| Sync Worker | Docker container | Local |
| Dominio | printup.cl | Activo |

---

## 2. Arquitectura Objetivo

```
                    printup.cl (DNS: Cloudflare)
                           |
                    [CDN + WAF + DDoS]
                           |
              +-----------+-----------+
              |                       |
        Vercel (Next.js)        Supabase Cloud
        - SSR/SSG/ISR           - PostgreSQL
        - API Routes            - Auth
        - Edge Functions        - Storage
        - Bot webhook           - Realtime
        - Cron jobs             - Edge Functions
              |                       |
              +---+---+---+---+------+
                  |   |   |   |
              Resend  MP  NC  Claude
              Email  Pago Files  AI
```

---

## 3. Fases de Despliegue

---

### FASE A: MVP en Vercel + Supabase (AHORA)
**Costo: $0-25 USD/mes | Tiempo: 1-2 dias**

Este es el despliegue inmediato para tener la app en produccion.

#### A.1 - Vercel (Frontend + API)
- **Plan:** Hobby (gratis) o Pro ($20/mes si necesitas mas)
- **Que incluye:**
  - Deploy automatico desde GitHub (branch `master`)
  - SSL automatico para printup.cl
  - Edge Network global (CDN)
  - Serverless Functions (API routes)
  - 100GB bandwidth/mes (hobby) o 1TB (pro)
  - Preview deployments por branch
  - Analytics basico

- **Configuracion:**
  ```bash
  # Instalar Vercel CLI
  npm i -g vercel

  # Login y conectar proyecto
  vercel login
  vercel link

  # Configurar variables de entorno
  vercel env add SUPABASE_URL
  vercel env add SUPABASE_ANON_KEY
  vercel env add SUPABASE_SERVICE_ROLE_KEY
  vercel env add RESEND_API_KEY
  vercel env add MERCADOPAGO_ACCESS_TOKEN
  vercel env add JWT_SECRET
  vercel env add FROM_EMAIL
  vercel env add FROM_NAME
  vercel env add NEXT_PUBLIC_SITE_URL

  # Deploy
  vercel --prod
  ```

- **Dominio:**
  - En Vercel: Settings > Domains > printup.cl
  - En registrar (NIC Chile): apuntar nameservers o CNAME a Vercel

- **Limitaciones del Hobby plan:**
  - 1 deploy concurrente
  - Serverless functions timeout 10s (suficiente)
  - Sin password protection
  - Sin team features

#### A.2 - Supabase Cloud
- **Plan:** Free (suficiente para empezar)
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth
  - 50,000 monthly active users
  - 500,000 Edge Function invocations
- **Pro ($25/mes)** cuando necesites:
  - 8GB database
  - 100GB storage
  - Daily backups
  - No pause after inactivity (IMPORTANTE: free tier pausa a los 7 dias sin uso)

- **Migracion de datos:**
  - Si ya tienes datos en Supabase, no hay que migrar nada
  - Si hay datos locales, exportar con `pg_dump` e importar

#### A.3 - Variables de entorno criticas
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
JWT_SECRET=tu-secreto-largo-y-seguro-de-32-chars

# Email
RESEND_API_KEY=re_xxxxxxxx
FROM_EMAIL=noreply@printup.cl
FROM_NAME=PrintUp

# Pagos
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx

# WhatsApp/Meta
META_WHATSAPP_PHONE_NUMBER_ID=xxxxx
META_PAGE_ACCESS_TOKEN=xxxxx
META_APP_SECRET=xxxxx
META_WEBHOOK_VERIFY_TOKEN=tu-token-verificacion

# Site
NEXT_PUBLIC_SITE_URL=https://printup.cl
```

#### A.4 - Webhook de Meta en produccion
- URL del webhook: `https://printup.cl/api/webhooks/meta`
- Configurar en Meta Business > App > Webhooks:
  - WhatsApp: messages, message_templates
  - Instagram: messages
  - Facebook: messages
- El verify token se lee de Supabase (tabla `configuracion`)

#### A.5 - Cron Jobs (Vercel Cron)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/carritos-abandonados",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/sync-nextcloud",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

### FASE B: Hardening y Servicios Auxiliares
**Costo: +$5-15 USD/mes | Tiempo: 1 semana**

#### B.1 - Cloudflare (DNS + CDN + Seguridad)
- **Plan:** Free
- **Que agrega:**
  - DNS rapido y confiable
  - CDN adicional sobre Vercel
  - DDoS protection
  - WAF basico (Web Application Firewall)
  - SSL flexible
  - Analytics
  - Bot protection

- **Configuracion:**
  1. Crear cuenta en Cloudflare
  2. Agregar printup.cl
  3. Cambiar nameservers en NIC Chile a los de Cloudflare
  4. En Cloudflare DNS: CNAME `@` -> `cname.vercel-dns.com`
  5. SSL: Full (strict)
  6. Reglas de cache: Cache Everything excepto `/api/*` y `/admin/*`

#### B.2 - Supabase Edge Functions
- Para procesar webhooks pesados sin bloquear las API routes de Vercel
- Casos de uso:
  - Procesar notificacion de pago (MP webhook)
  - Enviar notificaciones push de cambio de estado
  - Generar PDFs de OPs
  - Sincronizar con NextCloud

```typescript
// supabase/functions/on-estado-change/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { record, old_record } = await req.json();
  // Logica de notificacion...
});
```

#### B.3 - Dominio de email propio
- Configurar DNS para enviar desde `@printup.cl` con Resend:
  - SPF record
  - DKIM record
  - DMARC record
- Esto mejora la entregabilidad y evita que los emails caigan en spam

#### B.4 - Monitoring basico
- **Vercel Analytics** (incluido en Pro)
- **Sentry** free tier para error tracking
  ```bash
  npm install @sentry/nextjs
  ```
- **Supabase Dashboard** para monitorear queries y uso de DB
- **UptimeRobot** (gratis) para monitorear uptime de printup.cl

---

### FASE C: NextCloud en la Nube
**Costo: $5-12 USD/mes | Tiempo: 1-2 dias**

#### C.1 - Opciones para NextCloud

| Opcion | Costo | Pros | Contras |
|---|---|---|---|
| **Hetzner VPS** (CX22) | 5 EUR/mes | Barato, buen rendimiento, EU | Administrar server |
| **DigitalOcean Droplet** | $6/mes | Facil, marketplace con NC | Un poco mas caro |
| **NextCloud hosting** (managed) | $5-10/mes | Zero admin | Menos control |
| **Mantener local** | $0 | Ya funciona | Depende de tu PC/server |

**Recomendacion:** Hetzner CX22 (2 vCPU, 4GB RAM, 40GB SSD) por 5 EUR/mes.
- Docker compose con NextCloud + MariaDB + Redis
- Let's Encrypt SSL automatico
- Subdominio: `cloud.printup.cl` o `nc.printup.cl`

#### C.2 - Docker Compose para NextCloud en VPS
```yaml
services:
  nextcloud:
    image: nextcloud:latest
    restart: always
    ports:
      - 8080:80
    volumes:
      - nextcloud_data:/var/www/html
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=${NC_DB_PASS}
      - NEXTCLOUD_ADMIN_USER=${NC_ADMIN}
      - NEXTCLOUD_ADMIN_PASSWORD=${NC_ADMIN_PASS}
      - NEXTCLOUD_TRUSTED_DOMAINS=cloud.printup.cl
    depends_on:
      - db
      - redis

  db:
    image: mariadb:11
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=${NC_DB_ROOT_PASS}
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=${NC_DB_PASS}
    volumes:
      - db_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    restart: always

  caddy:
    image: caddy:latest
    restart: always
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - nextcloud

volumes:
  nextcloud_data:
  db_data:
  caddy_data:
```

```
# Caddyfile
cloud.printup.cl {
  reverse_proxy nextcloud:8080
}
```

---

### FASE D: Escalamiento a DigitalOcean App Platform
**Costo: $12-50 USD/mes | Cuando: +500 pedidos/mes o necesites mas control**

Esta fase es para cuando Vercel se quede corto (limites de bandwidth, funciones,
o necesites mas control sobre el servidor).

#### D.1 - Por que migrar de Vercel

| Razon | Cuando aplica |
|---|---|
| Costo de bandwidth | >100GB/mes en hobby, >1TB en pro |
| Serverless timeout | Necesitas procesos de mas de 60s |
| Costos impredecibles | Facturacion por uso en Vercel Pro |
| Control total | Necesitas Docker, workers, cron real |
| Costos fijos | Preferir pago fijo vs. pago por uso |

#### D.2 - Arquitectura en DigitalOcean

```
              printup.cl (Cloudflare DNS)
                     |
              DigitalOcean App Platform
              +---------------------------+
              |  Web Service (Next.js)    |
              |  - $12/mes (Basic)        |
              |  - 1 vCPU, 1GB RAM        |
              |  - Auto-deploy desde GH   |
              +---------------------------+
                     |
              +------+------+
              |             |
        Supabase      DO Managed DB
        (mantener)    (si migras DB)
        $25/mes       $15/mes
```

#### D.3 - Pasos de migracion Vercel -> DO

1. **Preparar Next.js para standalone:**
   ```javascript
   // next.config.ts
   const config = {
     output: 'standalone',
   };
   ```

2. **Crear Dockerfile:**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/public ./public
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

3. **Deploy en DO App Platform:**
   - Conectar repositorio GitHub
   - Seleccionar branch `master`
   - Configurar variables de entorno
   - DO detecta Dockerfile automaticamente

4. **DNS:** Cambiar CNAME en Cloudflare de Vercel a DO

#### D.4 - DigitalOcean vs Vercel: comparacion de costos

| Concepto | Vercel Pro | DO App Platform |
|---|---|---|
| Base | $20/mes | $12/mes |
| Bandwidth incluido | 1TB | 100GB (App) |
| Funciones serverless | 1M invocaciones | Ilimitado (es server) |
| Timeout maximo | 60s | Sin limite |
| Workers/Cron | Via Vercel Cron | Worker dedicado ($5+) |
| Scaling automatico | Si | Si (horizontal) |
| **Total ~500 pedidos/mes** | **$20-35** | **$12-25** |

---

### FASE E: Infraestructura Completa (Escala)
**Costo: $50-150 USD/mes | Cuando: negocio validado, multiples clientes**

Para cuando PrintUp crezca o quiera ofrecer la plataforma a otras imprentas.

#### E.1 - Stack de escala

```
                   printup.cl
                       |
                  Cloudflare
                  (CDN + WAF)
                       |
              +--------+--------+
              |                 |
    DigitalOcean           DigitalOcean
    App Platform           Managed DB
    (Next.js app)          (PostgreSQL)
    $24/mes (Pro)          $15/mes
              |                 |
              +-----+-----+----+
                    |     |
              +-----+  +--+----+
              |        |        |
          Supabase   Redis   S3/Spaces
          Auth+      Cache   Storage
          Realtime   $15/m   $5/mes
          $25/mes
```

#### E.2 - Migrar DB de Supabase a DigitalOcean Managed DB

**Cuando hacerlo:**
- Cuando Supabase Pro ($25/mes) no alcance en storage o performance
- Cuando necesites replicas de lectura
- Cuando quieras backups cada hora

**Pasos:**
1. Crear Managed PostgreSQL en DO ($15/mes - 1GB RAM, 10GB storage)
2. `pg_dump` de Supabase
3. `pg_restore` en DO
4. Cambiar connection string en variables de entorno
5. Mantener Supabase SOLO para Auth + Realtime (son dificiles de reemplazar)

#### E.3 - Storage: DigitalOcean Spaces
- Compatible con S3 API
- $5/mes: 250GB storage + 1TB bandwidth
- Para: imagenes de productos, archivos de formularios, comprobantes, OPs PDF
- CDN incluido

#### E.4 - Worker dedicado para tareas pesadas
- DigitalOcean Worker ($5/mes):
  - Sync con NextCloud
  - Generacion de PDFs
  - Procesamiento de imagenes
  - Envio masivo de emails (campanas)
  - Limpieza de datos (cron)

---

### FASE F: Multi-tenant SaaS (Futuro)
**Cuando: quieras vender la plataforma a otras imprentas**

#### F.1 - Modelo multi-tenant
```
admin.printup.cl      -> Instancia PrintUp
admin.otraimprenta.cl -> Instancia OtraImprenta
admin.graficas-x.cl   -> Instancia GraficasX
```

Cada tenant tiene:
- Su propia base de datos (schema isolation) o Row Level Security
- Su propio subdominio
- Sus propias credenciales de Meta, MercadoPago, Resend
- Su propio branding (colores, logo)

#### F.2 - Implementacion tecnica
- **Row Level Security (RLS)** en Supabase/PostgreSQL:
  ```sql
  ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation ON productos
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
  ```
- **Middleware** que detecta el tenant por dominio/subdominio
- **Tabla de tenants** con configuracion por empresa
- **Billing** con Stripe (planes mensuales)

#### F.3 - Pricing sugerido

| Plan | Precio | Incluye |
|---|---|---|
| Starter | $19.990 CLP/mes | Tienda + admin + 1 canal WA |
| Pro | $39.990 CLP/mes | + Bot IA + Multi-canal + Campanas |
| Enterprise | $79.990 CLP/mes | + OPs + NextCloud + API + Soporte |

---

## 4. Checklist de Despliegue Inmediato (Fase A)

```
[ ] 1. Crear cuenta en Vercel (si no existe)
[ ] 2. Conectar repositorio GitHub app-formularios
[ ] 3. Configurar branch de produccion: master
[ ] 4. Agregar TODAS las variables de entorno en Vercel
[ ] 5. Hacer primer deploy: vercel --prod
[ ] 6. Verificar que la app carga correctamente
[ ] 7. Configurar dominio printup.cl en Vercel
[ ] 8. Verificar SSL/HTTPS
[ ] 9. Configurar webhook de Meta con URL de produccion
[ ] 10. Probar flujo completo: formulario -> email -> admin
[ ] 11. Probar MercadoPago webhook con URL de produccion
[ ] 12. Verificar cron jobs (carritos abandonados)
[ ] 13. Crear cuenta Cloudflare y configurar DNS (Fase B)
[ ] 14. Configurar dominio de email en Resend (SPF/DKIM/DMARC)
[ ] 15. Hacer pedido de prueba end-to-end
```

---

## 5. Seguridad

| Medida | Donde | Como |
|---|---|---|
| Variables de entorno | Vercel/DO | Nunca en codigo. .env.local solo en dev |
| HTTPS forzado | Cloudflare | SSL Full (Strict) |
| Rate limiting | Cloudflare WAF | Regla: max 100 req/min por IP en /api/* |
| Auth admin | JWT propio | Ya implementado en src/lib/auth.ts |
| Auth cliente | Supabase Auth | Ya implementado |
| Webhook verification | Meta signature | Ya implementado en src/lib/meta.ts |
| Webhook MP | Signature check | Agregar verificacion HMAC |
| SQL injection | Supabase client | Queries parametrizadas (ya lo hacen) |
| XSS | Next.js | React auto-escapa. Validar inputs server-side |
| CORS | Next.js middleware | Restringir origenes permitidos |
| Backup DB | Supabase Pro | Backups diarios automaticos |
| Secrets rotation | Vercel | Rotar tokens cada 90 dias |

---

## 6. Mapa de Costos por Etapa

| Etapa | Servicios | Costo mensual USD |
|---|---|---|
| **A: MVP** | Vercel Free + Supabase Free + Resend Free | $0 |
| **A: MVP Pro** | Vercel Free + Supabase Pro | $25 |
| **B: Hardened** | + Cloudflare Free + Sentry Free + UptimeRobot | $25 |
| **C: NC Cloud** | + Hetzner VPS para NextCloud | $30 |
| **D: DO Migration** | DO App + Supabase Pro | $37-50 |
| **E: Full Scale** | DO App + DO DB + Spaces + Worker | $60-100 |
| **F: Multi-tenant** | Escala segun tenants | $100+ |

---

## 7. Recomendacion Final

**Para PrintUp hoy (mayo 2026):**

1. **Desplegar YA** en Vercel Hobby + Supabase Free = **$0/mes**
2. Cuando tengas trafico real, subir a Supabase Pro = **$25/mes**
3. NextCloud mantenerlo local o moverlo a Hetzner = **$0-5/mes**
4. **NO migrar a DO** hasta que Vercel sea limitante (probablemente no antes de 500+ pedidos/mes)
5. **NO pensar en multi-tenant** hasta validar el modelo de negocio con PrintUp propio

**El stack Vercel + Supabase + Resend + Meta Cloud API es la combinacion
mas costo-efectiva y con mejor DX para un e-commerce SaaS en 2026.**

---

## 8. Fuentes

- [Vercel - Next.js Deployment](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Supabase - Getting Started](https://supabase.com/docs/guides/getting-started)
- [Supabase + Next.js Starter](https://vercel.com/templates/next.js/supabase)
- [DigitalOcean App Platform vs Vercel](https://www.digitalocean.com/resources/articles/digitalocean-vs-vercel)
- [Migrar Next.js de Vercel a DigitalOcean](https://bleext.com/post/how-to-migrate-nextjs-from-vercel-to-your-own-vps-on-digital-ocean)
- [DigitalOcean Next.js Hosting](https://www.digitalocean.com/solutions/nextjs-hosting)
- [MakerKit - Next.js + Supabase SaaS](https://makerkit.dev/next-supabase)
- [Why Next.js for SaaS 2026](https://makerkit.dev/blog/tutorials/why-you-should-use-nextjs-saas)
- [Best SaaS Boilerplates Next.js 2026](https://shipai.today/blog/best-saas-boilerplate-nextjs-2026)
- [Stripe + Supabase SaaS Starter](https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
