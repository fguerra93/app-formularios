# Prompts de Ejecución — Transición PrintUp a su versión máxima + Deploy Sandbox GCP

> **Qué es esto:** la guía operativa para ejecutar, fase por fase, todo el trabajo descrito en
> `PLAN-MAESTRO-SITIO-DEFINITIVO.md`, hasta dejar el **ambiente sandbox desplegado en GCP** por
> **~$0–8/mes**, reutilizando la cuenta/proyecto de AdminSmart (San Alfonso).
>
> Cada fase trae un **PROMPT listo para pegar en Claude Code** y un **bloque de VALIDACIÓN**
> obligatorio. **No se avanza a la fase siguiente sin pasar la validación de la actual.**
>
> Creado: 2026-06-04 · Documento hermano: `PLAN-MAESTRO-SITIO-DEFINITIVO.md`

---

## Cómo usar este documento

1. Trabaja una fase a la vez. Abre Claude Code en la raíz del repo y **pega el prompt** de la fase.
2. Al terminar, Claude Code debe **ejecutar el bloque de validación** y reportar resultados.
3. Si la validación falla, se corrige **antes** de pasar a la siguiente fase.
4. Convención de ramas: una rama por fase (`fase/0-validacion`, `fase/1-repos`, …), merge a
   `develop` al validar. Commit al cerrar cada fase.
5. Reglas de oro para Claude Code en cada prompt:
   - **No romper lo que ya funciona** (checkout server-side, `descontar_stock`, firma Meta).
   - **Leer `node_modules/next/dist/docs/`** antes de tocar APIs de Next.js 16 (ver `AGENTS.md`).
   - **Cero secretos hardcodeados**; todo por env / Secret Manager.
   - Al final, correr `npm run build` y `npm run lint` y reportar que pasan.

### Marcadores

- 🟥 **BLOQUEANTE SANDBOX** — necesaria para que el dueño pueda probar.
- 🟩 **PRODUCTO MÁXIMO** — eleva a "reemplazo total de Shopify"; puede ir después del primer sandbox.

> **Ruta mínima para un sandbox ya:** Fases 0 → 1 → 2 → 8 → 9. Las fases 3–7 (núcleo robusto,
> operación dueño, bot pro, legal, producción) se pueden intercalar y re-desplegar. El deploy es
> incremental: cada `gcloud run deploy` publica el estado actual.

---

## Decisión de arquitectura (se fija en Fase 0)

> **✅ DECISIÓN TOMADA (2026-06-05): VARIANTE B — todo-GCP.** Cloud Run + instancia **Cloud SQL
> Postgres `printup-sql` PROPIA y SEPARADA** (distinta de `adminsmart-sql`; son negocios distintos).
> Implica salir del SDK de Supabase (Auth, Storage, queries). Ver `wiki/DECISION-INFRA-PRINTUP.md`.

### Reutilización de cuentas — validado

| Recurso | ¿Reutilizable? | Detalle |
|---|:--:|---|
| Proyecto GCP `adminsmart` + billing | ✅ Sí | Un proyecto aloja N servicios Cloud Run y N instancias Cloud SQL. PrintUp vive al lado de AdminSmart. |
| Cuenta Cloudflare + R2 + Pages | ✅ Sí | Una cuenta, múltiples buckets/proyectos. Nuevo bucket `printup-archivos`. |
| **Instancia `adminsmart-sql`** ($8, MySQL) | ⚠️ No directo | Una instancia Cloud SQL = un solo motor. PrintUp es Postgres → no entra ahí sin reescribir el esquema a MySQL (no recomendado: usa `jsonb`, `gen_random_uuid()`, RLS, plpgsql). |

### Las dos variantes para "lograr los $8" (PrintUp es Postgres)

- **Variante A — $0, cero reescritura de datos (RECOMENDADA para el primer sandbox).**
  Cloud Run (escala a cero) en el proyecto GCP compartido + **Supabase Free** (Postgres + Auth +
  Storage incluidos). No se toca el SDK de Supabase. Costo nuevo: **$0**. Único "pero": el proyecto
  Free se pausa tras 7 días sin uso y se reactiva solo al volver (irrelevante para un demo).

- **Variante B — +$8, paridad total con San Alfonso (todo-GCP).**
  Cloud Run + **segunda instancia Cloud SQL Postgres `db-f1-micro`** en el mismo proyecto + R2 para
  archivos. Implica **rehacer la capa de datos** (salir del SDK de Supabase: Auth, Storage y queries).
  La **Fase 1 (repositorios)** es la que vuelve esto barato y de bajo riesgo.

> **Nota técnica importante:** AdminSmart (Java) conecta a Cloud SQL por *socket factory*. PrintUp es
> **Node**, así que conecta por **unix socket `/cloudsql/<CONNECTION_NAME>`** con el driver `pg`, o con
> `@google-cloud/cloud-sql-connector`. NO uses la librería de Java.
>
> **Nota de arquitectura:** PrintUp es Next.js **unificado** (front + API en el mismo proceso). NO
> necesita el `_worker.js` proxy que usó AdminSmart (eso fue porque su Angular estático y su Java
> estaban en orígenes distintos). PrintUp se despliega como **un solo servicio Cloud Run**, con
> Cloudflare delante solo como DNS/CDN/WAF.

### Sobre "crear carpeta backend"

No se separa en un servicio backend aparte (sería sobre-ingeniería para una PYME y rompería el
deploy único). Se crea una **capa backend dentro del repo Next.js**: `src/server/` (repositorios,
servicios de dominio, cliente de BD, eventos). El App Router y las API routes siguen siendo el
borde HTTP; la lógica baja a `src/server/`.

---

# FASE 0 — Validación de cuentas e infraestructura 🟥

**Objetivo:** confirmar empíricamente qué se puede reutilizar y **fijar la variante (A o B)** antes
de escribir código. Esta fase casi no toca código: produce un registro de decisión.

```text
Contexto: voy a desplegar el proyecto PrintUp (Next.js 16 + Supabase, este repo) en GCP reutilizando
la cuenta/proyecto de mi otro proyecto "adminsmart" (que ya tiene un sandbox en GCP Santiago, ver
wiki/PLAN-MAESTRO-SITIO-DEFINITIVO.md sección 2). Quiero el sandbox más barato posible (~$0-8/mes).

Tarea — VALIDACIÓN DE INFRAESTRUCTURA (no escribas código de la app todavía):
1. Verifica que tengo gcloud instalado y a qué cuenta/proyecto apunta:
   - Corre: gcloud --version ; gcloud config list ; gcloud auth list
   - Si el proyecto activo no es "adminsmart", indícame el comando para cambiarlo (no lo ejecutes sin confirmarme).
2. Lista lo que ya existe en el proyecto para reutilizar billing y servicios:
   - gcloud projects describe adminsmart
   - gcloud billing projects describe adminsmart
   - gcloud sql instances list
   - gcloud run services list --region southamerica-west1
   - gcloud services list --enabled
3. Confirma estos hechos y déjalos por escrito en un archivo nuevo wiki/DECISION-INFRA-PRINTUP.md:
   - La instancia adminsmart-sql es MySQL → NO sirve para PrintUp (Postgres). Hay que elegir variante.
   - Variante A: Cloud Run + Supabase Free ($0, sin reescribir datos).
   - Variante B: Cloud Run + nueva instancia Cloud SQL Postgres db-f1-micro (+$8, requiere rehacer
     la capa de datos para salir del SDK de Supabase).
4. En ese mismo archivo escribe la tabla de costos estimada de cada variante y una RECOMENDACIÓN.
5. Revisa el repo y lista TODO lo que hoy depende del SDK de Supabase (para dimensionar la Variante B):
   - Cuenta archivos/usos de: supabase.from( , supabase.auth. , .storage.from( , createServerClient,
     @supabase/ssr. Resume cuántas rutas/componentes son y agrúpalos.
6. NO decidas tú la variante: déjame un resumen claro para que yo elija A o B al final del prompt.

Al terminar: muéstrame el contenido de wiki/DECISION-INFRA-PRINTUP.md y el conteo de dependencias
de Supabase. No modifiques código de la aplicación.
```

### ✅ VALIDACIÓN FASE 0
- [ ] `gcloud config list` muestra el proyecto correcto (o sé el comando para fijarlo).
- [ ] Existe `wiki/DECISION-INFRA-PRINTUP.md` con: hechos de reutilización, las 2 variantes, costos y recomendación.
- [ ] Tengo el conteo real de dependencias del SDK de Supabase (cuántas rutas/componentes).
- [ ] **Yo (humano) elegí la variante A o B** y la anoté en el documento de decisión.

---

# FASE 1 — Capa de servidor + repositorios (Patrón 5) 🟥

**Objetivo:** crear `src/server/` y mover **todo** acceso a datos detrás de repositorios. Esto vuelve
la base de datos intercambiable (clave para la Variante B) y es buena ingeniería en cualquier caso.

```text
Contexto: el acceso a datos está disperso (supabase.from(...) en ~95 API routes y varios componentes).
Quiero introducir una capa backend dentro del repo, sin cambiar el comportamiento.

Tarea — CAPA DE REPOSITORIOS (Patrón 5 del PLAN-MAESTRO sección 4):
1. Crea la estructura:
   src/server/
     db/            -> cliente de datos (hoy: wrapper sobre supabase admin; mañana: pg/Cloud SQL)
     repositories/  -> un repo por agregado: productos, pedidos, clientes, cupones, zonas, inventario,
                       conversaciones, mensajes, configuracion, reviews, preguntas, portafolio,
                       newsletter, campanas, formularios
     services/      -> lógica de dominio reutilizable (ej. checkout ya está en src/lib/checkout.ts:
                       muévelo/condénsalo aquí o haz que use los repos)
     domain/        -> tipos del dominio (reutiliza src/lib/types.ts)
2. Define una interfaz por repositorio (métodos que devuelven tipos del dominio, NO filas crudas de
   Supabase). La implementación actual usa getSupabaseAdmin() internamente.
3. Refactoriza las API routes y libs para que llamen a los repositorios en vez de supabase.from(...)
   directo. Empieza por las rutas de: pedidos, productos, pagos/webhook, cliente/*, admin/pedidos,
   admin/productos. Luego el resto. NO cambies contratos HTTP ni payloads.
4. Regla dura: después de esta fase, "supabase.from(" y ".storage.from(" NO deben aparecer FUERA de
   src/server/. (El SDK queda encapsulado en un solo lugar.)
5. No cambies el esquema de BD ni la lógica de negocio. Es un refactor de estructura, equivalente
   funcionalmente.

Validación al final (córrela y repórtame el resultado):
- npm run build  (debe compilar)
- npm run lint
- Busca y muéstrame que NO quedan usos de supabase.from( ni .storage.from( fuera de src/server/
  (un grep del repo, excluyendo src/server/).
- Lista 3 rutas refactorizadas y confirma que su respuesta es idéntica a antes (mismos campos).
```

### ✅ VALIDACIÓN FASE 1
- [ ] `npm run build` y `npm run lint` pasan.
- [ ] No hay `supabase.from(` ni `.storage.from(` fuera de `src/server/`.
- [ ] Las rutas refactorizadas devuelven exactamente lo mismo que antes (probar 2–3 a mano).
- [ ] La app levanta con `npm run dev` y el checkout sigue funcionando.

---

# FASE 2 — Blindaje de seguridad (Roadmap A · Patrones 4, 6, 10) 🟥

**Objetivo:** cerrar los puntos ciegos críticos #1, #2, #3, #8: firma de webhook MP, idempotencia,
RBAC multiusuario, audit log, rate-limiting, Sentry y `.env.example` completo.

```text
Contexto: ver PLAN-MAESTRO sección 1 (puntos ciegos 1,2,3,8) y sección 4 (Patrones 4,6,10).

Tareas — BLINDAJE:
1. Firma de webhook MercadoPago (Patrón 4): crea src/lib/mercadopago.ts con verifyMpSignature()
   que valide el header x-signature (HMAC), igual que src/lib/meta.ts hace con Meta. Aplícala en
   src/app/api/pagos/webhook/route.ts: firma inválida -> 401, no procesa.
2. Idempotencia (Patrón 4): crea tabla webhook_eventos (id de evento del proveedor UNIQUE, proveedor,
   payload, procesado_at) en una nueva migración supabase/schema-seguridad.sql. En el webhook de MP y
   en el de Meta: si el id de evento ya existe, ignorar (no reprocesar). Envuelve el descuento de
   stock para que un reintento NO duplique movimientos.
3. RBAC (Patrón 6, cierra punto ciego #1): migración con tablas usuarios_admin (email, hash de
   password con bcrypt/argon2, rol), roles (admin, vendedor, bodega), y permisos por rol. Reemplaza
   el login de admin único (src/lib/auth.ts) por verificación contra usuarios_admin. Crea un usuario
   admin semilla desde env (ADMIN_EMAIL/ADMIN_PASSWORD para el bootstrap inicial). Middleware que
   valide rol por ruta /admin/** y /api/admin/**. Añade tab "Usuarios" en /admin/configuracion.
4. Audit log (Patrón 10): tabla audit_log (usuario, accion, entidad, entidad_id, datos, created_at).
   Registrar acciones sensibles del admin (cambiar estado de pedido, validar pago, ajustar stock,
   crear/editar usuario).
5. Rate limiting (Patrón 10): middleware con límite por IP en /api/pedidos, /api/upload,
   /api/pagos/webhook, /api/auth/*, newsletter. Usa una solución simple (in-memory para sandbox o
   Upstash Redis free si está disponible). Responder 429 al exceder.
6. Sentry: integra @sentry/nextjs (plan free) en cliente y server. Reemplaza console.error perdidos
   en API routes. DSN por env NEXT_PUBLIC_SENTRY_DSN (ya existe en .env.example).
7. Hardening cookie admin: httpOnly, secure, sameSite=strict.
8. Actualiza .env.example con TODO lo nuevo (ANTHROPIC_API_KEY para el bot, ADMIN_EMAIL,
   MERCADOPAGO_WEBHOOK_SECRET si falta, etc.). Sin valores reales.

Trabaja sobre la capa src/server/ de la Fase 1 (los repos), no vuelvas a meter supabase.from suelto.

Validación (córrela y repórtame):
- npm run build && npm run lint
- Simula un webhook MP con firma inválida (curl) -> 401.
- Envía el MISMO webhook MP válido dos veces -> el segundo no duplica stock ni emails (revisa
  movimientos_stock).
- Intenta entrar a /api/admin/productos sin sesión -> 401/redirect.
- Haz ~50 requests rápidos a /api/pedidos -> empieza a responder 429.
- Fuerza un error en una API route -> aparece en Sentry (o en el log si no hay DSN en local).
```

### ✅ VALIDACIÓN FASE 2
- [ ] Webhook MP con firma inválida → `401`; webhook duplicado no reprocesa.
- [ ] Login admin funciona contra `usuarios_admin`; rutas admin exigen rol.
- [ ] `audit_log` registra acciones sensibles.
- [ ] Flood a `/api/pedidos` → `429`. Sentry captura un error de prueba.
- [ ] `.env.example` documenta todas las variables nuevas. Build y lint verdes.

---

# FASE 3 — Núcleo robusto: FSM + eventos + reservas (Roadmap C · Patrones 1, 2, 9) 🟩

**Objetivo:** formalizar estados, hacer la automatización confiable (nada se pierde/duplica) y
reservar stock durante el checkout.

```text
Contexto: PLAN-MAESTRO sección 4, Patrones 1 (FSM), 2 (eventos+outbox), 9 (reserva stock TTL).

Tareas:
1. FSM (Patrón 1): migración con una definición de estados y transiciones permitidas para pedidos
   (pendiente -> pagado -> en_produccion -> listo -> entregado; ramas cancelado/devuelto). Crea
   src/server/services/pedido-fsm.ts con transicion(pedido, nuevoEstado) que valide la transición y
   rechace saltos ilegales. Usa esto en /api/admin/pedidos/[id] y en el webhook de pago.
2. Eventos + Outbox transaccional (Patrón 2): migración tabla domain_events (tipo, payload, estado
   [pendiente|procesado|error], created_at, procesado_at). En la MISMA transacción que un cambio de
   estado, inserta el evento (pedido.pagado, arte.aprobado, op.lista, etc.). Crea un worker/endpoint
   src/app/api/cron/procesar-eventos/route.ts que lea eventos pendientes y dispare efectos (email,
   WhatsApp, push, notificación in-app) con reintento; marca procesado. Idempotente.
3. Reserva de stock con TTL (Patrón 9): usa los tipos 'reserva'/'liberacion' que YA existen en
   movimientos_stock. Al iniciar checkout, reserva (sin descontar definitivo); si no se paga en N
   minutos, un cron libera. Ajusta descontar_stock para convertir reserva -> venta al confirmar pago.
4. Centro de notificaciones in-app: tabla notificaciones + campanita en el header del admin (contador
   no leídas). Los efectos del worker de eventos escriben aquí.

NO rompas descontar_stock ni el checkout server-side existentes; intégralos.

Validación:
- npm run build && npm run lint
- Intenta una transición ilegal de pedido (ej: pendiente -> entregado) -> rechazada.
- Cambia un pedido a 'pagado' -> se crea 1 evento, el worker lo procesa UNA vez (no duplica al
  re-ejecutar el worker).
- Inicia checkout y no pagues -> tras el TTL, el stock reservado se libera.
```

### ✅ VALIDACIÓN FASE 3
- [ ] Transiciones ilegales bloqueadas; estados solo avanzan por la FSM.
- [ ] Un cambio de estado emite 1 evento; el worker lo procesa exactamente una vez.
- [ ] Reserva de stock expira y libera; al pagar, reserva → venta sin doble descuento.
- [ ] Campanita de notificaciones funciona. Build y lint verdes.

---

# FASE 4 — Operación del dueño: cola de aprobación + Cliente 360 (Roadmap D · Patrones 3, 8) 🟩

**Objetivo:** materializar "el dueño solo aprueba". Toda acción sensible pasa por una cola.

```text
Contexto: PLAN-MAESTRO sección 5 (niveles verde/amarillo/rojo) y sección 4 Patrones 3 y 8.

Tareas:
1. Cola de aprobaciones (Patrón 3): migración tabla aprobaciones (tipo, payload, estado
   [pendiente|aprobada|rechazada], creada_por [bot|sistema], resuelta_por, created_at, resuelta_at).
   Tipos: validar_pago, aprobar_arte, enviar_cotizacion, responder_cliente. El sistema/bot NUNCA
   ejecuta estas acciones: inserta una aprobación pendiente.
2. Bandeja /admin/aprobaciones: lista de tarjetas con [Aprobar] [Editar] [Rechazar]. Al aprobar,
   se dispara el efecto vía un domain_event (Fase 3): enviar WhatsApp, validar pago, etc. Al rechazar,
   notifica/registra. Badge con contador en el sidebar.
3. Cliente 360: mejora /admin/contactos a una vista de cliente con timeline unificado (pedidos +
   mensajes WA/IG/FB + cotizaciones + aprobaciones + valor histórico). Lee de los repos.
4. Read models (Patrón 8): tablas/vistas resumen para el dashboard (ventas por día, por producto,
   pagos sin validar, formularios sin revisar >24h, stock bajo). El dashboard lee de ahí.
5. Notificaciones proactivas al dueño: web push (VAPID) + notificación in-app cuando entra un pedido,
   un pago por validar, o una aprobación pendiente.

Validación:
- npm run build && npm run lint
- Una acción del bot (ej. cotización) NO se envía sola: aparece en /admin/aprobaciones como pendiente.
- Aprobar esa tarjeta dispara el efecto (se envía el mensaje / se valida) vía domain_event.
- El Cliente 360 de un contacto muestra sus pedidos y sus mensajes juntos.
- El dashboard muestra "pagos sin validar" y "formularios >24h".
```

### ✅ VALIDACIÓN FASE 4
- [ ] Acciones sensibles del bot/sistema caen en la cola, no se ejecutan solas.
- [ ] Aprobar con un tap dispara el efecto real; rechazar lo cancela.
- [ ] Cliente 360 muestra el timeline unificado. Dashboard con alertas accionables.
- [ ] Llega web push al dueño. Build y lint verdes.

---

# FASE 5 — Bot pro: autonomía verde/amarillo/rojo + tool-use (Roadmap E · Patrón 7) 🟩

**Objetivo:** que el bot resuelva solo lo seguro, proponga lo dudoso (a la cola de Fase 4) y escale
lo sensible. Cotización automática por planilla.

```text
Contexto: PLAN-MAESTRO sección 5; el bot vive en src/lib/bot/ (engine, intents, ai, flows).
Mantener Meta Cloud API directo (sin SaaS). Modelo: claude-haiku-4-5 (ya usado en src/lib/bot/ai.ts).

Tareas:
1. Niveles de autonomía: en src/lib/bot/engine.ts clasifica cada mensaje en VERDE (info: horario,
   catálogo, dirección, estado de pedido), AMARILLO (cotización, duda compleja) o ROJO (confirmar
   pago, cerrar venta, reclamo, dato sensible).
   - VERDE -> responde automático.
   - AMARILLO -> redacta borrador y crea una aprobacion (Fase 4); NO envía hasta que el dueño aprueba.
   - ROJO -> escala a humano (estado conversación 'escalada') + notifica al dueño.
2. Clasificación híbrida (Patrón 7): keywords primero (gratis); si no matchea, Claude Haiku clasifica.
   Cachea clasificaciones frecuentes (tabla bot_intent_cache) para abaratar.
3. Cotización automática: migración tabla planillas_precios (tipo_producto, unidad, rangos jsonb,
   precio_diseno, dias_produccion). Crea src/lib/bot/pricing.ts con calcularCotizacion(). Flujo de
   cotización en el bot que pregunta tipo/cantidad/diseño y arma el monto. La cotización resultante
   va a la cola de aprobación (AMARILLO), no se envía sola.
4. Tool-use: dale al modelo herramientas seguras (calcularCotizacion, buscarPedidoPorNumeroOEmail,
   consultarHorario). El modelo NUNCA confirma pagos ni crea pedidos.
5. Bot proactivo por etapa: cuando un pedido cambia de estado (domain_event de Fase 3), el worker
   envía el WhatsApp correspondiente al cliente ("pago confirmado", "listo para retiro", etc.).
6. Agrega ANTHROPIC_API_KEY a .env.example (documenta que el bot la necesita).

Validación:
- npm run build && npm run lint
- Mensaje VERDE ("¿cuál es el horario?") -> el bot responde solo, correcto.
- Mensaje AMARILLO ("quiero cotizar 50 poleras DTF") -> genera cotización y la deja en
  /admin/aprobaciones; NO se envía hasta aprobar.
- Mensaje ROJO ("ya pagué, confírmenme") -> escala a humano + notifica.
- Cambiar un pedido a 'listo' -> el cliente recibe el WhatsApp automático.
```

### ✅ VALIDACIÓN FASE 5
- [ ] Verde se responde solo; amarillo va a la cola; rojo escala.
- [ ] La cotización automática calcula bien y respeta la aprobación del dueño.
- [ ] Tool-use no permite que el modelo confirme pagos/cree pedidos.
- [ ] Cambios de estado disparan mensajes proactivos al cliente. Build y lint verdes.

---

# FASE 6 — Legal y cobro: IVA + boleta/factura SII + devoluciones (Roadmap B) 🟩

**Objetivo:** poder vender legalmente en Chile.

```text
Contexto: PLAN-MAESTRO sección 3 (brechas 2 y 5). Requisito legal: documento tributario (SII).

Tareas:
1. IVA: mostrar "Precios incluyen IVA (19%)" y desglose en carrito/checkout (informativo).
2. Boleta/Factura electrónica: integra LibreDTE (open source) en MODO CERTIFICACIÓN/sandbox del SII
   (no producción). Crea src/server/services/dte.ts que, al confirmar un pago, emita el documento y
   guarde folio/PDF en el pedido. Si no hay credenciales SII en sandbox, deja la integración detrás
   de un flag y simula el documento (mock) para el demo.
3. Devoluciones/reembolsos: flujo de solicitud de devolución (estado del pedido 'devuelto' vía la FSM
   de Fase 3) + reposición de stock (reponer_stock ya existe) + nota de crédito (mock en sandbox).

Validación:
- npm run build && npm run lint
- Carrito/checkout muestran desglose con IVA.
- Pagar (sandbox) emite un documento (real en certificación SII, o mock si no hay credenciales) y lo
  asocia al pedido.
- Una devolución repone stock y registra la nota de crédito.
```

### ✅ VALIDACIÓN FASE 6
- [ ] IVA visible y desglosado. Documento tributario emitido (cert/mock) y asociado al pedido.
- [ ] Flujo de devolución repone stock y genera nota de crédito. Build y lint verdes.

---

# FASE 7 — Producción: OP + Kanban del taller + PDF (Roadmap F · Patrones 1, 2) 🟩

**Objetivo:** el corazón de la imprenta: orden de producción y tablero del taller.

```text
Contexto: PLAN-MAESTRO secciones 3 y 6; reutiliza FSM (Fase 3) y eventos (Fase 3).

Tareas:
1. Migración tabla ordenes_produccion (numero_op, pedido_id/formulario_id, datos del trabajo: tipo,
   cantidad, dimensiones, material, archivo_diseno_url, precios, estado de taller, prioridad,
   fecha_compromiso, operador, tipo_entrega). Estados del taller por FSM:
   en_cola -> imprimiendo -> acabado -> control_calidad -> listo -> entregado.
2. Generación automática de OP cuando se valida el pago (domain_event de Fase 3).
3. /admin/produccion: tablero Kanban (drag & drop) con las OPs por estado; mover tarjeta cambia el
   estado (vía FSM) y emite evento (notifica al cliente).
4. PDF de la OP con @react-pdf/renderer (endpoint /api/admin/op/[id]/pdf): datos cliente + trabajo +
   precios + zona manual de notas + checklist de calidad + QR al detalle en el admin.

Validación:
- npm run build && npm run lint
- Validar el pago de un pedido auto-crea su OP en 'en_cola'.
- Mover la tarjeta en el Kanban a 'listo' notifica al cliente (WhatsApp/email vía evento).
- El PDF de la OP se genera y descarga correctamente.
```

### ✅ VALIDACIÓN FASE 7
- [ ] Pago validado → OP creada automáticamente. Kanban mueve estados y notifica.
- [ ] PDF de OP renderiza con todos los campos. Build y lint verdes.

---

# FASE 8 — Containerización + store objetivo (la "rehacer datos como San Alfonso") 🟥

**Objetivo:** dejar la app lista para Cloud Run y conectar el store de la **variante elegida en Fase 0**.

> Si elegiste **Variante A ($0)**: haz solo la PARTE 1 (container) y la PARTE 2A (Supabase Free).
> Si elegiste **Variante B (+$8, todo-GCP)**: haz la PARTE 1 y la PARTE 2B (Cloud SQL Postgres + R2 + auth).

```text
PARTE 1 — Containerización (ambas variantes):
1. En next.config.ts activa output: 'standalone' (lee node_modules/next/dist/docs/ antes; respeta las
   convenciones de Next 16 de este repo, ver AGENTS.md).
2. Crea un Dockerfile multi-stage para Next.js standalone (deps -> build -> runner liviano, node 22,
   expone PORT=3000, usa el output standalone). Crea .dockerignore y .gcloudignore (excluye node_modules,
   .next/cache, .env*, wiki, legacy, sync-worker).
3. Crea deploy/run-env.sandbox.yaml (plantilla, SIN secretos reales) con todas las env que Cloud Run
   necesita (las de .env.example en modo sandbox). Documenta cuáles van a Secret Manager.
4. Verifica build local del contenedor: docker build -t printup . (si Docker está disponible) y que
   arranca. Si no hay Docker local, valida que `gcloud run deploy --source` podrá compilarlo (Dockerfile
   válido).

PARTE 2A — Store Variante A (Supabase Free, cero reescritura):
5. No cambies la capa de datos. Solo confirma que el cliente de src/server/db usa las env de Supabase.
6. Documenta en wiki/DECISION-INFRA-PRINTUP.md: crear proyecto Supabase Free "printup-sandbox" (región
   São Paulo), correr TODAS las migraciones (las 11 + schema-inventario.sql + las nuevas de Fases 2-7),
   crear buckets de Storage. (La ejecución real va en Fase 9.)

PARTE 2B — Store Variante B (Cloud SQL Postgres + R2 + auth, todo-GCP):
5. Cambia la implementación de src/server/db a Postgres directo: instala 'pg' y
   '@google-cloud/cloud-sql-connector'. Conexión por unix socket /cloudsql/<CONNECTION_NAME> en Cloud
   Run (y por connector en local). Migra TODAS las queries de los repos del SDK de Supabase a SQL con
   pg (o Drizzle). Como ya están encapsuladas en src/server/repositories (Fase 1), es cambiar la
   implementación, no las 95 rutas.
6. Reúne las migraciones .sql del repo en un esquema Postgres aplicable a Cloud SQL (mismo SQL, ya es
   Postgres). Quita lo específico de Supabase (políticas RLS que dependían de auth.uid(): reemplaza la
   autorización por la lógica de la app/repos; las funciones plpgsql descontar_stock/reponer_stock se
   mantienen).
7. Reemplaza Supabase Auth (clientes) por auth propia: sesión JWT (jose, ya usado para admin) + tabla
   clientes con hash de password. Ajusta src/lib/auth-client.ts y las rutas /api/cliente/*.
8. Reemplaza Supabase Storage por Cloudflare R2 (SDK S3, las env R2_* ya están en .env.example).
   Centraliza subidas/descargas en src/server/services/storage.ts (igual que hizo AdminSmart con R2).

Validación (según variante):
- npm run build && npm run lint
- Variante A: la app levanta apuntando a un Supabase (free) de prueba.
- Variante B: la app levanta contra un Postgres local (docker) con el esquema aplicado; login de
  cliente y admin funcionan sin Supabase; subir un archivo va a R2.
- El contenedor arranca y responde en :3000.
```

### ✅ VALIDACIÓN FASE 8
- [ ] `next.config.ts` con `output: 'standalone'`; Dockerfile + `.gcloudignore` válidos; container arranca en `:3000`.
- [ ] (A) App corre contra Supabase de prueba **o** (B) corre contra Postgres + R2 + auth propia, sin SDK de Supabase.
- [ ] `deploy/run-env.sandbox.yaml` lista todas las env (sin secretos). Build y lint verdes.

---

# FASE 9 — Deploy del Sandbox en GCP (reusando la cuenta AdminSmart) 🟥

**Objetivo:** sitio en línea en GCP Santiago por ~$0–8/mes, con datos de demo, para que el dueño pruebe.

```text
Contexto: reusar el proyecto GCP "adminsmart" (billing ya activo). PrintUp es Next.js unificado -> UN
solo servicio Cloud Run, sin _worker.js. Cloudflare delante solo como DNS/CDN/WAF (opcional en sandbox).
Sigue el playbook de wiki/PLAN-MAESTRO sección 2 y el de AdminSmart.

Tareas:
1. Habilitar APIs (si faltan): gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   artifactregistry.googleapis.com  (+ sqladmin.googleapis.com SOLO si Variante B).
2. Provisionar el store:
   - Variante A: crear el proyecto Supabase Free "printup-sandbox", correr TODAS las migraciones en
     orden, crear buckets de Storage. Cargar las env de Supabase.
   - Variante B: crear instancia Postgres mínima en el MISMO proyecto:
     gcloud sql instances create printup-sql --database-version=POSTGRES_16 --tier=db-f1-micro
       --region=southamerica-west1 --storage-size=10GB --storage-type=HDD --no-backup
     gcloud sql databases create printup ; gcloud sql users create printup ;
     aplicar el esquema; anotar el CONNECTION_NAME para el socket.
3. Secretos en Secret Manager (JWT_SECRET, MERCADOPAGO_*, RESEND_API_KEY, ANTHROPIC_API_KEY, R2_*,
   META_*, credenciales del store). NO en texto plano.
4. Deploy del backend+front (un solo servicio), desde el código local (Cloud Build compila):
   gcloud run deploy printup-app --source . --region southamerica-west1 --allow-unauthenticated
     --min-instances 0 --max-instances 2 --memory 512Mi --cpu 1 --port 3000
     --env-vars-file deploy/run-env.sandbox.yaml
     [Variante B: --add-cloudsql-instances adminsmart:southamerica-west1:printup-sql]
   Asegura NEXT_PUBLIC_MODO=sandbox (banner demo) y NEXT_PUBLIC_APP_URL = la URL de Cloud Run.
5. Seed de demo: script que cargue ~20-30 productos PrintUp reales con imágenes, categorías, zonas de
   envío de O'Higgins, 2-3 cupones, portafolio, reseñas/preguntas aprobadas, pedidos de ejemplo en
   varios estados, y un usuario admin demo + cliente demo. Ejecutar contra el store del sandbox.
6. Webhook MercadoPago (TEST): configurar la URL https://<cloud-run-url>/api/pagos/webhook en la app
   de prueba de MP. Webhook Meta: apuntar al endpoint /api/webhooks/meta (si se prueba el bot).
7. Documentar en wiki/DECISION-INFRA-PRINTUP.md las URLs en vivo, credenciales demo y el comando de
   re-deploy.

Validación (córrela y repórtame):
- gcloud run services describe printup-app --region southamerica-west1 (estado Ready, URL).
- La URL carga la tienda con el BANNER de sandbox.
- /admin/login funciona con el usuario demo y exige rol (RBAC de Fase 2).
- Compra de prueba end-to-end (tarjeta TEST APRO o transferencia): crea pedido, descuenta stock,
  emite documento (mock/cert), manda emails, el dueño lo ve en /admin/pedidos.
- Las imágenes del seed cargan (desde Supabase Storage o R2 según variante).
- Reporta el COSTO estimado: confirma min-instances=0 (Cloud Run ~$0) y, si Variante B, la instancia
  db-f1-micro (~$8). Si Variante A, DB en Supabase Free ($0).
```

### ✅ VALIDACIÓN FASE 9
- [ ] La URL de Cloud Run carga la tienda con banner de sandbox; build de Cloud Build OK.
- [ ] `/admin/login` con RBAC; compra de prueba end-to-end completa (pedido, stock, documento, emails).
- [ ] Imágenes del seed cargan. Webhook MP TEST configurado.
- [ ] Costo confirmado: Cloud Run `min=0` ~$0 + (Supabase Free $0 **o** Cloud SQL micro ~$8).

---

# FASE 10 — UAT del dueño + cierre 🟥

**Objetivo:** el dueño valida TODO el sandbox de punta a punta.

```text
Tarea: genera wiki/UAT-DUENO-PRINTUP.md con un guion de prueba paso a paso para el dueño, cubriendo:
- Tienda (como cliente): navegar, buscar, calculadora m², carrito + cupón + IVA, registro/login,
  favoritos, reseña/pregunta, checkout con tarjeta TEST y por transferencia, recibir emails.
- Bot (como cliente en WhatsApp/IG): mensaje verde (responde solo), amarillo (queda en aprobaciones),
  rojo (escala).
- Admin (como dueño): ver pedido nuevo (realtime/alerta), aprobar una cotización y un pago desde la
  cola de aprobaciones, ver stock bajar y el movimiento, reponer stock, ver la OP en el Kanban,
  emitir/ver el documento tributario, Cliente 360, editar datos de empresa en Configuración, crear
  un usuario "vendedor" con rol limitado.
Incluye una lista de checkboxes y un espacio para anotar hallazgos. Verifica que no haya errores en
Sentry durante la prueba.
```

### ✅ VALIDACIÓN FASE 10
- [ ] El dueño completa el guion sin bloqueos; hallazgos registrados y priorizados.
- [ ] Cero errores nuevos en Sentry durante la UAT.
- [ ] Decisión registrada: ¿se queda en sandbox o se promueve a producción lean (~$15–30/mes)?

---

## Resumen de fases

| Fase | Nombre | Marcador | Patrones | Resultado |
|---|---|:--:|---|---|
| 0 | Validación cuentas + variante | 🟥 | — | Se sabe qué reutilizar y A/B elegida |
| 1 | Repositorios (`src/server/`) | 🟥 | 5 | BD intercambiable, SDK encapsulado |
| 2 | Blindaje seguridad | 🟥 | 4,6,10 | Firma MP, idempotencia, RBAC, audit, rate-limit, Sentry |
| 3 | Núcleo robusto | 🟩 | 1,2,9 | FSM + eventos/outbox + reserva stock |
| 4 | Operación dueño | 🟩 | 3,8 | Cola de aprobación + Cliente 360 |
| 5 | Bot pro | 🟩 | 7 | Verde/amarillo/rojo + cotización + tool-use |
| 6 | Legal + cobro | 🟩 | — | IVA + boleta SII + devoluciones |
| 7 | Producción | 🟩 | 1,2 | OP + Kanban + PDF |
| 8 | Container + store objetivo | 🟥 | 5 | Listo para Cloud Run (Variante A o B) |
| 9 | Deploy sandbox GCP | 🟥 | — | En línea ~$0–8/mes, datos demo |
| 10 | UAT del dueño | 🟥 | — | Aceptación validada |

> **Ruta mínima a un sandbox navegable:** 0 → 1 → 2 → 8 → 9 (+ seed). Las 3–7 elevan a "reemplazo
> total de Shopify" y se re-despliegan con un `gcloud run deploy` cada vez.

## Variables de entorno (consolidado para el sandbox)

Ya en `.env.example`: Supabase, ADMIN_*, JWT_SECRET, RESEND_*, MERCADOPAGO_* (+ WEBHOOK_SECRET),
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_MODO, R2_*, META_*, NEXT_PUBLIC_SENTRY_DSN.
A agregar durante las fases: `ANTHROPIC_API_KEY` (bot, Fase 5), `ADMIN_EMAIL` (RBAC, Fase 2), y
—solo Variante B— `DB_URL`/`DB_USER`/`DB_PASS` + `CLOUD_SQL_CONNECTION_NAME`.
