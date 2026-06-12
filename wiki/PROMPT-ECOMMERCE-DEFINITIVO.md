# Misión: el e-commerce definitivo de PrintUp

Actúa como director de producto, diseño e ingeniería de PrintUp (printup.cl), imprenta real en Ñuñoa, Santiago de Chile. Tu trabajo tiene tres resultados: (1) una tienda espectacular que dé ganas de comprar y que ningún profesional identifique como "hecha con IA", (2) un admin a la altura de Shopify que permita apagar Shopify para siempre, (3) una ficha de roller pendón centrada en una herramienta de dimensionado con precio en vivo.

Hay **tres features que Shopify no da bien y que justifican construir propio** — son la ventaja competitiva y orientan todas las decisiones:

1. **Cotizador instantáneo por cantidad:** slider de cantidad → precio unitario y total al tiro. La mayoría de las imprentas responde "te cotizamos en 48 horas"; PrintUp no.
2. **Pedido grupal de generación:** el delegado del curso crea el pedido, comparte un link, y cada apoderado entra, elige talla, pone el nombre del polerón y paga su parte individual; producción parte cuando se completa el curso o vence la fecha. Resuelve el dolor real de juntar la plata de 40 familias y ninguna imprenta de la zona lo tiene.
3. **Cola de producción del taller:** kanban de trabajos tan simple que cualquiera lo usa sin manual, con notificaciones automáticas al cliente en cada cambio de estado.

## 0. Contexto del repo (asúmelo y verifícalo, no lo re-descubras)

- Tienda en `src/app/(tienda)/`, admin en `src/app/admin/` (~30 rutas). Next.js 16 + Supabase/Postgres + Tailwind 4.
- OJO: esta versión de Next.js tiene breaking changes — lee `node_modules/next/dist/docs/` antes de escribir código (lo exige `AGENTS.md`).
- La rama `rediseno-minimal-storefront` ya aplicó un rediseño "minimal claro v2" (ver `wiki/PROPUESTA-REDISENO-STOREFRONT-MINIMAL.md`). Fue un avance pero NO basta: siguen vivos componentes con glassmorphism y círculos flotantes (`src/components/tienda/cotizador.tsx`, `src/components/tienda/decorative.tsx`), y la estética genérica "SaaS minimal Stripe/Linear" es en sí misma un tell de IA. El dueño lo dijo explícito: "la tienda se ve como los típicos estilos de IA".
- El catálogo se sembró desde Shopify (`supabase/seed-shopify-products.sql`); la meta del proyecto es reemplazar Shopify por completo. Contexto: `wiki/PLAN-MAESTRO-SITIO-DEFINITIVO.md` y `wiki/IMPLEMENTACION-FASES-AUTOMATIZACION.md`.
- Ya existe una calculadora por m² con ancho/alto, ancho imprimible del rollo y validación de empalmes: `src/components/tienda/price-calculator.tsx` (~1.000 líneas). Reutiliza su lógica: el problema es de presentación y jerarquía, no de matemática.
- La ficha de producto (`src/app/(tienda)/productos/[categoria]/[slug]/page.tsx`, ~2.100 líneas) está sobrecargada: el texto es útil pero es demasiado y entierra la herramienta.
- Muchas capacidades de las secciones 3 y 5 **ya existen parcialmente** en el repo (checkout, cupones, reviews, campañas, bot WhatsApp, designer, producción/KDS, costos, órdenes de compra). La matriz de paridad debe decir la verdad de cada una (existe / parcial / falta), no asumir que falta todo.
- Para levantar local con admin: `JWT_SECRET=printup-test-secret npm run dev` y forjar cookie `admin_token` con jose — detalle en tu memoria de proyecto (`reference_validacion_local_gated.md`). El Supabase local es parcial: los features sin tablas degradan con elegancia a estado vacío.

## 1. Método de trabajo (obligatorio)

**FASE 0 — Mirar antes de opinar.** Levanta el sistema en local y navega de verdad con el MCP de Playwright/Chrome DevTools. Captura screenshots (desktop Y móvil) de al menos: home, /productos, una categoría, el detalle del roller pendón, /personalizar, carrito, checkout, login, mi-cuenta; y del admin: dashboard, pedidos, detalle de pedido, productos, detalle de producto, inventario, envíos, cupones, campañas. Guárdalas en `wiki/audit/`. Prohibido proponer rediseño de una página que no miraste.

**FASE 1 — Auditoría + propuesta.** Escribe `wiki/ECOMMERCE-DEFINITIVO.md` con:

1. Hallazgos por página (referenciando su screenshot): qué funciona, qué se ve "IA", qué estorba a la conversión o a la operación diaria.
2. Matriz de paridad Shopify (sección 3) + checklist de capas (sección 5), con estado real verificado en el código.
3. Dirección de arte para la tienda: 2–3 direcciones distintas con wireframes en texto/ASCII de la home y de la ficha de producto, y tu recomendación fundamentada (sección 2).
4. Spec del configurador del roller pendón (sección 4).
5. Roadmap por etapas priorizado por impacto en ventas vs esfuerzo, respetando el corte brutal de alcance de la sección 7.

**FASE 2 — Implementación por etapas.** Cada etapa: compila, se valida navegando en local con screenshots antes/después, y se commitea por separado con mensaje claro. Trabaja en una rama nueva creada desde `rediseno-minimal-storefront` (si hay cambios sin commitear, commitéalos primero en esa rama y avisa). Nunca despliegues a GCP sin orden explícita.

## 2. La tienda: que NO parezca hecha con IA

Esto es lo más importante y lo más difícil de la misión. Reglas duras:

**Prohibido (tells de IA — si aparece uno, fallaste):**

- Glassmorphism, blobs, círculos/anillos flotantes, partículas decorativas.
- Texto con gradiente, subrayados degradados, paleta violeta/índigo, gradiente azul→morado.
- Hero centrado con pill-badge arriba + título + bajada + dos botones lado a lado.
- Grillas de 3 tarjetas con icono arriba y texto genérico debajo, repetidas sección tras sección.
- Emojis como íconos. Sombras difusas gigantes. Border-radius XXL en todo.
- Microcopy de relleno: "Soluciones integrales", "Calidad premium", "Llevamos tus ideas al siguiente nivel".
- Y el tell nuevo: el look "SaaS minimal estilo Stripe/Linear" aplicado a una imprenta. PrintUp no es un SaaS.

**En cambio (dirección de arte de imprenta real):**

- Identidad propia de IMPRENTA: tinta, papel, registro de color (CMYK), troquel, marcas de corte, escala. El lenguaje visual del oficio gráfico es oro y casi nadie lo usa bien online. Mira imprentas online con carácter (MOO, Vistaprint pro, estudios de risografía) para robar actitud, no layouts.
- Diseño editorial: tipografía protagonista con jerarquía fuerte, retícula visible, asimetría intencional, números grandes (precios, medidas, cantidades — es una imprenta: los datos duros venden).
- El producto manda: fotografía/mockups grandes del material impreso, texturas reales, escala humana. Donde falte foto real, mockups de producto creíbles — no ilustraciones 3D genéricas.
- Densidad de tienda real: precio CLP con IVA, plazo de producción, medios de pago y retiro/envío visibles sin scroll. Las tiendas reales informan; las plantillas IA decoran.
- Microinteracciones con función (feedback de precio, estados de stock, progreso de pedido), no decoración.
- Mobile-first de verdad: la mayoría del tráfico chileno de imprenta llega por móvil y WhatsApp.

**Criterio de éxito:** un diseñador senior que no conozca el proyecto debe mirar la home y la ficha del roller y no poder afirmar "esto lo hizo una IA". Y un cliente nuevo debe entender en 5 segundos qué vende PrintUp, cuánto cuesta y cuándo lo recibe.

## 3. El admin: paridad Shopify para apagar Shopify

El admin actual tiene muchas rutas pero se siente vacío y superficial. La vara es el admin de Shopify. Construye una matriz de paridad — para cada capacidad: estado en PrintUp (existe / parcial / falta) → prioridad → esfuerzo. Cubre como mínimo:

- **Pedidos:** línea de tiempo/historial por pedido, estados de pago y de fulfillment separados, edición de pedido, pedidos borrador (cotización→pedido), devoluciones/reembolsos, notas y etiquetas, impresión (boleta, guía de despacho, etiqueta, **ficha de trabajo imprimible** con diseño, cantidades, tallas y fecha comprometida), búsqueda con filtros guardados, acciones masivas.
- **Productos:** variantes reales (talla/color/material), **precios escalonados por cantidad** (1 polera ≠ precio unitario de 50 — en imprenta es obligatorio), colecciones manuales y automáticas, editor masivo tipo planilla, import/export CSV, SEO por producto, metacampos, organización (proveedor/tipo/etiquetas), duplicar producto.
- **Clientes:** ficha 360 (pedidos, gasto total, notas, direcciones), segmentos, etiquetas tipo CRM (colegio, pyme, club), historial de contacto — ya existe integración WhatsApp en el ecosistema: intégrala a la ficha. Recordatorios automáticos de recompra ("hace 6 meses pediste 40 poleras").
- **B2B:** ficha empresa con RUT y razón social, precios especiales por cliente, cotización formal en PDF con validez que se convierte en pedido con un clic.
- **Descuentos:** códigos, descuentos automáticos, "compra X lleva Y", envío gratis condicional, límites de uso, programación por fechas, descuento de primera compra ligado a captura de correo.
- **Analítica:** dashboard con ventas día/semana/mes, ticket promedio, conversión, productos top, fuentes de tráfico; reportes exportables. El home del admin debe responder "¿cómo va el negocio HOY?" de un vistazo — hoy está vacío.
- **Marketing:** recuperación de carrito abandonado (capturar email/teléfono temprano en el checkout + cron con link de recuperación a las pocas horas), campañas email (Resend ya está en las dependencias — evalúa qué le falta a `admin/campanas`), UTMs.
- **Tienda online:** gestión de menús/navegación, páginas de contenido, banners y home editables sin deploy, SEO global, redirecciones 301.
- **Configuración:** IVA 19% chileno, emails transaccionales de pedido (confirmación, despacho, entrega), roles y permisos de staff, estado real de medios de pago, tarifas de envío por zona/comuna + retiro en tienda.
- **UX transversal del admin:** búsqueda global, atajos de teclado, breadcrumbs, confirmación al salir con cambios sin guardar, tablas con columnas configurables, y estados vacíos que enseñan el primer paso (no páginas en blanco).

Lo que PrintUp ya tiene más allá de Shopify (producción/comanda KDS, costos, órdenes de compra, inteligencia de mercado, bot WhatsApp, designer, aprobaciones) no se pierde: intégralo en la navegación con coherencia y dale el mismo nivel de pulido.

## 4. Roller pendón: la ficha centrada en la herramienta

Es el producto estrella y el piloto del nuevo diseño de ficha. Hoy tiene demasiado texto (útil, pero entierra la herramienta) y el cliente puede equivocarse de medida. Quiero:

- **El configurador ES la página.** Above the fold: visualización del pendón A ESCALA + controles de ancho/alto + precio en vivo. Nada de héroe decorativo.
- **Escala humana:** silueta de persona (~1,70 m) dibujada junto al pendón en proporción real, que se redimensiona en vivo. El cliente debe VER qué significa 80×200 cm antes de pagar. Referencias opcionales: puerta, escritorio.
- **Medidas:** presets estándar (80×200, 85×200, 100×200, 150×200…) + medida libre con inputs y arrastre sobre el preview. Validación en vivo contra ancho imprimible y empalmes reutilizando la lógica de `price-calculator.tsx`; si una medida es problemática, decirlo en el momento y en lenguaje claro — no en el carrito.
- **Precio en vivo:** se actualiza con cada cambio (medida, material, acabado, cantidad), con desglose visible y precio final CLP IVA incluido, grande. CTA pegajoso (en móvil: barra inferior fija con precio + "Agregar al carrito").
- **El texto actual no se bota, se reorganiza:** tabs o acordeón (Especificaciones / Materiales y acabados / Archivo de impresión / Preguntas frecuentes), bullets escaneables, tabla de specs compacta. Above the fold solo lo que decide la compra.
- **Generaliza el patrón:** la misma ficha-herramienta debe servir para todos los productos por m² (tela PVC, vinilo, lienzos). Diseña el componente para eso desde el día uno.

## 5. Checklist completo por capas (lo que Shopify no regala)

Cada feature tiene un porqué. Verifica el estado real en el código antes de clasificarla.

### 5.1 Núcleo ecommerce (sin esto no hay tienda)
- Catálogo con variantes (talla, color, material) y **precios escalonados por cantidad**.
- Carrito persistente + **checkout como invitado** (obligar a crear cuenta mata conversión).
- Cupones y descuentos por código.
- Cuentas de usuario opcionales con historial y botón **"repetir pedido"** (oro para B2B).
- Panel admin: CRUD de productos, pedidos, clientes y descuentos.

### 5.2 Pagos y envíos (Chile)
- **Webpay Plus** (Transbank tiene SDK y ambiente de integración gratis) + **MercadoPago** + **transferencia con subida de comprobante**.
- Webhooks de confirmación de pago **idempotentes** (un webhook repetido no duplica pedidos).
- Envíos vía API de **Shipit o Envíame** (un solo contrato da Chilexpress/Starken/Blue Express), tarifas por comuna, y la opción destacada **"retiro gratis en tienda"** con horarios visibles.
- Selector de **región/comuna oficial de Chile**, CLP sin decimales, tracking de despacho.

### 5.3 Personalizador (diferenciador #1)
- Subida de diseño (PNG/JPG/PDF) con **validación de resolución/DPI** y aviso si viene en baja calidad (ahorra reimpresiones y peleas).
- Preview en vivo sobre mockup del producto (canvas con Fabric.js o Konva), texto con fuentes, posición y escala.
- Archivos a Cloud Storage con URLs firmadas, diseño guardado y vinculado al pedido.
- **Aprobación de mockup por el cliente antes de producir** (un clic en "apruebo"): elimina el 90% de los reclamos.

### 5.4 Módulo taller / producción (diferenciador #2)
- Cola de trabajos tipo kanban: pagado → en producción → listo para retiro → entregado, tan simple que se usa sin manual.
- Cada cambio de estado dispara **notificación automática al cliente por email y WhatsApp** ("tu pedido está listo para retiro").
- **Ficha de trabajo imprimible** por pedido: diseño, cantidades, tallas, fecha comprometida.

### 5.5 Tráfico (que te encuentren)
- SSR/SSG para SEO real, URLs limpias, sitemap, meta tags.
- **Schema.org de Product y LocalBusiness** (estrellitas y precio en Google) + **feed para Google Merchant Center** (aparecer gratis en Google Shopping).
- **Open Graph bien hecho:** al compartir un producto por WhatsApp debe verse imagen + precio (en Chile se vende por WhatsApp).
- Página del punto de retiro con mapa, horarios y reseñas de Google embebidas.
- Landings por campaña (ej. "Polerones de generación 2026") y landing del QR del letrero físico, con UTM.
- GA4 + Pixel de Meta + conversiones de Google Ads **medidas en el servidor**.

### 5.6 Conversión (que compren)
- **Cotizador instantáneo:** slider de cantidad → precio unitario y total al tiro, sin "te respondemos en 48 horas".
- Reseñas propias **con fotos** + solicitud automática post-entrega.
- Botón flotante de WhatsApp que abre el chat **con el producto ya referenciado**.
- **Carrito abandonado:** capturar email/teléfono temprano en el checkout, y un cron (Cloud Scheduler) que manda recordatorio con link de recuperación a las pocas horas.
- Imágenes WebP + CDN (Cloudflare gratis delante de GCP) y Core Web Vitals decentes.

### 5.7 Recompra y B2B (que vuelvan)
- **Portal empresa:** RUT, razón social, precios especiales, cotización formal en PDF con validez, convertible a pedido con un clic.
- **CRM mínimo:** etiquetas (colegio, pyme, club) y recordatorios automáticos de recompra.
- Captura de correo con descuento de primera compra + campañas (Resend/SendGrid capa gratis).
- **Pedido grupal de generación (feature estrella):** delegado crea el pedido → link compartido → cada apoderado elige talla, pone nombre y paga su parte → producción parte al completarse el curso o vencer la fecha.

### 5.8 Capa legal / Chile
- **Validación de RUT (módulo 11).**
- Boleta/factura electrónica SII vía API (**OpenFactura / LibreDTE / Facto**) — no para la demo, pero **deja el modelo de datos listo desde ya** (campos RUT, giro, tipo de documento).
- Términos claros: los productos personalizados generalmente quedan **fuera del retracto de 10 días** — decirlo explícito.
- Política de privacidad y consentimiento de marketing (la nueva ley chilena de datos personales ya está encima).

### 5.9 Infraestructura (presupuesto mínimo)
- Cloud Run con scale-to-zero. OJO con Cloud SQL: el mínimo se come solo un presupuesto chico — hoy ya existe un Cloud SQL micro desplegado (sandbox); mantén el costo a raya y evalúa Neon/Supabase gratis para entornos demo.
- Cloud Storage para imágenes y diseños, Secret Manager para llaves, Cloud Scheduler para crons, **backups automáticos de la BD desde el día uno**, HTTPS, y un uptime check con alerta.
- Separación demo/producción aunque sea por variables de entorno.

## 6. Restricciones globales

- Español de Chile en toda la UI. Precios en CLP **sin decimales**, IVA incluido. La identidad de marca PrintUp vive en los docs de `wiki/` — el rediseño puede evolucionarla, no inventar otra empresa.
- No perder NINGUNA funcionalidad existente: carrito, favoritos, auth, checkout, personalización (`/personalizar`), gang-sheet, cotización por WhatsApp, reviews, portafolio.
- Performance: imágenes optimizadas, sin librerías pesadas nuevas sin justificación; el sitio corre en Cloud Run + Cloud SQL micro. No agregues servicios pagados sin avisar.
- Accesibilidad: foco visible, contraste AA, navegable con teclado.
- Commits atómicos por etapa; nada directo a `master`; no desplegar a GCP.

## 7. Fases (sé brutal con el alcance)

- **MVP demo:** catálogo + precios escalonados + carrito + checkout invitado + Webpay sandbox + retiro/envío + panel de pedidos con estados + notificación WhatsApp manual (link wa.me). **El rediseño visual anti-IA y la ficha roller-herramienta entran aquí: son la cara del MVP.**
- **Fase 2:** personalizador con aprobación de mockup + cotizador instantáneo en todas las fichas + carrito abandonado + reseñas con fotos.
- **Fase 3:** portal B2B + pedido grupal de generación + facturación electrónica SII.

Empieza ahora con la FASE 0.
