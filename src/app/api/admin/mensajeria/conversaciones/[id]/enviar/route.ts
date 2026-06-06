import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { mensajeriaRepo } from "@/server/repositories";
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

    // Verify conversation exists
    const conversacion = await mensajeriaRepo.findConversacion(id);

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
      mensaje = await mensajeriaRepo.insertMensajeReturning({
        conversacion_id: id,
        direccion: "saliente",
        tipo,
        contenido: contenido?.trim() || null,
        media_url: media_url || null,
        estado_envio: "pendiente",
        respuesta_automatica: false,
        created_at: now,
      });
    } catch (e) {
      console.error("Error inserting message:", e);
      return NextResponse.json(
        { error: "Error al guardar mensaje" },
        { status: 500 }
      );
    }

    // Send via Meta API
    try {
      await sendMessageByChannel(
        conversacion.canal as string,
        conversacion.contacto_id as string,
        contenido?.trim() || ""
      );

      // Update message status to sent
      await mensajeriaRepo.updateMensaje(mensaje.id as string, {
        estado_envio: "enviado",
      });
    } catch (sendError) {
      console.error("Error sending message via Meta:", sendError);

      // Update message status to failed
      await mensajeriaRepo.updateMensaje(mensaje.id as string, {
        estado_envio: "fallido",
      });
    }

    // Update conversation
    try {
      await mensajeriaRepo.updateConversacion(id, {
        ultimo_mensaje: contenido?.trim() || `[${tipo}]`,
        ultimo_mensaje_at: now,
        updated_at: now,
      });
    } catch (e) {
      console.error("Error updating conversacion:", e);
    }

    // Re-fetch updated message
    const mensajeActualizado = await mensajeriaRepo.findMensajeById(
      mensaje.id as string
    );

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
