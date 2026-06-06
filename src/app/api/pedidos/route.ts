import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  pedidosRepo,
  configuracionRepo,
  domainEventsRepo,
  stockRepo,
  aprobacionesRepo,
} from "@/server/repositories";
import type { Pedido } from "@/server/domain";
import { calcularPedido } from "@/lib/checkout";
import { Resend } from "resend";

const itemSchema = z.object({
  producto_id: z.string().min(1),
  nombre: z.string().optional(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().nonnegative().optional(),
  variante: z.record(z.string(), z.string()).nullable().optional(),
});

const bodySchema = z.object({
  cliente_nombre: z.string().min(1),
  cliente_email: z.string().email(),
  cliente_telefono: z.string().nullable().optional(),
  cliente_rut: z.string().nullable().optional(),
  direccion_envio: z.record(z.string(), z.unknown()).nullable().optional(),
  tipo_entrega: z.enum(["retiro_tienda", "despacho"]).default("retiro_tienda"),
  items: z.array(itemSchema).min(1),
  pago_metodo: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  cliente_id: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos incompletos o invalidos. Revisa nombre, email e items." },
        { status: 400 }
      );
    }

    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      cliente_rut,
      direccion_envio,
      tipo_entrega,
      items,
      pago_metodo,
      notas,
      cliente_id,
    } = parsed.data;

    // Recalcular precios, stock y envio en el SERVIDOR. Nunca se confia
    // en subtotal/total/precio del navegador.
    const comuna = (direccion_envio as { comuna?: string } | null)?.comuna ?? null;
    const calculo = await calcularPedido({ items, tipo_entrega, comuna });

    if (calculo.faltantes.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos productos no tienen stock suficiente.",
          faltantes: calculo.faltantes,
        },
        { status: 409 }
      );
    }

    if (calculo.errores.length > 0) {
      return NextResponse.json(
        { error: calculo.errores.join(" ") },
        { status: 400 }
      );
    }

    const { items: itemsServidor, subtotal, costo_envio, total } = calculo;

    let pedido: Pedido;
    try {
      pedido = await pedidosRepo.create({
        cliente_nombre,
        cliente_email,
        cliente_telefono: cliente_telefono || null,
        cliente_rut: cliente_rut || null,
        direccion_envio: direccion_envio || null,
        tipo_entrega: tipo_entrega || "retiro_tienda",
        items: itemsServidor,
        subtotal,
        costo_envio,
        total,
        pago_metodo: pago_metodo || "transferencia",
        notas: notas || null,
        cliente_id: cliente_id || null,
      });
    } catch (e) {
      console.error("Error creating pedido:", e);
      return NextResponse.json(
        { error: "Error al crear el pedido" },
        { status: 500 }
      );
    }

    // Reserva de stock (Patrón 9) — best-effort: no rompe si la migración no
    // está aplicada. Solo mueve stock de productos con controla_stock = true.
    try {
      const itemsReserva = itemsServidor.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
      }));
      const reserva = await stockRepo.reservar(itemsReserva, pedido.id);
      if (!reserva.ok) {
        console.warn("Reserva con faltantes para pedido", pedido.id, reserva.faltantes);
      }
    } catch (e) {
      console.error("reservar_stock no disponible (no fatal):", e);
    }

    // Evento de dominio (Patrón 2): pedido creado.
    await domainEventsRepo.emit("pedido.creado", {
      pedido_id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      cliente_nombre,
      total,
    });

    // Cola de aprobación (Patrón 3): los pagos por transferencia los valida el
    // dueño a mano -> se crea una aprobación pendiente (no se cobra solo).
    const metodo = pago_metodo || "transferencia";
    if (metodo !== "mercadopago") {
      await aprobacionesRepo.crear({
        tipo: "validar_pago",
        titulo: `Validar pago pedido #${pedido.numero_pedido}`,
        descripcion: `${cliente_nombre} — $${total.toLocaleString("es-CL")} (${metodo})`,
        payload: { pedido_id: pedido.id, numero_pedido: pedido.numero_pedido },
        creada_por: "sistema",
      });
    }

    // Send notification email
    let apiKey = process.env.RESEND_API_KEY || "";
    const apiKeyCfg = await configuracionRepo.get("resend_api_key");
    if (apiKeyCfg) apiKey = apiKeyCfg;

    if (apiKey) {
      let notifyTo = process.env.NOTIFY_TO || "guerrafelipe93@gmail.com";
      const notifyCfg = await configuracionRepo.getMany(["notification_email", "notify_to"]);
      if (notifyCfg["notification_email"]) notifyTo = notifyCfg["notification_email"];
      else if (notifyCfg["notify_to"]) notifyTo = notifyCfg["notify_to"];

      const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
      const fromName = process.env.FROM_NAME || "PrintUp Tienda";

      const resend = new Resend(apiKey);

      const itemsHtml = itemsServidor
        .map(
          (item) =>
            `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.nombre}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.cantidad}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.precio_unitario.toLocaleString("es-CL")}</td></tr>`
        )
        .join("");

      // Email to admin
      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [notifyTo],
          subject: `Nuevo pedido #${pedido.numero_pedido} de ${cliente_nombre}`,
          html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:linear-gradient(135deg,#1B2A6B,#00B4D8);padding:24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Nuevo Pedido #${pedido.numero_pedido}</h1>
  </div>
  <div style="padding:24px;">
    <p><strong>Cliente:</strong> ${cliente_nombre} (${cliente_email})</p>
    <p><strong>Tipo entrega:</strong> ${tipo_entrega === "despacho" ? "Despacho a domicilio" : "Retiro en tienda"}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#f8f8f8;"><th style="padding:8px;text-align:left;">Producto</th><th style="padding:8px;text-align:center;">Cant.</th><th style="padding:8px;text-align:right;">Precio</th></tr>
      ${itemsHtml}
    </table>
    <p style="text-align:right;font-size:18px;font-weight:bold;color:#1B2A6B;">Total: $${total.toLocaleString("es-CL")}</p>
  </div>
</div>
</body></html>`,
        });
      } catch (e) {
        console.error("Error sending admin email:", e);
      }

      // Email confirmation to client
      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [cliente_email],
          subject: `Confirmacion de tu pedido #${pedido.numero_pedido} - PrintUp`,
          html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:linear-gradient(135deg,#1B2A6B,#00B4D8);padding:24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Pedido #${pedido.numero_pedido} Confirmado</h1>
  </div>
  <div style="padding:24px;">
    <p>Hola ${cliente_nombre},</p>
    <p>Hemos recibido tu pedido correctamente. Aqui tienes el resumen:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#f8f8f8;"><th style="padding:8px;text-align:left;">Producto</th><th style="padding:8px;text-align:center;">Cant.</th><th style="padding:8px;text-align:right;">Precio</th></tr>
      ${itemsHtml}
    </table>
    <p style="text-align:right;font-size:18px;font-weight:bold;color:#1B2A6B;">Total: $${total.toLocaleString("es-CL")}</p>
    <div style="margin:20px 0;padding:16px;background:#F0F7FF;border-radius:8px;">
      <p style="margin:0 0 8px;font-weight:bold;color:#1B2A6B;">Datos para transferencia:</p>
      <p style="margin:4px 0;font-size:14px;">Servicios Graficos Spa</p>
      <p style="margin:4px 0;font-size:14px;">RUT: 78.114.353-7</p>
      <p style="margin:4px 0;font-size:14px;">Enviar comprobante al WhatsApp: +56 9 66126645</p>
    </div>
    <p style="color:#64748B;font-size:14px;">Si tienes dudas, contactanos por WhatsApp al +56 9 66126645 o a contacto@printup.cl</p>
  </div>
  <div style="padding:16px 24px;background:#f8f8f8;text-align:center;font-size:12px;color:#64748B;">
    PrintUp - Tu impresion, nuestra huella
  </div>
</div>
</body></html>`,
        });
      } catch (e) {
        console.error("Error sending client email:", e);
      }
    }

    return NextResponse.json({ success: true, pedido });
  } catch (err) {
    console.error("Pedido error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
