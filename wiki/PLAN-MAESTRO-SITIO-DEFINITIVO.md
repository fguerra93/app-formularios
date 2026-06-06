# Plan Maestro — Plataforma Definitiva PrintUp

> **Qué es este documento:** el análisis técnico y la propuesta integrada para llevar el
> código actual a su **versión máxima profesional**: un ecommerce + CRM + mensajería
> omnicanal + producción, robusto, seguro y sin dependencia de Shopify.
>
> Incluye: diagnóstico real del código, costos reales de despliegue en GCP (verificados),
> revisión de todas las funciones del admin, los patrones de diseño de la industria que lo
> vuelven robusto, la arquitectura del bot con aprobación del dueño, y el roadmap de deploy.
>
> Última actualización: 2026-06-04 · Reemplaza el plan de 12 fases anterior.

---

## 0. Estado real de partida (corrección importante)

**Shopify ya NO es una dependencia viva.** En el código solo existe `scripts/sync-shopify.mjs`
+ `supabase/seed-shopify-products.sql`: un **importador de una sola vía** (Shopify → tabla
`productos` en Supabase). El catálogo, stock, pedidos, precios y clientes ya viven 100% en la
base de datos propia.

> **Implicancia:** PrintUp ya está técnicamente fuera de Shopify. Lo que falta **no es
> "desconectarse"**, es **cerrar brechas** (facturación legal, roles, producción, aprobaciones)
> y desplegar. Esto no es un reemplazo: es un cierre de funciones.

### Stack actual

| Capa | Tecnología |
|---|---|
| Frontend + API | Next.js 16.2.4 (App Router) + ~95 API routes = el backend |
| UI | React 19.2.4, Tailwind 4, shadcn/ui, Framer Motion, Recharts |
| Base de datos | Supabase (PostgreSQL, 40 tablas en 11 migraciones) |
| Auth clientes | Supabase Auth (`@supabase/ssr`) |
| Auth admin | JWT propio (`jose`) — **un solo usuario hardcodeado** |
| Pagos | MercadoPago SDK 2.12 |
| Emails | Resend 6.12 |
| Mensajería | Meta Cloud API directa (WhatsApp / Instagram / Facebook) |
| Bot | Lógica propia en `src/lib/bot/` + Claude Haiku como fallback |
| Storage / respaldo | Supabase Storage + worker NextCloud (Docker) + Cloudflare R2 (opcional) |

---

## 1. Diagnóstico del código

Lo que existe es **mucho más que "un ecommerce con admin"**: es una plataforma de comercio +
CRM + mensajería omnicanal a medio camino de un ERP-lite.

### Lo que está sólido

| Área | Estado |
|---|---|
| Catálogo, categorías, variantes, calculadora m² | Completo |
| Checkout con recálculo server-side (`src/lib/checkout.ts`) | Bien hecho — anti-manipulación de precios y piso para productos dinámicos |
| Inventario atómico (`descontar_stock` con `FOR UPDATE`, `supabase/schema-inventario.sql`) | Correcto — evita sobreventa por condición de carrera |
| Bot omnicanal (`src/lib/bot/`) | Funcional: onboarding, menú, flujos, intents + fallback IA, escalación a humano |
| Mensajería unificada WA/IG/FB | Webhook con firma HMAC verificada (`src/lib/meta.ts`) + bandeja en admin |
| Pagos MercadoPago + webhook | Funcional |
| 18+ secciones de admin | Ver sección 3 |

### Puntos ciegos reales (ordenados por gravedad)

| # | Punto ciego | Gravedad | Dónde |
|---|---|:--:|---|
| 1 | **Admin de un solo usuario hardcodeado** (`ADMIN_USER`/`ADMIN_PASSWORD`, JWT único, rol fijo) | 🔴 Alta | `src/lib/auth.ts` |
| 2 | **Webhook MercadoPago sin verificar firma** — un POST puede falsear un "pago aprobado" | 🔴 Alta | `src/app/api/pagos/webhook/route.ts` |
| 3 | **Sin idempotencia en webhooks** — un reintento puede duplicar descuento de stock / emails | 🔴 Alta | webhook + `descontar_stock` |
| 4 | **Sin boleta/factura electrónica (SII)** — requisito *legal* para vender en Chile | 🔴 Alta | no existe |
| 5 | **Capa de datos dispersa** — `supabase.from()` repetido en ~95 rutas, sin repositorios | 🟡 Media | todo `src/app/api/**` |
| 6 | **Sin cola de aprobación unificada** — el requisito "el dueño solo aprueba" no existe aún | 🟡 Media | — |
| 7 | **Sin módulo de producción / OP** (Kanban del taller) | 🟡 Media | planeado, no construido |
| 8 | Sin rate-limiting, sin Sentry, sin audit log (quién hizo qué) | 🟡 Media | — |
| 9 | Sin devoluciones/reembolsos, sin reportes PDF | 🟢 Baja | — |
| 10 | `ANTHROPIC_API_KEY` (bot) no está documentada en `.env.example` | 🟢 Baja | `src/lib/bot/ai.ts:12` |

> Ninguno es estructural. Son brechas cerrables. El diseño base (recálculo server-side, stock
> atómico, firma de webhook Meta) demuestra criterio sólido.

---

## 2. Costo real de desplegar en GCP

### La verdad incómoda primero

**El código NO está construido para GCP — está construido para Supabase.** Cada
`supabase.from(...)`, cada `supabase.auth.signInWithPassword`, cada `storage.from()` depende del
SDK de Supabase. GCP no tiene equivalente directo. Por eso "desplegar todo en GCP, base de datos
y todo" se bifurca en 3 caminos reales:

- **Opción A — Cloud Run + mantener Supabase.** La app (contenedor Next.js, output `standalone`)
  corre en Cloud Run; los datos siguen en Supabase. Migración: **casi cero código**. En sandbox,
  con Supabase Free, esto cuesta prácticamente **$0**.
- **Opción B — GCP nativo** (Cloud Run + Cloud SQL + GCS + Firebase Auth). Todo en GCP, pero hay
  que **reescribir la capa de datos** (`supabase-js` → Drizzle/Prisma en ~95 rutas),
  **reemplazar Supabase Auth** por Firebase Auth/Identity Platform y mover Storage a GCS. Proyecto
  de varias semanas.
- **Opción C — Supabase auto-hospedado en una VM de GCP** (Compute Engine + Docker). Todo en GCP
  *y* se conserva el código tal cual (Supabase es open source). El costo: **te vuelves el
  administrador del servidor** (backups, parches, uptime).

### Precedente real propio (no teoría)

El ecosistema hermano **AdminSmart** ya desplegó un **sandbox demo en GCP Santiago el 2026-06-03**
(ver `Adminsmart/.../wiki/Infraestructura-SaaS-y-Escalamiento.md`) para un cliente grande (San
Alfonso del Mar, ~300 unidades). Costo real del entorno:

| Capa | Servicio | Costo real |
|---|---|---|
| Backend | Cloud Run `min-instances=0` (escala a cero, acepta cold start en demo) | **~$0** (free tier) |
| Frontend + landing | Cloudflare Pages | **$0** |
| Storage | Cloudflare R2 (10 GB) | **$0** |
| Base de datos | Cloud SQL `db-f1-micro`, 10 GB HDD, `--no-backup` | **~$8/mes (único costo fijo)** |

Playbook usado: `gcloud run deploy --source .` (Cloud Build compila, no necesitas Docker local),
conexión a Cloud SQL por **socket factory** (sin VPC connector = sin costo de red), front en Pages
con un `_worker.js` que proxea `/api/*` (mismo origen para cookies). **Ese mismo playbook aplica a
PrintUp**, con un matiz clave abajo.

### El matiz PrintUp vs AdminSmart

AdminSmart llegó a $8 trivialmente porque usa **JDBC crudo sobre MySQL**: apuntar a Cloud SQL es
cambiar un connection string. PrintUp está **atado al SDK de Supabase** (`supabase.from()`, Auth,
Storage). Por eso para PrintUp el sandbox barato tiene dos caminos:

- **Camino $0, cero rework:** Cloud Run (escala a cero) + **Supabase Free** (Postgres + Auth +
  Storage incluidos). No tocas una línea. (Único pero: el proyecto Free se pausa tras 7 días sin
  uso y se despierta solo al volver — irrelevante para un demo.)
- **Camino ~$8, todo-GCP estilo AdminSmart:** Cloud Run + Cloud SQL `db-f1-micro`. Implica salir
  del SDK Supabase (o self-host con Opción C). Vale la pena solo si la meta es "todo en GCP".

### Tarifas base (list price, verificadas — ver fuentes)

Región **Santiago (`southamerica-west1`)**, la más cercana a Chile. Es **Tier 2** en Cloud Run
(≈40% más cara que us-central) y más cara en Cloud SQL. São Paulo es alternativa equivalente.

- **Cloud Run Tier 2:** CPU **$0.0000336/vCPU-s**, memoria **$0.0000035/GiB-s**, **$0.40/millón**
  de requests. Free tier: 180.000 vCPU-s + 360.000 GiB-s + 2M requests/mes. **`min-instances=0`
  (escala a cero) ⇒ ~$0** en tráfico de demo.
- **Cloud SQL:** `db-f1-micro` (compartida, lo que usa AdminSmart) **~$8–9/mes**; `db-g1-small`
  **~$10–15/mes** — ambas **SIN SLA**; dedicada 1 vCPU/3.75 GB ≈ `(1×$0.0413 + 3.75×$0.0070)×730h`
  ≈ **$49/mes en us-central → ~$60–65 en Santiago** + almacenamiento (~$0.17/GB SSD).

### Costos por escenario (corregido)

| Componente | **Sandbox/Demo** (lo que el dueño prueba) | **Producción lean** (vende, tráfico bajo, sin HA) | **Producción seria** (HA/SLA, alto volumen) |
|---|---:|---:|---:|
| App — Cloud Run | `min=0` escala a cero → **~$0** | `min=1` sin cold start → **$10–20** | scaling 1–N → **$25–50** |
| Base de datos | Supabase Free **$0** · *o* Cloud SQL `db-f1-micro` **$8** | `db-f1-micro`/`db-g1-small` **$8–15** · *o* Supabase Pro $25 | Cloud SQL dedicada + réplica HA **$120–180** |
| Storage + CDN | Cloudflare R2 + Pages **$0** | R2 **$0–3** + Cloudflare free | GCS/R2 + CDN **$10–25** |
| Auth / Secrets / misc | $0 | $1–5 | Secret Mgr + networking **$15–35** |
| **Total USD/mes** | **~$0–8** | **~$15–30** | **~$170–280** |
| **Total CLP/mes (aprox)** | **~$0–8k** | **~$15–29k** | **~$160–270k** |

> Servicios externos que se suman en cualquier escenario (y **no** cuentan como "infra GCP"):
> Resend ($0 hasta 3k emails/mes), Meta WhatsApp (~$5–15/mes por templates), Claude API del bot
> (~$5–10/mes), dominio (~$1.500 CLP/mes).

### Recomendación honesta de infraestructura

1. **Sandbox para el dueño → ~$0–8/mes.** Replica el playbook que ya ejecutaste en AdminSmart:
   Cloud Run `min-instances=0` + (Supabase Free para cero rework **o** Cloud SQL `db-f1-micro` para
   todo-GCP) + Cloudflare Pages/R2. El número que intuías ($8) es correcto.
2. **Cuando venda de verdad → ~$15–30/mes** en GCP lean (`min-instances=1` + Cloud SQL micro/small),
   o **$25–45** si prefieres Vercel + Supabase Pro por comodidad. Tu "<$30 en prod" también es correcto.
3. **El tier de $170–280/mes es SOLO HA/SLA con alto volumen** — no es el costo de entrada. Mi
   estimación anterior ancló en ese escenario por error; este tier se justifica recién cuando el
   volumen de pedidos lo pida (no es el caso hoy).

> **Veredicto:** el sandbox sale **~$0–8/mes** (tienes el playbook probado). Producción lean,
> **~$15–30/mes**. Reserva el tier de cientos de dólares para cuando haya HA/SLA por volumen real.
> La jugada que abarata *cualquier* migración futura es el **patrón de repositorios**
> (sección 4 · Patrón 5): encapsular el acceso a datos convierte "salir de Supabase a Cloud SQL"
> de un terror de 95 archivos a cambiar una sola capa — justo lo que separa el camino $0 del camino $8.

---

## 3. Revisión de TODAS las funciones del admin + brechas para reemplazar Shopify

El admin ya es un **CRM/ERP-lite** con 18+ secciones. Esto es lo que hace cada una y lo que le
falta para ser un reemplazo profesional de Shopify:

| Módulo admin | Hoy hace | Brecha para "versión máxima" |
|---|---|---|
| `/admin` Dashboard | Métricas | + alertas accionables (pagos sin validar, formularios >24h, stock bajo), realtime |
| `/admin/productos` (+nuevo, [id], personalización) | CRUD completo, calculadora m², variantes, áreas de diseño | OK. + bulk edit, importador CSV |
| `/admin/categorias` | CRUD | OK |
| `/admin/pedidos` (+[id]) | Gestión, filtros, export CSV | + máquina de estados formal, timeline, factura/boleta, devoluciones |
| `/admin/inventario` | Stock + alertas, movimientos | OK (ya con `descontar_stock`). + reservas con TTL |
| `/admin/envios` | Zonas, precios, días | + integración courier (Starken/Chilexpress) y tracking |
| `/admin/cupones` | Descuentos | OK |
| `/admin/contactos` | "CRM" de contactos | ⚠️ Convertir en **Cliente 360**: timeline unificado (pedidos + mensajes + cotizaciones + valor histórico) |
| `/admin/reviews`, `/admin/preguntas` | Moderación Q&A / reseñas | OK |
| `/admin/portafolio` | Trabajos + clientes destacados | OK |
| `/admin/newsletter` + `/admin/campanas` (+templates, editor) | Email marketing con editor visual, tracking opens/clicks | OK — sorprendentemente completo |
| `/admin/mensajeria` (+config) | Bandeja unificada WA/IG/FB, respuestas automáticas, mensajes rápidos | + cola de aprobación, asignación, SLA (sección 5) |
| `/admin/whatsapp` | Bot + cotizaciones WA | + cotización automática por planilla, tool-use (sección 5) |
| `/admin/designer` | Clipart + fuentes | OK |
| `/admin/configuracion` | 9 tabs | + tab de **usuarios/roles** (RBAC) |
| `/admin/historial` + `/admin/formularios/[id]` | Formularios | + validación de imagen/pago con botón aprobar |

### Lo que NO existe y separa de un "Shopify propio"

1. 🔴 **Multi-usuario con roles (RBAC)** — dueño / vendedor / bodega-producción.
2. 🔴 **Boleta/Factura electrónica SII** — vía LibreDTE (open source, barato), Bsale o Haulmer.
3. 🟡 **Módulo de Producción (OP + Kanban)** — el corazón de una imprenta.
4. 🟡 **Cola de aprobaciones del dueño** — el requisito central.
5. 🟡 **Devoluciones/reembolsos**, **audit log**, **reportes PDF**.

---

## 4. System design: los patrones que lo hacen robusto

Patrones probados de la industria, mapeados a este caso. Cada uno cierra un punto ciego concreto y
es construible de forma incremental.

### Patrón 1 — Máquina de estados (FSM) para pedidos y OP ★
Hoy los estados son strings sueltos. Formalizarlos: una tabla de definición con **transiciones
permitidas + guardas**. Un pedido solo puede ir `pendiente → pagado → en_producción → listo →
entregado` (y ramas `cancelado/devuelto`). Imposible saltarse pasos. Es el esqueleto del reemplazo
de Shopify *y* del tracking de producción.

### Patrón 2 — Arquitectura orientada a eventos + Outbox transaccional ★
Cada cambio de estado **emite un evento** (`pedido.pagado`, `arte.aprobado`, `op.lista`) a una
tabla `domain_events` *en la misma transacción* que el cambio. Un worker lee esa tabla y dispara
los efectos: WhatsApp al cliente, email, push al dueño, mover tarjeta Kanban.
**Por qué importa:** hoy si el webhook de MP falla a mitad, se puede descontar stock pero no enviar
el email. Con outbox, **nada se pierde y nada se duplica**. Es lo que vuelve confiable toda la
automatización.

### Patrón 3 — Human-in-the-loop / cola de aprobación ★ (requisito del dueño)
"El dueño solo aprueba o autoriza procesos válidos" = patrón **"el agente propone, el humano
dispone"**. Una tabla `aprobaciones` con acciones tipadas (`validar_pago`, `aprobar_arte`,
`enviar_cotización`, `responder_cliente`). El bot/sistema **nunca ejecuta** una acción sensible: la
deja en cola. El dueño ve una bandeja "Pendientes de aprobación" y aprueba/rechaza con un tap.
Detalle en la sección 5.

### Patrón 4 — Idempotencia + verificación de firma en webhooks 🔴 (cierra #2 y #3)
- Verificar firma HMAC de MercadoPago (ya se hace con Meta; copiar el patrón de `src/lib/meta.ts`).
- Tabla `webhook_eventos` con el `id` del evento como UNIQUE: si llega repetido, se ignora. Cero
  pagos falsos, cero duplicados.

### Patrón 5 — Capa de repositorios (Repository pattern) (cierra #5 + da portabilidad)
Encapsular todo `supabase.from()` en `src/repositories/*.ts` (`pedidosRepo`, `productosRepo`...).
Las rutas API llaman al repo, no a Supabase directo. Beneficio doble: testeable, y **migrar a Cloud
SQL/GCP en el futuro = cambiar una sola capa**, no 95 archivos. Es lo que desbloquea la Opción B de
GCP sin pánico.

### Patrón 6 — RBAC (control de acceso por roles) 🔴 (cierra #1)
Tablas `usuarios_admin`, `roles`, `permisos`. Middleware que valida rol por ruta. Reemplaza el
`admin/admin123` único. Imprescindible para que entren vendedor y bodega sin darles todo.

### Patrón 7 — Bot híbrido: intent → LLM classifier → tool-use
Mantener keywords (gratis, rápido) → si no matchea, Claude Haiku clasifica → para cotizar /
estado-de-pedido, dar al modelo **tool-use** (function calling) para que llame funciones reales y
seguras (`calcularCotizacion`, `buscarPedido`). El LLM **nunca** confirma pagos ni cierra ventas:
solo redacta borradores que van a la cola del Patrón 3.

### Patrón 8 — Read models / CQRS-lite para dashboards
Vistas materializadas o tablas resumen para métricas (ventas por día, por producto). El dashboard
lee de ahí, no calcula en vivo. Rápido y barato.

### Patrón 9 — Reserva de stock con TTL
Al iniciar checkout, reservar el stock (movimiento `reserva`); si no paga en N minutos, se libera.
Evita vender lo que otro está pagando. La tabla `movimientos_stock` ya contempla los tipos
`reserva`/`liberacion` — solo falta cablearlo.

### Patrón 10 — Audit log + observabilidad
Tabla `audit_log` (quién, qué, cuándo) — obligatorio con multiusuario. + Sentry para errores.
+ rate-limiting en endpoints públicos (`/api/pedidos`, `/api/upload`, `/api/pagos/webhook`, auth).

---

## 5. Mensajería + bots: el "dueño solo aprueba" como arquitectura

Dolor: *responderle a todos los clientes*. Regla: *el dueño solo aprueba procesos válidos*. Esto se
diseña combinando los patrones 3 + 7 + 2:

```
Cliente escribe (WA/IG/FB)
        │
        ▼
Webhook Meta ──► guarda mensaje ──► BOT decide nivel de autonomía:
        │
        ├─ VERDE   (info pura: horario, catálogo, dirección, estado de pedido)
        │          → el bot responde SOLO, automático. Cero intervención.
        │
        ├─ AMARILLO (cotización, propuesta de respuesta a duda compleja)
        │          → el bot REDACTA un borrador y lo deja en
        │            "Pendientes de aprobación" → el dueño ve, edita si quiere,
        │            aprueba con 1 tap → se envía.
        │
        └─ ROJO    (confirmar pago, cerrar venta, dato sensible, reclamo)
                   → el bot NO actúa. Escala a humano + notifica al dueño.
```

**Cómo se siente para el dueño:** abre el admin (o le llega un push) y ve una bandeja "Aprobaciones"
con tarjetas:

> *"Cotización lista para Juan (50 poleras DTF): $X. [Aprobar y enviar] [Editar] [Rechazar]"*
> *"Pago de María recibido (comprobante adjunto). [Validar] [Rechazar]"*

Un tap y el sistema hace el resto (envía WhatsApp, genera OP, mueve Kanban — todo vía eventos del
Patrón 2). **El dueño nunca redacta mensajes ni hace seguimiento manual: solo autoriza.**

**Herramientas (decisión confirmada):** **Meta Cloud API directo** (sin ManyChat/Respond.io/Twilio)
+ lógica propia + Claude. Ya está construido el 80% en `src/lib/bot/`; evita $15–45/mes de SaaS y el
vendor lock-in. Falta: (a) cotización automática por planilla, (b) tool-use, (c) la cola de
aprobación, (d) notificaciones proactivas por cambio de estado (Patrón 2).

---

## 6. Propuesta integrada final — camino a la "versión máxima"

Orden que **prioriza desbloquear ventas reales y seguras primero**, y deja lo robusto/escalable
después. Cada bloque es construible con Claude Code en 1–3 sesiones.

| Fase | Qué | Patrones | Resultado |
|---|---|---|---|
| **A. Blindaje** 🔴 | Firma webhook MP + idempotencia + RBAC multiusuario + capa de repositorios | 4, 5, 6, 10 | Operación segura y multi-persona |
| **B. Legal + cobro** 🔴 | Boleta/factura electrónica (LibreDTE), IVA visible, devoluciones | — | **Se puede vender legalmente en Chile** |
| **C. Núcleo robusto** | FSM de pedidos + eventos/outbox + reserva de stock TTL | 1, 2, 9 | Nada se pierde ni duplica; base de la automatización |
| **D. Operación dueño** ★ | Cola de aprobaciones + Cliente 360 + notificaciones proactivas | 3, 8 | "El dueño solo aprueba" |
| **E. Bot pro** | Cotización automática + tool-use + bot proactivo por etapa | 7 | Responde solo lo verde, propone lo amarillo |
| **F. Producción** | Módulo OP + Kanban del taller + PDF de OP | 1, 2 | El taller fluye |
| **G. Deploy versión máxima** | Vercel+Supabase (o Opción A/C en GCP), Sentry, rate-limit, dominio, backups | 10 | **En línea, robusto** |

**Dónde desplegar:** Vercel + Supabase Pro (menor fricción; el código ya está listo). Si se insiste
en GCP por estrategia, la capa de repositorios (Fase A) hace que mover a **Opción C** (Supabase en
VM GCP) o **Opción A** (Cloud Run + Supabase) sea de bajo riesgo, sin tocar las 95 rutas.

---

## Resumen ejecutivo

- **El código ya está fuera de Shopify** (Shopify es solo un importador one-shot). No se reemplaza:
  se cierran brechas.
- **Costos GCP reales por escenario:** sandbox del dueño **~$0–8/mes** (Cloud Run escala-a-cero +
  Supabase Free o Cloud SQL `db-f1-micro`, playbook ya probado en AdminSmart/San Alfonso);
  producción lean **~$15–30/mes**; el tier **$170–280/mes** es solo HA/SLA con alto volumen.
- El admin ya es un CRM/ERP-lite con 18+ módulos. Le faltan 5 cosas para ser "Shopify propio":
  **RBAC, boleta SII, producción, cola de aprobación, devoluciones.**
- El "dueño solo aprueba" no es una feature suelta: es el patrón **human-in-the-loop** + **eventos**
  + **bot con niveles de autonomía**.
- 10 patrones de diseño, todos construibles incrementalmente, todos cerrando un punto ciego concreto.

---

## Apéndice A — Tablas/estructuras nuevas que introduce esta propuesta

| Estructura | Patrón | Propósito |
|---|---|---|
| `domain_events` | 2 | Outbox transaccional de eventos de dominio |
| `aprobaciones` | 3 | Cola de acciones que el dueño autoriza |
| `webhook_eventos` | 4 | Idempotencia (id de evento UNIQUE) |
| `src/repositories/*.ts` | 5 | Capa de acceso a datos (no es tabla, es código) |
| `usuarios_admin`, `roles`, `permisos` | 6 | RBAC |
| `audit_log` | 10 | Trazabilidad de acciones del admin |
| `ordenes_produccion` | 1, F | OP digital + estados de taller |
| `estados` / definición de transiciones | 1 | FSM de pedidos y OP |

## Apéndice B — Fuentes de precios (verificadas 2026-06-04)

- Cloud Run pricing — Google Cloud: https://cloud.google.com/run/pricing
- Cloud SQL pricing — Google Cloud: https://cloud.google.com/sql/pricing
- Google Cloud SQL Pricing 2026 — Usage.ai: https://www.usage.ai/blogs/gcp/cloud-sql/pricing/
- Google Cloud Run Pricing Guide — Cloudchipr: https://cloudchipr.com/blog/cloud-run-pricing
