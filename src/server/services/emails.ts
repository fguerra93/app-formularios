import { Resend } from "resend";
import { publicOrigin } from "@/lib/url";
import { configuracionRepo } from "@/server/repositories";
import { getDb } from "@/server/db";
import type { Pedido } from "@/server/domain";

/**
 * Emails transaccionales de pedido — servicio único.
 *
 * Antes cada ruta armaba su propio HTML inline (con el branding viejo de
 * gradiente y sin tildes). Aquí vive la única plantilla, con la identidad
 * "pliego de taller": tinta plana, banda de registro CMYK y voz correcta.
 *
 * Degrada con elegancia: sin RESEND_API_KEY no envía (y no rompe el flujo);
 * cada intento queda registrado en `email_log` (best-effort).
 */

const TALLER = {
  nombre: "PrintUp",
  lema: "Tu impresión, nuestra huella",
  whatsapp: "+56 9 66126645",
  whatsappLink: "https://wa.me/56966126645",
  email: "contacto@printup.cl",
  direccion: "Errázuriz 09 / Francisco Lira 082, Doñihue",
  transferencia: {
    razon: "Servicios Gráficos Spa",
    rut: "78.114.353-7",
  },
};

async function getResend(): Promise<{ resend: Resend; from: string } | null> {
  const apiKey =
    (await configuracionRepo.get("resend_api_key")) ||
    process.env.RESEND_API_KEY ||
    "";
  if (!apiKey) return null;
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.FROM_NAME || "PrintUp";
  return { resend: new Resend(apiKey), from: `${fromName} <${fromEmail}>` };
}

async function logEmail(values: {
  destinatario: string;
  asunto: string;
  estado: "enviado" | "fallido" | "omitido";
  error?: string | null;
}) {
  try {
    await getDb().from("email_log").insert({ ...values, proveedor: "resend" });
  } catch {
    // best-effort: sin tabla en local no rompe nada
  }
}

async function enviar(to: string, subject: string, html: string) {
  const cfg = await getResend();
  if (!cfg) {
    await logEmail({ destinatario: to, asunto: subject, estado: "omitido", error: "RESEND_API_KEY no configurada" });
    return false;
  }
  try {
    await cfg.resend.emails.send({ from: cfg.from, to: [to], subject, html });
    await logEmail({ destinatario: to, asunto: subject, estado: "enviado" });
    return true;
  } catch (e) {
    await logEmail({ destinatario: to, asunto: subject, estado: "fallido", error: String(e) });
    console.error("Error enviando email:", subject, e);
    return false;
  }
}

// ─── Plantilla "pliego de taller" ─────────────────────────────────
function layout(titulo: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8eaee;">
  <tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="25%" height="3" style="background:#00aeef;"></td>
        <td width="25%" height="3" style="background:#ec008c;"></td>
        <td width="25%" height="3" style="background:#ffd100;"></td>
        <td width="25%" height="3" style="background:#3a3f47;"></td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:#0f1115;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:-0.02em;">${TALLER.nombre}</span>
      <span style="color:#8b94a3;font-size:12px;"> · ${TALLER.lema}</span>
    </td>
  </tr>
  <tr>
    <td style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.25;color:#0f1115;letter-spacing:-0.02em;">${titulo}</h1>
      ${cuerpo}
    </td>
  </tr>
  <tr>
    <td style="padding:18px 28px;background:#fafafb;border-top:1px solid #e8eaee;">
      <p style="margin:0;font-size:12px;color:#5b6472;line-height:1.6;">
        ¿Dudas? Escríbenos por <a href="${TALLER.whatsappLink}" style="color:#0e7490;">WhatsApp ${TALLER.whatsapp}</a>
        o a <a href="mailto:${TALLER.email}" style="color:#0e7490;">${TALLER.email}</a>.<br>
        ${TALLER.nombre} · ${TALLER.direccion}
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`;
}

type ItemPedido = { nombre: string; cantidad: number; precio_unitario: number; variante?: Record<string, string> | null };

function clp(n: number): string {
  return `$${Number(n || 0).toLocaleString("es-CL")}`;
}

function tablaItems(pedido: Pedido): string {
  const items = (pedido.items as ItemPedido[]) || [];
  const filas = items
    .map((i) => {
      const detalle = i.variante
        ? `<br><span style="font-size:12px;color:#5b6472;">${Object.entries(i.variante)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}</span>`
        : "";
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e8eaee;font-size:14px;color:#0f1115;">${i.nombre}${detalle}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e8eaee;font-size:14px;color:#0f1115;text-align:center;white-space:nowrap;">× ${i.cantidad}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e8eaee;font-size:14px;color:#0f1115;text-align:right;font-family:Consolas,Menlo,monospace;">${clp(i.precio_unitario)}</td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
    <tr>
      <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5b6472;border-bottom:1px solid #0f1115;">Producto</th>
      <th style="padding:8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5b6472;border-bottom:1px solid #0f1115;">Cant.</th>
      <th style="padding:8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5b6472;border-bottom:1px solid #0f1115;">Precio</th>
    </tr>
    ${filas}
    ${pedido.costo_envio > 0 ? `<tr>
      <td colspan="2" style="padding:10px 8px;font-size:13px;color:#5b6472;">Envío</td>
      <td style="padding:10px 8px;font-size:13px;color:#0f1115;text-align:right;font-family:Consolas,Menlo,monospace;">${clp(pedido.costo_envio)}</td>
    </tr>` : ""}
    <tr>
      <td colspan="2" style="padding:12px 8px;font-size:14px;font-weight:bold;color:#0f1115;border-top:1px solid #0f1115;">Total (IVA incluido)</td>
      <td style="padding:12px 8px;font-size:18px;font-weight:bold;color:#0f1115;text-align:right;border-top:1px solid #0f1115;font-family:Consolas,Menlo,monospace;">${clp(pedido.total)}</td>
    </tr>
  </table>`;
}

function cajaTransferencia(): string {
  return `<div style="margin:18px 0;padding:16px;background:#fafafb;border:1px solid #e8eaee;">
    <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#0f1115;text-transform:uppercase;letter-spacing:0.06em;">Datos para transferencia</p>
    <p style="margin:3px 0;font-size:14px;color:#0f1115;">${TALLER.transferencia.razon}</p>
    <p style="margin:3px 0;font-size:14px;color:#0f1115;">RUT ${TALLER.transferencia.rut}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#5b6472;">Envía el comprobante por WhatsApp al ${TALLER.whatsapp} para confirmar tu pedido.</p>
  </div>`;
}

// ─── Emails públicos ──────────────────────────────────────────────

/** Confirmación al cliente + aviso al taller cuando se crea el pedido. */
export async function emailPedidoCreado(pedido: Pedido): Promise<void> {
  const esTransferencia = pedido.pago_metodo !== "mercadopago" && pedido.pago_metodo !== "webpay";
  const entrega =
    pedido.tipo_entrega === "despacho"
      ? "Despacho a domicilio (miércoles y viernes)"
      : `Retiro en el taller — ${TALLER.direccion}`;

  const cuerpoCliente = `
    <p style="font-size:14px;color:#0f1115;margin:0 0 6px;">Hola ${pedido.cliente_nombre},</p>
    <p style="font-size:14px;color:#5b6472;margin:0 0 6px;">Recibimos tu pedido <strong style="color:#0f1115;">#${pedido.numero_pedido}</strong>. Este es el resumen:</p>
    ${tablaItems(pedido)}
    <p style="font-size:13px;color:#5b6472;margin:0;">Entrega: <strong style="color:#0f1115;">${entrega}</strong></p>
    ${esTransferencia ? cajaTransferencia() : `<p style="font-size:13px;color:#5b6472;margin:12px 0 0;">Cuando se confirme el pago empezamos a producir y te avisamos en cada paso.</p>`}`;

  await enviar(
    pedido.cliente_email,
    `Recibimos tu pedido #${pedido.numero_pedido} — PrintUp`,
    layout(`Pedido #${pedido.numero_pedido} recibido`, cuerpoCliente),
  );

  // Aviso interno al taller
  let notifyTo = process.env.NOTIFY_TO || "";
  const notifyCfg = await configuracionRepo.getMany(["notification_email", "notify_to"]);
  if (notifyCfg["notification_email"]) notifyTo = notifyCfg["notification_email"];
  else if (notifyCfg["notify_to"]) notifyTo = notifyCfg["notify_to"];
  if (notifyTo) {
    const cuerpoAdmin = `
      <p style="font-size:14px;color:#0f1115;margin:0 0 6px;"><strong>${pedido.cliente_nombre}</strong> (${pedido.cliente_email}${pedido.cliente_telefono ? ` · ${pedido.cliente_telefono}` : ""})</p>
      <p style="font-size:13px;color:#5b6472;margin:0;">${entrega} · Pago: ${pedido.pago_metodo}</p>
      ${tablaItems(pedido)}`;
    await enviar(
      notifyTo,
      `Nuevo pedido #${pedido.numero_pedido} de ${pedido.cliente_nombre} — ${clp(pedido.total)}`,
      layout(`Nuevo pedido #${pedido.numero_pedido}`, cuerpoAdmin),
    );
  }
}

/** Pago acreditado (Webpay o MercadoPago). */
export async function emailPagoConfirmado(pedido: Pedido): Promise<void> {
  const cuerpo = `
    <p style="font-size:14px;color:#0f1115;margin:0 0 6px;">Hola ${pedido.cliente_nombre},</p>
    <p style="font-size:14px;color:#5b6472;margin:0 0 6px;">Tu pago del pedido <strong style="color:#0f1115;">#${pedido.numero_pedido}</strong> quedó confirmado.</p>
    <p style="font-size:22px;color:#0f1115;font-weight:bold;margin:14px 0;font-family:Consolas,Menlo,monospace;">${clp(pedido.total)}</p>
    <p style="font-size:14px;color:#5b6472;margin:0;">Tu trabajo entra a producción. Te avisamos cuando esté ${pedido.tipo_entrega === "despacho" ? "despachado" : "listo para retiro"}.</p>`;
  await enviar(
    pedido.cliente_email,
    `Pago confirmado — pedido #${pedido.numero_pedido}`,
    layout("Pago confirmado", cuerpo),
  );
}

/** Recordatorio de carrito abandonado con link de recuperación. */
export async function emailCarritoAbandonado(input: {
  email: string;
  items: { nombre?: string; cantidad?: number; precio?: number }[];
  total: number;
  linkRecuperacion: string;
}): Promise<boolean> {
  const lista = input.items
    .slice(0, 4)
    .map(
      (i) =>
        `<li style="font-size:14px;color:#0f1115;margin:4px 0;">${i.nombre || "Producto"}${
          i.cantidad && i.cantidad > 1 ? ` × ${i.cantidad}` : ""
        }</li>`,
    )
    .join("");
  const extra = input.items.length > 4 ? `<li style="font-size:13px;color:#5b6472;">…y ${input.items.length - 4} más</li>` : "";

  const cuerpo = `
    <p style="font-size:14px;color:#0f1115;margin:0 0 6px;">Hola,</p>
    <p style="font-size:14px;color:#5b6472;margin:0 0 12px;">Dejaste tu impresión a medio camino. Tu carrito sigue guardado, listo para retomar donde quedaste:</p>
    <ul style="margin:0 0 14px;padding-left:18px;">${lista}${extra}</ul>
    <p style="font-size:18px;color:#0f1115;font-weight:bold;margin:0 0 18px;font-family:Consolas,Menlo,monospace;">Total: ${clp(input.total)} <span style="font-size:12px;font-weight:normal;color:#5b6472;">IVA incluido</span></p>
    <a href="${input.linkRecuperacion}" style="display:inline-block;background:#0f1115;color:#ffffff;text-decoration:none;padding:12px 22px;font-size:14px;font-weight:bold;">Retomar mi compra</a>
    <p style="font-size:12px;color:#8b94a3;margin:16px 0 0;">¿Dudas con medidas o archivos? Te respondemos rápido por WhatsApp.</p>`;

  return enviar(
    input.email,
    "Tu impresión quedó esperando — PrintUp",
    layout("Tu carrito sigue guardado", cuerpo),
  );
}

/** Cambio de estado del pedido (con texto correcto según tipo de entrega). */
export async function emailEstadoPedido(pedido: Pedido, estado: string): Promise<void> {
  const esRetiro = pedido.tipo_entrega !== "despacho";
  const textos: Record<string, { asunto: string; mensaje: string }> = {
    confirmado: {
      asunto: `Tu pedido #${pedido.numero_pedido} está confirmado`,
      mensaje: "Tu pedido está confirmado y entra a la cola de producción.",
    },
    preparando: {
      asunto: `Tu pedido #${pedido.numero_pedido} está en producción`,
      mensaje: "Estamos imprimiendo tu trabajo. Te avisamos apenas esté listo.",
    },
    enviado: esRetiro
      ? {
          asunto: `Tu pedido #${pedido.numero_pedido} está listo para retiro`,
          mensaje: `Tu pedido está listo. Puedes retirarlo en ${TALLER.direccion} — Lun a Vie 9:00–18:00, Sáb 10:00–14:00.`,
        }
      : {
          asunto: `Tu pedido #${pedido.numero_pedido} va en camino`,
          mensaje: "Tu pedido fue despachado y va en camino.",
        },
    entregado: {
      asunto: `Tu pedido #${pedido.numero_pedido} fue entregado`,
      mensaje: "Tu pedido fue entregado. ¡Gracias por imprimir con PrintUp!",
    },
  };

  const texto = textos[estado];
  if (!texto) return;

  // Entregado → pedir la reseña con link directo a la ficha del producto.
  let ctaReview = "";
  if (estado === "entregado") {
    const items = (pedido.items as { slug?: string }[]) || [];
    const slug = items.find((i) => i.slug)?.slug;
    const appUrl = publicOrigin();
    const link = slug ? `${appUrl}/r/${slug}#opiniones` : `${appUrl}/productos`;
    ctaReview = `
    <p style="font-size:14px;color:#5b6472;margin:18px 0 10px;">¿Cómo quedó tu impresión? Tu opinión (con foto, ojalá) ayuda a otros clientes y a nuestro taller:</p>
    <a href="${link}" style="display:inline-block;background:#0f1115;color:#ffffff;text-decoration:none;padding:11px 20px;font-size:14px;font-weight:bold;">Dejar mi opinión</a>`;
  }

  const cuerpo = `
    <p style="font-size:14px;color:#0f1115;margin:0 0 6px;">Hola ${pedido.cliente_nombre},</p>
    <p style="font-size:15px;color:#0f1115;margin:0 0 14px;">${texto.mensaje}</p>
    <div style="padding:12px 16px;background:#fafafb;border:1px solid #e8eaee;">
      <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5b6472;">Estado actual</span><br>
      <strong style="font-size:15px;color:#0f1115;">${texto.asunto.includes("retiro") ? "Listo para retiro" : estado.charAt(0).toUpperCase() + estado.slice(1)}</strong>
    </div>${ctaReview}`;
  await enviar(pedido.cliente_email, texto.asunto, layout(`Pedido #${pedido.numero_pedido}`, cuerpo));
}
