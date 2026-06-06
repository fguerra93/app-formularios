import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { campanasRepo, configuracionRepo, templatesRepo } from "@/server/repositories";
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

  // Get campaign
  const campana = await campanasRepo.findCampana(id);

  if (!campana) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    );
  }

  // Get email HTML: from campaign or from template
  let html = campana.contenido_html as string | null;
  if (!html && campana.template_id) {
    const template = await templatesRepo.findContenidoHtml(
      campana.template_id as string
    );
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

  // Get Resend config (config overrides env)
  const config = await configuracionRepo.getMany([
    "resend_api_key",
    "from_email",
    "from_name",
  ]);
  const apiKey = config.resend_api_key || process.env.RESEND_API_KEY || "";
  const fromEmail =
    config.from_email || process.env.FROM_EMAIL || "onboarding@resend.dev";
  const fromName = config.from_name || process.env.FROM_NAME || "PrintUp Tienda";

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
      subject: `[TEST] ${campana.asunto as string}`,
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
