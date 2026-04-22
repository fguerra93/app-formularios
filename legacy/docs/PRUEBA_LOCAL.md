# Prueba Local Paso a Paso — PrintUp Formulario

Guía para probar el formulario de subida de archivos conectado al backend Fastify, todo en tu máquina local.

---

## Requisitos Previos

- **Node.js** v18+ instalado → verifica con `node -v`
- **npm** instalado → verifica con `npm -v`
- Un navegador moderno (Chrome, Edge, Firefox)

---

## Paso 1 — Configurar variables de entorno

```bash
cd backend
copy .env.example .env      # Windows
# cp .env.example .env      # Mac/Linux
```

Edita `backend/.env` y ajusta los valores según tu entorno:

| Variable | Valor local sugerido | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto del servidor |
| `HOST` | `0.0.0.0` | Escuchar en todas las interfaces |
| `ALLOWED_ORIGINS` | `http://localhost:5500,http://127.0.0.1:5500,null` | Orígenes permitidos por CORS. Agrega `null` si abres el HTML directamente con `file://` |
| `NEXTCLOUD_URL` | tu URL de Nextcloud | Para la subida real de archivos |
| `SMTP_*` | tus credenciales SMTP | Para el envío de email de notificación |

> [!IMPORTANT]
> Si no tienes Nextcloud ni SMTP configurados, el formulario igualmente recibirá el request, pero la subida y el email fallarán (verás el error en la consola del backend). Esto es esperado para una primera prueba de conectividad.

---

## Paso 2 — Instalar dependencias

```bash
cd backend
npm install
```

---

## Paso 3 — Levantar el backend

```bash
npm run dev
```

Deberías ver algo como:

```
[HH:MM:ss] INFO: Server listening at http://0.0.0.0:3000
PrintUp Backend v1.0 corriendo en http://localhost:3000
```

> [!TIP]
> `npm run dev` usa `--watch`, así que si editas código del backend, se reinicia automáticamente.

---

## Paso 4 — Verificar que el backend responde

Abre en el navegador:

```
http://localhost:3000/api/health
```

Deberías ver un JSON con `"status": "ok"` y el estado de Nextcloud.

---

## Paso 5 — Abrir el formulario en el navegador

Abre el archivo directamente:

```
frontend/formulario-printup.html
```

O usa **Live Server** (extensión de VS Code) para servirlo en `http://localhost:5500`.

> [!NOTE]
> Si abres el HTML con `file://`, asegúrate de que `ALLOWED_ORIGINS` en `.env` incluya `null` (los orígenes `file://` se envían como `null`).

---

## Paso 6 — Llenar y enviar el formulario

1. **Nombre**: escribe cualquier nombre (mín. 2 caracteres)
2. **Email**: usa un email válido (ej: `test@test.com`)
3. **Teléfono**: opcional
4. **Material**: selecciona cualquier opción
5. **Mensaje**: opcional
6. **Archivo**: arrastra o selecciona un archivo de prueba (jpg, png, pdf, etc.)
7. Haz clic en **ENVIAR**

---

## Paso 7 — Verificar la respuesta

### ✅ Si todo funciona correctamente:
- El formulario mostrará el mensaje de éxito: **"¡Archivo recibido!"**
- En la consola del backend verás logs de la subida a Nextcloud y el envío del email

### ⚠️ Errores esperados sin Nextcloud/SMTP configurados:
- El backend recibirá el request pero fallará al subir a Nextcloud → respuesta **207** (parcial)
- El email no se enviará → error en consola del backend
- El formulario mostrará un alert con el error

### 🔍 Para depurar:
- **Consola del backend**: mira los logs con colores en la terminal donde ejecutaste `npm run dev`
- **DevTools del navegador** (F12 → Network): revisa el request POST a `/api/upload` y su respuesta
- **DevTools del navegador** (F12 → Console): revisa errores de JavaScript o CORS

---

## Flujo completo del request

```
Frontend (HTML)                    Backend (Fastify :3000)
     │                                     │
     │── POST /api/upload ────────────────►│
     │   (FormData: campos + archivos)     │
     │                                     │── Parsea multipart
     │                                     │── Valida campos
     │                                     │── Crea carpeta en Nextcloud (WebDAV)
     │                                     │── Sube archivos a Nextcloud
     │                                     │── Guarda metadatos como JSON
     │                                     │── Envía email de notificación
     │◄── JSON response ──────────────────│
     │   { success, message, folder }      │
```

---

## Troubleshooting

| Problema | Solución |
|---|---|
| **Error CORS** | Verifica que `ALLOWED_ORIGINS` en `.env` incluya el origen de tu frontend |
| **Connection refused** | Verifica que el backend esté corriendo en el puerto 3000 |
| **Error Nextcloud** | Normal si no configuraste las credenciales de WebDAV |
| **Error email** | Normal si no configuraste SMTP |
| **413 Payload Too Large** | El archivo excede el límite (`MAX_FILE_SIZE_MB` en `.env`) |
