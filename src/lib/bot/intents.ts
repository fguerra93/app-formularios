import type { BotIntent } from "./types";

/**
 * Detecta la intencion del mensaje.
 * Primero intenta con keywords (gratis, instantaneo).
 * Si no matchea, usa Claude Haiku como fallback.
 */
export async function detectIntent(text: string): Promise<BotIntent> {
  const intent = detectByKeywords(text);
  if (intent !== "desconocido") return intent;

  return classifyWithAI(text);
}

function detectByKeywords(text: string): BotIntent {
  const lower = text.toLowerCase().trim();

  // Opciones numericas del menu
  if (lower === "1") return "cotizar";
  if (lower === "2") return "subir_archivo";
  if (lower === "3") return "catalogo";
  if (lower === "4") return "estado_pedido";
  if (lower === "5") return "horario";
  if (lower === "6") return "humano";

  const keywords: Partial<Record<BotIntent, string[]>> = {
    saludo: [
      "hola",
      "buenas",
      "buenos dias",
      "buenas tardes",
      "buenas noches",
      "hey",
      "menu",
      "inicio",
      "empezar",
      "hi",
      "hello",
    ],
    cotizar: [
      "cotizar",
      "cotizacion",
      "presupuesto",
      "cuanto cuesta",
      "cuanto sale",
      "cuanto vale",
    ],
    precio: ["precio", "precios", "tarifa", "tarifas", "valor"],
    estado_pedido: [
      "pedido",
      "mi pedido",
      "seguimiento",
      "tracking",
      "donde esta mi",
      "estado",
    ],
    catalogo: [
      "productos",
      "catalogo",
      "que venden",
      "que tienen",
      "ver productos",
      "que ofrecen",
    ],
    subir_archivo: [
      "subir",
      "enviar diseno",
      "mandar archivo",
      "enviar archivo",
      "adjuntar",
    ],
    formulario: ["formulario", "contacto", "formulario web"],
    horario: [
      "horario",
      "direccion",
      "donde quedan",
      "ubicacion",
      "atencion",
      "abierto",
      "cerrado",
      "como llego",
    ],
    humano: [
      "persona",
      "humano",
      "ejecutivo",
      "hablar con alguien",
      "agente",
      "ayuda real",
    ],
  };

  for (const [intent, words] of Object.entries(keywords)) {
    if (words!.some((w) => lower.includes(w))) {
      return intent as BotIntent;
    }
  }

  return "desconocido";
}

/**
 * Clasifica con Claude Haiku API cuando keywords no matchean.
 */
async function classifyWithAI(text: string): Promise<BotIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "desconocido";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        system:
          "Clasifica el mensaje del usuario en UNA de estas categorias. " +
          "Responde SOLO con la categoria, nada mas.\n" +
          "Categorias: saludo, cotizar, precio, estado_pedido, catalogo, " +
          "subir_archivo, formulario, horario, humano, desconocido",
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!res.ok) return "desconocido";

    const data = await res.json();
    const classification = (data.content?.[0]?.text || "")
      .trim()
      .toLowerCase();

    const validIntents: BotIntent[] = [
      "saludo",
      "cotizar",
      "precio",
      "estado_pedido",
      "catalogo",
      "subir_archivo",
      "formulario",
      "horario",
      "humano",
    ];

    if (validIntents.includes(classification as BotIntent)) {
      return classification as BotIntent;
    }

    return "desconocido";
  } catch {
    return "desconocido";
  }
}
