import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { error: "Email es requerido" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Get campaign
  const { data: campana, error: campError } = await supabase
    .from("campanas")
    .select("*")
    .eq("id", id)
    .single();

  if (campError || !campana) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    );
  }

  // Get email HTML: from campaign or from template
  let html = campana.contenido_html;
  if (!html && campana.template_id) {
    const { data: template } = await supabase
      .from("email_templates")
      .select("contenido_html")
      .eq("id", campana.template_id)
      .single();

    if (template) {
      html = template.contenido_html;
    }
  }

  if (!html) {
    return NextResponse.json(
      { error: "La campana no tiene contenido HTML" },
      { status: 400 }
    );
  }

  // Replace variables with test values
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printup.cl";
  html = html
    .replace(/\{\{nombre\}\}/g, "Usuario de Prueba")
    .replace(/\{\{email\}\}/g, email)
    .replace(
      /\{\{link_desuscribir\}\}/g,
      `${baseUrl}/api/newsletter/desuscribir?email=${encodeURIComponent(email)}`
    );

  // Get Resend config
  let apiKey = process.env.RESEND_API_KEY || "";
  let fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  let fromName = process.env.FROM_NAME || "PrintUp Tienda";

  try {
    const { data: configs } = await supabase
      .from("configuracion")
      .select("*")
      .in("clave", ["resend_api_key", "from_email", "from_name"]);

    if (configs) {
      const keyConfig = configs.find(
        (c: { clave: string }) => c.clave === "resend_api_key"
      );
      const emailConfig = configs.find(
        (c: { clave: string }) => c.clave === "from_email"
      );
      const nameConfig = configs.find(
        (c: { clave: string }) => c.clave === "from_name"
      );
      if (keyConfig?.valor) apiKey = keyConfig.valor;
      if (emailConfig?.valor) fromEmail = emailConfig.valor;
      if (nameConfig?.valor) fromName = nameConfig.valor;
    }
  } catch {
    // Use env defaults
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key de Resend no configurada" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: `[TEST] ${campana.asunto}`,
      html,
    });

    return NextResponse.json({ success: true, email });
  } catch (e) {
    console.error("Error sending test email:", e);
    return NextResponse.json(
      { error: "Error al enviar email de prueba" },
      { status: 500 }
    );
  }
}
