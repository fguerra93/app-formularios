import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

interface Destinatario {
  email: string;
  nombre: string;
}

async function getResendConfig(supabase: ReturnType<typeof getSupabaseAdmin>) {
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

  return { apiKey, fromEmail, fromName };
}

async function resolveDestinatarios(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  segmento: { tipo: string; emails?: string[] }
): Promise<Destinatario[]> {
  if (segmento.tipo === "todos") {
    const { data } = await supabase
      .from("suscriptores")
      .select("email, nombre")
      .eq("activo", true);
    return (data || []).map((s: { email: string; nombre?: string }) => ({
      email: s.email,
      nombre: s.nombre || "",
    }));
  }

  if (segmento.tipo === "clientes") {
    const { data } = await supabase
      .from("clientes")
      .select("email, nombre")
      .not("email", "is", null);
    return (data || [])
      .filter((c: { email?: string }) => c.email)
      .map((c: { email: string; nombre?: string }) => ({
        email: c.email,
        nombre: c.nombre || "",
      }));
  }

  if (segmento.tipo === "custom" && segmento.emails) {
    return segmento.emails.map((email: string) => ({
      email,
      nombre: "",
    }));
  }

  return [];
}

function replaceVariables(
  html: string,
  destinatario: Destinatario,
  envioId: string,
  baseUrl: string
): string {
  const unsubscribeUrl = `${baseUrl}/api/newsletter/desuscribir?email=${encodeURIComponent(destinatario.email)}`;
  const trackOpenUrl = `${baseUrl}/api/email/track/open/${envioId}`;

  let result = html
    .replace(/\{\{nombre\}\}/g, destinatario.nombre || "")
    .replace(/\{\{email\}\}/g, destinatario.email)
    .replace(/\{\{link_desuscribir\}\}/g, unsubscribeUrl);

  // Append tracking pixel before closing </body>
  const trackingPixel = `<img src="${trackOpenUrl}" width="1" height="1" style="display:none;" alt="" />`;
  if (result.includes("</body>")) {
    result = result.replace("</body>", `${trackingPixel}</body>`);
  } else {
    result += trackingPixel;
  }

  return result;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://printup.cl";

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

  if (campana.estado === "enviada" || campana.estado === "enviando") {
    return NextResponse.json(
      { error: "Esta campana ya fue enviada o esta en proceso de envio" },
      { status: 400 }
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

  // Get Resend config
  const { apiKey, fromEmail, fromName } = await getResendConfig(supabase);

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key de Resend no configurada" },
      { status: 500 }
    );
  }

  // Resolve recipients
  const segmento = campana.segmento || { tipo: "todos" };
  const destinatarios = await resolveDestinatarios(supabase, segmento);

  if (destinatarios.length === 0) {
    return NextResponse.json(
      { error: "No se encontraron destinatarios para el segmento seleccionado" },
      { status: 400 }
    );
  }

  // Mark campaign as sending
  await supabase
    .from("campanas")
    .update({
      estado: "enviando",
      total_destinatarios: destinatarios.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Create envio records for each recipient
  const envioRecords = destinatarios.map((d) => ({
    campana_id: id,
    email: d.email,
    nombre: d.nombre,
    estado: "pendiente",
  }));

  const { data: envios, error: envioError } = await supabase
    .from("campana_envios")
    .insert(envioRecords)
    .select("id, email, nombre");

  if (envioError || !envios) {
    console.error("Error creating envio records:", envioError);
    await supabase
      .from("campanas")
      .update({ estado: "borrador", updated_at: new Date().toISOString() })
      .eq("id", id);
    return NextResponse.json(
      { error: "Error al crear registros de envio" },
      { status: 500 }
    );
  }

  // Send emails in batches of 10
  const resend = new Resend(apiKey);
  let totalEnviados = 0;
  let totalErrores = 0;
  const batchSize = 10;

  for (let i = 0; i < envios.length; i += batchSize) {
    const batch = envios.slice(i, i + batchSize);

    const sendPromises = batch.map(async (envio) => {
      const destinatario: Destinatario = {
        email: envio.email,
        nombre: envio.nombre || "",
      };
      const personalizedHtml = replaceVariables(
        html,
        destinatario,
        envio.id,
        baseUrl
      );

      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [envio.email],
          subject: campana.asunto,
          html: personalizedHtml,
        });

        await supabase
          .from("campana_envios")
          .update({ estado: "enviado" })
          .eq("id", envio.id);

        totalEnviados++;
      } catch (e) {
        const errorMsg =
          e instanceof Error ? e.message : "Error desconocido";
        console.error(`Error sending to ${envio.email}:`, e);

        await supabase
          .from("campana_envios")
          .update({ estado: "error", error_msg: errorMsg })
          .eq("id", envio.id);

        totalErrores++;
      }
    });

    await Promise.all(sendPromises);
  }

  // Update campaign with final stats
  await supabase
    .from("campanas")
    .update({
      estado: "enviada",
      enviada_at: new Date().toISOString(),
      total_enviados: totalEnviados,
      total_errores: totalErrores,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({
    success: true,
    total_destinatarios: destinatarios.length,
    total_enviados: totalEnviados,
    total_errores: totalErrores,
  });
}
