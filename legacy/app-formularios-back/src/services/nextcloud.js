// ============================================
// Servicio: Nextcloud WebDAV
// Sube archivos a Nextcloud usando el protocolo
// WebDAV (remote.php/dav/files/{usuario})
// ============================================

import { createClient } from 'webdav';

let client = null;

function getClient() {
  if (!client) {
    const url = process.env.NEXTCLOUD_URL;
    const user = process.env.NEXTCLOUD_USER;
    const pass = process.env.NEXTCLOUD_PASSWORD;

    if (!url || !user || !pass) {
      throw new Error('Faltan variables NEXTCLOUD_URL, NEXTCLOUD_USER o NEXTCLOUD_PASSWORD en .env');
    }

    const webdavUrl = `${url}/remote.php/dav/files/${user}`;
    client = createClient(webdavUrl, { username: user, password: pass });
    console.log(`[Nextcloud] WebDAV → ${webdavUrl}`);
  }
  return client;
}

/**
 * Sube un archivo a Nextcloud.
 * Crea la carpeta del pedido si no existe.
 * 
 * @param {string} folderName - Subcarpeta del pedido
 * @param {string} filename - Nombre del archivo
 * @param {Buffer} buffer - Contenido binario
 * @returns {string} Ruta remota completa
 */
export async function sendToNextcloud(folderName, filename, buffer) {
  const wdav = getClient();
  const base = process.env.NEXTCLOUD_FOLDER || '/PrintUp/Pedidos_Nuevos';
  const folderPath = `${base}/${folderName}`;
  const filePath = `${folderPath}/${filename}`;

  // Crear carpeta recursivamente
  await ensureDir(wdav, folderPath);

  // Subir archivo
  await wdav.putFileContents(filePath, buffer, {
    overwrite: true,
    contentLength: buffer.length
  });

  return filePath;
}

/**
 * Verifica conexión con Nextcloud (para health check)
 */
export async function checkNextcloudConnection() {
  try {
    const wdav = getClient();
    const folder = process.env.NEXTCLOUD_FOLDER || '/';
    const exists = await wdav.exists(folder);
    return { connected: true, folderExists: exists };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

async function ensureDir(wdav, path) {
  const parts = path.split('/').filter(Boolean);
  let current = '';
  for (const part of parts) {
    current += '/' + part;
    try {
      if (!(await wdav.exists(current))) {
        await wdav.createDirectory(current);
      }
    } catch { /* ya existe */ }
  }
}
