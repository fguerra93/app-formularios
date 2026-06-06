import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { whatsappRepo } from "@/server/repositories";

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

    // Verify conversation exists
    const conversacion = await whatsappRepo.findConversacionBasica(id);

    if (!conversacion) {
      return NextResponse.json(
        { error: "Conversacion no encontrada" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Insert outgoing message
    let mensaje;
    try {
      mensaje = await whatsappRepo.insertMensaje({
        conversacion_id: id,
        direccion: "saliente",
        contenido: contenido.trim(),
        procesado_por: "humano",
        created_at: now,
      });
    } catch (e) {
      console.error("Error inserting message:", e);
      return NextResponse.json(
        { error: "Error al enviar mensaje" },
        { status: 500 }
      );
    }

    // Update conversation's ultimo_mensaje_at
    try {
      await whatsappRepo.updateConversacion(id, {
        ultimo_mensaje_at: now,
        estado: "activa",
      });
    } catch (e) {
      console.error("Error updating conversacion:", e);
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
