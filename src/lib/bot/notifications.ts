import { Resend } from "resend";
import { configuracionRepo } from "@/server/repositories";
import { sendWhatsAppMessage } from "@/lib/meta";
import type { IncomingMessage } from "./types";

const PRINTUP_PHONE = "56966126645";
const ADMIN_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/admin`
  : "https://printup.cl/admin";

interface NotifyPayload {
  type:
    | "nuevo_cliente"
    | "nuevo_formulario"
    | "escalacion"
    | "imagen_recibida";
  data: Record<string, unknown>;
}

export async function notifyPrintUp(
  payload: NotifyPayload,
  msg: IncomingMessage
): Promise<void> {
  const subject = getSubject(payload);
  const html = getEmailHtml(payload);
  const waMsg = getWhatsAppMsg(payload);

  // Enviar ambos en paralelo
  await Promise.allSettled([
    sendEmailNotification(subject, html),
    sendWhatsAppNotification(waMsg),
  ]);

  // Log en consola para debug
  console.log(`[Bot Notify] ${payload.type}:`, payload.data, `canal=${msg.canal}`);
}

function getSubject(payload: NotifyPayload): string {
  const d = payload.data;
  switch (payload.type) {
    case "nuevo_cliente":
      return `Nuevo cliente: ${d.nombre} (${d.canal})`;
    case "nuevo_formulario":
      return `Nuevo formulario: ${d.cliente_nombre}`;
    case "escalacion":
      return `Atencion requerida: ${d.cliente_nombre} pide hablar con persona`;
    case "imagen_recibida":
      return `Nueva imagen: ${d.cliente_nombre} - ${d.material}`;
    default:
      return "Notificacion PrintUp Bot";
  }
}

function getEmailHtml(payload: NotifyPayload): string {
  const d = payload.data;
  switch (payload.type) {
    case "nuevo_cliente":
      return (
        `<h2>Nuevo cliente registrado via bot</h2>` +
        `<p><strong>Nombre:</strong> ${d.nombre}</p>` +
        `<p><strong>Email:</strong> ${d.email}</p>` +
        `<p><strong>Tipo:</strong> ${d.tipo}</p>` +
        `<p><strong>Canal:</strong> ${d.canal}</p>` +
        `<p><a href="${ADMIN_URL}/contactos">Ver en admin</a></p>`
      );
    case "imagen_recibida":
      return (
        `<h2>Imagen recibida por chat</h2>` +
        `<p><strong>Cliente:</strong> ${d.cliente_nombre}</p>` +
        `<p><strong>Material:</strong> ${d.material}</p>` +
        `<p><strong>Canal:</strong> ${d.canal}</p>` +
        (d.formulario_id
          ? `<p><a href="${ADMIN_URL}/formularios/${d.formulario_id}">Ver formulario</a></p>`
          : "")
      );
    case "escalacion":
      return (
        `<h2>Cliente solicita atencion humana</h2>` +
        `<p><strong>Cliente:</strong> ${d.cliente_nombre}</p>` +
        `<p><strong>Canal:</strong> ${d.canal}</p>` +
        `<p><strong>Mensaje:</strong> ${d.mensaje}</p>` +
        `<p><a href="${ADMIN_URL}/mensajeria">Ir a mensajeria</a></p>`
      );
    default:
      return `<p>Notificacion: ${JSON.stringify(d)}</p>`;
  }
}

function getWhatsAppMsg(payload: NotifyPayload): string {
  const d = payload.data;
  switch (payload.type) {
    case "nuevo_cliente":
      return `[Bot] Nuevo cliente: ${d.nombre} (${d.tipo}) via ${d.canal}`;
    case "imagen_recibida":
      return (
        `[Bot] Imagen recibida de ${d.cliente_nombre}\n` +
        `Material: ${d.material}\n` +
        `Ver: ${ADMIN_URL}/formularios/${d.formulario_id || ""}`
      );
    case "escalacion":
      return (
        `[Bot] ${d.cliente_nombre} pide hablar con persona\n` +
        `Canal: ${d.canal}\n` +
        `Ver: ${ADMIN_URL}/mensajeria`
      );
    default:
      return `[Bot] ${payload.type}`;
  }
}

async function sendEmailNotification(
  subject: string,
  html: string
): Promise<void> {
  try {
    const apiKey =
      (await configuracionRepo.get("resend_api_key")) ||
      process.env.RESEND_API_KEY ||
      "";

    if (!apiKey) return;

    const notifyTo =
      process.env.NOTIFY_TO || "guerrafelipe93@gmail.com";
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.FROM_NAME || "PrintUp Bot";

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [notifyTo],
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1B2A6B,#00B4D8);padding:16px 24px;">
            <h1 style="color:#fff;margin:0;font-size:16px;">PrintUp Bot</h1>
          </div>
          <div style="padding:24px;background:#fff;">
            ${html}
          </div>
          <div style="padding:12px 24px;background:#f8f8f8;text-align:center;font-size:11px;color:#999;">
            Notificacion automatica del bot de PrintUp
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("Email notification error:", e);
  }
}

async function sendWhatsAppNotification(message: string): Promise<void> {
  try {
    const config = await configuracionRepo.getMany([
      "meta_page_access_token",
      "meta_whatsapp_phone_number_id",
    ]);

    const token = config.meta_page_access_token;
    const phoneId = config.meta_whatsapp_phone_number_id;

    if (!token || !phoneId) {
      console.log("[Bot WA Notify] No Meta config, skipping:", message);
      return;
    }

    await sendWhatsAppMessage(PRINTUP_PHONE, message, token, phoneId);
  } catch (e) {
    console.error("WhatsApp notification error:", e);
  }
}
