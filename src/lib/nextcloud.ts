// Nextcloud WebDAV integration - prepared for future connection
// To activate: npm install webdav, set NEXTCLOUD_* env vars, and replace stubs below

interface NextcloudResult {
  success: boolean;
  message: string;
  path?: string;
}

export async function uploadFile(
  _folderName: string,
  _fileName: string,
  _fileBuffer: Buffer
): Promise<NextcloudResult> {
  const url = process.env.NEXTCLOUD_URL;
  if (!url) {
    return { success: false, message: "Nextcloud no configurado" };
  }
  // TODO: Implement with webdav library
  // const { createClient } = require("webdav");
  // const client = createClient(`${url}/remote.php/dav/files/${user}`, { username, password });
  // const basePath = process.env.NEXTCLOUD_FOLDER || "/PrintUp/Pedidos_Nuevos";
  // const fullPath = `${basePath}/${folderName}/${fileName}`;
  // await client.putFileContents(fullPath, fileBuffer);
  return { success: false, message: "Nextcloud no configurado" };
}

export async function createFolder(_folderName: string): Promise<NextcloudResult> {
  const url = process.env.NEXTCLOUD_URL;
  if (!url) {
    return { success: false, message: "Nextcloud no configurado" };
  }
  return { success: false, message: "Nextcloud no configurado" };
}

export async function checkConnection(): Promise<NextcloudResult> {
  const url = process.env.NEXTCLOUD_URL;
  if (!url) {
    return { success: false, message: "Nextcloud no configurado - configure NEXTCLOUD_URL" };
  }
  return { success: false, message: "Nextcloud no conectado aún" };
}

export function getNextcloudFileUrl(folderName: string): string {
  const url = process.env.NEXTCLOUD_URL || "https://your-nextcloud.example.com";
  const folder = process.env.NEXTCLOUD_FOLDER || "/PrintUp/Pedidos_Nuevos";
  return `${url}/apps/files/?dir=${folder}/${folderName}`;
}
