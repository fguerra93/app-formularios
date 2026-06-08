# Implementación — Automatización integral de PrintUp

> Bitácora de implementación de las fases de `PROPUESTA-AUTOMATIZACION-PRINTUP.md`
> (§8). Una sección por fase: qué se construyó, archivos, cómo se validó y qué
> queda pendiente. Las fases reutilizan los cimientos existentes (bot, planillas,
> Kanban de producción, designer, cola de aprobación, eventos de dominio) sin
> romper los flujos actuales.
>
> **Convención de datos:** acceso solo por `getDb()`; repos en
> `src/server/repositories/*`; tablas nuevas en `supabase/schema-*.sql`
> registradas en `deploy/apply-cloudsql.mjs` (array `ORDER`) y volcadas al
> consolidado `deploy/schema-cloudsql.sql`. En local cae a Supabase; en prod usa
> Cloud SQL vía el adaptador `pg`. **Para validar end-to-end con datos, aplica el
> esquema** (`node deploy/apply-cloudsql.mjs` contra la instancia, o corre el
> `.sql` de la fase en Supabase).

---

## F1 — Cerebro de precios + Gang Sheet (self-service) ✅

**Objetivo:** un único motor de precios compartido por web y bot, y un
constructor de gang sheet que cobra por área (cm²) y, al confirmar, genera el
archivo listo + la OP.

### Datos (`supabase/schema-fase-f1-gangsheet.sql`)
- **`tarifas_gang_sheet`** — `material`, `ancho_pliego_cm`, `tarifa_por_cm2`,
  `merma_pct`, `precio_minimo`, `tramos` (jsonb de descuento por área),
  `dias_produccion`. Semilla: DTF Textil (58cm), DTF UV (60cm), Sublimación (100cm).
- **`gang_sheets`** — `material`, `ancho_pliego_cm`, `alto_pliego_cm`, `items`
  (jsonb con `{arte_url,x,y,w_cm,h_cm,rot}`), `area_usada_cm2`, `area_pliego_cm2`,
  `merma_cm2`, `precio`, `desglose`, `estado`, vínculo a `pedido_id`/`op_id`.

### Motor de precios (compartido web + bot)
- `src/server/domain/gang-sheet.ts`:
  - `autoNest(items, anchoCm)` — bin-packing heurístico **shelf / NFDH** (ordena
    por alto desc., coloca en repisas, **rota 90°** un arte si así cabe en el
    ancho; escala el caso borde más ancho que el pliego). Devuelve posiciones y
    alto total. Documentado como heurístico; punto de extensión a MaxRects.
  - `calcularGangSheet({items, material, ancho_pliego_cm})` — nesting → área
    usada/pliego → merma → tarifa por cm² → **tramo de descuento por área** →
    piso mínimo. Degradación elegante: si no hay tarifa en BD usa una de
    referencia (`tarifa_por_defecto: true`).
  - `generarPliegoSvg(...)` — "archivo listo" del pliego como **SVG** (vector,
    sin dependencias). Rasterización a PDF/PNG 300dpi = punto de extensión.
- `src/lib/bot/pricing.ts` → `cotizarGangSheet(...)` y `src/lib/bot/tools.ts` →
  `cotizarPliego(...)`, `formatearPliego(...)`, `linkConstructorGangSheet()`.
  **El bot llama exactamente la misma función** → mismo input, mismo precio.

### API
- `POST /api/cotizar/gang-sheet` — precio en vivo (no guarda).
- `GET /api/tarifas-gang-sheet` — tarifas activas (pobla el selector).
- `POST /api/gang-sheets` — guarda (recalcula el precio en servidor).
- `GET /api/gang-sheets/:id` — lee el pliego.
- `GET /api/gang-sheets/:id/pliego` — SVG del pliego (archivo de taller).

### UI (tienda, sistema `.mc-*`)
- `src/app/(tienda)/gang-sheet/page.tsx` — sube/arrastra artes, mide cada uno
  (default a 300dpi, editable), cantidad por arte, **precio en vivo** (debounce),
  **vista previa del auto-acomodo**, desglose y "Agregar al carrito". Ruta nueva
  para no chocar con el rediseño en curso de `/productos/.../personalizar`.

### Integración con el pipeline existente
- `src/lib/checkout.ts` (`calcularPedido`) reconoce ítems de pliego por
  `variante.gang_sheet_id` y usa el **precio guardado en servidor** (no confía en
  el navegador; no requiere fila en `productos`).
- `src/app/api/cron/procesar-eventos/route.ts` (`crearOPDesdePedido`) enriquece la
  OP del pedido pagado con material, dimensiones y `archivo_diseno_url`
  (`/api/gang-sheets/:id/pliego`), y enlaza el pliego (`op_id`, `estado=en_op`).
  **No se tocó la cola de aprobación ni la FSM del taller.**

### Validación
- `npx tsc --noEmit` limpio · `npm run build` verde (rutas nuevas en el árbol).
- Smoke real del endpoint (cae a tarifa de respaldo sin BD): 5 artes 20×30 DTF
  Textil → pliego 58×90.6cm, 2 por repisa, área usada 3000cm², cobrada 5675cm²
  (+8% merma), subtotal $34.051, tramo −10% → **$30.646**. Aritmética verificada.
- Auto-rotación: arte 70×40 en pliego de 58cm → `rot=90` (40×70). ✓
- Playwright sobre `/gang-sheet`: render correcto en minimal-claro; subir arte →
  ítem editable + **precio en vivo** + **auto-acomodo visible** + botón habilitado.
  (Únicos errores de consola: `/api/config/public` 401, **pre-existente** sin env.)

### Pendiente / notas
- Aplicar `schema-fase-f1-gangsheet.sql` para persistir pliegos y validar el guardado
  (`POST /api/gang-sheets`) y la generación de OP end-to-end con datos reales.
- Subida de arte a GCS es best-effort (firma v4); en local sin credenciales el
  precio igual se calcula (solo no persiste el `arte_url`).
- Admin de tarifas (CRUD de `tarifas_gang_sheet`) se puede añadir; hoy se editan
  por SQL/seed.

---

## F2 — Pipeline omnicanal + Comanda/KDS de taller ✅

**Objetivo:** una sola cola para todo pedido (web/bot/manual) y una comanda de
taller en tiempo real (PWA) por estación, estilo KDS de restaurante.

### Datos (`supabase/schema-fase-f2-taller.sql`)
- `pedidos.canal` y `ordenes_produccion.canal` (`web|whatsapp|manual`), **aditivo
  con DEFAULT 'web'** para no romper inserts existentes. El semáforo de SLA usa
  `updated_at` (entrada a la etapa actual); el historial por transición ya vive
  en `domain_events` (`op.estado`).

### Máquina de estados (reusa lo existente)
- Estado canónico = FSM del taller existente (`src/server/services/op-fsm.ts`):
  `en_cola → imprimiendo → acabado → control_calidad → listo → entregado`. Las
  **estaciones del KDS son esos estados**; "bump" = avanzar/retroceder un paso.
- `src/server/services/op-eventos.ts` (**nuevo**): centraliza los efectos al
  cambiar estado (evento `op.estado` + aviso al cliente `pedido.estado`). Lo usan
  el admin (`/api/admin/op/[id]`, refactorizado) y el taller, sin duplicar lógica.

### API
- `GET /api/taller/cola` — cola para el KDS (polling). Auth rol **bodega/admin**.
- `POST /api/taller/op/:id/avanzar` — bump (`dir:1` avanza, `dir:-1` retrocede);
  valida con la FSM y dispara los mismos avisos al cliente que el admin.
- `crearOPDesdePedido` etiqueta el `canal` de la OP desde el pedido (best-effort).

### UI — superficie "taller" (PWA kiosko)
- `src/app/taller/*`: `layout.tsx` (tema oscuro + manifest + theme-color),
  `page.tsx` (**server**, guard por rol; sin sesión → CTA de login),
  `taller-board.tsx` (**client**): columnas por estación, tarjetas-comanda con
  OP/material/dimensiones/canal/entrega + enlace al archivo, **semáforo de SLA**
  por etapa, **filtro por estación** (vista de un operario), polling 5s.
- PWA instalable: `public/taller/manifest.json` + `public/taller/sw.js`
  (network-first, offline básico) + íconos 192/512; registro vía `sw-register.tsx`.

### Integración
- El Kanban admin `/admin/produccion` se conserva intacto (base del KDS).
- Web (checkout) y bot crean pedidos que pagan → `pedido.pagado` → **misma cola**
  de OP. Sin tocar la cola de aprobación.

### Validación
- `npx tsc --noEmit` limpio · `npm run build` verde (`/taller`,
  `/api/taller/cola`, `/api/taller/op/[id]/avanzar` en el árbol).
- Guards: cola **401** sin sesión, **autoriza** con sesión rol bodega (token de
  prueba). PWA: manifest/sw/icon **200**.
- Playwright con sesión bodega: el **tablero KDS renderiza completo** (header,
  filtros por estación, 6 columnas en tema kiosko oscuro).

### Pendiente / notas
- **Importante:** el Supabase local de este entorno **no tiene la tabla
  `ordenes_produccion`** (la fase 7 de producción no se aplicó aquí; sí el
  e-commerce). Por eso el tablero se ve vacío en local. Aplicar
  `schema-fase7-produccion.sql` + `schema-fase-f2-taller.sql` puebla la cola.
- Ruteo por operario (cada uno ve solo su estación) está como **filtro**; el
  gating por rol fino por estación es extensión.
- Tiempo real por **polling** (5s); SSE/WebSocket es una mejora opcional.

---

## F3 — Bot de WhatsApp que cierra pedidos ✅ (andamiaje documentado)

**Objetivo:** que el bot tome el pedido COMPLETO (no solo cotice): verde=cierra,
amarillo/rojo=escala, reusando el motor del bot existente.

### Cierre de pedido (lo nuevo y testeable por tipos)
- `src/server/services/op-desde-pedido.ts` (**nuevo**): se extrajo
  `crearOPDesdePedido` del cron a un servicio para que lo usen **el cron (al
  pagar) y el bot (al cerrar)** — misma comanda, misma lógica (incl. gang sheet
  y canal). `cron/procesar-eventos` ahora lo importa.
- `src/lib/bot/orders.ts` (**nuevo**): `crearPedidoDesdeBot(...)` crea el pedido
  (canal=whatsapp, email sintetizado si falta), emite `pedido.creado`, abre la
  aprobación `validar_pago` (el dueño valida la transferencia) y **encola la
  comanda** (`crearOPDesdePedido`). `puedeEnviarPromo(cliente)` = opt-in.
- `src/lib/bot/flows/menu.ts`: tras cotizar por planilla, si el dueño activó
  `bot_autoclose=true` (config), el bot **envía el precio y ofrece confirmar**;
  al confirmar, cierra el pedido sin intervención. Si no, mantiene el
  comportamiento actual (cotización a la **cola de aprobación**, amarillo).

### WhatsApp Flows / catálogo / plantillas (andamiaje)
- `src/lib/bot/whatsapp-flows.ts` (**nuevo**): definición JSON del Flow de
  cotización in-chat, `parseFlowCotizacion`, `cotizarDesdeFlow` /
  `cotizarPliegoDesdeFlow` (reusan **el mismo motor** de precios) y
  `construirMensajeFlow` (mensaje interactivo para Cloud API). Queda listo para
  publicar el Flow en Meta y referenciarlo por `flow_id`.
- Webhook de producción **ya existe**: `/api/webhooks/meta` (verifica firma
  `x-hub-signature-256`, verify-token, idempotencia por `meta_message_id`).
  No se tocó. El `/api/test/whatsapp-webhook` queda como simulador de dev.

### Cobro y cumplimiento (documentado)
- **Cobro:** transferencia / pago al retirar por defecto (**sin MercadoPago**);
  gancho de pago en línea queda en el flujo de aprobación.
- **WhatsApp pricing (jul-2025):** el envío se cobra **por mensaje y por
  categoría** (marketing / utility / authentication / service). Diseñar
  plantillas como *utility* (confirmación/estado) y reservar *marketing* solo
  con opt-in. El bot aquí solo envía utilitarios (cotización pedida, confirmación).
- **Política IA 2026:** bot **acotado a tareas** (responder, cotizar, tomar
  pedidos, logística). Promos **solo con opt-in** (`puedeEnviarPromo`).

### Validación
- `npx tsc --noEmit` limpio · `npm run build` verde.
- **No** se valida end-to-end en local: requiere número/app de Meta y tablas que
  el Supabase local no tiene (`planillas_precios`, `aprobaciones`,
  `domain_events`, `ordenes_produccion`). En prod (GCP) esas tablas existen.

### Pendiente / notas
- Activar el cierre verde: `configuracion.bot_autoclose = 'true'` (opt-in del dueño).
- Publicar el Flow en Meta y enrutar `interactive`/`nfm_reply` en el webhook
  (parser de Flow responses) — punto de extensión señalado.
- Recuperación de carrito abandonado: reusar el cron `carritos-abandonados`
  añadiendo un recordatorio por WhatsApp (plantilla *utility*).

---

## F4 — Inteligencia de insumos / costos / márgenes ✅

**Objetivo:** saber el costo real y el margen (¿compro bien?), con proveedores y
órdenes de compra.

### Datos (`supabase/schema-fase-f4-costos.sql`)
- `insumos` (sku, nombre, unidad, **costo_actual**), `proveedores`,
  `precios_proveedor` (insumo, proveedor, precio, fecha — histórico para alertas),
  `bom` (producto → insumo + cantidad, UNIQUE producto+insumo),
  `ordenes_compra` (+ `oc_items` con recepción).

### Lógica (`src/server/services/costos.ts`, funciones PURAS)
- `calcularRentabilidad(productos, bom, insumos)` → por producto:
  **costo real = Σ(BOM.cantidad × insumo.costo_actual)**, margen y margen %.
- `detectarAlertasInsumos(insumos, precios, umbral=15)` → alerta cuando el
  `costo_actual` supera el promedio histórico en ≥ umbral %.

### API/UI (admin, estilo admin actual)
- Repos en `src/server/repositories/costos.ts` (coerción de `numeric`) +
  `productosRepo.listBasico()`.
- Rutas: `/api/admin/costos` (rentabilidad + alertas), `…/insumos[/:id]`,
  `…/proveedores[/:id]`, `…/precios-proveedor`, `…/bom`,
  `…/ordenes-compra[/:id]` (enviar / recibir / cancelar).
- `/admin/costos` (4 pestañas: **Rentabilidad** con tablero y alertas, **Insumos**,
  **Proveedores**, **Ficha de costos / BOM** por producto con costo real por unidad).
- `/admin/ordenes-compra` (crear OC con ítems desde insumos, **enviar**,
  **registrar recepción**, cancelar). Nueva sección "COSTOS & MERCADO" en el menú.

### Validación
- `npx tsc --noEmit` limpio · `npm run build` verde (10 rutas + 2 páginas).
- Playwright con sesión admin: `/admin/costos` renderiza (sidebar con la sección
  nueva, 4 pestañas, tablero) con **degradación elegante** ("Sin productos")
  porque las tablas F4 no existen en el Supabase local.

### Pendiente / notas
- Aplicar `schema-fase-f4-costos.sql` para datos reales (insumos/BOM/OC).
- Margen por **pedido/OP**: derivable del costo real de los productos del pedido;
  hoy el tablero es por producto (extensión directa).
- La recepción marca `cantidad_recibida = cantidad`; recepción parcial por ítem
  ya está soportada por la API (`recibidos[]`), falta UI fina.

---

## F5 — Inteligencia de mercado ✅

**Objetivo:** comparar mis precios con el mercado y sugerir precio respetando el
margen mínimo.

### Datos (`supabase/schema-fase-f5-mercado.sql`)
- `competidores` (nombre, url), `productos_competencia` (mapeo mi producto ↔
  producto del competidor), `precios_competencia` (histórico con fecha).

### Lógica (`src/server/services/mercado.ts`, PURA)
- `calcularComparativa(productos, costos, mapeos, precios, margenMin)` → por
  producto: mi precio, mercado (min/prom), posición %, **precio sugerido**
  (iguala al mínimo del mercado pero **nunca baja del piso de margen** que sale
  del costo real de F4) y margen actual/sugerido. `bajo_margen` marca cuando no
  se puede igualar al mercado sin perder el margen mínimo.
- El costo real lo aporta `calcularRentabilidad` (F4); el umbral es
  `configuracion.margen_minimo_pct` (default 25).

### API/UI (admin)
- Repos `src/server/repositories/mercado.ts`. Rutas: `/api/admin/mercado`
  (comparativa), `…/mercado/aplicar` (aplica precio + **auditoría**),
  `…/competidores[/:id]`, `…/productos-competencia`, `…/precios-competencia`
  (carga manual y por **lote/CSV**; gancho para scraper opcional).
- `/admin/mercado` (pestañas **Comparativa** con botón "Aplicar", **Competidores**,
  **Mapeos & Precios**). "Aplicar" actualiza `productos.precio` y registra
  auditoría (`auditRepo`, acción `mercado.aplicar_precio`).

### Validación
- `npx tsc --noEmit` limpio · `npm run build` verde (7 rutas + 1 página).
- Playwright con sesión admin: `/admin/mercado` renderiza (3 pestañas, tabla
  comparativa) con degradación elegante (tablas F5 ausentes en el Supabase local).

### Pendiente / notas
- Aplicar `schema-fase-f5-mercado.sql` para datos reales.
- **Scraper de competencia**: queda como gancho (la ingesta acepta lote). Cuidar
  legalidad/robustez del scraping; partir con pocos competidores y precios
  públicos (riesgo en §6 de la propuesta).
- "Aplicar a planilla" se implementa como actualización del **precio del
  producto** (interpretación concreta de "planilla de venta") con auditoría.

---

## F6 — App del dueño (PWA + push) ✅

**Objetivo:** dashboard móvil del dueño con aprobaciones push y alertas, como PWA.

### Datos (`supabase/schema-fase-f6-push.sql`)
- `push_subscriptions` (endpoint único, p256dh, auth, usuario, `preferencias`
  jsonb: aprobaciones/margen/stock/op).

### Web Push (VAPID, dependencia `web-push`)
- `src/server/services/push.ts`: `enviarPushATodos(payload, pref)` (respeta
  preferencias y **poda** suscripciones 404/410) + conveniencias
  `pushNuevaAprobacion`, `pushMargenBajo`, `pushStockCritico`, `pushOpAtascada`.
  **No-op elegante** si no hay claves VAPID en env.
- Disparo real: `aprobacionesRepo.crear` envía `pushNuevaAprobacion` best-effort
  (import dinámico para evitar ciclo). Toda aprobación nueva → push al dueño.

### API
- `GET /api/push/vapid-public-key`, `POST /api/push/subscribe`,
  `POST /api/push/unsubscribe`, `POST /api/admin/push/test` (push de prueba),
  `GET /api/admin/dueno/resumen` (ventas hoy + pendientes + OP por estado,
  resiliente a tablas ausentes).

### UI — superficie "dueño" (`/m`, PWA móvil)
- `src/app/m/*`: `layout.tsx` (manifest + theme + registro SW), `page.tsx`
  (**server**, guard rol admin/vendedor), `dueno-dashboard.tsx` (**client**):
  cards (ventas hoy, aprobaciones, taller, listo), **bandeja de aprobaciones con
  aprobar/rechazar de 1 toque** (reusa `/api/admin/aprobaciones/:id`), botón
  **Activar notificaciones** (suscribe Web Push), polling 15s.
- PWA: `public/m/manifest.json` + `public/m/sw.js` (maneja `push` y
  `notificationclick` → abre `/m`) + íconos 192/512.

### Validación
- `npx tsc --noEmit` limpio · `npm run build` verde (`/m` + 5 rutas).
- Playwright con sesión admin: `/m` renderiza (cards, botón de push, bandeja
  "Todo al día", tema móvil oscuro). PWA: manifest/sw/icon/vapid **200**.

### Pendiente / notas
- Configurar VAPID en prod: `npx web-push generate-vapid-keys` →
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Sin claves, el botón
  avisa "falta configurar VAPID" (degradación elegante).
- **iOS:** el push de PWA exige "agregar a inicio" (instalar) y el alcance es
  menor que nativo (ver §4 y fuente [17]); para uso interno del dueño es
  suficiente.
- Aplicar `schema-fase-f6-push.sql` para persistir suscripciones.
- Más alertas (margen bajo, stock crítico, OP atascada): las conveniencias ya
  existen; falta engancharlas a un cron/umbral (extensión directa).

---

## Cómo aplicar el esquema (para validar con datos reales)

Las 6 fases agregan tablas/columnas. En local caen con **degradación elegante**;
para datos reales, aplica el esquema:

- **Cloud SQL (prod):** `node deploy/apply-cloudsql.mjs` (regenera el consolidado
  desde `supabase/schema-*.sql` y lo aplica). Requiere `DB_HOST/DB_USER/DB_PASS`.
- **Supabase (local):** corre cada `supabase/schema-fase-fN-*.sql` (F1, F2, F4,
  F5, F6) en el SQL editor. Nota: este entorno local ya tenía solo el e-commerce
  (faltaban incluso `ordenes_produccion` de fase 7); aplica también las fases
  base que falten.

**Orden de fases:** F1 → F2 → F3 → F4 → F5 → F6 (cada una entrega valor sola;
F1 y F2 son la base). Convención de commits: `feat(fase-N): …`.
