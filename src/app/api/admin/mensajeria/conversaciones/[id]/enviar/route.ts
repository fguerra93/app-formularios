import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMessageByChannel } from "@/lib/meta";

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

  try {
    const body = await request.json();
    const { contenido, tipo = "texto", media_url } = body;

    if (!contenido && !media_url) {
      return NextResponse.json(
        { error: "Se requiere contenido o media_url" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify conversation exists
    const { data: conversacion, error: convError } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("id", id)
      .single();

    if (convError || !conversacion) {
      return NextResponse.json(
        { error: "Conversacion no encontrada" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Insert outgoing message
    const { data: mensaje, error: msgError } = await supabase
      .from("mensajes")
      .insert({
        conversacion_id: id,
        direccion: "saliente",
        tipo,
        contenido: contenido?.trim() || null,
        media_url: media_url || null,
        estado_envio: "pendiente",
        respuesta_automatica: false,
        created_at: now,
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error inserting message:", msgError);
      return NextResponse.json(
        { error: "Error al guardar mensaje" },
        { status: 500 }
      );
    }

    // Send via Meta API
    try {
      await sendMessageByChannel(
        conversacion.canal,
        conversacion.contacto_id,
        contenido?.trim() || ""
      );

      // Update message status to sent
      await supabase
        .from("mensajes")
        .update({ estado_envio: "enviado" })
        .eq("id", mensaje.id);
    } catch (sendError) {
      console.error("Error sending message via Meta:", sendError);

      // Update message status to failed
      await supabase
        .from("mensajes")
        .update({ estado_envio: "fallido" })
        .eq("id", mensaje.id);
    }

    // Update conversation
    const { error: updateError } = await supabase
      .from("conversaciones")
      .update({
        ultimo_mensaje: contenido?.trim() || `[${tipo}]`,
        ultimo_mensaje_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating conversacion:", updateError);
    }

    // Re-fetch updated message
    const { data: mensajeActualizado } = await supabase
      .from("mensajes")
      .select("*")
      .eq("id", mensaje.id)
      .single();

    return NextResponse.json({
      success: true,
      mensaje: mensajeActualizado || mensaje,
    });
  } catch (err) {
    console.error("Error enviando mensaje:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
