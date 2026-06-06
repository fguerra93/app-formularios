# Deploy — PrintUp (Cloud Run + Variante B)

## Estado

- **Parte 1 (containerización): LISTA.** `output: 'standalone'` en `next.config.ts`,
  `Dockerfile` multi-stage (node 22), `.dockerignore`, `.gcloudignore` y
  `deploy/run-env.sandbox.yaml`. `npm run build` genera `.next/standalone/server.js`.
- **Parte 2B (datos todo-GCP): PENDIENTE** (requiere la instancia Cloud SQL viva).
  Hoy la app corre sobre el SDK de Supabase (Variante A) y queda lista para deploy
  inmediato así. La Parte 2B se ejecuta al provisionar `printup-sql`.

## Probar el contenedor localmente

```bash
docker build -t printup .
docker run --rm -p 3000:3000 --env-file .env.local printup
# -> http://localhost:3000
```

Si no hay Docker local, `gcloud run deploy --source .` deja que Cloud Build use
este mismo `Dockerfile`.

## Migraciones SQL — ORDEN de ejecución (antes/durante el deploy)

Aplicar en Supabase/Postgres en este orden (todas idempotentes):

1. `supabase/schema.sql` / `schema-ecommerce.sql` … (base existente del proyecto)
2. `supabase/schema-inventario.sql`        — stock, descontar/reponer
3. `supabase/schema-seguridad.sql`         — webhook_eventos, usuarios_admin, audit_log
4. `supabase/schema-fase3-nucleo.sql`      — domain_events, notificaciones, reservas
5. `supabase/schema-fase4-aprobaciones.sql`— aprobaciones, vw_ventas_por_dia
6. `supabase/schema-fase5-bot.sql`         — planillas_precios, bot_intent_cache
7. `supabase/schema-fase6-dte.sql`         — dte_* en pedidos, notas_credito
8. `supabase/schema-fase7-produccion.sql`  — ordenes_produccion

> Mientras NO estén aplicadas, el código degrada best-effort (RPC/tablas ausentes
> → `catch` no fatal): el sitio, checkout, webhook y admin siguen funcionando.

## Bootstrap del admin (RBAC)

1. Definir `ADMIN_EMAIL` + `ADMIN_PASSWORD` + `JWT_SECRET` en el entorno.
2. Primer login con esas credenciales (válido solo mientras `usuarios_admin` esté vacía).
3. Crear los usuarios reales (admin/vendedor/bodega) vía `POST /api/admin/usuarios`.
   A partir de ahí el login se valida contra la tabla.

## Crons a agendar (Cloud Scheduler) — POST con `Authorization: Bearer $CRON_SECRET`

- `/api/cron/procesar-eventos`     — worker del outbox (cada 1-2 min)
- `/api/cron/liberar-reservas`     — libera reservas vencidas (cada 10-15 min)
- `/api/cron/carritos-abandonados` — recuperación de carritos (cada 1-6 h)

## Parte 2B — pasos concretos (todo-GCP)

1. **Provisionar Cloud SQL Postgres** (instancia propia, separada de adminsmart-sql):
   ```bash
   gcloud sql instances create printup-sql --database-version=POSTGRES_16 \
     --tier=db-f1-micro --region=southamerica-west1 --storage-size=10GB \
     --storage-type=HDD --no-backup
   gcloud sql databases create printup --instance=printup-sql
   gcloud sql users create printup --instance=printup-sql --password=...
   ```
   Anotar `CONNECTION_NAME` = `adminsmart:southamerica-west1:printup-sql`.
2. **Aplicar el esquema** (mismas migraciones de arriba; ya es Postgres). Quitar las
   políticas RLS dependientes de `auth.uid()` (la autorización pasa a la app/repos).
3. **Swap de `src/server/db`**: instalar `pg` + `@google-cloud/cloud-sql-connector`;
   reimplementar `getDb()` para hablar SQL por unix socket `/cloudsql/$CONNECTION_NAME`.
   Como TODO el acceso a datos está detrás de `src/server/repositories` (Fase 1),
   el cambio es de implementación, no de las ~95 rutas. (Trabajo grande; hacerlo con
   la instancia viva para poder probar cada repo.)
4. **Auth de clientes** (subsistema diferido): reemplazar Supabase Auth por JWT propio
   (jose) + tabla `clientes` con hash; migrar `cliente/perfil|pedidos|carrito`,
   `src/lib/auth-client.ts`, `components/auth/auth-provider.tsx`.
5. **Storage**: reemplazar Supabase Storage por Cloudflare R2 (SDK S3) en
   `src/server/repositories/storage.ts` (un solo lugar).

## Deploy a Cloud Run (un solo servicio)

```bash
gcloud run deploy printup-app --source . --region southamerica-west1 \
  --allow-unauthenticated --min-instances 0 --max-instances 2 \
  --memory 512Mi --cpu 1 --port 3000 \
  --env-vars-file deploy/run-env.sandbox.yaml
# Variante B: agregar --add-cloudsql-instances adminsmart:southamerica-west1:printup-sql
```

Secretos sensibles via `--set-secrets` (Secret Manager), NO en el YAML.
