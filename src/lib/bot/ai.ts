import { productosRepo } from "@/server/repositories";

/**
 * Genera una respuesta con Claude para preguntas que no matchean
 * ningun intent especifico (dudas tipicas, preguntas generales).
 */
export async function handleAIResponse(
  text: string,
  cliente: Record<string, unknown> | null
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return (
      "No pude procesar tu mensaje. Puedo ayudarte con:\n\n" +
      "1. Cotizar un trabajo\n" +
      "2. Subir archivo/diseno\n" +
      "3. Ver catalogo\n" +
      "4. Estado de mi pedido\n" +
      "5. Horarios y ubicacion\n" +
      "6. Hablar con una persona"
    );
  }

  try {
    const productos = await productosRepo.listParaBot(15);

    const productosCtx = productos
      .map((p) => `- ${p.nombre}: $${p.precio?.toLocaleString("es-CL")}`)
      .join("\n");

    const clienteNombre = (cliente?.nombre as string) || "el cliente";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system:
          `Eres el asistente virtual de PrintUp, empresa de impresion y publicidad en Donihue, Chile.\n` +
          `Datos: Errazuriz 09, Donihue | L-V 9-18 | WA: +56 9 66126645 | Web: printup.cl\n` +
          `Despachos: Mie y Vie | Envio gratis sobre $50.000\n` +
          `Pagos: MercadoPago, transferencia, pago al retirar\n` +
          `Servicios: DTF Textil, DTF UV, Sublimacion, Vinilo, Pendones, Poleras, Tazones\n\n` +
          `PRODUCTOS:\n${productosCtx}\n\n` +
          `El cliente se llama ${clienteNombre}.\n\n` +
          `REGLAS:\n` +
          `- Responde en espanol chileno, amigable y profesional\n` +
          `- Maximo 500 caracteres\n` +
          `- NO inventes precios especificos, di que pueden cotizar\n` +
          `- Si no sabes, ofrece conectar con un ejecutivo (opcion 6)\n` +
          `- Siempre recuerda que pueden visitar printup.cl`,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    return (
      data.content?.[0]?.text ||
      "No pude procesar tu mensaje. Escribe 6 para hablar con un ejecutivo."
    );
  } catch (error) {
    console.error("AI response error:", error);
    return "No pude procesar tu mensaje. Escribe 6 para hablar con un ejecutivo o visita printup.cl";
  }
}
