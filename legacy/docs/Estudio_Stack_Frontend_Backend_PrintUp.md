# Estudio Técnico: Stack Frontend y Backend para PrintUp.cl

**Marzo 2026 — Formulario de Subida de Archivos**

---

## PARTE 1: FRONTEND

### ¿Qué necesitas realmente?

Miremos tu formulario con honestidad: es una sola página con 5 campos de texto, un selector, un área de drag-and-drop y un botón de enviar. No hay navegación entre páginas, no hay autenticación, no hay estado global complejo. Es un formulario.

### Comparativa de Tecnologías Frontend

| Tecnología | Peso del bundle | Curva de aprendizaje | ¿Necesario para un formulario? | Versión actual (Mar 2026) |
|---|---|---|---|---|
| **HTML + CSS + JS puro** | ~0 KB de framework | Ninguna (ya lo sabes) | **Perfecto** | ES2024 / CSS 2024 |
| **React** | ~45 KB (min+gzip) | Media | Sobredimensionado | React 19.x |
| **Vue 3** | ~33 KB (min+gzip) | Media-Baja | Sobredimensionado | Vue 3.5.x |
| **Angular** | ~65-130 KB (min+gzip) | Alta | Muy sobredimensionado | Angular 19.x |
| **Svelte** | ~2-5 KB (compilado) | Baja | Aceptable pero innecesario | Svelte 5.x |
| **Astro** | ~0 KB JS por defecto | Baja | Viable para estáticos | Astro 5.x |

### Veredicto Frontend: HTML + CSS + JavaScript moderno

**No necesitas Angular, React ni Vue para esto.** Usar un framework SPA para un formulario de una sola página es como usar un camión para ir a comprar pan. Funciona, pero es absurdo en relación al problema.

**¿Por qué HTML/CSS/JS puro es la mejor opción para PrintUp?**

1. **Cero dependencias = cero mantenimiento.** No hay `node_modules`, no hay `npm audit` con 47 vulnerabilidades, no hay breaking changes al actualizar. Tu formulario funciona hoy y funcionará igual en 5 años.

2. **Carga instantánea.** Un HTML con CSS inline carga en ~50ms. Un proyecto Angular compilado carga en 1-3 segundos (tiene que descargar el runtime, parsear JS, hidratarse). Para un formulario donde el cliente quiere subir un archivo rápido, cada segundo de espera es fricción.

3. **SEO y accesibilidad nativos.** HTML semántico funciona perfecto con lectores de pantalla y buscadores sin configuración extra.

4. **Desplegable en cualquier parte.** El archivo HTML funciona en Cloudflare Pages, en Nginx, en Apache, abierto directamente desde el disco. No necesita build step, no necesita `ng build`, no necesita servidor de desarrollo.

5. **CSS moderno (2024-2026) ya tiene todo lo que necesitas:** `container queries`, `has()`, `nesting`, `@layer`, variables CSS, `clamp()` para tipografía responsiva, `backdrop-filter` para efectos visuales. No necesitas Tailwind ni SCSS para un formulario.

6. **JavaScript moderno ya tiene todo:** `fetch()` nativo para enviar el FormData, `async/await`, `FormData API`, `Drag and Drop API`, todo funciona sin librerías externas.

**¿Cuándo SÍ usarías un framework?**

Si PrintUp creciera a una plataforma completa con: dashboard de cliente, historial de pedidos, chat en tiempo real, carrito de compras, multi-step wizard complejo — ahí sí vale la pena React o Vue. Pero para el formulario de subida, no.

---

## PARTE 2: BACKEND

### ¿Qué necesita hacer tu backend?

1. Recibir un `multipart/form-data` con archivos de hasta 100 MB
2. Validar los campos del formulario
3. Enviar los archivos a Nextcloud vía WebDAV (HTTP PUT)
4. Opcionalmente guardar los metadatos (nombre, email, material) en una base de datos o archivo JSON
5. Responder con éxito o error

### Comparativa de Frameworks Backend (Node.js)

| Framework | Versión actual | Req/seg (benchmark) | Tamaño bundle | TypeScript | Ecosistema | Ideal para |
|---|---|---|---|---|---|---|
| **Express.js** | 4.21.x (v5 RC) | ~15.000 | Mínimo | Parcial (@types) | Enorme (el mayor) | Prototipos, APIs simples, cuando el equipo ya lo conoce |
| **Fastify** | 5.2.x | ~30.000-76.000 | Mínimo | Nativo | Grande y maduro | APIs de producción, rendimiento, validación con esquemas |
| **Hono** | 4.7.x | ~25.000 (Node), ~400.000 (Workers) | Ultra-mínimo (14 KB) | Nativo | Pequeño pero creciendo | Edge/serverless, multi-runtime, apps ligeras |
| **NestJS** | 11.x | Similar a Express/Fastify (usa uno debajo) | Grande | Nativo (obligatorio) | Grande | Empresas grandes, microservicios, equipos grandes |
| **AdonisJS** | 6.x | ~15.000 | Grande | Nativo | Medio | Full-stack tipo Laravel, apps MVC |

### Análisis detallado

#### Express.js — El veterano

Express existe desde 2010 y sigue siendo el framework más descargado (~30 millones/semana en npm). Su API es extremadamente simple y hay middleware para todo lo imaginable. Sin embargo, la versión 4 tiene años sin cambios significativos y la versión 5 lleva años en Release Candidate sin lanzarse. La gestión de errores asíncronos requiere wrappers manuales. Para un proyecto nuevo en 2026, Express funciona pero ya no es la mejor opción técnica.

#### Fastify — El elegido

Fastify nació en 2016 enfocado en rendimiento. En benchmarks reales, maneja entre 2x y 3x más requests por segundo que Express. Pero más allá de la velocidad (que para tu caso con pocos pedidos al día es irrelevante), Fastify destaca por:

- **Validación con JSON Schema integrada:** Defines qué espera tu API y Fastify valida automáticamente. No necesitas instalar Joi o Zod aparte.
- **Serialización optimizada:** Las respuestas JSON se serializan más rápido que en Express.
- **Plugin system limpio:** Cada funcionalidad se encapsula en plugins con su propio ciclo de vida.
- **Soporte de TypeScript de primera clase.**
- **Manejo de multipart nativo** con `@fastify/multipart`.
- **Logging integrado** con Pino (el logger más rápido de Node.js).
- **Ecosistema maduro:** Plugins oficiales para CORS, rate limiting, helmet, swagger, file uploads, etc.

Empresas como Microsoft, Siemens, Trivago y Platformatic lo usan en producción.

#### Hono — El futuro

Hono es el framework más moderno de la lista. Su diferencial es que corre en cualquier runtime JavaScript: Node.js, Bun, Deno, Cloudflare Workers, AWS Lambda, Vercel Edge. Esto lo hace ideal si planeas desplegar en Cloudflare Workers o en edge computing. Sin embargo, su ecosistema de plugins es más pequeño que Fastify y el manejo de archivos grandes no es su fuerte (está optimizado para requests livianos en el edge).

#### NestJS — El empresarial

NestJS trae la arquitectura de Angular al backend (decoradores, inyección de dependencias, módulos). Es excelente para equipos grandes con múltiples microservicios, pero para un formulario de subida de archivos es como traer un cañón para matar una mosca. Tiene una curva de aprendizaje empinada y la cantidad de boilerplate necesario para un endpoint simple es desproporcionada.

### Veredicto Backend: Fastify

**Para PrintUp, Fastify es la mejor opción.** Las razones:

1. **Manejo de archivos multipart nativo y optimizado** (`@fastify/multipart`), sin depender de `multer` como en Express.
2. **Validación integrada con JSON Schema** — defines una vez lo que esperas y Fastify rechaza requests inválidos automáticamente.
3. **Performance real** — no porque lo necesites hoy con 10 pedidos al día, sino porque si PrintUp crece, Fastify escala sin cambiar nada.
4. **Ecosistema maduro** — CORS, rate limiting, helmet, swagger, todo como plugins oficiales mantenidos por el core team.
5. **TypeScript nativo** — si en el futuro quieres tipar tu código, Fastify lo soporta sin configuración extra.
6. **Comunidad activa** — parte de la OpenJS Foundation, con releases regulares y buena documentación.
7. **Migración fácil desde Express** — si ya tienes código Express, `@fastify/express` permite migrar incrementalmente.

---

## RESUMEN FINAL

| Capa | Tecnología recomendada | ¿Por qué? |
|---|---|---|
| **Frontend** | **HTML + CSS + JS puro** | Es un formulario. Cero dependencias, carga instantánea, desplegable en cualquier hosting estático |
| **Backend** | **Fastify 5 (Node.js 22 LTS)** | Validación integrada, manejo de archivos optimizado, rendimiento superior, ecosistema maduro |
| **Comunicación** | **Fetch API → multipart/form-data** | Nativo del navegador, sin librerías |
| **Almacenamiento** | **Nextcloud vía WebDAV** | Ya lo tienes, control total |
| **SSL/CDN** | **Cloudflare (Free)** | Gratis, rápido, seguro |

### Versiones recomendadas (Marzo 2026)

| Tecnología | Versión | Notas |
|---|---|---|
| Node.js | **22.x LTS** | Long Term Support hasta abril 2027. No usar v23 (current, inestable) |
| Fastify | **5.2.x** | Última estable, requiere Node.js ≥ 20 |
| @fastify/multipart | **9.x** | Para recibir archivos multipart |
| @fastify/cors | **10.x** | Si frontend y backend corren en dominios distintos |
| webdav (npm) | **5.x** | Cliente WebDAV para conectar con Nextcloud |
