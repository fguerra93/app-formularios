# `src/server/` — Capa backend de PrintUp

Capa de servidor del repo Next.js. **No es un servicio aparte**: el App Router y las API routes
siguen siendo el borde HTTP; aquí baja la lógica de datos y dominio. Esto habilita la **Variante B**
(migrar a Cloud SQL Postgres) sin tocar las ~95 rutas — solo se cambia esta capa.

## Estructura

```
src/server/
  db/            Chokepoint de acceso a datos. getDb() hoy devuelve el cliente
                 service-role de Supabase; en Fase 8B se cambia a pg/Cloud SQL aquí.
  domain/        Tipos del dominio (reexporta src/lib/types.ts).
  repositories/  Un repo por agregado. Métodos orientados al dominio que devuelven
                 tipos del dominio (no filas crudas del proveedor).
  services/      (futuro) Lógica de dominio reutilizable (FSM, eventos, etc.).
```

## Regla de oro

`supabase.from(` y `.storage.from(` **solo** pueden aparecer dentro de `src/server/`.
Todo lo demás (rutas, componentes, libs) habla con los **repositorios**. Así el proveedor de datos
queda encapsulado en un único lugar y la migración a Cloud SQL es de bajo riesgo.

## Estado de migración (Fase 1) — COMPLETA ✅

`npm run build` y `npx tsc --noEmit` verdes. `supabase.from(` y `.storage.from(` ya no aparecen
fuera de `src/server/` salvo el subsistema Auth diferido (ver abajo).

**Repositorios (`src/server/repositories/`):** `productos`, `pedidos`, `zonas`, `configuracion`,
`categorias`, `cupones`, `notificaciones-stock`, `clientes`, `stats`, `reviews`, `preguntas`,
`portafolio` (+`clientesDestacados`), `newsletter`, `formularios`, `storage`, `carritos`,
`campanas`, `designer` (`areasDiseno`/`clipart`/`fuentes`/`disenos`), `pagos`, `whatsapp`,
`mensajeria` (+`mensajesRapidos`/`respuestasAutomaticas`), `templates`.

**Áreas migradas (toda la superficie HTTP + libs de servidor):**
- Núcleo y catálogo público; admin CRUD (productos, categorías, envíos, cupones, pedidos).
- Cliente-data/config/stats; reviews, preguntas, portafolio, clientes destacados, newsletter.
- Formularios + uploads (`upload`, `upload-url`, `admin/productos/upload`), email/track (open/click),
  cron `carritos-abandonados`, `sitemap.ts`, `admin/contactos`.
- Designer admin + público (areas-diseño, clipart, fuentes, disenos).
- Pagos (`webhook` MercadoPago, `crear-preferencia`).
- WhatsApp admin (conversaciones, cotizaciones, stats) y mensajería unificada admin
  (conversaciones, enviar, stats, mensajes-rápidos, respuestas-automáticas).
- Bot completo: `src/lib/bot/*` (engine, ai, notifications, flows) + `src/lib/meta.ts`, y los
  webhooks `webhooks/meta` y `test/whatsapp-webhook`.
- Campañas: CRUD, stats, segmentos/preview, templates (+duplicate), test y envío masivo.

**Diferido a Fase 8 (subsistema de Auth de clientes — único SDK fuera de `src/server/`):**
`cliente/perfil`, `cliente/pedidos`, `cliente/carrito`, `src/lib/auth-client.ts`,
`components/auth/auth-provider.tsx`. Usan cliente Supabase por-request con token de usuario +
`supabase.auth` + RLS; migran junto con el reemplazo de Supabase Auth por JWT propio (Fase 8B).

> Nota: el sitemap y algunas rutas públicas usaban el cliente anónimo (`getSupabase()`); al
> relocalizarse pasan por `getDb()` (service-role). Para filas públicas activas el resultado es
> equivalente; al cambiar a Cloud SQL (Fase 8) la autorización vivirá en la app, no en RLS.
