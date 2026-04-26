// Nextcloud WebDAV integration via fetch (no external dependencies)

interface NextcloudResult {
  success: boolean;
  message: string;
  path?: string;
}

function getConfig() {
  const url = process.env.NEXTCLOUD_URL;
  const user = process.env.NEXTCLOUD_USER;
  const password = process.env.NEXTCLOUD_PASSWORD;
  const folder = process.env.NEXTCLOUD_FOLDER || "/PrintUp/Pedidos_Nuevos";
  return { url, user, password, folder };
}

function authHeaders(): HeadersInit {
  const { user, password } = getConfig();
  const encoded = Buffer.from(`${user}:${password}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

function davUrl(path: string): string {
  const { url, user } = getConfig();
  return `${url}/remote.php/dav/files/${user}${path}`;
}

export async function createFolder(folderPath: string): Promise<NextcloudResult> {
  const { url } = getConfig();
  if (!url) return { success: false, message: "Nextcloud no configurado" };

  try {
    const res = await fetch(davUrl(folderPath), {
      method: "MKCOL",
      headers: authHeaders(),
    });

    // 201 = created, 405 = already exists (both are fine)
    if (res.ok || res.status === 405) {
      return { success: true, message: "Carpeta creada", path: folderPath };
    }
    return { success: false, message: `Error ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Error de conexion" };
  }
}

export async function createFolderRecursive(folderPath: string): Promise<NextcloudResult> {
  const { url } = getConfig();
  if (!url) return { success: false, message: "Nextcloud no configurado" };

  const parts = folderPath.split("/").filter(Boolean);
  let currentPath = "";

  for (const part of parts) {
    currentPath += `/${part}`;
    const result = await createFolder(currentPath);
    if (!result.success) return result;
  }

  return { success: true, message: "Carpetas creadas", path: folderPath };
}

export async function uploadFile(
  folderPath: string,
  fileName: string,
  fileBuffer: Uint8Array,
  contentType?: string
): Promise<NextcloudResult> {
  const { url } = getConfig();
  if (!url) return { success: false, message: "Nextcloud no configurado" };

  const fullPath = `${folderPath}/${fileName}`;

  try {
    const headers: HeadersInit = {
      ...authHeaders(),
      "Content-Type": contentType || "application/octet-stream",
    };

    const res = await fetch(davUrl(fullPath), {
      method: "PUT",
      headers,
      body: fileBuffer as unknown as BodyInit,
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      return { success: true, message: "Archivo subido", path: fullPath };
    }
    return { success: false, message: `Error ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Error de conexion" };
  }
}

export async function deleteFile(filePath: string): Promise<NextcloudResult> {
  const { url } = getConfig();
  if (!url) return { success: false, message: "Nextcloud no configurado" };

  try {
    const res = await fetch(davUrl(filePath), {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (res.ok || res.status === 204) {
      return { success: true, message: "Archivo eliminado" };
    }
    return { success: false, message: `Error ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Error de conexion" };
  }
}

export async function checkConnection(): Promise<NextcloudResult> {
  const { url, user } = getConfig();
  if (!url) return { success: false, message: "Nextcloud no configurado - configure NEXTCLOUD_URL" };

  try {
    const res = await fetch(davUrl("/"), {
      method: "PROPFIND",
      headers: {
        ...authHeaders(),
        Depth: "0",
      },
    });

    if (res.ok || res.status === 207) {
      return { success: true, message: `Conectado como ${user}` };
    }
    if (res.status === 401) {
      return { success: false, message: "Credenciales incorrectas" };
    }
    return { success: false, message: `Error ${res.status}: ${res.statusText}` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "No se pudo conectar" };
  }
}

export function getNextcloudFileUrl(folderName: string): string {
  const url = process.env.NEXTCLOUD_URL || "https://printup.internos";
  const folder = process.env.NEXTCLOUD_FOLDER || "/PrintUp/Pedidos_Nuevos";
  return `${url}/apps/files/?dir=${folder}/${folderName}`;
}
