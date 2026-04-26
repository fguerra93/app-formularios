import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getNextcloudFileUrl } from "@/lib/nextcloud";
import type { ArchivoInfo } from "@/lib/types";

const MAX_FILES = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nombre: string | null = body.nombre || null;
    const email: string | null = body.email || null;
    const telefono: string | null = body.telefono || null;
    const material: string | null = body.material || null;
    const mensaje: string | null = body.mensaje || null;
    const archivos: ArchivoInfo[] = body.archivos || [];
    const folderName: string = body.folderName || "";

    if (!nombre || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    if (archivos.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximo ${MAX_FILES} archivos permitidos` },
        { status: 400 }
      );
    }

    if (!folderName) {
      return NextResponse.json(
        { error: "folderName es requerido" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Insert record into formularios table
    const { data: formulario, error: insertError } = await supabase
      .from("formularios")
      .insert({
        nombre,
        email,
        telefono,
        material,
        mensaje,
        archivos,
        estado: "nuevo",
        nextcloud_path: folderName,
        nextcloud_synced: false,
        email_enviado: false,
      })
      .select()
      .single();

    if (insertError || !formulario) {
      console.error("Error inserting formulario:", insertError);
      return NextResponse.json(
        { error: "Error al guardar el formulario" },
        { status: 500 }
      );
    }

    // Send notification email via Resend
    let apiKey = process.env.RESEND_API_KEY || "";
    try {
      const { data: config } = await supabase
        .from("configuracion")
        .select("*")
        .eq("clave", "resend_api_key")
        .single();
      if (config) apiKey = config.valor;
    } catch {}

    let notifyTo = process.env.NOTIFY_TO || "guerrafelipe93@gmail.com";
    try {
      const { data: notifyConfig } = await supabase
        .from("configuracion")
        .select("*")
        .eq("clave", "notification_email")
        .single();
      if (notifyConfig?.valor) notifyTo = notifyConfig.valor;
    } catch {}
    const fromName = process.env.FROM_NAME || "PrintUp Formulario";
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const nextcloudUrl = getNextcloudFileUrl(folderName);

    let emailSent = false;
    let emailError: string | null = null;

    if (apiKey) {
      const resend = new Resend(apiKey);

      const archivosHtml = archivos.length
        ? `<ul style="margin:0;padding-left:20px;">${archivos
            .map(
              (a) =>
                `<li style="margin-bottom:4px;"><a href="${a.url}" style="color:#1B2A6B;">${a.nombre}</a> (${(a.tamaño / 1024).toFixed(1)} KB - ${a.tipo})</li>`
            )
            .join("")}</ul>`
        : "<p style='color:#666;'>Sin archivos adjuntos</p>";

      const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#FFD700,#FF00FF,#00FFFF,#1B2A6B);padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">Nuevo Formulario Recibido</h1>
    </div>
    <div style="padding:30px;">
      <h2 style="color:#1B2A6B;margin-top:0;">Datos del Cliente</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#333;width:120px;">Nombre:</td><td style="padding:8px;border-bottom:1px solid #eee;">${nombre}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#333;">Email:</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#1B2A6B;">${email}</a></td></tr>
        ${telefono ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#333;">Teléfono:</td><td style="padding:8px;border-bottom:1px solid #eee;">${telefono}</td></tr>` : ""}
        ${material ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#333;">Material:</td><td style="padding:8px;border-bottom:1px solid #eee;">${material}</td></tr>` : ""}
      </table>
      ${mensaje ? `<h3 style="color:#1B2A6B;">Mensaje</h3><p style="background:#f9f9f9;padding:15px;border-radius:8px;color:#333;">${mensaje}</p>` : ""}
      <h3 style="color:#1B2A6B;">Archivos Adjuntos (${archivos.length})</h3>
      ${archivosHtml}
      <div style="margin-top:30px;text-align:center;">
        <a href="${appUrl}/admin/formularios/${formulario.id}" style="display:inline-block;background:#1B2A6B;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-right:10px;">Ver en Panel Admin</a>
        <a href="${nextcloudUrl}" style="display:inline-block;background:#0082c9;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">Ver en Nextcloud</a>
      </div>
    </div>
    <div style="background:#f4f4f4;padding:15px;text-align:center;color:#999;font-size:12px;">
      <p style="margin:0;">PrintUp - Sistema de Formularios</p>
    </div>
  </div>
</body>
</html>`;

      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [notifyTo],
          subject: `Nuevo formulario de ${nombre}`,
          html: htmlContent,
        });
        emailSent = true;
      } catch (err) {
        emailError =
          err instanceof Error ? err.message : "Error al enviar email";
        console.error("Error sending email:", err);
      }
    } else {
      emailError = "API key de Resend no configurada";
    }

    // Update email_enviado status
    if (emailSent) {
      await supabase
        .from("formularios")
        .update({ email_enviado: true })
        .eq("id", formulario.id);
    }

    // Log email to email_log table
    await supabase.from("email_log").insert({
      formulario_id: formulario.id,
      destinatario: notifyTo,
      asunto: `Nuevo formulario de ${nombre}`,
      estado: emailSent ? "enviado" : "error",
      error: emailError,
      proveedor: "resend",
    });

    return NextResponse.json({ success: true, id: formulario.id });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
