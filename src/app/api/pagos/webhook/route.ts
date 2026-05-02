import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // Log webhook
    await supabase.from("pagos_log").insert({
      tipo: body.type || body.action || "unknown",
      payload: body,
    }).then(() => {});

    // Only handle payment notifications
    if (body.type !== "payment" && body.action !== "payment.updated") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // Get MercadoPago credentials
    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
    try {
      const { data: config } = await supabase
        .from("configuracion")
        .select("*")
        .eq("clave", "mercadopago_access_token")
        .single();
      if (config?.valor) accessToken = config.valor;
    } catch {}

    if (!accessToken) {
      return NextResponse.json({ error: "No MP config" }, { status: 400 });
    }

    // Fetch payment details from MercadoPago
    const client = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: paymentId });

    const pedidoId = payment.external_reference;
    if (!pedidoId) {
      return NextResponse.json({ ok: true });
    }

    // Update order based on payment status
    const updateData: Record<string, unknown> = {
      pago_referencia: String(paymentId),
      updated_at: new Date().toISOString(),
    };

    if (payment.status === "approved") {
      updateData.pago_estado = "pagado";
      updateData.estado = "confirmado";
    } else if (payment.status === "rejected") {
      updateData.pago_estado = "fallido";
    } else if (payment.status === "pending" || payment.status === "in_process") {
      updateData.pago_estado = "pendiente";
    }

    const { data: pedido } = await supabase
      .from("pedidos")
      .update(updateData)
      .eq("id", pedidoId)
      .select()
      .single();

    // Send payment confirmation email to client
    if (payment.status === "approved" && pedido) {
      try {
        let apiKey = process.env.RESEND_API_KEY || "";
        const { data: config } = await supabase
          .from("configuracion")
          .select("*")
          .eq("clave", "resend_api_key")
          .single();
        if (config?.valor) apiKey = config.valor;

        if (apiKey) {
          const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
          const fromName = process.env.FROM_NAME || "PrintUp Tienda";
          const resend = new Resend(apiKey);

          await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [pedido.cliente_email],
            subject: `Pago confirmado - Pedido #${pedido.numero_pedido}`,
            html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:linear-gradient(135deg,#1B2A6B,#00B4D8);padding:24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Pago Confirmado</h1>
  </div>
  <div style="padding:24px;">
    <p>Hola ${pedido.cliente_nombre},</p>
    <p>Tu pago para el pedido <strong>#${pedido.numero_pedido}</strong> ha sido confirmado exitosamente.</p>
    <p style="font-size:18px;font-weight:bold;color:#1B2A6B;">Total: $${pedido.total.toLocaleString("es-CL")}</p>
    <p>Estamos preparando tu pedido. Te avisaremos cuando este listo.</p>
    <p style="color:#64748B;font-size:14px;">Gracias por comprar en PrintUp!</p>
  </div>
  <div style="padding:16px 24px;background:#f8f8f8;text-align:center;font-size:12px;color:#64748B;">
    PrintUp - Tu impresion, nuestra huella
  </div>
</div>
</body></html>`,
          });
        }
      } catch (e) {
        console.error("Error sending payment email:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
