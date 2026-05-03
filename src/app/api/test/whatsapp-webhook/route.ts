import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Simple keyword-based bot responses for testing
function generateBotResponse(message: string): string {
  const msg = message.toLowerCase().trim();

  if (msg === "hola" || msg === "hi" || msg === "buenas" || msg === "buenos dias") {
    return "Hola! Bienvenido a PrintUp. Soy el asistente virtual. Puedo ayudarte con:\n- Informacion de productos\n- Cotizaciones\n- Estado de pedidos\n- Horarios y ubicacion\n\nEscribe lo que necesites!";
  }

  if (msg.includes("precio") || msg.includes("costo") || msg.includes("cotiz") || msg.includes("cuanto")) {
    return "Para darte una cotizacion necesito los siguientes datos:\n- Tipo de producto (tarjetas, volantes, afiches, etc.)\n- Cantidad\n- Tamano\n- Tipo de papel\n\nPor favor comparte estos detalles y te envio una cotizacion.";
  }

  if (msg.includes("pedido") || msg.includes("estado") || msg.includes("seguimiento")) {
    return "Para consultar el estado de tu pedido, por favor indicame tu numero de pedido (ejemplo: #PU-001234).";
  }

  if (msg.includes("horario") || msg.includes("hora") || msg.includes("abierto")) {
    return "Nuestro horario de atencion es:\nLunes a Viernes: 9:00 - 18:00\nSabado: 10:00 - 14:00\nDomingo: Cerrado\n\nUbicacion: Santiago, Chile";
  }

  if (msg.includes("tarjeta") || msg.includes("volante") || msg.includes("afiche") || msg.includes("impresion") || msg.includes("imprimir")) {
    return "Tenemos una amplia variedad de productos de impresion:\n- Tarjetas de presentacion\n- Volantes y flyers\n- Afiches\n- Pendones\n- Stickers\n- Y mucho mas!\n\nVisita nuestra tienda online o indicame que producto te interesa para darte mas detalles.";
  }

  if (msg.includes("gracias") || msg.includes("thank")) {
    return "De nada! Si necesitas algo mas, no dudes en escribirme. Estamos para ayudarte!";
  }

  if (msg.includes("envio") || msg.includes("despacho") || msg.includes("entrega")) {
    return "Ofrecemos despacho a todo Chile. Los tiempos de entrega son:\n- Santiago: 1-2 dias habiles\n- Regiones: 3-5 dias habiles\n\nTambien puedes retirar en nuestra tienda sin costo adicional.";
  }

  if (msg.includes("pago") || msg.includes("transferencia") || msg.includes("pagar")) {
    return "Aceptamos los siguientes metodos de pago:\n- Transferencia bancaria\n- MercadoPago (tarjetas de credito/debito)\n- Pago en tienda\n\nPara transferencias:\nServicios Graficos Spa\nRUT: 78.114.353-7";
  }

  return "Gracias por tu mensaje. No estoy seguro de como ayudarte con eso. Puedes preguntarme sobre:\n- Productos y precios\n- Cotizaciones\n- Estado de pedidos\n- Horarios\n- Envios\n- Metodos de pago\n\nO si prefieres, puedo conectarte con un agente humano.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, message } = body;

    if (!from || !message) {
      return NextResponse.json(
        { error: "Se requiere 'from' (telefono) y 'message'" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Find or create conversation
    let { data: conversacion } = await supabase
      .from("conversaciones_whatsapp")
      .select("*")
      .eq("telefono", from)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversacion) {
      const { data: nuevaConv, error: convError } = await supabase
        .from("conversaciones_whatsapp")
        .insert({
          telefono: from,
          estado: "activa",
          ultimo_mensaje_at: now,
        })
        .select()
        .single();

      if (convError || !nuevaConv) {
        console.error("Error creating conversacion:", convError);
        return NextResponse.json(
          { error: "Error al crear conversacion" },
          { status: 500 }
        );
      }
      conversacion = nuevaConv;
    }

    // Save incoming message
    const { error: inMsgError } = await supabase
      .from("mensajes_whatsapp")
      .insert({
        conversacion_id: conversacion.id,
        direccion: "entrante",
        contenido: message,
        procesado_por: "bot",
        created_at: now,
      });

    if (inMsgError) {
      console.error("Error saving incoming message:", inMsgError);
      return NextResponse.json(
        { error: "Error al guardar mensaje" },
        { status: 500 }
      );
    }

    // Generate bot response (simple keyword matching, no Claude API call)
    const respuesta = generateBotResponse(message);

    // Save outgoing response
    const { data: mensajeRespuesta, error: outMsgError } = await supabase
      .from("mensajes_whatsapp")
      .insert({
        conversacion_id: conversacion.id,
        direccion: "saliente",
        contenido: respuesta,
        procesado_por: "bot",
        created_at: new Date(Date.now() + 1000).toISOString(), // 1 second after to maintain order
      })
      .select()
      .single();

    if (outMsgError) {
      console.error("Error saving bot response:", outMsgError);
      return NextResponse.json(
        { error: "Error al guardar respuesta" },
        { status: 500 }
      );
    }

    // Update conversation timestamp
    await supabase
      .from("conversaciones_whatsapp")
      .update({ ultimo_mensaje_at: now })
      .eq("id", conversacion.id);

    return NextResponse.json({
      success: true,
      conversacion_id: conversacion.id,
      mensaje_entrante: message,
      respuesta: mensajeRespuesta,
    });
  } catch (err) {
    console.error("Test WhatsApp webhook error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
