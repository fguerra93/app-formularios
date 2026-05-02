import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.estado) updateData.estado = body.estado;
  if (body.pago_estado) updateData.pago_estado = body.pago_estado;
  if (body.notas !== undefined) updateData.notas = body.notas;

  const { data, error } = await supabase
    .from("pedidos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating pedido:", error);
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }

  // Send email notification on status change
  if (body.estado && (body.estado === "confirmado" || body.estado === "enviado" || body.estado === "entregado")) {
    try {
      await sendStatusEmail(supabase, data, body.estado);
    } catch (e) {
      console.error("Error sending status email:", e);
    }
  }

  return NextResponse.json(data);
}

async function sendStatusEmail(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  pedido: Record<string, unknown>,
  estado: string
) {
  let apiKey = process.env.RESEND_API_KEY || "";
  try {
    const { data: config } = await supabase
      .from("configuracion")
      .select("*")
      .eq("clave", "resend_api_key")
      .single();
    if (config) apiKey = config.valor;
  } catch {}

  if (!apiKey) return;

  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.FROM_NAME || "PrintUp Tienda";
  const resend = new Resend(apiKey);

  const estadoTextos: Record<string, { asunto: string; mensaje: string }> = {
    confirmado: {
      asunto: `Tu pedido #${pedido.numero_pedido} ha sido confirmado`,
      mensaje: "Tu pedido ha sido confirmado y estamos preparandolo.",
    },
    enviado: {
      asunto: `Tu pedido #${pedido.numero_pedido} esta en camino`,
      mensaje: "Tu pedido ha sido despachado y va en camino. Pronto lo recibiras.",
    },
    entregado: {
      asunto: `Tu pedido #${pedido.numero_pedido} fue entregado`,
      mensaje: "Tu pedido fue entregado. Gracias por tu compra en PrintUp!",
    },
  };

  const texto = estadoTextos[estado];
  if (!texto) return;

  await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [pedido.cliente_email as string],
    subject: texto.asunto,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:linear-gradient(135deg,#1B2A6B,#00B4D8);padding:24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Pedido #${pedido.numero_pedido}</h1>
  </div>
  <div style="padding:24px;">
    <p>Hola ${pedido.cliente_nombre},</p>
    <p style="font-size:16px;">${texto.mensaje}</p>
    <div style="margin:20px 0;padding:16px;background:#F0F7FF;border-radius:8px;">
      <p style="margin:0;color:#1B2A6B;font-weight:bold;">Estado: ${estado.charAt(0).toUpperCase() + estado.slice(1)}</p>
    </div>
    <p style="color:#64748B;font-size:14px;">Si tienes dudas, contactanos por WhatsApp al +56 9 66126645 o a contacto@printup.cl</p>
  </div>
  <div style="padding:16px 24px;background:#f8f8f8;text-align:center;font-size:12px;color:#64748B;">
    PrintUp - Tu impresion, nuestra huella
  </div>
</div>
</body></html>`,
  });
}
