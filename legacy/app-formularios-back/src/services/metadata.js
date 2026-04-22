// ============================================
// Servicio: Metadatos del Pedido
// Guarda un pedido.json junto a los archivos
// ============================================

import { sendToNextcloud } from './nextcloud.js';

export async function saveMetadata(folderName, metadata) {
  const json = JSON.stringify(metadata, null, 2);
  const buffer = Buffer.from(json, 'utf-8');
  await sendToNextcloud(folderName, 'pedido.json', buffer);
}
