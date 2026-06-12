# Propuesta de rediseño del storefront — "Minimal claro"

> **Estado:** v2 implementada y **validada en local** (sistema levantado, navegado y
> capturado). **No desplegada a GCP todavía** (queda para después, a tu orden).
> **Rama:** `rediseno-minimal-storefront`.

---

## 1. Qué pediste

> *"Hazme una propuesta de mejora del layout del e-commerce para que no se vea
> tan IA, sin perder funcionalidades, pero mejorar con chiches visuales, y una
> mejor, profesional, real a la UI."*

Tres requisitos: **(1)** que no se vea "tan IA", **(2)** sin perder funcionalidades,
**(3)** chiches visuales con gusto → más profesional y "real".

Y luego: *"dale una segunda vuelta, qué cosas se pueden mejorar aún más… actualiza
el código… valida los cambios y todo en local, levantando todo el sistema. NO
despliegues a GCP por ahora."*

---

## 2. Dirección de diseño — "Minimal claro (e-commerce)"

Estética de tienda real moderna (estilo Shopify premium / Stripe / Linear):

- **Paleta sobria:** blanco + tinta casi-negra (`#0f1115`) + **un solo acento** cyan.
- **Tipografía grande y apretada** (titulares con `letter-spacing` negativo).
- **Bordes de 1px** y **sombras suaves**, en vez de vidrio y degradados.
- **El "chiche":** *lift* sutil de las tarjetas al hover (se elevan 3px). Discreto.
- **Encabezados a la izquierda** con jerarquía (eyebrow → título → bajada).
- **Acento intencional:** cyan solo para señales (links, foco, selección, estado
  activo); **negro** para la acción primaria. Nunca compiten.

---

## 3. Primera vuelta (v1) — piloto

Se aplicó a **home + núcleo**: sistema de diseño `MINIMAL CLARO` en `globals.css`
(tokens + clases `.mc-*`), Hero, ProductCard, CategoryCard, SectionHeader, la home
y se quitó la línea degradada del navbar. Diagnóstico: se eliminaron los "tells" de
plantilla IA (glassmorphism, círculos/puntos/anillos flotantes, subrayados
degradados, hero con video, texto con gradiente).

**Lo que quedó a medias en la v1:** el *chrome* que aparece en **todas** las
páginas (navbar azul marino, footer con gradiente, badges de 5 colores, precios en
azul, fondo `#F0F7FF` del `main`) seguía con el diseño viejo → al navegar, chocaba.

---

## 4. Segunda vuelta (v2) — qué se mejoró aún más

### 4.1 Sistema de diseño v2 (`globals.css`)
Pulido que faltaba para que se vea de verdad profesional:

- **Foco accesible (`:focus-visible`)** con anillo de acento en botones, links e
  inputs — accesibilidad de teclado + pulido. (No había.)
- **Cifras tabulares en precios** (`.mc-price` con `tabular-nums`) — los números
  dejan de "bailar"; se ven de tienda real.
- **Estado de pulsación** en botones (`:active` baja 1px) — tacto.
- **Formularios coherentes** (`.mc-input`, `.mc-select`, `.mc-textarea`, `.mc-label`,
  `.mc-checkbox`) para checkout, login, búsqueda y filtros.
- **Badges sobrios** (`.mc-badge` + variantes `solid/outline/accent/warn/muted`):
  de 5 colores chillones a un set restringido y de alto contraste.
- **Secciones, tabs y panel** (`.mc-section(-alt)`, `.mc-tab`, `.mc-panel`).
- **Color de selección** de texto con tinte de marca y `text-wrap: balance` en
  titulares (sin líneas viudas). Respeta `prefers-reduced-motion`.

### 4.2 Coherencia total del *chrome* (aparece en cada página)
- **`main`** del storefront: fondo `#F0F7FF` → **blanco**.
- **Navbar** reescrito a minimal: barra superior **tinta**, links tinta/superficie,
  badge de favoritos en tinta (no rosa), dropdowns y menú móvil recoloreados.
  Preservado: búsqueda, mega-dropdown de categorías, carrito, favoritos, menú de
  cuenta, móvil y el shrink al hacer scroll.
- **Footer** reescrito a **tinta** (casi-negro): sin gradiente navy→cyan ni línea
  decorativa; newsletter con un único acento cyan. Preserva links, redes, horario,
  datos y suscripción.
- **`ModuleHero`** (cabecera de catálogo/contacto/nosotros/sucursales) reescrito a
  minimal: ícono en caja + título fuerte + bajada + regla. Misma API → arregla esas
  4 cabeceras de una.
- **Badges** (`product-badge.tsx`) y **Price** (`price.tsx`) migrados a los tokens.

### 4.3 Migración de paleta del storefront
Para armonizar las páginas grandes (detalle de 2.144 líneas, checkout, mi-cuenta,
etc.) sin reescribirlas a mano, se hizo una **migración de tokens de color** acotada
a `src/app/(tienda)`, `src/components/tienda` y `src/components/cart`: se cambiaron
los hex legados por sus equivalentes minimal **sin tocar acentos válidos** (cyan
`#00B4D8`, WhatsApp `#25D366`, verdes/ámbar/rojo de estado).

| Legado | → Nuevo | Rol |
|---|---|---|
| `#1B2A6B` / `#152259` / `#00355a` | `#0f1115` / `#000` | navy marca → tinta |
| `#1E293B` | `#0f1115` | texto → tinta |
| `#64748B` | `#5b6472` | texto secundario |
| `#94A3B8` | `#8b94a3` | texto terciario |
| `#E2E8F0` | `#e8eaee` | bordes 1px |
| `#F0F7FF` / `#F8F8F8` | `#fafafb` | fondos → superficie |
| `#E91E8C` | `#0f1115` | rosa → tinta |

**Resultado: 38 archivos, 1.070 reemplazos.** (detalle de producto 322, calculadora
de precio 124, personalizar 114, checkout 49, contacto 38, carrito 36…)

### 4.4 Bug corregido
- **`ProductCard`:** había un `<a>` (WhatsApp) anidado dentro del `<Link>` de la
  tarjeta → HTML inválido y error de hidratación de React. Se cambió a `<button>` +
  `window.open(...)`. (Venía desde la v1.)

### 4.5 Decisión de diseño
- Se quitó el badge **"Envío gratis"** de la tarjeta de producto (la tienda mostraba
  hasta 4 badges apilados). La info **no se pierde**: está en la barra de info del
  navbar ("Envío gratis sobre $50.000") en todas las páginas.

---

## 5. Validación local (sin desplegar)

Sistema levantado con `npm run dev` (Next 16, datos desde Supabase vía `.env.local`)
y navegado con un navegador real:

- ✅ `npx tsc --noEmit` — **sin errores**.
- ✅ **Home** — hero minimal, barra superior tinta, footer tinta.
- ✅ **Catálogo** (`/productos`) — cabecera minimal, filtros con activo en tinta,
  tarjetas con precio tabular + botón negro.
- ✅ **Detalle de producto** — precio en tinta, CTA negro, pestañas con activo en
  tinta, pasos numerados; verdes/ámbar de estado conservados.
- ✅ **Carrito** — resumen, "Proceder al Checkout" negro, "Seguir comprando" cyan.
- ✅ **Checkout** — stepper 1-2-3 con conector cyan, método de pago activo con anillo
  cyan, desglose IVA, "Confirmar Pedido" negro.
- ✅ **Login** — formulario minimal, botón negro.

Capturas tomadas durante la validación (no versionadas).

---

## 6. Pendiente / opcional

- [ ] **Desplegar a GCP** (Cloud Run) — *a tu orden, después* (este turno NO se tocó GCP).
- [ ] Secciones secundarias de la home que aún usan los componentes decorativos
  (testimonios con gradiente rosa, "números" en banda oscura). Las bandas oscuras de
  CTA se ven bien; el gradiente de testimonios se podría suavizar en otra pasada.
- [ ] Pre-existentes en local, ajenos al rediseño: `/api/config/public` 401 y
  `/api/portafolio` 500 (datos/entorno), y MercadoPago aún aparece en el checkout
  (el deploy es *sin MP* — es config, no UI).

---

## 7. Cómo verlo tú mismo

Con Docker Desktop abierto no hace falta para el front; basta el dev server:

```
npm run dev
# luego abre http://localhost:3000
```

Recorre: Inicio → Productos → un producto → Carrito → Checkout.
