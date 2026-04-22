# PrintUp Backend — Documentación Completa

## 1. Descripción General

Este backend recibe formularios con archivos adjuntos desde el frontend de PrintUp.cl, los almacena en un servidor Nextcloud vía el protocolo WebDAV, y envía una notificación por correo electrónico al administrador con los datos del pedido y un enlace directo a la carpeta en Nextcloud.

**Stack tecnológico:**
- Runtime: Node.js 22 LTS
- Framework HTTP: Fastify 5
- Protocolo de archivos: WebDAV (vía librería `webdav`)
- Email: Nodemailer con SMTP
- Formato de datos: multipart/form-data (entrada), JSON (metadatos)


## 2. Arquitectura

```
┌──────────────┐     POST /api/upload      ┌─────────────────────┐
│              │    (multipart/form-data)   │                     │
│   FRONTEND   │ ────────────────────────►  │   FASTIFY SERVER    │
│  (index.html)│                            │   puerto 3000       │
│              │  ◄──── JSON response ────  │                     │
└──────────────┘                            └────────┬───────┬────┘
                                                     │       │
                                            WebDAV   │       │  SMTP
                                            (PUT)    │       │  (email)
                                                     ▼       ▼
                                            ┌────────────┐ ┌──────────┐
                                            │ NEXTCLOUD  │ │  GMAIL   │
                                            │ /Pedidos/  │ │  SMTP    │
                                            │  └─ carpeta│ │          │
                                            │     ├─ img │ │ → correo │
                                            │     └─ json│ │   admin  │
                                            └────────────┘ └──────────┘
```


## 3. Estructura de Archivos

```
backend/
├── package.json          ← Dependencias y scripts npm
├── .env.example          ← Plantilla de variables de entorno
├── .gitignore            ← Archivos excluidos de git
├── public/               ← Frontend (servido como estático)
│   └── index.html        ← Formulario de subida
├── src/
│   ├── server.js         ← Punto de entrada — configura Fastify y plugins
│   ├── routes/
│   │   └── upload.js     ← Ruta POST /api/upload — lógica principal
│   └── services/
│       ├── nextcloud.js  ← Cliente WebDAV — sube archivos a Nextcloud
│       ├── email.js      ← Nodemailer — envía notificación por correo
│       └── metadata.js   ← Guarda pedido.json con datos del cliente
└── docs/
    └── ARQUITECTURA.md   ← Este archivo
```


## 4. Flujo Detallado de un Pedido

### Paso 1: El cliente abre el formulario
El navegador carga `index.html` desde `public/`. El HTML incluye CSS y JS inline (cero dependencias externas). El formulario tiene campos para nombre, email, teléfono, material, mensaje y un área de drag-and-drop para archivos.

### Paso 2: El cliente envía el formulario
Al hacer clic en "ENVIAR", el JavaScript del frontend:
1. Valida los campos requeridos (nombre, email, al menos 1 archivo)
2. Construye un objeto `FormData` con todos los campos + archivos
3. Hace `fetch('POST', '/api/upload', formData)`
4. Muestra un spinner mientras espera la respuesta

### Paso 3: Fastify recibe el request
El servidor en `server.js` pasa el request por estos plugins en orden:
1. **@fastify/rate-limit**: Verifica que la IP no exceda 20 requests/minuto
2. **@fastify/cors**: Verifica que el origin esté en la lista permitida
3. **@fastify/multipart**: Parsea el body multipart en partes (campos + archivos)

### Paso 4: La ruta /api/upload procesa el pedido (`routes/upload.js`)
1. **Parseo**: Itera sobre las partes del multipart. Los campos de texto van a un objeto `fields`. Los archivos se leen completos a un Buffer en memoria.
2. **Validación**: Verifica nombre (mín. 2 chars), email (formato válido), y que haya al menos 1 archivo.
3. **Naming**: Genera un nombre de carpeta único: `2026-03-08T14-30-00_Maria_Gonzalez`
4. **Upload a Nextcloud**: Por cada archivo, llama a `sendToNextcloud(carpeta, nombre, buffer)`
5. **Metadatos**: Crea un `pedido.json` con todos los datos y lo sube a la misma carpeta
6. **Email**: Envía un correo HTML con los datos del pedido y un link directo a Nextcloud
7. **Respuesta**: Retorna `{ success: true }` al frontend

### Paso 5: El frontend muestra confirmación
Si la respuesta es exitosa, oculta el formulario y muestra un mensaje de éxito animado.


## 5. Definiciones y Conceptos

### WebDAV
WebDAV (Web Distributed Authoring and Versioning) es una extensión del protocolo HTTP que permite a los clientes crear, mover y editar archivos en un servidor remoto. Nextcloud expone una API WebDAV en la ruta `/remote.php/dav/files/{usuario}/`. Usamos la librería `webdav` de npm que abstrae las llamadas HTTP PUT/MKCOL/PROPFIND.

### Multipart/form-data
Es el formato estándar HTTP para enviar formularios que incluyen archivos binarios. Cada campo y archivo se envía como una "parte" separada con su propio Content-Type. El plugin `@fastify/multipart` parsea este formato de manera streaming (no carga todo en memoria de golpe).

### SMTP
Simple Mail Transfer Protocol. Es el protocolo estándar para enviar correos electrónicos. Nodemailer se conecta al servidor SMTP de Gmail (o el que configures) y envía el email. Para Gmail necesitas una "App Password", no tu contraseña normal.

### Rate Limiting
Protección contra abuso. Limita a 20 requests por minuto por IP. Si un bot intenta enviar 1000 formularios, se bloquea después del request #20.

### CORS
Cross-Origin Resource Sharing. El navegador bloquea requests desde un dominio diferente al del servidor por seguridad. El plugin @fastify/cors agrega los headers HTTP necesarios para permitir que el frontend (ej: formulario.printup.cl) hable con el backend (ej: api.printup.cl).


## 6. Guía Práctica de Uso

### Requisitos Previos
- Node.js 22 LTS instalado (https://nodejs.org)
- Un servidor Nextcloud accesible con un usuario que tenga permisos de escritura
- Una cuenta de Gmail con App Password habilitado (o cualquier servidor SMTP)

### Instalación

```bash
# 1. Entrar a la carpeta del backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Crear archivo de configuración
cp .env.example .env

# 4. Editar .env con tus datos reales
# (Nextcloud URL, usuario, contraseña, SMTP, etc.)
```

### Configurar Gmail para envío de emails

1. Ve a https://myaccount.google.com/security
2. Activa la verificación en 2 pasos si no la tienes
3. Ve a https://myaccount.google.com/apppasswords
4. Genera una App Password para "Otra (nombre personalizado)" → "PrintUp"
5. Copia la contraseña de 16 caracteres y pégala en SMTP_PASS del .env

### Crear la carpeta en Nextcloud

Antes de usar el backend, crea la carpeta destino en tu Nextcloud:
1. Entra a tu Nextcloud
2. Crea la carpeta `/PrintUp/Pedidos_Nuevos/` (o la ruta que pongas en NEXTCLOUD_FOLDER)
3. Asegúrate de que el usuario configurado tenga permisos de escritura

### Ejecutar en desarrollo

```bash
# Modo desarrollo (auto-restart al cambiar código)
npm run dev

# Modo producción
npm start
```

El servidor arranca en http://localhost:3000 y sirve el formulario en la raíz.

### Verificar que todo funciona

```bash
# Health check (verifica Nextcloud)
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "nextcloud": { "connected": true, "folderExists": true }
}
```

### Probar el formulario
1. Abre http://localhost:3000 en el navegador
2. Llena el formulario y adjunta un archivo
3. Haz clic en ENVIAR
4. Verifica que:
   - El archivo apareció en Nextcloud dentro de la carpeta correspondiente
   - Recibiste un email en guerrafelipe93@gmail.com con los datos


## 7. Estructura de un Pedido en Nextcloud

Cada pedido crea una carpeta con esta estructura:

```
/PrintUp/Pedidos_Nuevos/
  └── 2026-03-08T14-30-00_Maria_Gonzalez/
      ├── diseño_banner.pdf          ← Archivo del cliente
      ├── logo_empresa.png           ← Otro archivo del cliente
      └── pedido.json                ← Metadatos del pedido
```

Contenido de `pedido.json`:
```json
{
  "nombre": "María González",
  "email": "maria@ejemplo.com",
  "telefono": "+56 9 1234 5678",
  "material": "vinilo",
  "mensaje": "Necesito 2 copias en tamaño 1m x 0.5m",
  "archivos": [
    { "nombre": "diseño_banner.pdf", "tamaño": "12.3 MB", "estado": "ok" },
    { "nombre": "logo_empresa.png", "tamaño": "450.2 KB", "estado": "ok" }
  ],
  "fecha": "2026-03-08T14:30:00.000Z",
  "carpeta": "2026-03-08T14-30-00_Maria_Gonzalez"
}
```


## 8. Variables de Entorno (Referencia)

| Variable | Requerida | Valor por defecto | Descripción |
|---|---|---|---|
| `PORT` | No | 3000 | Puerto del servidor |
| `HOST` | No | 0.0.0.0 | Host de escucha |
| `NEXTCLOUD_URL` | **Sí** | — | URL base de Nextcloud (sin / final) |
| `NEXTCLOUD_USER` | **Sí** | — | Usuario con permisos de escritura |
| `NEXTCLOUD_PASSWORD` | **Sí** | — | Contraseña o App Password |
| `NEXTCLOUD_FOLDER` | No | /PrintUp/Pedidos_Nuevos | Carpeta destino |
| `SMTP_HOST` | **Sí** | — | Servidor SMTP (ej: smtp.gmail.com) |
| `SMTP_PORT` | No | 465 | Puerto SMTP |
| `SMTP_SECURE` | No | true | Usar TLS |
| `SMTP_USER` | **Sí** | — | Email del remitente |
| `SMTP_PASS` | **Sí** | — | App Password de Gmail |
| `NOTIFY_TO` | **Sí** | — | Email donde llegan las notificaciones |
| `NOTIFY_FROM` | No | SMTP_USER | Nombre del remitente |
| `ALLOWED_ORIGINS` | No | http://localhost:3000 | Orígenes CORS (separados por coma) |
| `MAX_FILE_SIZE_MB` | No | 100 | Tamaño máximo por archivo en MB |
| `MAX_FILES` | No | 10 | Máximo de archivos por envío |


## 9. Despliegue en Producción

### Opción A: Tu servidor local + Cloudflare Tunnel
1. Instala `cloudflared` en tu Windows Server
2. Crea un túnel apuntando al puerto 3000
3. Configura `formulario.printup.cl` como hostname del túnel
4. Cambia `ALLOWED_ORIGINS` a `https://formulario.printup.cl`

### Opción C: Oracle Cloud Always Free
1. Crea una VM ARM (4 CPU, 24 GB RAM)
2. Instala Node.js 22, clona el proyecto, configura .env
3. Usa `pm2` o `systemd` para mantener el servidor corriendo
4. Apunta `formulario.printup.cl` a la IP de Oracle
5. Configura Nginx como reverse proxy + Let's Encrypt para SSL

### Mantener el proceso vivo con PM2
```bash
npm install -g pm2
pm2 start src/server.js --name printup
pm2 save
pm2 startup  # genera el comando para autostart al reiniciar
```
