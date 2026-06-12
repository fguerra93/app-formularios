# Propuesta — Automatización integral de PrintUp

> **Objetivo:** producir y vender más con menos trabajo manual. Pasar de "atender
> a cada cliente por WhatsApp uno por uno y cotizar a mano" a un **negocio
> orquestado**: los pedidos entran solos (web o WhatsApp), se cotizan solos
> (gang sheet + planillas), se encolan como **comandas** para el taller y avisan
> al cliente en cada etapa — con **inteligencia de costos y de mercado** para
> saber si compras y vendes bien.
>
> **Estado:** propuesta. **No se implementa nada todavía.** Documento para decidir
> alcance y orden. Acompaña a `PROPUESTA-REDISENO-STOREFRONT-MINIMAL.md`.
> Fecha: 2026-06-07.

---

## 0. Resumen ejecutivo (TL;DR)

**Las 4 apuestas grandes:**

1. **Venta y captación automática (omnicanal real):** WhatsApp + web alimentan
   **un solo embudo**. El bot toma pedidos completos (no solo cotiza), con
   handoff a humano cuando hace falta. Dejas de atender 1×1.
2. **Cotización self-service + Gang Sheet:** el cliente arma su pliego en la web
   (sube arte → mide → precio al instante por cm² → auto-acomodo), o el bot lo
   cotiza igual. Mata la "plantilla tediosa".
3. **Inteligencia de insumos y mercado:** motor de **costos/márgenes** (¿compro
   bien?) + **monitoreo de precios de la competencia** (¿vendo bien?).
4. **Visor 360 / Comanda de taller (estilo restaurante / KDS):** cola en tiempo
   real alimentada por web + bot, por estaciones, con semáforo de tiempos, visible
   para los operarios y que avisa al cliente al avanzar.

**¿Cuántas apps?** → **Una sola plataforma** (un código Next.js) que sirve **4
superficies por rol** + WhatsApp como **canal** (no app). **App móvil:** sí, pero
como **PWA instalable** (no nativa al inicio). Detalle en §4.

---

## 1. Diagnóstico — los cuellos de botella (en tus palabras)

| # | Dolor | Hoy en tu app | Falta |
|---|---|---|---|
| 1 | "Atender a todos por WhatsApp **uno por uno**" | Ya hay un **motor de bot** (`src/lib/bot/`: `engine`, `autonomy` verde/amarillo/rojo, `intents`, `flows`, `ai`) + bandeja en admin (`/admin/whatsapp`, `/admin/mensajeria`) | Que el bot **cierre pedidos** y que web+WhatsApp caigan en **un mismo embudo**; push al dueño para no vigilar el chat |
| 2 | Ver **precios y costos reales de insumos** + estudio de mercado (¿compro bien?) | — (no existe) | **Motor de costos/márgenes** + lista de proveedores + órdenes de compra |
| 3 | Saber si **vendo bien** vs el mercado | Precios fijos en planillas/productos | **Monitoreo de competencia** + sugerencia de precio |
| 4 | "Cada venta exige **analizar el precio en una plantilla tediosa**" → **gang sheet** | `planillasRepo` (rangos $ por cantidad + precio diseño + días); `bot/pricing.ts`; `/admin/designer` (clipart/fuentes/diseños) y `/productos/.../personalizar` | **Constructor de gang sheet** self-service con precio por cm² y **auto-acomodo** |
| 5 | **Visor 360** de todas las etapas, estilo **comanda de restaurante** | Kanban de producción `/admin/produccion` (en_cola→imprimiendo→acabado→control_calidad→listo→entregado), OP, aviso al cliente al "listo/entregado" | Convertirlo en **KDS en tiempo real** alimentado por todos los canales, por estaciones, con tiempos, para **los operarios** |

> **Conclusión:** ya tienes los cimientos (bot, planillas, kanban, designer,
> Cliente 360). La propuesta es **conectarlos en un flujo continuo** y agregar las
> dos piezas que faltan (gang sheet self-service e inteligencia de costos/mercado).

---

## 2. Los 4 pilares

### Pilar A — Venta y captación automática (omnicanal)

**Idea fuerza:** *un pedido es un pedido, venga de donde venga.* Web, WhatsApp o
carga manual entran al **mismo pipeline** (mismo estado, misma comanda, mismas
notificaciones).

- **WhatsApp Business Cloud API**: el bot no solo responde — **toma pedidos**.
  Con **WhatsApp Flows** el cliente llena formularios *dentro del chat* (medidas,
  cantidad, datos), navega el **catálogo nativo** y puede pagar sin salir. Casos
  estándar: confirmación de pedido, estado/seguimiento, recuperación de carrito
  abandonado (25–35% de recuperación), preguntas frecuentes (deflecta 60–80% del
  soporte tier-1). [1][2]
- **Cumplimiento 2026:** mantener el bot acotado a tareas (responder, cotizar,
  tomar pedidos, logística) y **opt-in** para promociones. Ojo al **cobro por
  mensaje** (desde jul-2025, por categoría: marketing/utility/auth/service). [3][2]
- **Reusa tu motor actual:** niveles de autonomía (verde = responde solo, amarillo
  = sugiere, rojo = escala a humano) ya existen — se extienden para **confirmar
  pedido** en verde y **encolar comanda** automáticamente.
- **Bandeja unificada:** una sola inbox (ya tienes `/admin/mensajeria` y
  `/admin/whatsapp`) con handoff humano de un clic.

> **Resultado:** el dueño deja de teclear lo mismo 50 veces; solo aprueba o
> interviene los casos "amarillos/rojos", desde el móvil.

### Pilar B — Cotización self-service + Gang Sheet

**Idea fuerza:** que el **precio se calcule solo** y el **archivo de impresión se
arme solo**, tanto en la web como por el bot.

Así lo hace la industria DTF y es exactamente tu "arma tu plantilla":

- El cliente **sube su arte → la app lee dimensiones → calcula precio al instante**
  por tarifa **por cm²/pulgada²** con **tramos de descuento** por tamaño/cantidad,
  y **auto-acomoda** (auto-nesting) los diseños en el pliego para **ahorrar
  material (~30% de film)**. [4][5][6]
- **Constructor visual** (extiende tu `/admin/designer` y `/productos/.../personalizar`):
  arrastrar, repetir, escalar, rotar; salida **lista para imprimir** (PDF/PNG a
  resolución) + **vista previa**.
- **Un solo motor de precios** (extiende `planillasRepo` + `bot/pricing.ts`):
  lo consume **la web y el bot**. Si te escriben de Instagram/teléfono, el bot
  manda el **link al constructor** o cotiza con las medidas que le dictan → mismo
  resultado.
- Al confirmar, **se genera la OP** (orden de producción) y entra a la comanda
  (Pilar D) **sin intervención manual**.

**Referencias de mercado** (qué replicar / o integrar como SaaS): Tally (lee
dimensiones y precia por pulgada²), DTF Gang Sheet App (auto-nesting con IA),
Antigro Gang Sheet Builder, DTF Transfer Studio (auto-nest, –30% film). [4][5][6][7]

### Pilar C — Inteligencia de insumos y de mercado

Dos preguntas que hoy respondes "a ojo":

**C.1 ¿Compro bien? (costos de insumos)**
- **Ficha de costos (BOM)** por producto: insumos (film, tinta, polera, tazón…),
  cantidad por unidad, **costo real** y **margen** por trabajo.
- **Lista de proveedores** con precios y **órdenes de compra**: generar PO, enviar
  al proveedor y registrar recepción (patrón Printavo/YoPrint). [8][9]
- **Histórico de precios de insumos** → alerta "estás pagando 18% más que el
  promedio de los últimos 3 meses / que otro proveedor".

**C.2 ¿Vendo bien? (estudio de mercado)**
- **Monitoreo de competencia** (ChileImprime, etc.): seguir precios públicos y
  **sugerir tu precio**; **pricing dinámico** con topes que protegen tu margen.
  Es el patrón de Prisync / Pricefy / Competera / Intelligence Node. [10][11][12][13]
- El monitor **realimenta tus planillas**: "tu pendón está 12% sobre el mercado;
  margen actual 41% → puedes bajar a X y seguir con 33%".

> Juntos: un **tablero de rentabilidad** por producto/pedido que cruza *costo real
> ↔ precio de venta ↔ precio de mercado*. Decides con datos, no con corazonadas.

### Pilar D — Visor 360 / Comanda de taller (KDS de imprenta)

**Idea fuerza:** la cocina de un restaurante con **comandas**: el pedido entra por
cualquier canal y aparece **al instante** en una pantalla de taller, ruteado por
**estación**, con **tiempos** y **"bump"** para avanzar. [14][15][16]

- **Cola en tiempo real** alimentada por web + bot + manual (un solo formato
  digital, sin papel). [14]
- **Ruteo por estación** (como bar/parrilla/freidora → en tu caso
  **impresión / acabado / control de calidad / despacho**); cada operario ve
  **solo lo suyo**. [15]
- **Semáforo de SLA** (tiempo en cada etapa), prioridad, y al marcar **"listo"**
  dispara aviso automático al cliente (ya lo haces al "listo/entregado"). [16]
- **Beneficios documentados de un KDS:** hasta **–90% de errores** y **–20/30% de
  espera**. [14][16]
- Es la **evolución de tu Kanban** `/admin/produccion` → pantalla **kiosko/tablet**
  para el taller, en tiempo real, pensada para **los operarios** (no para el dueño).

---

## 3. Innovaciones recomendadas (la "mejor solución")

1. **Pipeline omnicanal único:** una sola máquina de estados
   `nuevo → cotizado → aprobado/pagado → en producción (estaciones) → listo →
   entregado`, sin importar el canal. Todo lo demás (comanda, avisos, métricas)
   se cuelga de ahí.
2. **Gang sheet que genera el archivo Y la OP:** el self-service no solo cobra —
   **produce el insumo de trabajo** (pliego listo) y **encola la comanda**. Cero
   armado manual.
3. **Un solo cerebro de precios** compartido por web y bot, alimentado por la
   inteligencia de costos/mercado (Pilar C). Cotizar deja de ser una tarea.
4. **Push al dueño** (no más vigilar WhatsApp): aprobaciones y alarmas llegan a su
   móvil; aprueba/rechaza de un toque.
5. **Comanda con tiempos** estilo KDS: el taller trabaja por pantalla, el cliente
   recibe avisos solos.

---

## 4. El ecosistema completo — apps, móvil y URLs

### ¿Cuántas "apps"? → 1 plataforma, 4 superficies + 1 canal

**Recomendación:** **un solo proyecto/código** (tu Next.js actual, monorepo en
Cloud Run) que expone **4 superficies por rol** mediante subdominios, **más
WhatsApp como canal** (integración, no app aparte). Esto evita mantener varias
bases de código y reusa tu motor de precios, repos y auth.

| # | Superficie (app) | URL sugerida | Para quién | Tipo | Estado base |
|---|---|---|---|---|---|
| 1 | **Tienda** (storefront) | `printup.cl` / `www` | Clientes | Web responsiva + PWA | ✅ existe (rediseño minimal en curso) |
| 2 | **Admin / back-office** | `admin.printup.cl` | Dueño / ventas | Web | ✅ existe (`/admin/*`) |
| 3 | **Comanda de taller (KDS)** | `taller.printup.cl` | Operarios | **PWA** tablet/kiosko | 🟡 evolución del Kanban `/admin/produccion` |
| 4 | **App del dueño (dashboard móvil)** | `m.printup.cl` o PWA de admin | Dueño | **PWA** con push | 🟡 nueva vista móvil |
| 5 | **Bot de WhatsApp** | webhook en `api.printup.cl/webhooks/wa` | Clientes | Canal (no app) | ✅ motor en `src/lib/bot/` |
| 6 | **API / webhooks** | `api.printup.cl` | Integraciones | Servicio | ✅ rutas `/api/*` |

### ¿App móvil nativa o PWA?

**Recomendación: PWA primero** (una sola base de código, instalable, offline,
y **push desde iOS 16.4**). Reserva **nativa** solo si más adelante necesitas
hardware/confiabilidad de push críticos. [17][18][19]

- **Por qué PWA:** rapidez, bajo costo, un solo código; ideal para **taller**
  (tablet en modo kiosko) y **dueño** (dashboard + alertas). [18][19]
- **Límite honesto:** en iOS el push de PWA exige "agregar a inicio" y el embudo
  reduce el alcance ~10–15× vs nativo (≈16% aceptan push web vs 40–70% nativo).
  Para **uso interno** (operarios/dueño que sí instalan) **no es problema**; si
  algún día quieres push masivo a **clientes**, ahí sí evaluar nativa. [17]

### Mapa de páginas por superficie (resumen)

- **Tienda** (`printup.cl`): inicio · catálogo · producto · **constructor gang
  sheet** (nuevo) · carrito · checkout · seguimiento de pedido · mi-cuenta.
- **Admin** (`admin.printup.cl`): pedidos · **aprobaciones** · productos ·
  **planillas/precios** · **costos & márgenes** (nuevo) · **proveedores & órdenes
  de compra** (nuevo) · **inteligencia de mercado** (nuevo) · inventario · envíos ·
  WhatsApp/mensajería · campañas · reviews/preguntas · designer · configuración.
- **Comanda taller** (`taller.printup.cl`): cola por estación · detalle de OP +
  archivo listo · "bump"/avanzar · semáforo de tiempos.
- **App dueño** (`m.printup.cl`/PWA): bandeja de aprobaciones (push) · ventas del
  día · alertas de margen/stock · estado del taller de un vistazo.

---

## 5. Roadmap por fases (extiende lo existente)

> Cada fase es entregable y medible. Encaja en tu stack actual (Next.js + Cloud
> Run + Cloud SQL) sin cambiar arquitectura.

| Fase | Entregable | Resultado de negocio |
|---|---|---|
| **F1 — Cerebro de precios + Gang Sheet** | Constructor de gang sheet en la tienda (sube→mide→precia por cm²→auto-acomodo) reusando `planillas`/`pricing`; el bot usa el mismo motor | Cotizar deja de ser manual; ventas self-service 24/7 |
| **F2 — Pipeline omnicanal + Comanda/KDS** | Máquina de estados única; **comanda taller** (PWA) en tiempo real por estación con avisos automáticos | El taller trabaja por pantalla; el dueño deja de coordinar a mano |
| **F3 — Bot que cierra pedidos** | WhatsApp Flows + catálogo + confirmación/pago; autonomía verde cierra, amarillo/rojo escala | Fin del "uno por uno"; recuperación de carritos |
| **F4 — Inteligencia de insumos/costos** | BOM, costo real, márgenes, proveedores + órdenes de compra, alertas de sobreprecio | Sabes qué deja plata y si compras caro |
| **F5 — Inteligencia de mercado** | Monitor de competencia + sugerencia de precio + topes de margen | Sabes si vendes bien; precios al día |
| **F6 — App dueño (PWA + push)** | Dashboard móvil con aprobaciones push y alertas | Operas el negocio desde el bolsillo |

---

## 6. Decisiones abiertas / riesgos a considerar

- **Costo de WhatsApp** (por mensaje desde jul-2025) y **política de IA 2026**:
  diseñar plantillas y opt-in con cuidado. [3][2]
- **Gang sheet: ¿construir o integrar SaaS?** Tu `/admin/designer` ya es base para
  construir; alternativa: integrar un builder de terceros. Decisión de costo/control.
- **Monitoreo de competencia:** legalidad/robustez del scraping; partir con pocos
  competidores y precios públicos. [10][13]
- **Pagos:** MercadoPago quedó fuera del deploy actual; el bot que "cierra pedido"
  necesita definir si cobra en línea o con transferencia/pago al retirar.
- **Roles/permisos:** operario (taller) vs vendedor vs dueño — ya hay roles
  (`admin/vendedor/bodega`); la comanda usa el rol de taller.

---

## 7. Fuentes (actuales, 2025–2026)

**WhatsApp / comercio conversacional**
1. eesel AI — WhatsApp Business Platform 2025 (IA y campañas): https://www.eesel.ai/blog/whatsapp-business-platform-2025-updates-for-ai-and-campaigns
2. Message Central — WhatsApp Business API 2026 (setup, Cloud API, pricing): https://www.messagecentral.com/blog/whatsapp-business-api-complete-guide
3. Alibaba Cloud — WhatsApp AI policy 2026: https://www.alibabacloud.com/help/en/chatapp/use-cases/whatsapp-ai-policy-2026-guide

**Gang sheet (DTF) — auto-nesting y precio por área**
4. Tally (Shopify) — lee dimensiones, precia por pulgada²: https://apps.shopify.com/tally-app
5. DTF Gang Sheet App — auto-nesting con IA: https://dtfgangsheetapp.com/
6. DTF Transfer Studio — auto-nest, ahorro ~30% film: https://dtftransferstudio.com/
7. DTF Core — Gang Sheet Builder features & pricing 2025: https://www.dtfcore.com/dtf-gangsheet-builder-features-pros-and-pricing-in-2025/

**Software de taller / order tracking**
8. Printavo — job tracking, órdenes de compra a proveedores: https://www.printavo.com/blog/print-shop-job-tracking-software/
9. YoPrint — production management (estados por tarea): https://www.yoprint.com/production-management-for-print-shops

**Inteligencia de precios / mercado**
10. Prisync — monitoreo de competencia + pricing dinámico: https://prisync.com/
11. Pricefy — price tracking con matching IA: https://www.pricefy.io/
12. Intelligence Node — price monitoring para e-commerce: https://www.intelligencenode.com/solutions/price-monitoring-software-for-ecommerce/
13. AIMultiple — price benchmarking (panorama de herramientas): https://research.aimultiple.com/price-benchmarking/

**Comanda / KDS (modelo restaurante)**
14. Ordering Stack — guía de KDS: https://orderingstack.com/blog/a-guide-to-kitchen-display-system-kds-in-restaurant
15. Lightspeed — Kitchen Display System: https://www.lightspeedhq.com/pos/restaurant/kitchen-display-system/
16. LS Retail — por qué tu cocina necesita un KDS: https://www.lsretail.com/resources/what-is-restaurant-kitchen-display-system

**PWA vs nativa (decisión de app móvil)**
17. Brainhub — PWA en iOS, estado y límites 2025: https://brainhub.eu/library/pwa-on-ios
18. MagicBell — cuándo construir PWA instalable vs nativa: https://www.magicbell.com/blog/pwa-vs-native-app-when-to-build-installable-progressive-web-app
19. Progressier — tabla comparativa PWA vs nativa 2026: https://progressier.com/pwa-vs-native-app-comparison-table

---

## 8. Prompts completos de desarrollo (para ejecutar fase por fase)

> **Cómo usarlos.** Estos prompts están escritos para pegárselos a **Claude Code**
> en una sesión nueva. Para cada fase: pega **§8.0 Prompt base** + el **prompt de
> la fase** (§8.1…§8.6). El agente leerá el repo, implementará, **validará en local**
> y dejará **commit en una rama** — **sin desplegar a GCP** salvo que lo pidas.
> Orden recomendado y meta-prompt en §8.7.
>
> Sustituye lo que vaya entre `⟦corchetes⟧` si quieres acotar el alcance.

### 8.0 — Prompt base (común a TODAS las fases)

```text
Trabajas en PrintUp: e-commerce + back-office de una imprenta (Doñihue, Chile).
Stack: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 ·
fuente Plus Jakarta Sans. Deploy objetivo: GCP Cloud Run + Cloud SQL (Postgres).

ANTES DE ESCRIBIR CÓDIGO:
- Lee AGENTS.md y las guías relevantes en node_modules/next/dist/docs/. Esta
  versión de Next tiene breaking changes respecto a lo que “recuerdas”: respétalas.
- Lee wiki/PROPUESTA-AUTOMATIZACION-PRINTUP.md (esta propuesta) para el contexto.
- Hazme primero un PLAN corto (pasos + supuestos + archivos a tocar) y espera mi OK
  si algo es ambiguo. Si no hay ambigüedad, procede.

CONVENCIONES DEL REPO (obligatorias):
- Acceso a datos SOLO por el chokepoint getDb() en src/server/db/index.ts. La
  lógica vive en repositorios src/server/repositories/* (con barrel index.ts).
- En local getDb() usa Supabase; en prod usa Cloud SQL vía el adaptador
  src/server/db/adapter.ts (createPgDb), que traduce el query-builder estilo
  PostgREST a SQL con `pg`. POR ESO: en los repos usa el builder
  (.from().select().eq().or().order().upsert()...), NO escribas SQL crudo.
- Tablas nuevas: agrégalas al esquema consolidado (deploy/schema-cloudsql.sql vía
  deploy/apply-cloudsql.mjs) Y créalas también en Supabase para validar en local.
  Nombres y estilo consistentes con las tablas existentes.
- Auth: admin → src/lib/auth.ts (cookie admin_token, getSession(), roles
  admin/vendedor/bodega). Cliente → src/lib/auth-cliente.ts (cookie cliente_token).
- Archivos/medios: src/server/repositories/storage.ts (GCS, URLs firmadas v4).
- Diseño: el storefront usa el sistema “minimal claro” (.mc-* en globals.css) y
  export const dynamic = "force-dynamic". El admin conserva su estilo actual.
- Notificaciones: reutiliza el patrón existente (bot/notifications.ts, email Resend,
  avisos al cliente al avanzar la OP).

GUARDRAILES:
- NO integres MercadoPago por defecto (el deploy actual va sin MP). Deja gancho.
- NO despliegues a GCP ni toques infra salvo que te lo pida explícitamente.
- Si creas secrets en Windows/PowerShell, cuida el BOM (escribe UTF-8 sin BOM).
- Reusa lo que ya existe; NO dupliques (bot engine, planillas/pricing, Kanban de
  producción, designer, cola de aprobación, Cliente 360). NO rompas esos flujos.
- Trabaja en una rama feature; mensajes de commit estilo `feat(fase-N): ...`
  NO menciones IA/Claude en los commits y NO uses el footer Co-Authored-By.

DEFINICIÓN DE HECHO (toda fase):
1) `npx tsc --noEmit` limpio y `npm run build` verde.
2) Validación en local: `npm run dev` + recorrido con Playwright (capturas de las
   pantallas nuevas/afectadas) y revisión de errores de consola.
3) Reusa lo existente y no rompe el flujo actual (incl. la cola de aprobación).
4) Actualiza la doc correspondiente en wiki/ y deja TODO en un commit en la rama.
5) Repórtame qué validaste (con las capturas) y qué quedó pendiente.
```

### 8.1 — F1: Cerebro de precios + Gang Sheet (self-service)

```text
Implementa la FASE 1 (usa el Prompt base §8.0).

OBJETIVO: un único “cerebro de precios” compartido por web y bot, y un constructor
de gang sheet self-service que cobra por área y genera el archivo listo + la OP.

DATOS (tablas nuevas/extendidas):
- tarifas_gang_sheet: material, ancho_pliego_cm, tarifa_por_cm2 (o por pulgada²),
  merma_pct, tramos de descuento por área/cantidad, dias_produccion.
- gang_sheets (extiende el repo `disenos`/designer): items[] {arte_url, x, y,
  w_cm, h_cm, rot}, ancho_pliego, material, area_usada, area_pliego, precio,
  desglose; vínculo a item de carrito y luego a OP.

MOTOR DE PRECIOS (compartido):
- Centraliza el cálculo en src/server/domain (reusando planillasRepo y
  src/lib/bot/pricing.ts). Función calcularGangSheet({items, ancho, material}) →
  {areaUsada, areaPliego, merma, precio, desglose}.
- Auto-nesting heurístico en servidor (bin-packing tipo shelf/MaxRects);
  documenta que es heurístico y deja punto de extensión.

API:
- POST /api/cotizar/gang-sheet (precio en vivo, sin guardar).
- POST /api/gang-sheets, GET /api/gang-sheets/:id (reusa /api/designer/disenos).
- Subida de arte con URL firmada de GCS (storage.ts).

UI (tienda, estilo .mc-*):
- Extiende /productos/[categoria]/[slug]/personalizar (o nueva /gang-sheet):
  lienzo arrastrar/soltar, subir arte, repetir/escalar/rotar, PRECIO EN VIVO,
  preview del pliego con auto-acomodo, botón “Agregar al carrito”.

INTEGRACIÓN:
- El bot (src/lib/bot) usa el MISMO endpoint de cálculo; si cotiza por medidas o
  manda el link al constructor, el precio coincide con la web.
- Al confirmar (carrito→pago/aprobación) se genera archivo listo (PDF/PNG server)
  y nace una OP en estado en_cola (no romper la cola de aprobación actual).

ACEPTACIÓN:
- Subir arte → precio coherente por cm² con descuentos; auto-acomodo visible.
- El diseño queda guardado y reutilizable; agregar al carrito funciona.
- El bot devuelve el mismo precio que la web para el mismo input.
```

### 8.2 — F2: Pipeline omnicanal + Comanda / KDS de taller

```text
Implementa la FASE 2 (usa el Prompt base §8.0).

OBJETIVO: una sola máquina de estados para TODO pedido (web/bot/manual) y una
“comanda de taller” en tiempo real (PWA) por estación, estilo KDS de restaurante.

DATOS:
- Estado canónico de pedido/OP: nuevo → cotizado → aprobado/pagado →
  en_produccion{impresion, acabado, control_calidad, despacho} → listo → entregado.
- Campo `canal` (web | whatsapp | manual) en pedido/OP.
- Registra timestamp por transición (reusa la tabla de eventos de la FSM existente).

API:
- Extiende /api/admin/op con estaciones y un endpoint “avanzar/bump”.
- /api/taller/cola con actualización en tiempo real (SSE o polling corto).

UI — superficie nueva “taller” (PWA, modo tablet/kiosko):
- Ruta /taller (o subdominio taller.printup.cl). Manifest + service worker
  (instalable, offline básico). Auth rol bodega/taller.
- Columnas por estación; tarjetas-comanda con datos de la OP + archivo listo;
  botón avanzar; SEMÁFORO de tiempo (SLA por etapa); orden por prioridad/llegada.
- Al marcar “listo” dispara aviso automático al cliente (reusa notificaciones).

INTEGRACIÓN:
- Parte del Kanban actual /admin/produccion como base (no lo elimines).
- El checkout web y el bot crean pedidos que entran a la MISMA cola.

ACEPTACIÓN:
- Un pedido creado por web y otro por bot aparecen en la misma cola casi al instante.
- Avanzar etapa se refleja en vivo en la pantalla del taller.
- Semáforo de tiempos visible; al “listo” el cliente recibe aviso.
- La vista de taller se instala como PWA en una tablet.
```

### 8.3 — F3: Bot de WhatsApp que cierra pedidos

```text
Implementa la FASE 3 (usa el Prompt base §8.0).

OBJETIVO: que el bot tome el pedido COMPLETO por WhatsApp (no solo cotice):
WhatsApp Flows + catálogo + confirmación, con autonomía verde=cierra,
amarillo/rojo=escala a humano, y recuperación de carrito.

INTEGRACIÓN (reusa src/lib/bot/*):
- engine/autonomy/intents/ai/tools/pricing ya existen: extiéndelos para crear
  pedido y encolar comanda (F2) en caso “verde”.
- WhatsApp Cloud API: Flows (formularios in-chat para medidas/datos), catálogo
  nativo, plantillas (templates) aprobadas. Promos solo con opt-in.
- Cobro: por defecto transferencia / pago al retirar (SIN MercadoPago); deja
  gancho para pago en línea.
- Webhook: lleva src/app/api/test/whatsapp-webhook a producción de forma segura.

CONSIDERA (documéntalo): el cobro por mensaje de WhatsApp (categorías) desde
jul-2025 y la política de IA 2026 (bot acotado a tareas).

ACEPTACIÓN:
- Caso verde: una conversación cotiza → confirma → crea pedido → entra a la comanda
  SIN intervención humana.
- Casos amarillo/rojo: escala a humano en la bandeja (/admin/whatsapp).
- Respeta opt-in y no envía promo sin permiso.
```

### 8.4 — F4: Inteligencia de insumos / costos / márgenes

```text
Implementa la FASE 4 (usa el Prompt base §8.0).

OBJETIVO: saber el costo real y el margen (¿compro bien?), con proveedores y
órdenes de compra.

DATOS:
- insumos (sku, nombre, unidad, costo_actual), proveedores,
  precios_proveedor (insumo, proveedor, precio, fecha),
  bom (producto → insumos + cantidad por unidad),
  ordenes_compra (+ items + recepción).

LÓGICA:
- Costo real por producto/OP = Σ(BOM × costo insumo). Margen = precio − costo.
- Alertas: “insumo X subió ≥⟦15⟧% vs su histórico” o “proveedor A más caro que B”.

API/UI (admin, estilo admin actual):
- /admin/costos (ficha de costos/márgenes por producto y por pedido/OP),
  /admin/proveedores, /admin/ordenes-compra (crear OC, enviar, registrar recepción).
- Tablero de rentabilidad cruzando costo real ↔ precio de venta.

INTEGRACIÓN:
- Cruza con planillas/precios (F1) y con la OP (costo real del trabajo).

ACEPTACIÓN:
- Ficha de costos por producto; margen visible por pedido.
- OC se genera, se envía y se registra la recepción.
- Salta alerta cuando un insumo supera el umbral configurado.
```

### 8.5 — F5: Inteligencia de mercado (¿vendo bien?)

```text
Implementa la FASE 5 (usa el Prompt base §8.0).

OBJETIVO: comparar mis precios con el mercado y sugerir precio respetando margen.

DATOS:
- competidores (nombre, url), productos_competencia (mapeo a mis productos),
  precios_competencia (histórico con fecha).

LÓGICA:
- Ingesta de precios: empieza por carga MANUAL/CSV (y deja interfaz para un
  scraper opcional más adelante — ver riesgo legal en §6).
- Matching a mis productos; sugerencia de precio con TOPE de margen mínimo
  (usa el costo real de F4); pricing dinámico opcional con guardarraíles.

API/UI (admin):
- /admin/mercado: comparativa “mi precio vs mercado” por producto, con sugerencia
  y botón “aplicar a planilla” (deja auditoría del cambio).

ACEPTACIÓN:
- Ver mi precio vs mercado por producto.
- La sugerencia nunca baja del margen mínimo configurado.
- Aplicar la sugerencia actualiza la planilla con registro de auditoría.
```

### 8.6 — F6: App del dueño (PWA + push)

```text
Implementa la FASE 6 (usa el Prompt base §8.0).

OBJETIVO: dashboard móvil del dueño con aprobaciones push y alertas, como PWA.

DATOS:
- push_subscriptions (web push / VAPID) + preferencias de alerta.

LÓGICA:
- PWA: manifest + service worker + Web Push con VAPID. Push en: nueva aprobación
  pendiente, margen bajo, stock crítico, OP atascada en la comanda.

UI — superficie “dueño” (PWA móvil):
- Ruta /m (o m.printup.cl): bandeja de aprobaciones (aprobar/rechazar de 1 toque),
  ventas del día, alertas, estado del taller de un vistazo.

INTEGRACIÓN:
- Reutiliza la cola de aprobación (Fase 4 existente) y las métricas.

ACEPTACIÓN:
- Se instala como PWA; recibe push de aprobación y permite aprobar desde el aviso.
- Degrada bien en iOS (recordar el funnel de push PWA; ver §4 y fuentes [17]).
```

### 8.7 — Orden de ejecución y meta-prompt

**Orden recomendado:** F1 → F2 → F3 → F4 → F5 → F6. Cada fase entrega valor por sí
sola; F1 y F2 son la base sobre la que se apoyan las demás.

**Meta-prompt (para arrancar cualquier fase):**

```text
Implementa la ⟦Fase X⟧ de wiki/PROPUESTA-AUTOMATIZACION-PRINTUP.md.
Usa el “Prompt base (§8.0)” + el “prompt de la fase (§8.⟦x⟧)”.
Primero dame un plan corto y tus supuestos; luego implementa, valida en local
(tsc + build + npm run dev + capturas) y deja un commit en una rama feature.
NO despliegues a GCP. NO menciones IA/Claude en el commit.
```

