# El e-commerce definitivo de PrintUp — Auditoría y propuesta

> **Fecha:** 2026-06-12 · **Rama:** `ecommerce-definitivo` (desde `rediseno-minimal-storefront`)
> **Método:** sistema levantado en local, navegado con Playwright, 12 capturas en `wiki/audit/`.
> Estado del código verificado con grep contra `src/` y `supabase/` — la matriz dice la verdad, no supone.

---

## 1. Resumen ejecutivo

La base es mucho mejor de lo que el dueño cree — pero se ve peor de lo que es. El backend tiene
piezas que Shopify cobra caro (aprobaciones de mockup, producción KDS, costos/BOM, bot WhatsApp,
designer, webhooks idempotentes, zonas de envío, DTE en esquema). El problema está en tres capas:

1. **La tienda todavía huele a plantilla.** El "minimal claro v2" limpió mucho, pero sobreviven
   bloques enteros de la era anterior: cotizador glassmorphism con círculos flotantes, contadores
   con iconos multicolor (que además muestran "0+ Clientes" y "0 anos" — sin ñ), blobs rosados en
   testimonios, grillas de 3 tarjetas con icono. Y el contenido del seed viene **sin tildes**
   ("Pendon", "Informacion", "Descripcion") — nada grita "hecho a máquina" más fuerte que eso.
2. **La ficha del roller entierra su mejor arma.** El configurador por m² existe y calcula bien,
   pero está al 60% del scroll, debajo de ~15 secciones de texto donde "Qué incluye" aparece
   **tres veces** y "Por qué elegir PrintUp" dos. Todo el embudo desemboca en "Cotizar por
   WhatsApp": no hay compra directa con medida configurada.
3. **El admin tiene rutas, no profundidad.** El dashboard es un skeleton sin datos (literal:
   la queja "está muy vacía" es exacta). Pedidos y productos son listas planas sin acciones
   masivas, sin timeline, sin variantes, sin filtros guardados.

**Gaps duros para apagar Shopify:** Webpay (no existe — solo MercadoPago), variantes de producto,
precios escalonados por cantidad (solo texto, no motor), emails transaccionales de pedido,
analítica de ventas en dashboard, carrito abandonado (la tabla existe, el cron no).

---

## 2. Hallazgos por página (FASE 0)

### 2.1 Home — `wiki/audit/tienda-home-desktop.jpeg`, `tienda-home-mobile.jpeg`

| Qué funciona | Qué falla |
|---|---|
| Barra de anuncios real (despachos mié/vie, envío gratis $50.000, retiro) — señal de negocio vivo | "Productos destacados", "Explora por categoría" y "Cómo funciona" se renderizan **invisibles sin scroll** (framer-motion `opacity:0` inicial): un crawler o un screenshot ve secciones vacías → riesgo SEO directo |
| Hero v2 con titular a la izquierda y foto real | Contador "Números que nos respaldan" muestra **"0+ Clientes Felices, 0 anos De Experiencia"** — ceros y un "anos" sin ñ visibles en producción |
| FAQ y footer sobrios | Cotizador = panel degradado navy + glassmorphism + círculos flotantes + pill centrado: el tell de IA más fuerte de todo el sitio |
| | Testimonios con blobs rosados de fondo y carrusel centrado genérico |
| | Sección poleras = otra tarjeta oscura genérica; iconos multicolor en stats |

### 2.2 Ficha roller pendón — `wiki/audit/tienda-roller-pendon-desktop.jpeg`, `-mobile.jpeg`

Above the fold: imagen mockup IA ("TU MARCA AQUÍ"), precio "desde $12.000/m²", chips de
confianza, dos CTAs que van a cotizar (negro) y WhatsApp (verde). **No hay compra directa.**

Luego, en orden, el muro: 3 tarjetas icono → "Que incluye" (1ª vez) → tabs Descripción/Detalles/
Envío/Preguntas → "Características principales" → "Usos y aplicaciones" → "Información de
impresión" → "Que incluye tu pedido" (2ª vez) → "Como funciona?" → "Por que elegir PrintUp" →
**"Configura tu trabajo" (el configurador, recién aquí)** con sidebar que repite "Por qué
elegimos" y "Que incluye tu pedido" (3ª vez) → FAQ (2ª vez, ya estaba en tabs) → "Pon tus
medidas" con 4 círculos multicolor → reviews vacías → footer.

El configurador en sí: inputs ancho/alto/cantidad, dropdown "Opciones reales del taller",
"DESDE $12.000 por m²" y CTA WhatsApp. **Sin preview a escala, sin presets de medidas
estándar, sin precio total en vivo de la medida puesta, sin agregar al carrito.** La
matemática está (`price-calculator.tsx`: precio m², ancho imprimible 85 cm, área mínima,
validación de empalmes) — solo está mal vestida y mal ubicada.

### 2.3 Catálogo y categoría — `tienda-productos-desktop.jpeg`, `tienda-categoria-desktop.jpeg`
Grilla limpia heredada del v2. Sin filtros por precio/material, sin orden visible, tarjetas
correctas. Aceptable como base, mejorable en densidad de información (plazo, "desde $X/m²").

### 2.4 Checkout — `tienda-checkout-desktop.jpeg`
Con carrito vacío muestra estado vacío. El código soporta invitado (verificado por grep).
Pago: **solo MercadoPago + transferencia**; no hay Webpay. No captura email/teléfono temprano
(el carrito abandonado no tiene materia prima).

### 2.5 Admin dashboard — `admin-dashboard.jpeg`
**Skeletons grises sin resolver, cero KPIs.** No responde "¿cómo va el negocio hoy?". La
campana de notificaciones es un emoji 🔔. Sidebar bien seccionado (Operación/Tienda/
Formularios/Costos & Mercado) pero sin tildes ("Produccion", "Categorias", "Disenador").

### 2.6 Admin pedidos — `admin-pedidos.jpeg`
Búsqueda por nombre/email, filtro de estado único, rango de fechas nativo, exportar CSV.
**Faltan:** tabs por estado, estados de pago vs fulfillment separados, acciones masivas,
filtros guardados, timeline por pedido, pedidos borrador, notas/etiquetas, impresión de
documentos. El estado vacío es un callejón ("No hay pedidos que coincidan") — no enseña nada.

### 2.7 Admin productos — `admin-productos.jpeg`
Lista real con thumbnail, SKU, categoría, precio, stock, estado y acciones (ver/duplicar/
toggle). **Faltan:** variantes, precios escalonados, selección masiva, edición inline,
colecciones, import CSV, SEO por producto. Es un CRUD correcto, no una herramienta de
catálogo.

### 2.8 Capturadas para referencia
`admin-inventario.jpeg`, `admin-cupones.jpeg`, `admin-campanas.jpeg` — mismas conclusiones
de profundidad: la ruta existe, la operación diaria no está resuelta.

---

## 3. Matriz de paridad Shopify (estado verificado en código)

Leyenda: ✅ existe · 🟡 parcial · ❌ falta · **P1** = bloquea apagar Shopify · P2 = duele pronto · P3 = puede esperar

### Núcleo
| Capacidad | Estado | Evidencia | Prio | Esfuerzo |
|---|---|---|---|---|
| Catálogo + categorías + CRUD admin | ✅ | `productos`, `categorias`, admin/productos | — | — |
| Variantes (talla/color/material) | ❌ | no hay tabla `variantes`; solo `opciones` JSON plano | **P1** | M |
| Precios escalonados por cantidad | ❌ | solo texto en ficha; sin motor ni tabla | **P1** | M |
| Carrito persistente | ✅ | `carritos_guardados` + provider | — | — |
| Checkout invitado | ✅ | verificado en `checkout/page.tsx` | — | — |
| Cupones | ✅ | `cupones` + admin | — | — |
| Cuentas + historial | ✅ | `clientes`, mi-cuenta | — | — |
| Botón "repetir pedido" | ❌ | no existe | P2 | S |

### Pagos y envíos (Chile)
| Capacidad | Estado | Evidencia | Prio | Esfuerzo |
|---|---|---|---|---|
| MercadoPago | ✅ | SDK en deps + checkout | — | — |
| **Webpay Plus** | ❌ | cero menciones a transbank/webpay en `src/` | **P1** | M |
| Transferencia + comprobante | 🟡 | transferencia sí; subida de comprobante no | P2 | S |
| Webhooks idempotentes | ✅ | tabla `webhook_eventos` (schema-seguridad) | — | — |
| Zonas/tarifas de envío por comuna | 🟡 | `zonas_envio` existe; falta selector región/comuna oficial completo | P2 | M |
| API courier (Shipit/Envíame) | ❌ | no existe | P3 | M |
| Tracking de despacho | 🟡 | campo en pedidos; sin integración | P3 | S |

### Operación (ventaja propia — Shopify no lo tiene así)
| Capacidad | Estado | Evidencia | Prio | Esfuerzo |
|---|---|---|---|---|
| Cola de producción kanban | ✅ | `ordenes_produccion`, /admin/produccion, /taller | — | pulir UX |
| Aprobación de mockup | ✅ | `aprobaciones` + /admin/aprobaciones | — | integrarla al flujo de pedido |
| Personalizador/designer | ✅ | fase9: `disenos_cliente`, areas, clipart, fuentes | — | validación DPI 🟡 |
| Gang sheet builder | ✅ | `gang_sheets` + /gang-sheet | — | — |
| Bot WhatsApp | ✅ | fase11 + /admin/whatsapp | — | — |
| Costos/BOM/órdenes de compra | ✅ | fase F4 | — | — |
| Ficha de trabajo imprimible | ❌ | no hay vista de impresión | P2 | S |
| Notificación automática por cambio de estado | 🟡 | `domain_events`+`notificaciones` existen; falta disparar email/WA al cliente | **P1** | M |

### Pedidos / clientes / marketing
| Capacidad | Estado | Prio | Esfuerzo |
|---|---|---|---|
| Timeline del pedido | ❌ | P2 | M |
| Estados pago vs fulfillment separados | 🟡 (un solo `estado`) | **P1** | M |
| Pedido borrador / cotización→pedido | 🟡 (`cotizaciones_whatsapp` sin conversión 1-clic) | P2 | M |
| Acciones masivas + filtros guardados | ❌ | P2 | M |
| Ficha cliente 360 + etiquetas CRM | 🟡 (`clientes` con RUT; sin vista 360) | P2 | M |
| Emails transaccionales de pedido | ❌ (Resend en deps, `email_log` existe; no se envían) | **P1** | S–M |
| Carrito abandonado (cron) | 🟡 (tabla lista; sin captura temprana ni cron) | P2 | M |
| Campañas email | ✅ (fase8 + editor) | — | — |
| Reviews con fotos + solicitud post-entrega | 🟡 (reviews sí; fotos/solicitud no) | P2 | M |
| Dashboard con ventas/KPIs | ❌ (skeleton) | **P1** | M |

### Tráfico / legal / infra
| Capacidad | Estado | Prio | Esfuerzo |
|---|---|---|---|
| SSR + sitemap + metas | ✅ (Next 16) | — | — |
| Schema.org Product/LocalBusiness | ❌ | P2 | S |
| Feed Google Merchant Center | ❌ | P2 | S–M |
| OG por producto (imagen+precio para WhatsApp) | 🟡 | P2 | S |
| GA4 + Pixel Meta | ✅ (providers) | — | server-side ❌ P3 |
| Validación RUT módulo 11 | 🟡 (campo existe; validador no encontrado) | P2 | S |
| DTE boleta/factura SII | 🟡 (esquema fase6-dte + notas_credito; sin emisor API) | P3 | L |
| Retracto/términos personalizados | 🟡 (políticas genéricas) | P2 | S |
| Backups BD + uptime check | 🟡 (GCP sandbox; verificar) | P2 | S |

**Conclusión de paridad:** para apagar Shopify faltan exactamente seis P1: Webpay, variantes,
precios escalonados, emails transaccionales, estados de pago/fulfillment separados y dashboard
con ventas. Todo lo demás ya existe o puede esperar.

---

## 4. Dirección de arte — "que no parezca IA"

### Por qué lo actual sigue pareciendo IA
El v2 adoptó "minimal Stripe/Linear", que en 2026 es el *uniforme* de las páginas generadas:
correcto, frío, intercambiable. Además quedaron tells de la era anterior (glassmorphism del
cotizador, blobs, iconos multicolor) y los ceros/faltas de ortografía del seed rematan la
sensación de maqueta.

### Dirección A — **"Pliego de taller"** (recomendada)
La identidad sale del oficio de imprenta, no de un SaaS. Elementos concretos:

- **Cotas y medidas como lenguaje gráfico:** líneas de dimensión (`|—— 85 cm ——|`), escalas,
  retícula técnica sutil de fondo en secciones clave. En una imprenta los números venden.
- **Marcas del oficio usadas con función, no de adorno:** registro CMYK en el footer, marcas
  de corte en las esquinas de las tarjetas de producto al hover, "pliego" como metáfora de
  sección.
- **Tipografía editorial:** titulares grandes y apretados (ya está), pero los datos técnicos
  (precios, medidas, SKU, plazos) en **monoespaciada tabular** — voz de taller, no de app.
- **Tinta sobre papel:** fondo blanco papel, tinta casi negra (ya está), un solo acento que
  pasa de cyan decorativo a **cyan proceso (C de CMYK)** usado solo en datos activos.
- **Fotografía real del taller y del producto impreso.** Donde no haya, mockup limpio sobre
  fondo neutro — nunca render 3D genérico ni stock con sonrisas.
- **Microcopy de imprentero:** "Impreso en Doñihue", "Sale en 24–48 h", "85 cm de ancho
  imprimible". Cero "soluciones integrales".

### Dirección B — "Catálogo industrial"
Densidad tipo Saxoprint/Vistaprint pro: tablas de precio visibles, grillas comprimidas, todo
clicable. Máxima conversión B2B, mínima poesía. Riesgo: parecer genérico de otra forma.

### Dirección C — "Risografía con carácter"
Color plano vibrante, duotonos, texturas de tinta. Máxima personalidad, pero exige dirección
de arte fotográfica constante y pelea con el catálogo heredado de Shopify.

**Recomendación: A**, con la densidad informativa de B en catálogo y fichas. C se descarta por
costo de mantención.

### Wireframe home (dirección A)

```
┌──────────────────────────────────────────────────────────────┐
│ ● Abierto ahora · Despachos mié/vie · Retiro gratis Doñihue  │  ← barra real (ya existe)
├──────────────────────────────────────────────────────────────┤
│ PrintUp   Productos  Portafolio  Nosotros  Contacto    ⌕ ♡ 🛒 │
├──────────────────────────────────────────────────────────────┤
│  IMPRESIÓN EN DOÑIHUE — REGIÓN DE O'HIGGINS                  │
│  Tu impresión,            ┌────────────────────────┐         │
│  lista cuando la          │ foto real del taller   │         │
│  necesitas.               │ |——— 80 × 200 cm ———|  │  ← cota real sobre la foto
│                           └────────────────────────┘         │
│  [Ver catálogo]  [Cotizar por WhatsApp]                      │
│  ── 500+ clientes · 2.000+ trabajos · sale en 24–48 h ──     │  ← datos reales, sin iconos
├──────────────────────────────────────────────────────────────┤
│  LO MÁS PEDIDO                                    ver todo → │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │ foto    │ │         │ │         │ │         │             │  ← tarjetas con marcas de
│  │ Roller  │ │ DTF     │ │ Tazón   │ │ Pendón  │             │    corte al hover; precio
│  │ $46.990 │ │ $16.660 │ │ $5.000  │ │ $12.000/m²           │    monoespaciado; plazo
│  │ 24–48 h │ │ 24 h    │ │ 48 h    │ │ 24–48 h │             │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
├──────────────────────────────────────────────────────────────┤
│  COTIZA AL TIRO (panel tinta, formulario técnico, sin vidrio)│
│  producto ▾   cantidad [   ]   material ▾   → [Cotizar]      │
├──────────────────────────────────────────────────────────────┤
│  categorías en lista editorial (no grilla de iconos)         │
│  testimonios sin blobs · FAQ · footer tinta con registro CMYK│
└──────────────────────────────────────────────────────────────┘
```

### Qué se elimina sin piedad
`FloatingCircles` y `GlassmorphCard` (cotizador), blobs de testimonios, iconos multicolor de
stats, los "0+" (números reales fijos: 500+, 2.000+), popup "alguien compró" en su forma
actual, y **todas las tildes faltantes del contenido** (seed + UI).

---

## 5. Spec: configurador del roller pendón (piloto de ficha-herramienta)

**Principio: el configurador ES la página.** Layout above the fold (desktop):

```
┌───────────────────────────────┬──────────────────────────────┐
│  PREVIEW A ESCALA             │  Pendón Roller PVC           │
│  ┌─────────┐                  │  Impreso en Doñihue · 24–48 h│
│  │         │   ╷              │                              │
│  │ PENDÓN  │   │ silueta      │  Medida                      │
│  │ (vivo,  │   │ humana       │  [80×200] [85×200] [100×200] │
│  │ escala  │   │ 1,70 m       │  ancho [ 85] cm alto [200] cm│
│  │ real)   │   ╵              │  ⚠ máx. ancho imprimible 85cm│
│  │         │                  │                              │
│  └─────────┘                  │  Material/acabado  ▾         │
│  |—— 85 cm ——|  alto 200 cm   │  Cantidad  [− 1 +]           │
│                               │                              │
│  cotas vivas bajo el preview  │  TOTAL      $46.990          │
│                               │  $12.000/m² × 1,70 m² + base │
│                               │  IVA incluido                │
│                               │  [Agregar al carrito]        │
│                               │  [Cotizar por WhatsApp]      │
└───────────────────────────────┴──────────────────────────────┘
```

Reglas:
1. **Preview SVG a proporción real** con silueta humana de 1,70 m al lado; al cambiar
   ancho/alto el pendón se redimensiona en vivo y las cotas se actualizan. El cliente VE si
   el pendón le llega a la cintura o lo supera.
2. **Presets** de medidas estándar (chips) + medida libre. Validación inline reutilizando la
   lógica existente de `price-calculator.tsx` (ancho imprimible, área mínima, empalmes), con
   mensajes en lenguaje claro en el momento — no en el carrito.
3. **Precio total en vivo** (no "desde"): m² calculados × tarifa + estructura, IVA incluido,
   con desglose visible en monoespaciada. Cambia con medida/material/cantidad sin recargar.
4. **CTA doble:** "Agregar al carrito" (primario, tinta) con la medida exacta en el ítem;
   WhatsApp como secundario — deja de ser la única salida.
5. **Móvil:** barra inferior fija con `TOTAL $XX.XXX · Agregar` siempre visible.
6. **El texto se reorganiza, no se bota:** debajo del configurador quedan 4 tabs
   (Especificaciones / Qué incluye / Archivo de impresión / Preguntas) — una sola vez cada
   contenido. Desaparecen las 3 repeticiones de "qué incluye" y los 4 círculos multicolor.
7. **Genérico por diseño:** el componente sirve para todo producto con `precio_m2`
   (tela PVC, vinilo, lienzo) vía props; la silueta humana se activa para productos
   verticales (roller, pendón).

---

## 6. Roadmap por etapas

### Etapa 1 — La cara nueva (esta rama, ahora)
1. **E1 Chrome+home anti-IA:** matar cotizador glassmorphism/decorative, stats con ceros y
   "anos", blobs; aplicar dirección "Pliego de taller" (cotas, monoespaciada técnica, marcas
   de corte) a hero/home/footer. Arreglar contenido oculto por `opacity:0` (SEO).
2. **E2 Ficha roller = configurador** según spec §5, generalizable a productos por m².

### Etapa 2 — Apagar Shopify (los seis P1)
3. Webpay Plus (sandbox→prod) junto a MercadoPago.
4. Variantes de producto + precios escalonados por cantidad (tabla + motor + UI ficha/admin).
5. Emails transaccionales de pedido (Resend; `email_log` ya existe) + notificación automática
   al cliente en cambios de estado de producción (los eventos ya se emiten).
6. Estados de pago vs fulfillment separados + dashboard admin con ventas reales.

### Etapa 3 — Conversión y tráfico
7. Carrito abandonado end-to-end (captura temprana + Cloud Scheduler) · reviews con fotos +
   solicitud post-entrega · Schema.org + feed Merchant Center + OG por producto · validación
   RUT módulo 11 en checkout.

### Etapa 4 — B2B y diferenciadores
8. Portal empresa (precios especiales, cotización PDF→pedido) · **pedido grupal de
   generación** (delegado crea, apoderados pagan su parte, producción al completar) ·
   ficha de trabajo imprimible · DTE SII vía API.

---

## 7. Ejecutado en esta sesión (FASE 2)

Ver commits de la rama `ecommerce-definitivo`. Detalle al final de la sesión:
- E1: rediseño anti-IA de chrome + home (cotizador, stats, testimonios, hero, decorative).
- E2: configurador-m2 con escala humana + reestructuración de la ficha del roller.
