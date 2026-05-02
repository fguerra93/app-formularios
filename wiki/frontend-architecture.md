# Arquitectura del Frontend

Este documento describe la arquitectura de la interfaz de usuario (Frontend) de la aplicación de formularios.

## Stack Tecnológico Principal

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Biblioteca de UI**: [React 19](https://react.dev/)
- **Lenguaje**: TypeScript
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes Base**: [shadcn/ui](https://ui.shadcn.com/) y [@base-ui/react](https://base-ui.com/)

## Estructura de Directorios

El código del frontend reside principalmente en la carpeta `src/`:

```text
src/
├── app/                  # Rutas de la aplicación (App Router)
│   ├── admin/            # Panel de administración (Protegido)
│   │   ├── configuracion/
│   │   ├── formularios/
│   │   ├── historial/
│   │   └── login/        # Inicio de sesión para administradores
│   ├── globals.css       # Estilos globales y variables de Tailwind
│   ├── layout.tsx        # Layout principal de la aplicación
│   └── page.tsx          # Página principal (Pública)
├── components/           # Componentes reutilizables de UI (shadcn, custom)
└── lib/                  # Utilidades y configuración del cliente
```

## Patrones de Diseño y Decisiones

1. **App Router de Next.js**: Se utiliza el enrutamiento basado en el sistema de archivos dentro de `src/app`. Soporta renderizado en el servidor (SSR) y Server Components nativamente para un mejor rendimiento y SEO.
2. **Sistema de Diseño**: 
   - Se emplea **Tailwind CSS v4** para estilos utilitarios y rápidos.
   - **shadcn/ui** se utiliza como base para componentes accesibles y personalizables (los componentes generados suelen ubicarse en `src/components/ui/`).
3. **Animaciones y Experiencia de Usuario**:
   - [Framer Motion](https://www.framer.com/motion/) se utiliza para transiciones suaves y micro-interacciones.
   - [Sonner](https://sonner.emilkowal.ski/) provee notificaciones emergentes (toasts).
   - [Lucide React](https://lucide.dev/) se usa para la iconografía.
4. **Visualización de Datos**: Se integra [Recharts](https://recharts.org/) para los gráficos y métricas del dashboard de administración.
5. **Protección de Rutas**: Un archivo `src/middleware.ts` a nivel raíz intercepta las peticiones y protege las rutas bajo `/admin` (excepto `/admin/login`) asegurando que el usuario esté autenticado.
