import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getMetaConfig,
  verifyWebhookSignature,
  sendMessageByChannel,
} from "@/lib/meta";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types for parsed incoming messages
// ---------------------------------------------------------------------------

interface ParsedMessage {
  canal: "whatsapp" | "instagram" | "facebook";
  senderId: string;
  senderName: string;
  senderPhone: string;
  senderUsername: string;
  messageId: string;
  tipo: "texto" | "imagen" | "audio" | "video" | "documento" | "sticker" | "ubicacion" | "template";
  contenido: string;
  mediaUrl: string;
  mediaType: string;
}

// ---------------------------------------------------------------------------
// GET – Webhook verification (Meta sends hub.mode, hub.verify_token, hub.challenge)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return NextResponse.json(
      { error: "Missing verification parameters" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: config } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "meta_webhook_verify_token")
      .single();

    const verifyToken = config?.valor || "";

    if (token === verifyToken) {
      // Meta expects the challenge echoed back as plain text
      return new Response(challenge, { status: 200 });
    }

    return NextResponse.json(
      { error: "Token de verificacion invalido" },
      { status: 403 }
    );
  } catch (err) {
    console.error("Webhook verification error:", err);
    return NextResponse.json(
      { error: "Error en verificacion" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST – Receive webhook events from WhatsApp, Instagram, Facebook Messenger
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Always return 200 quickly – Meta requires fast acknowledgement
  try {
    const rawBody = await request.text();

    // Verify signature
    const signature = request.headers.get("x-hub-signature-256") || "";
    const metaConfig = await getMetaConfig();

    if (metaConfig.appSecret && signature) {
      const valid = verifyWebhookSignature(rawBody, signature, metaConfig.appSecret);
      if (!valid) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Identify channel from the `object` field
    const objectField: string = payload.object || "";
    let canal: "whatsapp" | "instagram" | "facebook";

    if (objectField === "whatsapp_business_account") {
      canal = "whatsapp";
    } else if (objectField.includes("instagram") || objectField === "instagram") {
      canal = "instagram";
    } else if (objectField === "page") {
      canal = "facebook";
    } else {
      // Unknown object type – acknowledge but skip processing
      console.warn("Unknown webhook object type:", objectField);
      return NextResponse.json({ ok: true });
    }

    // Parse messages from entries
    const messages = parseMessages(payload, canal);

    if (messages.length === 0) {
      // Could be a status update (delivered/read) – acknowledge
      return NextResponse.json({ ok: true });
    }

    // Process each message
    const supabase = getSupabaseAdmin();

    for (const msg of messages) {
      try {
        await processIncomingMessage(supabase, msg, metaConfig.pageAccessToken);
      } catch (err) {
        console.error("Error processing message:", err);
        // Continue with next message – don't fail the whole webhook
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook POST error:", err);
    // Still return 200 so Meta doesn't retry
    return NextResponse.json({ ok: true });
  }
}

// ---------------------------------------------------------------------------
// Payload parsing per channel
// ---------------------------------------------------------------------------

function parseMessages(
  payload: Record<string, unknown>,
  canal: "whatsapp" | "instagram" | "facebook"
): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const entries = (payload.entry as Array<Record<string, unknown>>) || [];

  for (const entry of entries) {
    if (canal === "whatsapp") {
      const changes = (entry.changes as Array<Record<string, unknown>>) || [];
      for (const change of changes) {
        const value = change.value as Record<string, unknown> | undefined;
        if (!value) continue;

        const incomingMessages = (value.messages as Array<Record<string, unknown>>) || [];
        const contacts = (value.contacts as Array<Record<string, unknown>>) || [];

        for (const waMsg of incomingMessages) {
          const contact = contacts[0] as Record<string, unknown> | undefined;
          const profile = contact?.profile as Record<string, unknown> | undefined;

          const tipo = mapWhatsAppType(waMsg.type as string);
          const contenido = extractWhatsAppContent(waMsg);

          messages.push({
            canal: "whatsapp",
            senderId: (waMsg.from as string) || "",
            senderName: (profile?.name as string) || "",
            senderPhone: (waMsg.from as string) || "",
            senderUsername: "",
            messageId: (waMsg.id as string) || "",
            tipo,
            contenido,
            mediaUrl: extractWhatsAppMediaUrl(waMsg),
            mediaType: (waMsg.type as string) || "",
          });
        }
      }
    } else {
      // Instagram and Facebook share the same messaging structure
      const messagingEvents = (entry.messaging as Array<Record<string, unknown>>) || [];
      for (const event of messagingEvents) {
        const sender = event.sender as Record<string, unknown> | undefined;
        const message = event.message as Record<string, unknown> | undefined;

        if (!sender || !message) continue;

        const attachments = (message.attachments as Array<Record<string, unknown>>) || [];
        let tipo: ParsedMessage["tipo"] = "texto";
        let mediaUrl = "";
        let mediaType = "";

        if (attachments.length > 0) {
          const att = attachments[0];
          const attType = (att.type as string) || "";
          tipo = mapAttachmentType(attType);
          const attPayload = att.payload as Record<string, unknown> | undefined;
          mediaUrl = (attPayload?.url as string) || "";
          mediaType = attType;
        }

        messages.push({
          canal,
          senderId: (sender.id as string) || "",
          senderName: "",
          senderPhone: "",
          senderUsername: "",
          messageId: (message.mid as string) || "",
          tipo,
          contenido: (message.text as string) || "",
          mediaUrl,
          mediaType,
        });
      }
    }
  }

  return messages;
}

function mapWhatsAppType(
  type: string
): ParsedMessage["tipo"] {
  switch (type) {
    case "text":
      return "texto";
    case "image":
      return "imagen";
    case "audio":
      return "audio";
    case "video":
      return "video";
    case "document":
      return "documento";
    case "sticker":
      return "sticker";
    case "location":
      return "ubicacion";
    default:
      return "texto";
  }
}

function mapAttachmentType(
  type: string
): ParsedMessage["tipo"] {
  switch (type) {
    case "image":
      return "imagen";
    case "audio":
      return "audio";
    case "video":
      return "video";
    case "file":
      return "documento";
    default:
      return "texto";
  }
}

function extractWhatsAppContent(
  waMsg: Record<string, unknown>
): string {
  const type = waMsg.type as string;

  if (type === "text") {
    const textObj = waMsg.text as Record<string, unknown> | undefined;
    return (textObj?.body as string) || "";
  }

  if (type === "location") {
    const loc = waMsg.location as Record<string, unknown> | undefined;
    const lat = loc?.latitude ?? "";
    const lng = loc?.longitude ?? "";
    const name = loc?.name || "";
    return `Ubicacion: ${lat}, ${lng}${name ? ` (${name})` : ""}`;
  }

  // For media types, return caption if available
  const mediaObj = waMsg[type] as Record<string, unknown> | undefined;
  return (mediaObj?.caption as string) || "";
}

function extractWhatsAppMediaUrl(
  waMsg: Record<string, unknown>
): string {
  const type = waMsg.type as string;
  if (["image", "audio", "video", "document", "sticker"].includes(type)) {
    const mediaObj = waMsg[type] as Record<string, unknown> | undefined;
    // WhatsApp sends a media ID; actual URL needs a separate API call.
    // We store the ID for now – can be fetched later with GET /{media-id}
    return (mediaObj?.id as string) || "";
  }
  return "";
}

// ---------------------------------------------------------------------------
// Process a single incoming message
// ---------------------------------------------------------------------------

async function processIncomingMessage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  msg: ParsedMessage,
  accessToken: string
) {
  const now = new Date().toISOString();

  // 1. Find or create conversation
  const { data: existingConv } = await supabase
    .from("conversaciones")
    .select("*")
    .eq("canal", msg.canal)
    .eq("contacto_id", msg.senderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let conversacionId: string;

  if (existingConv) {
    conversacionId = existingConv.id;

    // Update conversation
    await supabase
      .from("conversaciones")
      .update({
        ultimo_mensaje: msg.contenido || `[${msg.tipo}]`,
        ultimo_mensaje_at: now,
        no_leidos: (existingConv.no_leidos || 0) + 1,
        estado: "abierta",
        contacto_nombre: msg.senderName || existingConv.contacto_nombre,
        contacto_telefono: msg.senderPhone || existingConv.contacto_telefono,
        updated_at: now,
      })
      .eq("id", conversacionId);
  } else {
    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from("conversaciones")
      .insert({
        canal: msg.canal,
        contacto_id: msg.senderId,
        contacto_nombre: msg.senderName || msg.senderId,
        contacto_telefono: msg.senderPhone || "",
        contacto_username: msg.senderUsername || "",
        estado: "abierta",
        etiquetas: [],
        ultimo_mensaje: msg.contenido || `[${msg.tipo}]`,
        ultimo_mensaje_at: now,
        no_leidos: 1,
        metadata: {},
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (convError || !newConv) {
      console.error("Error creating conversacion:", convError);
      return;
    }

    conversacionId = newConv.id;
  }

  // 2. Save incoming message
  await supabase.from("mensajes").insert({
    conversacion_id: conversacionId,
    direccion: "entrante",
    tipo: msg.tipo,
    contenido: msg.contenido,
    media_url: msg.mediaUrl || null,
    media_type: msg.mediaType || null,
    meta_message_id: msg.messageId,
    estado_envio: "entregado",
    respuesta_automatica: false,
    created_at: now,
  });

  // 3. Check for auto-replies (only for text messages with content)
  if (msg.contenido) {
    await checkAndSendAutoReply(
      supabase,
      conversacionId,
      msg,
      accessToken
    );
  }
}

// ---------------------------------------------------------------------------
// Auto-reply logic
// ---------------------------------------------------------------------------

async function checkAndSendAutoReply(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  conversacionId: string,
  msg: ParsedMessage,
  accessToken: string
) {
  // Fetch active auto-replies for this channel
  const { data: reglas, error } = await supabase
    .from("respuestas_automaticas")
    .select("*")
    .eq("activo", true)
    .contains("canales", [msg.canal])
    .order("prioridad", { ascending: false });

  if (error || !reglas || reglas.length === 0) return;

  const msgLower = msg.contenido.toLowerCase();
  const now = new Date();

  for (const regla of reglas) {
    // Check time restrictions
    if (regla.horario_inicio && regla.horario_fin) {
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (currentTime < regla.horario_inicio || currentTime > regla.horario_fin) {
        continue;
      }
    }

    // Check keyword match (case-insensitive, any keyword contained in message)
    const keywords: string[] = regla.palabras_clave || [];
    const matched = keywords.some((kw: string) =>
      msgLower.includes(kw.toLowerCase())
    );

    if (!matched) continue;

    // We have a match – send the auto-reply
    const respuesta: string = regla.respuesta || "";
    if (!respuesta) continue;

    // Send via the appropriate channel API
    if (accessToken) {
      await sendMessageByChannel(msg.canal, msg.senderId, respuesta);
    }

    // Save outgoing message
    const replyNow = new Date().toISOString();
    await supabase.from("mensajes").insert({
      conversacion_id: conversacionId,
      direccion: "saliente",
      tipo: regla.tipo_respuesta || "texto",
      contenido: respuesta,
      media_url: regla.media_url || null,
      estado_envio: accessToken ? "enviado" : "pendiente",
      respuesta_automatica: true,
      created_at: replyNow,
    });

    // Update conversation with the auto-reply as last message
    await supabase
      .from("conversaciones")
      .update({
        ultimo_mensaje: respuesta,
        ultimo_mensaje_at: replyNow,
        updated_at: replyNow,
      })
      .eq("id", conversacionId);

    // Only send the first matching auto-reply (highest priority)
    break;
  }
}
