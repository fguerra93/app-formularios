# Arquitectura del Backend

Este documento describe la arquitectura del servidor y los servicios en la nube de la aplicación de formularios.

## Stack Tecnológico Principal

- **Framework**: [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) (Serverless functions)
- **Base de Datos y BaaS**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Almacenamiento de Archivos**: Nextcloud (vía API) / Supabase Storage
- **Autenticación y Seguridad**: JWT manejado con la librería `jose` y middleware de Next.js.
- **Envío de Correos**: [Resend](https://resend.com/)

## Estructura y Componentes

La lógica del servidor se encuentra embebida dentro de la estructura de Next.js y en configuraciones de servicios externos.

```text
src/
├── app/api/              # API Endpoints (Route Handlers)
│   ├── auth/             # Autenticación de usuarios
│   ├── config/           # Gestión de la configuración de la app
│   ├── formularios/      # Recepción y gestión de los formularios
│   ├── stats/            # Obtención de métricas para el dashboard
│   └── upload/           # Carga de archivos e integraciones
├── lib/                  # Lógica de servidor compartida
│   ├── auth.ts           # Utilidades para validación JWT
│   ├── nextcloud.ts      # Cliente API para la integración con Nextcloud
│   └── supabase.ts       # Cliente para conectar a la DB Supabase
└── middleware.ts         # Middleware para validación de tokens
supabase/
└── schema.sql            # Definición del esquema de base de datos PostgreSQL
```

## Servicios y Flujo de Datos

1. **API Serverless**:
   El backend no es un servidor tradicional corriendo continuamente; en su lugar, utiliza los *Route Handlers* de Next.js (`/api/*`) que actúan como funciones serverless.
2. **Base de Datos (Supabase)**:
   - Se utiliza PostgreSQL administrado por Supabase para almacenar la información de los formularios, usuarios y configuración.
   - El esquema está versionado en `supabase/schema.sql`.
   - La interacción desde el servidor se hace a través de `@supabase/supabase-js`.
3. **Almacenamiento de Archivos**:
   La plataforma cuenta con un conector personalizado para **Nextcloud** (`src/lib/nextcloud.ts`), permitiendo que los documentos adjuntos en los formularios sean cargados directamente a una nube privada, y/o utilizando el storage nativo de Supabase.
4. **Seguridad y Autenticación**:
   - Autenticación manejada mediante JSON Web Tokens (JWT).
   - La librería `jose` se emplea para la firma y verificación criptográfica de los tokens.
   - El archivo `src/middleware.ts` verifica la validez del JWT en las cabeceras/cookies antes de permitir acceso al backend y a las rutas de administración del frontend.
5. **Notificaciones**:
   Se utiliza el SDK de **Resend** para el envío programático y transaccional de correos electrónicos (por ejemplo, confirmaciones de recepción de formularios o alertas administrativas).
