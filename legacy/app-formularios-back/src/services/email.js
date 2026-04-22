// ============================================
// Servicio: Notificación por Email
// Envía un correo al dueño (guerrafelipe93@gmail.com)
// cada vez que un cliente sube un archivo.
// Usa Nodemailer con SMTP (Gmail u otro).
// ============================================

import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '465');
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error('Faltan variables SMTP_HOST, SMTP_USER o SMTP_PASS en .env');
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    console.log(`[Email] SMTP configurado → ${host}:${port} (${user})`);
  }
  return transporter;
}

/**
 * Envía un email de notificación con los datos del pedido.
 *
 * @param {object} data
 * @param {string} data.nombre
 * @param {string} data.email
 * @param {string} data.telefono
 * @param {string} data.material
 * @param {string} data.mensaje
 * @param {Array}  data.archivos - [{name, size, ok}]
 * @param {string} data.folder - Nombre de la carpeta
 * @param {string} data.folderLink - URL directa a Nextcloud
 */
export async function sendNotification(data) {
  const mail = getTransporter();
  const to = process.env.NOTIFY_TO;
  const from = process.env.NOTIFY_FROM || process.env.SMTP_USER;

  if (!to) {
    throw new Error('Falta la variable NOTIFY_TO en .env');
  }

  // Lista de archivos formateada
  const filesList = data.archivos
    .map(f => `  • ${f.name} (${fmtSize(f.size)}) — ${f.ok ? '✓ Subido' : '✗ Error'}`)
    .join('\n');

  // --- Email en texto plano ---
  const text = `
NUEVO PEDIDO — PrintUp.cl
========================================

Cliente:    ${data.nombre}
Email:      ${data.email}
Teléfono:   ${data.telefono || 'No proporcionado'}
Material:   ${data.material || 'No especificado'}

Mensaje:
${data.mensaje || '(Sin mensaje)'}

Archivos (${data.archivos.length}):
${filesList}

Carpeta en Nextcloud:
${data.folder}

Abrir en Nextcloud:
${data.folderLink}

========================================
Enviado automáticamente por PrintUp Backend
`;

  // --- Email en HTML ---
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F7F8FC;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#FFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="height:6px;background:linear-gradient(90deg,#FFD100,#E91E8C,#00BFFF,#1B2A6B);"></div>
    <div style="padding:24px 32px 16px;border-bottom:1px solid #E2E8F0;">
      <h1 style="margin:0;font-size:20px;color:#1B2A6B;">📦 Nuevo Pedido</h1>
      <p style="margin:4px 0 0;color:#64748B;font-size:14px;">Se recibió un archivo desde el formulario de PrintUp.cl</p>
    </div>

    <!-- Datos del cliente -->
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#64748B;width:100px;vertical-align:top;">Cliente</td>
          <td style="padding:8px 0;color:#1E293B;font-weight:600;">${esc(data.nombre)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;vertical-align:top;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${esc(data.email)}" style="color:#00B4D8;">${esc(data.email)}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;vertical-align:top;">Teléfono</td>
          <td style="padding:8px 0;color:#1E293B;">${esc(data.telefono) || '<span style="color:#94A3B8;">No proporcionado</span>'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748B;vertical-align:top;">Material</td>
          <td style="padding:8px 0;color:#1E293B;">${esc(data.material) || '<span style="color:#94A3B8;">No especificado</span>'}</td>
        </tr>
      </table>

      ${data.mensaje ? `
      <div style="margin-top:16px;padding:12px 16px;background:#F7F8FC;border-radius:8px;border-left:3px solid #00B4D8;">
        <div style="font-size:12px;color:#64748B;margin-bottom:4px;">Mensaje:</div>
        <div style="font-size:14px;color:#1E293B;line-height:1.5;">${esc(data.mensaje)}</div>
      </div>
      ` : ''}

      <!-- Archivos -->
      <div style="margin-top:20px;">
        <div style="font-size:13px;font-weight:600;color:#1E293B;margin-bottom:8px;">📎 Archivos adjuntos (${data.archivos.length}):</div>
        ${data.archivos.map(f => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F7F8FC;border-radius:6px;margin-bottom:4px;font-size:13px;">
          <span style="color:${f.ok ? '#10B981' : '#EF4444'};">${f.ok ? '✓' : '✗'}</span>
          <span style="color:#1E293B;font-weight:500;">${esc(f.name)}</span>
          <span style="color:#94A3B8;margin-left:auto;">${fmtSize(f.size)}</span>
        </div>
        `).join('')}
      </div>

      <!-- Botón Nextcloud -->
      <div style="margin-top:24px;text-align:center;">
        <a href="${data.folderLink}" 
           style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#1B2A6B,#2D3F9E);color:#FFF;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          Abrir en Nextcloud →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#F7F8FC;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94A3B8;">
        Carpeta: <code style="background:#E2E8F0;padding:2px 6px;border-radius:3px;">${esc(data.folder)}</code>
      </p>
    </div>
  </div>
</body>
</html>
`;

  // --- Enviar ---
  await mail.sendMail({
    from,
    to,
    subject: `📦 Nuevo pedido de ${data.nombre} — PrintUp`,
    text,
    html
  });
}

/**
 * Verifica la conexión SMTP
 */
export async function checkEmailConnection() {
  try {
    const mail = getTransporter();
    await mail.verify();
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
