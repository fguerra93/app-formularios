# PrintUp - Plataforma E-Commerce de Impresion y Publicidad

Ecosistema digital completo para PrintUp (Servicios Graficos Spa), empresa de impresion y publicidad en Donihue, Region de O'Higgins, Chile.

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Pagos | MercadoPago SDK |
| Emails | Resend (transaccional + newsletter) |
| Storage | Supabase Storage + NextCloud |
| Auth | Supabase Auth (clientes) + JWT/jose (admin) |
| Analytics | Google Analytics 4 |
| Hosting | Vercel |

## Sistemas del Ecosistema

### Tienda Online
- Catalogo con busqueda, filtros, paginacion
- Detalle de producto con galeria, variantes, Q&A, reviews, ficha tecnica
- Carrito persistente + checkout con 3 metodos de pago
- Cuentas de cliente (registro, login, historial, favoritos)
- Portafolio de trabajos con lightbox
- Paginas legales (envio, devoluciones, privacidad)

### Panel de Administracion (/admin)
- Dashboard con metricas de ventas
- Gestion de pedidos con timeline de estados
- CRUD de productos, categorias, cupones
- Control de inventario con alertas
- Reviews y preguntas de clientes
- Newsletter con envio masivo
- Portafolio (trabajos + clientes destacados)
- WhatsApp Bot configurable
- CRM basico de contactos
- Zonas de envio
- Configuracion centralizada (tienda, pagos, WhatsApp, email, NextCloud, GA4)

### Automatizaciones
- Webhook MercadoPago (confirmacion automatica de pagos)
- Emails automaticos (nuevo pedido, confirmacion, cambio estado)
- Bot WhatsApp (respuestas automaticas a preguntas frecuentes)
- Social proof popup (compras recientes)
- Newsletter opt-in automatico (checkout + registro)
- Sincronizacion NextCloud (archivos + pedidos)
- Google Analytics 4 (configurable sin tocar codigo)

## Desarrollo Local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth Admin
ADMIN_USER=
ADMIN_PASSWORD=
JWT_SECRET=

# Email
RESEND_API_KEY=

# Pagos
MERCADOPAGO_ACCESS_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://printup.cl
```

## Documentacion

- [Guia Practica del Ecosistema](wiki/guia-practica-ecosistema.md)
- [Resumen del Ecosistema](wiki/resumen-ecosistema-printup.md)
- [Pendientes para Produccion](wiki/pendientes-produccion.md)
- [Arquitectura](wiki/architecture-final.md)
- [Plan de Construccion (6 fases)](wiki/plan-3-fases-v2.md)

## Licencia

Privado - Servicios Graficos Spa
