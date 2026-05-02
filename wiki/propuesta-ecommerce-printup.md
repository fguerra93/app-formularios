# Propuesta: Refactorizacion E-Commerce PrintUp.cl

> Fecha: 2026-04-27
> Estado actual: Shopify (tema Horizon v3.3.1)
> Dominio: printup.cl

---

## Analisis de la tienda actual

| Aspecto | Estado actual |
|---|---|
| Plataforma | Shopify (tema Horizon v3.3.1) |
| Productos | ~15-20 productos, 4 categorias |
| Categorias | Articulos Publicitarios, Grafica Publicitaria, Transferibles, Pendones y Banderas |
| Pagos | Shopify Payments (2.9% + 30c) |
| Envios | Regional, $3,500-$4,500 CLP, gratis sobre $50k |
| Analytics | Google Analytics (G-5KJM02BYX3) + Google Ads |
| Contacto | WhatsApp (+56966126645) + formulario de archivos |
| Moneda | CLP (Pesos Chilenos) |
| Horario | Lun-Vie 9:00-18:00 |
| Ubicacion | Errazuriz 09 / Francisco Lira 082, Donihue |

### Productos destacados
- DTF impresion textil (metro lineal, $16,660)
- DTG poleras personalizadas ($19,990)
- Tote bags ($5,990)
- Pendones PVC roller ($46,990)
- Botellas sublimadas ($7,990)
- Impresiones B/N y color ($100-$250)

---

## Las 2 opciones

### Opcion A: Astro + Shopify Storefront API (RECOMENDADA)

Sitio web 100% custom con Astro, pero Shopify sigue manejando pagos, inventario y checkout.

```
Tu sitio (Astro 5)                        Shopify (backend)

  Pagina de productos  ---query-------->  Productos/inventario
  Carrito visual       ---mutation------>  Crear checkout
  Boton "Pagar"        ---redirect------>  Checkout seguro (PCI)
                       <--webhook-------  Orden confirmada

El cliente ve TU diseno, pero paga en Shopify (seguro, certificado)
```

**Stack:** Astro 5 + React (islas interactivas) + Tailwind v4 + Shopify Storefront API

**Que puedes hacer con la Storefront API:**
- Listar productos, colecciones, variantes, precios
- Buscar productos
- Crear carrito y agregar items
- Redirigir al checkout de Shopify (o embeber checkout)
- Recibir webhooks cuando se confirma una compra

**Que NO puedes hacer (se hace en admin Shopify):**
- Crear/editar productos
- Gestionar inventario
- Ver reportes de ventas

### Opcion B: Astro + Backend propio (sin Shopify)

Todo construido por ti. Frontend en Astro, backend propio, pasarela de pago chilena.

```
Tu sitio (Astro 5)                        Tu Backend

  Catalogo           ---fetch---------->  Supabase (BD propia)
  Carrito            ---estado local--->  Zustand/localStorage
  Checkout           ---redirect------->  Flow.cl o Transbank
  Admin panel        ---CRUD----------->  API propia

  Deploy: Vercel                          BD: Supabase (ya la tienes)
  Pagos: Flow.cl ($0 fijo, 2.49%+IVA)
```

---

## Tabla comparativa completa

| | Opcion A: Astro + Shopify API | Opcion B: Astro + Backend propio |
|---|---|---|
| **Resumen** | Sitio custom, Shopify maneja pagos/inventario | Todo tuyo, sin Shopify |
| | | |
| **COSTOS MENSUALES** | | |
| Hosting sitio web | $0 (Vercel free) | $0 (Vercel free) |
| Plataforma e-commerce | $29-39 USD/mes (Shopify Basic) | $0 |
| Base de datos | $0 (usa Shopify) | $0 (Supabase free) |
| Pasarela de pago | Shopify Payments (2.9% + 30c) | Flow.cl (2.49% + IVA) |
| Dominio | Ya lo tienes | Ya lo tienes |
| **Total mensual** | **~$29-39 USD/mes + % ventas** | **~$0/mes + % ventas** |
| | | |
| **COSTOS ANUALES** | | |
| Ano 1 | ~$350-470 USD + desarrollo | $0 fijo + desarrollo |
| Ano 2+ | ~$350-470 USD/ano | $0/ano |
| En 5 anos | ~$2,340 USD | ~$0 |
| | | |
| **DESARROLLO** | | |
| Tiempo estimado | 2-3 semanas | 6-10 semanas |
| Complejidad | Media (solo frontend + API calls) | Alta (frontend + backend + pagos + seguridad) |
| Carrito | Shopify lo maneja | Construir desde cero |
| Checkout/pagos | Shopify (PCI compliant) | Integrar Flow/Transbank (tu manejas seguridad) |
| Inventario | Shopify admin (ya funciona) | Construir panel admin + logica de stock |
| Emails transaccionales | Shopify los envia | Construir con Resend |
| | | |
| **ESCALABILIDAD** | | |
| 100 productos | Perfecto | Perfecto |
| 1,000 productos | Perfecto | Perfecto |
| 10,000 productos | Perfecto | Necesitas Supabase Pro ($25/mes) |
| Trafico alto | Shopify + Vercel CDN | Vercel CDN + Supabase (puede upgrade) |
| Multiples vendedores | Shopify lo soporta | Debes construirlo |
| Multi-moneda | Shopify lo soporta | Debes construirlo |
| | | |
| **MANTENIMIENTO** | | |
| Actualizar productos | Admin de Shopify (visual, facil) | Panel admin propio (debes construirlo) |
| Seguridad de pagos | Shopify se encarga (PCI DSS) | Tu eres responsable |
| Uptime pagos | 99.99% (Shopify) | Depende de Flow/Transbank + tu codigo |
| Actualizaciones | Shopify actualiza su backend | Tu actualizas todo |
| Horas mantenimiento/ano | ~10-20 horas | ~40-80 horas |
| | | |
| **PARA TU CV** | | |
| Impresion | "Headless commerce con Storefront API" | "E-commerce full-stack con pasarela propia" |
| Nivel percibido | Senior frontend/architect | Senior full-stack |

---

## Costos proyectados en el tiempo

```
                    Opcion A              Opcion B
                    (Shopify API)         (Backend propio)

Mes 0 (desarrollo)  Tu tiempo: 2-3 sem   Tu tiempo: 6-10 sem
Mes 1               $39 USD               $0
Mes 6               $234 USD              $0
Ano 1               $468 USD              $0
Ano 2               $936 USD              $0
Ano 3               $1,404 USD            $0
Ano 5               $2,340 USD            $0

PERO en Opcion B:
- Si algo falla en pagos -> pierdes ventas (tu lo arreglas)
- Si Transbank/Flow cambia su API -> tu migras
- Panel admin, emails, inventario -> tu mantienes todo

En Opcion A:
- Shopify maneja todo lo critico
- Tu solo mantienes el frontend (diseno)
```

---

## El servidor local (printup.internos) en cada opcion

| Opcion | Usar tu servidor? |
|---|---|
| Opcion A | No necesitas. Vercel (frontend) + Shopify (backend). Servidor sigue con NextCloud |
| Opcion B | Podrias correr la API ahi, PERO Starlink/CGNAT no permite acceso desde internet. Necesitarias nube |

### Opciones de nube gratis para backend propio (Opcion B):

| Servicio | Free tier | Para que |
|---|---|---|
| Railway | $5 USD gratis/mes | API Node.js + PostgreSQL |
| Render | 750 hrs/mes gratis | API Node.js |
| Fly.io | 3 VMs gratis | API + BD |
| Supabase | Ya lo tienes | BD + Auth + Storage |

---

## Por que Astro y no otros frameworks

| Framework | Veredicto para PrintUp |
|---|---|
| **Astro 5** | Perfecto. HTML estatico (rapido, SEO excelente), usa React solo donde necesitas interactividad (carrito, formularios). Ideal para catalogos pequenos/medianos |
| **Next.js** | Overkill. SSR dinamico que no necesitas para 20 productos |
| **Angular** | Demasiado pesado. Framework enterprise para apps complejas |
| **React SPA** | Malo para SEO, lento en primera carga |
| **Vue/Nuxt** | Viable pero sin ventaja clara sobre Astro para este caso |

---

## Recomendacion final

### Si tu prioridad es tiempo + seguridad + estabilidad:
**Opcion A (Astro + Shopify API)**
- 2-3 semanas de desarrollo
- Diseno 100% custom y rapido (Lighthouse 95+)
- No arriesgas la seguridad de pagos
- Los $39/mes se pagan con 2-3 ventas
- Para tu CV: "Headless commerce, Astro 5, Storefront API GraphQL"

### Si tu prioridad es costo $0 + control total + desafio tecnico:
**Opcion B (Backend propio)**
- 6-10 semanas de desarrollo
- $0/mes para siempre
- Control total pero mantenimiento constante
- Para tu CV: "E-commerce full-stack con integracion de pasarela de pago chilena"

### Para el contexto de PrintUp:
El negocio depende mas de cotizaciones por WhatsApp/formulario que del carrito online. El formulario de archivos (que ya construimos) genera mas ingresos que el checkout. Los $39/mes de Shopify se justifican por la tranquilidad de no mantener pagos, inventario y seguridad PCI.

---

> Documento generado como parte del proyecto app-formularios.
> Para proceder con cualquier opcion, definir scope y crear plan de implementacion.
