// ============================================
// Ruta: POST /api/upload
// 1. Recibe formulario multipart
// 2. Sube archivos a Nextcloud vía WebDAV
// 3. Guarda metadatos como JSON en Nextcloud
// 4. Envía email de notificación
// ============================================

import { sendToNextcloud } from '../services/nextcloud.js';
import { saveMetadata } from '../services/metadata.js';
import { sendNotification } from '../services/email.js';
import { saveToLocal, saveMetadataLocal } from '../services/localStorage.js';

const STORAGE_MODE = (process.env.STORAGE_MODE || 'nextcloud').toLowerCase();

export async function uploadRoute(app) {

  app.post('/api/upload', async (request, reply) => {
    const start = Date.now();
    const fields = {};
    const files = [];

    try {
      // --- 1. Parsear multipart ---
      const parts = request.parts();

      for await (const part of parts) {
        if (part.type === 'file') {
          if (!part.filename) continue;

          const chunks = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);

          if (part.file.truncated) {
            return reply.code(413).send({
              success: false,
              error: `"${part.filename}" excede el límite de tamaño.`
            });
          }

          files.push({
            filename: sanitize(part.filename),
            originalName: part.filename,
            mimetype: part.mimetype,
            size: buffer.length,
            buffer
          });
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      // --- 2. Validar ---
      const errors = [];
      if (!fields.nombre || fields.nombre.trim().length < 2)
        errors.push('Nombre requerido (mínimo 2 caracteres)');
      if (!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
        errors.push('Email inválido');
      if (files.length === 0)
        errors.push('Adjunta al menos un archivo');

      if (errors.length > 0) {
        return reply.code(400).send({ success: false, errors });
      }

      // --- 3. Crear carpeta en Nextcloud ---
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const name = fields.nombre.trim()
        .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '')
        .replace(/\s+/g, '_');
      const folder = `${ts}_${name}`;

      // --- 4. Subir archivos ---
      const results = [];

      for (const file of files) {
        try {
          let path;
          if (STORAGE_MODE === 'local') {
            path = await saveToLocal(folder, file.filename, file.buffer);
          } else {
            path = await sendToNextcloud(folder, file.filename, file.buffer);
          }
          results.push({ name: file.originalName, size: file.size, path, ok: true });
          request.log.info(`✓ ${file.originalName} (${fmtSize(file.size)}) → ${path}`);
        } catch (err) {
          request.log.error(`✗ ${file.originalName}: ${err.message}`);
          results.push({ name: file.originalName, size: file.size, ok: false, error: err.message });
        }
      }

      // --- 5. Guardar metadatos como JSON ---
      const meta = {
        nombre: fields.nombre.trim(),
        email: fields.email.trim(),
        telefono: fields.telefono?.trim() || '',
        material: fields.material || '',
        mensaje: fields.mensaje?.trim() || '',
        archivos: results.map(r => ({ nombre: r.name, tamaño: fmtSize(r.size), estado: r.ok ? 'ok' : 'error' })),
        fecha: new Date().toISOString(),
        carpeta: folder
      };

      try {
        if (STORAGE_MODE === 'local') {
          await saveMetadataLocal(folder, meta);
        } else {
          await saveMetadata(folder, meta);
        }
      } catch (err) {
        request.log.error(`Error guardando metadatos: ${err.message}`);
      }

      // --- 6. Enviar email de notificación ---
      const ncBase = process.env.NEXTCLOUD_URL || '';
      const ncUser = process.env.NEXTCLOUD_USER || '';
      const ncFolder = process.env.NEXTCLOUD_FOLDER || '';
      const folderLink = `${ncBase}/index.php/apps/files/?dir=${encodeURIComponent(ncFolder + '/' + folder)}`;

      try {
        await sendNotification({
          nombre: meta.nombre,
          email: meta.email,
          telefono: meta.telefono,
          material: meta.material,
          mensaje: meta.mensaje,
          archivos: results,
          folder,
          folderLink
        });
        request.log.info(`📧 Email enviado a ${process.env.NOTIFY_TO}`);
      } catch (err) {
        request.log.error(`Error enviando email: ${err.message}`);
        // No fallamos el request por esto — el archivo ya está en Nextcloud
      }

      // --- 7. Responder ---
      const allOk = results.every(r => r.ok);
      const elapsed = Date.now() - start;

      if (allOk) {
        request.log.info(`Pedido completo: ${folder} (${files.length} archivos, ${elapsed}ms)`);
        return reply.code(200).send({
          success: true,
          message: '¡Archivos recibidos correctamente!',
          folder,
          files: results.length,
          elapsed: `${elapsed}ms`
        });
      }

      return reply.code(207).send({
        success: false,
        message: 'Algunos archivos fallaron',
        results
      });

    } catch (err) {
      request.log.error(`Error general: ${err.message}`);
      return reply.code(500).send({
        success: false,
        error: 'Error interno. Intenta nuevamente.'
      });
    }
  });
}

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ._\- ]/g, '').replace(/\s+/g, '_').slice(0, 200);
}

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
