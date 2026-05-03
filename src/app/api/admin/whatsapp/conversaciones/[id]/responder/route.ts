import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

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
    const { contenido } = body;

    if (!contenido || typeof contenido !== "string" || !contenido.trim()) {
      return NextResponse.json(
        { error: "Se requiere el contenido del mensaje" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify conversation exists
    const { data: conversacion, error: convError } = await supabase
      .from("conversaciones_whatsapp")
      .select("id, telefono")
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
      .from("mensajes_whatsapp")
      .insert({
        conversacion_id: id,
        direccion: "saliente",
        contenido: contenido.trim(),
        procesado_por: "humano",
        created_at: now,
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error inserting message:", msgError);
      return NextResponse.json(
        { error: "Error al enviar mensaje" },
        { status: 500 }
      );
    }

    // Update conversation's ultimo_mensaje_at
    const { error: updateError } = await supabase
      .from("conversaciones_whatsapp")
      .update({
        ultimo_mensaje_at: now,
        estado: "activa",
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating conversacion:", updateError);
    }

    // In production, this is where you would call the Meta WhatsApp Business API
    // to actually send the message to the user's phone

    return NextResponse.json({
      success: true,
      mensaje,
    });
  } catch (err) {
    console.error("Responder WhatsApp error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
