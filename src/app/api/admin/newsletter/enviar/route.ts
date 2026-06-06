import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { configuracionRepo, newsletterRepo } from "@/server/repositories";
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

  // Read config (resend_api_key, from_email, from_name) from configuracion table
  const config = await configuracionRepo.getMany([
    "resend_api_key",
    "from_email",
    "from_name",
  ]);

  const apiKey = config.resend_api_key || process.env.RESEND_API_KEY || "";
  const fromEmail = config.from_email || process.env.FROM_EMAIL || "onboarding@resend.dev";
  const fromName = config.from_name || process.env.FROM_NAME || "PrintUp Tienda";

  if (!apiKey) {
    return NextResponse.json({ error: "API key de Resend no configurada" }, { status: 500 });
  }

  // Get all active subscribers
  let suscriptores: { email: string }[];
  try {
    suscriptores = await newsletterRepo.listActivosEmails();
  } catch (e) {
    console.error("Error fetching suscriptores:", e);
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
