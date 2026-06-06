# Decisión de Infraestructura — PrintUp (Fase 0)

> Registro de la validación de infraestructura y la decisión de arquitectura para el despliegue
> del sandbox de PrintUp en GCP. Hermano de `PROMPTS-TRANSICION-GCP-SANDBOX.md` y
> `PLAN-MAESTRO-SITIO-DEFINITIVO.md`.
>
> Fecha: 2026-06-05

---

## ✅ Decisión: VARIANTE B (todo-GCP)

- **Compute:** Cloud Run (servicio `printup-app`), `min-instances=0` (escala a cero), región
  `southamerica-west1` (Santiago).
- **Base de datos:** **instancia Cloud SQL Postgres `printup-sql` PROPIA y SEPARADA** de
  `adminsmart-sql`. Negocios distintos → instancias distintas (aislamiento de datos, credenciales,
  límites de conexión y costos). `db-f1-micro`, 10 GB, `southamerica-west1`.
- **Storage:** Cloudflare R2 (bucket nuevo `printup-archivos`), API S3-compatible.
- **Auth:** propia (JWT con `jose`, ya usada en el admin) — se reemplaza Supabase Auth.
- **Proyecto/billing GCP:** se reutiliza el proyecto `adminsmart` (mismo billing), conviviendo con
  AdminSmart. **No** se comparte la instancia de BD.

**Costo objetivo:** Cloud Run `min=0` ≈ **$0** + `printup-sql` `db-f1-micro` ≈ **$8/mes**. R2 y
Cloudflare gratis. Total nuevo ≈ **$8/mes** (sumado al $8 que ya cuesta AdminSmart, en el mismo proyecto).

---

## Validación empírica (gcloud, 2026-06-05)

Ejecutado contra la cuenta real:

| Comprobación | Resultado |
|---|---|
| `gcloud --version` | Google Cloud SDK **571.0.0** instalado |
| Cuenta / proyecto activos | `guerrafelipe93@gmail.com` · proyecto **`adminsmart`** |
| `gcloud sql instances list` | **`adminsmart-sql`** — MYSQL_8_0, db-f1-micro, southamerica-west1-b, RUNNABLE |
| `gcloud run services list` | **`adminsmart-api`** ya desplegado en southamerica-west1 |
| APIs habilitadas | `run`, `sqladmin`, `cloudbuild`, `artifactregistry` ✅ · **falta `secretmanager`** (habilitar en Fase 9) |

### Reutilización de cuentas — conclusión

| Recurso | ¿Reutilizable? | Acción |
|---|:--:|---|
| Proyecto GCP `adminsmart` + billing | ✅ Sí | `printup-app` y `printup-sql` viven en el mismo proyecto |
| Cuenta Cloudflare + R2 | ✅ Sí | Nuevo bucket `printup-archivos` |
| Instancia `adminsmart-sql` (MySQL) | ❌ No | Es MySQL y PrintUp es Postgres; además son negocios distintos → **instancia separada `printup-sql`** |

---

## Inventario de dependencias del SDK de Supabase (alcance de la Variante B)

Medido en el repo (`supabase.from(`, `supabase.auth.`, `.storage.from(`, `getSupabaseAdmin`,
`getSupabase`, `createServerClient`, `createBrowserClient`):

- **254 ocurrencias en 102 archivos.**

Distribución por área (aprox.):

| Área | Qué hay que hacer en la Variante B |
|---|---|
| API routes públicas y de cliente (`/api/**`) | Pasar a repositorios (Fase 1); el SDK queda encapsulado |
| API routes admin (`/api/admin/**`) | Pasar a repositorios |
| Auth de clientes (`src/lib/auth-client.ts`, `components/auth/auth-provider.tsx`, `/api/cliente/*`) | **Reemplazar Supabase Auth** por JWT propio + tabla `clientes` con hash (Fase 8B) |
| Storage (`sync-worker`, uploads) | **Reemplazar Supabase Storage** por R2 S3 (Fase 8B) |
| Bot (`src/lib/bot/*`) | Pasar lecturas a repositorios |

**Estrategia:** la **Fase 1** encapsula los 254 usos detrás de `src/server/repositories/*`. Una vez
encapsulado, la **Fase 8B** cambia la *implementación* del cliente de datos (de Supabase a `pg`/Cloud
SQL) y reemplaza Auth y Storage **sin tocar las ~95 rutas** (solo la capa `src/server/`).

---

## Plan de provisión (se ejecuta en Fase 9)

```
# Instancia Postgres SEPARADA para PrintUp
gcloud sql instances create printup-sql \
  --database-version=POSTGRES_16 --tier=db-f1-micro \
  --region=southamerica-west1 --storage-size=10GB --storage-type=HDD --no-backup
gcloud sql databases create printup --instance=printup-sql
gcloud sql users create printup --instance=printup-sql --password=<secreto>

# Conexión desde Cloud Run (Node): unix socket /cloudsql/<CONNECTION_NAME>
#   CONNECTION_NAME = adminsmart:southamerica-west1:printup-sql
# NO usar socket factory de Java (eso fue AdminSmart). Node usa 'pg' + el socket o el connector.

# Deploy (un solo servicio; PrintUp es Next.js unificado, sin _worker.js)
gcloud run deploy printup-app --source . --region southamerica-west1 \
  --allow-unauthenticated --min-instances 0 --max-instances 2 \
  --memory 512Mi --cpu 1 --port 3000 \
  --add-cloudsql-instances adminsmart:southamerica-west1:printup-sql \
  --env-vars-file deploy/run-env.sandbox.yaml
```

---

## Estado de ejecución

- [x] Fase 0 — validación e infra decidida (este documento).
- [ ] Fase 1 — capa `src/server/` + repositorios (en progreso).
- [ ] Fases 2–7 — features.
- [ ] Fase 8 — container + swap a Postgres + R2 + auth propia.
- [ ] Fase 9 — provisión `printup-sql` + deploy.
- [ ] Fase 10 — UAT.
