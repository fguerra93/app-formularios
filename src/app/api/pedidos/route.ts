import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      cliente_rut,
      direccion_envio,
      tipo_entrega,
      items,
      subtotal,
      costo_envio,
      total,
      pago_metodo,
      notas,
    } = body;

    if (!cliente_nombre || !cliente_email || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos. Se requiere nombre, email y al menos un item." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        cliente_nombre,
        cliente_email,
        cliente_telefono: cliente_telefono || null,
        cliente_rut: cliente_rut || null,
        direccion_envio: direccion_envio || null,
        tipo_entrega: tipo_entrega || "retiro_tienda",
        items,
        subtotal,
        costo_envio: costo_envio || 0,
        total,
        estado: "pendiente",
        pago_estado: "pendiente",
        pago_metodo: pago_metodo || "transferencia",
        notas: notas || null,
      })
      .select()
      .single();

    if (error || !pedido) {
      console.error("Error creating pedido:", error);
      return NextResponse.json(
        { error: "Error al crear el pedido" },
        { status: 500 }
      );
    }

    // Send notification email
    let apiKey = process.env.RESEND_API_KEY || "";
    try {
      const { data: config } = await supabase
        .from("configuracion")
        .select("*")
        .eq("clave", "resend_api_key")
        .single();
      if (config) apiKey = config.valor;
    } catch {}

    if (apiKey) {
      let notifyTo = process.env.NOTIFY_TO || "guerrafelipe93@gmail.com";
      try {
        const { data: configs } = await supabase
          .from("configuracion")
          .select("*")
          .in("clave", ["notification_email", "notify_to"]);
        if (configs && configs.length > 0) {
          const preferred = configs.find((c: { clave: string }) => c.clave === "notification_email")
            || configs.find((c: { clave: string }) => c.clave === "notify_to");
          if (preferred?.valor) notifyTo = preferred.valor;
        }
      } catch {}

      const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
      const fromName = process.env.FROM_NAME || "PrintUp Tienda";

      const resend = new Resend(apiKey);

      const itemsHtml = items
        .map(
          (item: { nombre: string; cantidad: number; precio_unitario: number }) =>
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
