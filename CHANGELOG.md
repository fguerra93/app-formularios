# Changelog

Todos los cambios notables de este proyecto se documentan aqui.

## [1.2.0] - 2026-04-27

### NextCloud Sync Integration

- **Integracion NextCloud via WebDAV**: Sincronizacion automatica de archivos de formularios a NextCloud self-hosted mediante patron store-and-forward
- **Sync Worker (Docker)**: Servicio independiente que polling cada 30s a Supabase, descarga archivos, los sube a NextCloud via WebDAV y libera storage de Supabase
- **Upload directo a Supabase Storage desde frontend**: Los archivos se suben directamente desde el navegador a Supabase Storage via REST API, eliminando el limite de 4.5MB de Vercel API routes
- **Group Folders con ACL**: Configuracion de permisos granulares por grupo en NextCloud para control de acceso a carpetas de formularios
- **Link directo a NextCloud en email**: Notificacion incluye boton que lleva a la carpeta exacta del formulario en NextCloud (accesible en LAN)
- **Limites de archivos**: Max 50MB por archivo, max 5 archivos por formulario (validacion frontend + backend)
- **Panel admin NextCloud activo**: Tab de configuracion NextCloud habilitada con campos editables
- **Auto-limpieza Supabase Storage**: Archivos se eliminan de Supabase tras sincronizarse a NextCloud, manteniendo el uso bajo el free tier (1GB)

## [1.1.0] - 2026-04-25

### Accessibility & UX

- Mejoras de accesibilidad: contraste WCAG AA, landmarks semanticos

## [1.0.0] - 2026-04-24

### Plataforma Full-Stack

- Rebuild completo como plataforma Next.js 16 full-stack
- Formulario publico con drag & drop de archivos
- Panel admin protegido con JWT: dashboard, historial, detalle, configuracion
- Supabase como BD (PostgreSQL) y Storage
- Notificaciones por email via Resend con HTML personalizado
- Sistema de estados: nuevo > revisado > completado
- Busqueda, filtros y paginacion en historial
- Metricas en dashboard: formularios hoy/mes/total, tasa de exito email
