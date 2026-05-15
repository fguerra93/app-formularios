/**
 * AWS Lambda - WhatsApp Bot Handler
 *
 * Receives webhooks from Meta WhatsApp Business Cloud API,
 * processes messages through predefined flows or AI (Claude via Bedrock),
 * and responds automatically.
 *
 * Deploy: AWS SAM or Lambda function URL
 * Runtime: Node.js 20
 *
 * Environment variables:
 * - META_WHATSAPP_TOKEN: Permanent access token from Meta
 * - META_WHATSAPP_PHONE_ID: WhatsApp phone number ID
 * - META_WHATSAPP_VERIFY_TOKEN: Webhook verification token (you define it)
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_KEY: Supabase service role key
 * - AWS_REGION: AWS region for Bedrock (us-east-1)
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// ============================================
// TYPES
// ============================================

interface WebhookEntry {
  changes: Array<{
    value: {
      messages?: Array<{
        from: string;
        type: string;
        text?: { body: string };
        interactive?: { type: string; button_reply?: { id: string }; list_reply?: { id: string } };
        image?: { id: string; mime_type: string };
        document?: { id: string; mime_type: string; filename: string };
      }>;
      statuses?: Array<unknown>;
    };
  }>;
}

interface FlowContext {
  flow?: string;
  step?: number;
  data?: Record<string, unknown>;
}

// ============================================
// MAIN HANDLER
// ============================================

export async function handler(event: {
  requestContext: { http: { method: string } };
  queryStringParameters?: Record<string, string>;
  body?: string;
  headers: Record<string, string>;
}) {
  const method = event.requestContext.http.method;

  // GET: Webhook verification
  if (method === "GET") {
    const params = event.queryStringParameters || {};
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    if (mode === "subscribe" && token === process.env.META_WHATSAPP_VERIFY_TOKEN) {
      return { statusCode: 200, body: challenge };
    }
    return { statusCode: 403, body: "Forbidden" };
  }

  // POST: Process incoming message
  if (method === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const entries: WebhookEntry[] = body.entry || [];

      for (const entry of entries) {
        for (const change of entry.changes) {
          const messages = change.value.messages || [];
          for (const msg of messages) {
            await processMessage(msg.from, msg);
          }
        }
      }

      return { statusCode: 200, body: "OK" };
    } catch (error) {
      console.error("Webhook error:", error);
      return { statusCode: 200, body: "OK" }; // Always return 200 to Meta
    }
  }

  return { statusCode: 405, body: "Method not allowed" };
}

// ============================================
// MESSAGE PROCESSING
// ============================================

async function processMessage(
  phone: string,
  msg: NonNullable<WebhookEntry["changes"][0]["value"]["messages"]>[0]
) {
  // Get or create conversation
  let { data: conv } = await supabase
    .from("conversaciones_whatsapp")
    .select("*")
    .eq("whatsapp_phone", phone)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conv) {
    const { data: newConv } = await supabase
      .from("conversaciones_whatsapp")
      .insert({ whatsapp_phone: phone, estado: "activa" })
      .select()
      .single();
    conv = newConv;
  }

  if (!conv) return;

  // Save incoming message
  const messageText = msg.text?.body || msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || "[media]";
  await supabase.from("mensajes_whatsapp").insert({
    conversacion_id: conv.id,
    direccion: "entrante",
    tipo: msg.type === "text" ? "texto" : msg.type,
    contenido: messageText,
    metadata: msg,
  });

  // Update conversation timestamp
  await supabase
    .from("conversaciones_whatsapp")
    .update({ ultimo_mensaje_at: new Date().toISOString() })
    .eq("id", conv.id);

  // Detect intent and respond
  const context: FlowContext = (conv.contexto as FlowContext) || {};
  const text = messageText.toLowerCase().trim();

  // Check for active flow first
  if (context.flow) {
    await continueFlow(conv.id, phone, context, text);
    return;
  }

  // Intent detection
  const intent = detectIntent(text);
  let response: string;
  let procesadoPor: "bot" | "ia" = "bot";

  switch (intent) {
    case "saludo":
      response = await handleSaludo(phone);
      break;
    case "cotizar":
      await startCotizacionFlow(conv.id, phone);
      return;
    case "estado_pedido":
      await startEstadoPedidoFlow(conv.id, phone);
      return;
    case "catalogo":
      response = await handleCatalogo();
      break;
    case "archivo":
      response = "Puedes subir tu archivo directamente en nuestro formulario web: printup.cl/contacto\n\nAhi puedes adjuntar archivos de hasta 50MB.";
      break;
    case "horario":
      response = handleHorario();
      break;
    case "humano":
      response = "Entendido, te conecto con un ejecutivo de PrintUp. Responderemos a la brevedad.";
      await supabase
        .from("conversaciones_whatsapp")
        .update({ estado: "escalada" })
        .eq("id", conv.id);
      break;
    default:
      // Free-form question -> AI response
      response = await handleAIResponse(text);
      procesadoPor = "ia";
      break;
  }

  // Save and send response
  await saveAndSend(conv.id, phone, response, procesadoPor);
}

// ============================================
// INTENT DETECTION
// ============================================

type Intent = "saludo" | "cotizar" | "estado_pedido" | "catalogo" | "archivo" | "horario" | "humano" | "unknown";

function detectIntent(text: string): Intent {
  const keywords: Partial<Record<Intent, string[]>> = {
    saludo: ["hola", "buenas", "buenos dias", "buenas tardes", "hey", "menu", "inicio"],
    cotizar: ["cotizar", "precio", "cuanto cuesta", "cuanto sale", "cotizacion", "presupuesto", "valor"],
    estado_pedido: ["pedido", "mi pedido", "seguimiento", "donde esta", "estado", "tracking"],
    catalogo: ["productos", "catalogo", "que venden", "que tienen", "ver productos"],
    archivo: ["subir archivo", "enviar diseno", "mandar archivo", "enviar archivo"],
    horario: ["horario", "direccion", "donde quedan", "ubicacion", "atencion", "abierto"],
    humano: ["persona", "humano", "ejecutivo", "hablar con alguien", "agente"],
  };

  for (const [intent, words] of Object.entries(keywords)) {
    if (words.some((w) => text.includes(w))) {
      return intent as Intent;
    }
  }

  // Check for numbered options (from menu)
  if (text === "1") return "catalogo";
  if (text === "2") return "cotizar";
  if (text === "3") return "estado_pedido";
  if (text === "4") return "archivo";
  if (text === "5") return "horario";
  if (text === "6") return "humano";

  return "unknown";
}

// ============================================
// FLOW HANDLERS
// ============================================

async function handleSaludo(phone: string): Promise<string> {
  return `Hola! Soy el asistente virtual de PrintUp. En que te puedo ayudar?\n\n1. Ver catalogo de productos\n2. Cotizar un trabajo\n3. Estado de mi pedido\n4. Subir archivo de diseno\n5. Horarios y ubicacion\n6. Hablar con una persona`;
}

async function handleCatalogo(): Promise<string> {
  const { data: categorias } = await supabase
    .from("categorias")
    .select("nombre, slug")
    .eq("activa", true)
    .order("orden");

  let msg = "Nuestras categorias:\n\n";
  (categorias || []).forEach((cat) => {
    msg += `- ${cat.nombre}: printup.cl/productos/${cat.slug}\n`;
  });
  msg += "\nVisita nuestro catalogo completo en printup.cl/productos";
  return msg;
}

function handleHorario(): string {
  return `PrintUp - Servicios Graficos Spa\n\nDireccion: Errazuriz 09, Donihue\nHorario: Lunes a Viernes 9:00 - 18:00\nDespachos: Miercoles y Viernes\nEnvio gratis sobre $50.000\n\nTienda online: printup.cl`;
}

async function startCotizacionFlow(convId: string, phone: string) {
  await supabase
    .from("conversaciones_whatsapp")
    .update({ contexto: { flow: "cotizacion", step: 1, data: {} } })
    .eq("id", convId);

  await saveAndSend(
    convId,
    phone,
    "Que tipo de producto necesitas?\n\n1. Poleras\n2. Pendones\n3. Tazones\n4. Adhesivos/Stickers\n5. DTF/DTG\n6. Otro",
    "bot"
  );
}

async function startEstadoPedidoFlow(convId: string, phone: string) {
  await supabase
    .from("conversaciones_whatsapp")
    .update({ contexto: { flow: "estado_pedido", step: 1, data: {} } })
    .eq("id", convId);

  await saveAndSend(
    convId,
    phone,
    "Ingresa tu numero de pedido (ej: #1001) o el email con el que compraste:",
    "bot"
  );
}

async function continueFlow(convId: string, phone: string, context: FlowContext, text: string) {
  if (context.flow === "cotizacion") {
    await continueCotizacion(convId, phone, context, text);
  } else if (context.flow === "estado_pedido") {
    await continueEstadoPedido(convId, phone, context, text);
  }
}

async function continueCotizacion(convId: string, phone: string, context: FlowContext, text: string) {
  const step = context.step || 1;
  const data = (context.data || {}) as Record<string, string>;

  switch (step) {
    case 1: {
      const tipos: Record<string, string> = { "1": "Poleras", "2": "Pendones", "3": "Tazones", "4": "Adhesivos", "5": "DTF/DTG", "6": "Otro" };
      data.producto_tipo = tipos[text] || text;
      await updateFlowContext(convId, "cotizacion", 2, data);
      await saveAndSend(convId, phone, "Cuantas unidades?\n\n1. 1-10\n2. 11-50\n3. 51-100\n4. 100+", "bot");
      break;
    }
    case 2: {
      const cantidades: Record<string, string> = { "1": "1-10", "2": "11-50", "3": "51-100", "4": "100+" };
      data.cantidad = cantidades[text] || text;
      await updateFlowContext(convId, "cotizacion", 3, data);
      await saveAndSend(convId, phone, "Necesitas diseno o ya lo tienes?\n\n1. Ya tengo diseno\n2. Necesito diseno", "bot");
      break;
    }
    case 3: {
      data.tiene_diseno = text.includes("1") || text.includes("tengo") ? "si" : "no";
      await updateFlowContext(convId, "cotizacion", 4, data);
      await saveAndSend(convId, phone, "Para cuando lo necesitas?\n\n1. Esta semana\n2. Proxima semana\n3. Sin apuro", "bot");
      break;
    }
    case 4: {
      const urgencias: Record<string, string> = { "1": "Esta semana", "2": "Proxima semana", "3": "Sin apuro" };
      data.urgencia = urgencias[text] || text;
      await updateFlowContext(convId, "cotizacion", 5, data);
      await saveAndSend(convId, phone, "Dejame tu nombre y email para enviarte la cotizacion formal.\n\nFormato: Nombre - email@ejemplo.com", "bot");
      break;
    }
    case 5: {
      const parts = text.split(/[-–]/).map((s: string) => s.trim());
      data.nombre = parts[0] || "";
      data.email = parts[1] || "";

      // Save quotation
      await supabase.from("cotizaciones_whatsapp").insert({
        conversacion_id: convId,
        cliente_nombre: data.nombre,
        cliente_email: data.email,
        producto_tipo: data.producto_tipo,
        cantidad: parseInt(data.cantidad) || null,
        tiene_diseno: data.tiene_diseno === "si",
        urgencia: data.urgencia,
        estado: "pendiente",
      });

      // Clear flow
      await updateFlowContext(convId, null, 0, {});

      await saveAndSend(
        convId,
        phone,
        `Cotizacion registrada!\n\nProducto: ${data.producto_tipo}\nCantidad: ${data.cantidad}\nDiseno: ${data.tiene_diseno === "si" ? "Tiene" : "Necesita"}\nUrgencia: ${data.urgencia}\n\nUn ejecutivo te enviara la cotizacion formal a la brevedad. Tambien puedes cotizar online en printup.cl/contacto`,
        "bot"
      );
      break;
    }
  }
}

async function continueEstadoPedido(convId: string, phone: string, _context: FlowContext, text: string) {
  // Try to find order by number or email
  const orderNum = text.replace("#", "").trim();
  const isEmail = text.includes("@");

  let query = supabase.from("pedidos").select("numero_pedido, estado, total, created_at");

  if (isEmail) {
    query = query.eq("cliente_email", text.trim());
  } else {
    query = query.eq("numero_pedido", parseInt(orderNum) || 0);
  }

  const { data: pedidos } = await query.limit(1);

  // Clear flow
  await updateFlowContext(convId, null, 0, {});

  if (pedidos && pedidos.length > 0) {
    const p = pedidos[0];
    const estados: Record<string, string> = {
      pendiente: "Pendiente de confirmacion",
      confirmado: "Confirmado",
      preparando: "En preparacion",
      enviado: "Enviado",
      entregado: "Entregado",
      cancelado: "Cancelado",
    };
    await saveAndSend(
      convId,
      phone,
      `Pedido #${p.numero_pedido}\nEstado: ${estados[p.estado] || p.estado}\nTotal: $${p.total?.toLocaleString("es-CL")}\nFecha: ${new Date(p.created_at).toLocaleDateString("es-CL")}`,
      "bot"
    );
  } else {
    await saveAndSend(
      convId,
      phone,
      "No encontre ese pedido. Verifica el numero o escribe 6 para contactar a un ejecutivo.",
      "bot"
    );
  }
}

// ============================================
// AI RESPONSE (Claude via Bedrock)
// ============================================

async function handleAIResponse(text: string): Promise<string> {
  try {
    // Get products for context
    const { data: productos } = await supabase
      .from("productos")
      .select("nombre, precio, stock")
      .eq("activo", true)
      .limit(20);

    const productosContext = (productos || [])
      .map((p) => `- ${p.nombre}: $${p.precio?.toLocaleString("es-CL")} (${p.stock > 0 ? "disponible" : "agotado"})`)
      .join("\n");

    // Call Bedrock (Claude Haiku)
    const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
    const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

    const response = await bedrock.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-haiku-4-5-20251001-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 300,
          system: `Eres el asistente virtual de PrintUp, empresa de impresion y publicidad en Donihue, Chile.
Info: Errazuriz 09, Donihue | L-V 9-18 | WhatsApp: +56 9 66126645 | Web: printup.cl
Despachos: Mie y Vie | Envio gratis sobre $50.000
Pagos: MercadoPago, transferencia, pago al retirar

PRODUCTOS:
${productosContext}

REGLAS: Responde en espanol chileno, amigable. Max 300 chars. No inventes precios. Si no sabes, ofrece conectar con ejecutivo.`,
          messages: [{ role: "user", content: text }],
        }),
      })
    );

    const result = JSON.parse(new TextDecoder().decode(response.body));
    return result.content?.[0]?.text || "Lo siento, no pude procesar tu mensaje. Escribe 6 para hablar con un ejecutivo.";
  } catch (error) {
    console.error("AI response error:", error);
    return "No pude procesar tu mensaje en este momento. Escribe 6 para hablar con un ejecutivo o visita printup.cl";
  }
}

// ============================================
// HELPERS
// ============================================

async function updateFlowContext(convId: string, flow: string | null, step: number, data: Record<string, unknown>) {
  await supabase
    .from("conversaciones_whatsapp")
    .update({ contexto: flow ? { flow, step, data } : {} })
    .eq("id", convId);
}

async function saveAndSend(convId: string, phone: string, message: string, procesadoPor: "bot" | "ia" | "humano") {
  // Save to DB
  await supabase.from("mensajes_whatsapp").insert({
    conversacion_id: convId,
    direccion: "saliente",
    tipo: "texto",
    contenido: message,
    procesado_por: procesadoPor,
  });

  // Send via Meta WhatsApp Cloud API
  await sendWhatsAppMessage(phone, message);
}

async function sendWhatsAppMessage(phone: string, message: string) {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.log("[DEV] WhatsApp message to", phone, ":", message);
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
