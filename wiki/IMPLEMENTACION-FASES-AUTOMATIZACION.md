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
