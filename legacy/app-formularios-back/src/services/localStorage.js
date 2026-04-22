// ============================================
// Servicio: Almacenamiento Local
// Guarda archivos en disco (carpeta uploads/)
// cuando Nextcloud no está disponible.
// ============================================

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

/**
 * Guarda un archivo en disco local.
 * Crea la carpeta del pedido si no existe.
 */
export async function saveToLocal(folderName, filename, buffer) {
    const folderPath = join(UPLOADS_DIR, folderName);
    await mkdir(folderPath, { recursive: true });

    const filePath = join(folderPath, filename);
    await writeFile(filePath, buffer);

    console.log(`[Local] Archivo guardado → ${filePath}`);
    return filePath;
}

/**
 * Guarda metadatos en disco local como JSON.
 */
export async function saveMetadataLocal(folderName, metadata) {
    const json = JSON.stringify(metadata, null, 2);
    const buffer = Buffer.from(json, 'utf-8');
    await saveToLocal(folderName, 'pedido.json', buffer);
}
