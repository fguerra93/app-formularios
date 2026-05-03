import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { asunto, contenido } = body;

  if (!asunto || !contenido) {
    return NextResponse.json({ error: "Asunto y contenido son requeridos" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Read resend_api_key from configuracion table
  let apiKey = process.env.RESEND_API_KEY || "";
  try {
    const { data: config } = await supabase
      .from("configuracion")
      .select("*")
      .eq("clave", "resend_api_key")
      .single();
    if (config) apiKey = config.valor;
  } catch {}

  if (!apiKey) {
    return NextResponse.json({ error: "API key de Resend no configurada" }, { status: 500 });
  }

  // Read from_email and from_name from config
  let fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  let fromName = process.env.FROM_NAME || "PrintUp Tienda";
  try {
    const { data: configs } = await supabase
      .from("configuracion")
      .select("*")
      .in("clave", ["from_email", "from_name"]);
    if (configs) {
      const emailConfig = configs.find((c: { clave: string }) => c.clave === "from_email");
      const nameConfig = configs.find((c: { clave: string }) => c.clave === "from_name");
      if (emailConfig?.valor) fromEmail = emailConfig.valor;
      if (nameConfig?.valor) fromName = nameConfig.valor;
    }
  } catch {}

  // Get all active subscribers
  const { data: suscriptores, error: subError } = await supabase
    .from("suscriptores")
    .select("email")
    .eq("activo", true);

  if (subError) {
    console.error("Error fetching suscriptores:", subError);
    return NextResponse.json({ error: "Error al obtener suscriptores" }, { status: 500 });
  }

  if (!suscriptores || suscriptores.length === 0) {
    return NextResponse.json({ enviados: 0, errores: 0 });
  }

  const resend = new Resend(apiKey);
  let enviados = 0;
  let errores = 0;

  for (const suscriptor of suscriptores) {
    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [suscriptor.email],
        subject: asunto,
        html: contenido,
      });
      enviados++;
    } catch (e) {
      console.error(`Error sending to ${suscriptor.email}:`, e);
      errores++;
    }
  }

  return NextResponse.json({ enviados, errores });
}
