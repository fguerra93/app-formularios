import { NextRequest, NextResponse } from "next/server";
import { mensajeriaRepo } from "@/server/repositories";
import { processBotMessage } from "@/lib/bot/engine";
import type { IncomingMessage } from "@/lib/bot/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/test/whatsapp-webhook
 *
 * Simula un mensaje entrante para probar el bot sin Meta real.
 *
 * Body:
 *   { from: "56912345678", message: "Hola", type?: "texto"|"imagen", canal?: "whatsapp"|"instagram" }
 *
 * Crea la conversacion en la tabla real `conversaciones` y procesa con el bot engine.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      from,
      message,
      type = "texto",
      canal = "whatsapp",
      name = "Test User",
    } = body;

    if (!from || !message) {
      return NextResponse.json(
        { error: "Se requiere 'from' (telefono) y 'message'" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Find or create conversation in the unified table
    const existingConv = await mensajeriaRepo.findByContacto(canal, from);

    let conversacionId: string;

    if (existingConv) {
      conversacionId = existingConv.id as string;
      await mensajeriaRepo.updateConversacion(conversacionId, {
        ultimo_mensaje: message,
        ultimo_mensaje_at: now,
        no_leidos: ((existingConv.no_leidos as number) || 0) + 1,
        estado: "abierta",
        updated_at: now,
      });
    } else {
      const newConv = await mensajeriaRepo.createConversacion({
        canal,
        contacto_id: from,
        contacto_nombre: name,
        contacto_telefono: canal === "whatsapp" ? from : "",
        contacto_username: "",
        estado: "abierta",
        etiquetas: [],
        ultimo_mensaje: message,
        ultimo_mensaje_at: now,
        no_leidos: 1,
        metadata: {},
        created_at: now,
        updated_at: now,
      });

      if (!newConv) {
        return NextResponse.json(
          { error: "Error al crear conversacion" },
          { status: 500 }
        );
      }
      conversacionId = newConv.id;
    }

    // Save incoming message
    await mensajeriaRepo.insertMensaje({
      conversacion_id: conversacionId,
      direccion: "entrante",
      tipo: type,
      contenido: message,
      media_url: null,
      media_type: null,
      meta_message_id: `test_${Date.now()}`,
      estado_envio: "entregado",
      respuesta_automatica: false,
      created_at: now,
    });

    // Build IncomingMessage for the bot engine
    const msg: IncomingMessage = {
      canal: canal as "whatsapp" | "instagram" | "facebook",
      senderId: from,
      senderName: name,
      senderPhone: canal === "whatsapp" ? from : "",
      senderUsername: "",
      messageId: `test_${Date.now()}`,
      tipo: type,
      contenido: message,
      mediaUrl: "",
      mediaType: "",
    };

    // Process with bot engine
    // Note: In test mode, sendMessageByChannel will fail silently
    // (no real Meta token), but the bot logic and DB writes still execute.
    await processBotMessage(conversacionId, msg);

    // Fetch bot responses from DB
    const responses = await mensajeriaRepo.listMensajesSalientes(conversacionId, 3);

    // Fetch conversation state
    const convState = await mensajeriaRepo.getConversacionContext(conversacionId);

    return NextResponse.json({
      success: true,
      conversacion_id: conversacionId,
      mensaje_entrante: message,
      respuestas_bot: responses.reverse(),
      bot_context: convState?.bot_context || {},
      cliente_id: convState?.cliente_id || null,
      estado_conversacion: convState?.estado || "abierta",
    });
  } catch (err) {
    console.error("Test webhook error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
