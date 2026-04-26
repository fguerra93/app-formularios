# Seccion CV — PrintUp.cl

> Copiar/pegar en tu CV. Redactado con metricas y vision de senior engineer.

---

## PrintUp.cl — Plataforma de Impresion Personalizada

**Fundador Tecnico & Arquitecto de Software** | Next.js 16 + React 19 + Supabase + NextCloud + Docker

**Infraestructura & Operaciones**
- Disenhe arquitectura hibrida cloud/on-premise: Vercel (serverless) + servidor fisico (NextCloud, Docker) + Supabase (BaaS), reduciendo costos de infraestructura a $0/mes en tiers gratuitos
- Implementé patron store-and-forward para sincronizacion de archivos entre Supabase Storage y NextCloud self-hosted, con worker Docker que procesa en <30s y auto-limpia storage para mantener uso bajo free tier (1GB)
- Configuré NextCloud AIO en Docker con Caddy reverse proxy, SSL interno, Group Folders con ACL granular por equipo y usuario bot dedicado con app passwords
- Resolvi restriccion de CGNAT (Starlink) diseñando arquitectura que no requiere puertos abiertos ni DNS externo para comunicacion Vercel ↔ servidor local
- Migre DNS de dominio (NIC Chile/Hostinger) con zero-downtime, manteniendo Shopify e-commerce operativo mientras se agregaban subdominios

**Aplicacion de Formularios (Full-Stack)**
- Construi plataforma completa de recepcion de archivos: formulario publico, panel admin con dashboard, historial con busqueda/filtros/paginacion, y sistema de estados
- Upload directo desde browser a Supabase Storage via REST API, eliminando limite de 4.5MB de Vercel serverless functions — soporta archivos de hasta 50MB
- Pipeline automatizado: formulario → Supabase → email (Resend) → sync worker → NextCloud → limpieza storage, sin intervencion manual
- Sistema de notificaciones con email HTML responsive (Resend API) incluyendo deep links a panel admin y carpeta NextCloud
- Autenticacion JWT con middleware de proteccion de rutas, panel de configuracion dinamico con persistencia en BD

**E-commerce (Shopify)**
- Diseñe la arquitectura e-commerce sobre Shopify con integracion de pasarelas de pago chilenas
- Migracion de hosting Hostinger → Shopify con configuracion DNS via NIC Chile

**Stack**: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Supabase (PostgreSQL + Storage), Resend, NextCloud (WebDAV), Docker, Caddy, JWT/jose

---

> **Nota**: Adapta segun el rol al que postulas. Para roles backend/infra, enfatiza la arquitectura hibrida y el worker. Para roles fullstack, enfatiza la app. Para roles DevOps, enfatiza Docker + reverse proxy + CGNAT workaround.
