import { getSupabaseAdmin } from "@/lib/supabase";
import { detectIntent } from "../intents";
import type { BotContext, BotResponse, IncomingMessage } from "../types";

const MENU_TEXT =
  `1. Cotizar un trabajo\n` +
  `2. Subir archivo/diseno\n` +
  `3. Ver catalogo\n` +
  `4. Estado de mi pedido\n` +
  `5. Horarios y ubicacion\n` +
  `6. Hablar con una persona`;

/**
 * Maneja las opciones del menu principal y sub-acciones.
 */
export async function handleMenu(
  context: BotContext,
  msg: IncomingMessage
): Promise<BotResponse> {
  const text = msg.contenido.trim().toLowerCase();
  const pending = context.data.pending_action as string | undefined;

  // --- Sub-acciones pendientes ---

  if (pending === "upload_choice") {
    return handleUploadChoice(context, msg, text);
  }

  if (pending === "estado_pedido") {
    return handleEstadoPedido(context, text);
  }

  if (pending === "cotizar") {
    return handleCotizarChoice(context, text);
  }

  // --- Opciones del menu ---

  switch (text) {
    case "1":
      return {
        messages: [
          `Que tipo de impresion necesitas?\n\n` +
            `1. DTF Textil (poleras, telas)\n` +
            `2. DTF UV (rigidos, stickers)\n` +
            `3. Sublimacion\n` +
            `4. Vinilo / Pendones\n` +
            `5. Otro (cotizacion manual)`,
        ],
        newContext: {
          ...context,
          data: { ...context.data, pending_action: "cotizar" },
        },
      };

    case "2":
      return {
        messages: [
          `Puedes enviarme la imagen directamente aqui, ` +
            `o llenar nuestro formulario web con mas detalles:\n\n` +
            `printup.cl/contacto\n\n` +
            `Que prefieres?\n1. Enviar imagen aqui\n2. Ir al formulario web`,
        ],
        newContext: {
          ...context,
          data: { ...context.data, pending_action: "upload_choice" },
        },
      };

    case "3":
      return {
        messages: [
          `Visita nuestro catalogo en:\nprintup.cl/productos\n\n` +
            `Tenemos poleras, pendones, tazones, adhesivos y mas!`,
        ],
        newContext: { ...context, flow: null, data: {} },
      };

    case "4":
      return {
        messages: [
          "Ingresa tu numero de pedido (ej: #1001) o tu email:",
        ],
        newContext: {
          ...context,
          data: { ...context.data, pending_action: "estado_pedido" },
        },
      };

    case "5":
      return {
        messages: [
          `PrintUp - Servicios Graficos\n\n` +
            `Direccion: Errazuriz 09, Donihue\n` +
            `Horario: L-V 9:00 - 18:00\n` +
            `Despachos: Mie y Vie\n` +
            `Envio gratis sobre $50.000\n\n` +
            `Web: printup.cl`,
        ],
        newContext: { ...context, flow: null, data: {} },
      };

    case "6":
      return {
        messages: [
          "Te conecto con un ejecutivo de PrintUp. Responderemos a la brevedad.",
        ],
        newContext: { ...context, flow: null, data: {} },
        escalate: true,
        notify: {
          type: "escalacion",
          data: {
            cliente_nombre: msg.senderName || msg.senderId,
            canal: msg.canal,
            mensaje: "Solicito hablar con persona",
          },
        },
      };

    default: {
      // Intentar detectar intencion por texto libre
      const intent = await detectIntent(text);
      const intentToOption: Record<string, string> = {
        cotizar: "1", precio: "1",
        subir_archivo: "2", formulario: "2",
        catalogo: "3",
        estado_pedido: "4",
        horario: "5",
        humano: "6",
      };
      const mapped = intentToOption[intent];
      if (mapped) {
        return handleMenu({ ...context, data: {} }, { ...msg, contenido: mapped });
      }
      // Si dice "hola" o saludo, volver a mostrar menu
      if (intent === "saludo") {
        return {
          messages: [`En que te puedo ayudar?\n\n${MENU_TEXT}`],
          newContext: context,
        };
      }
      return {
        messages: [`No entendi esa opcion. Puedo ayudarte con:\n\n${MENU_TEXT}`],
        newContext: context,
      };
    }
  }
}

function handleUploadChoice(
  context: BotContext,
  msg: IncomingMessage,
  text: string
): BotResponse {
  if (text === "1" || text.includes("enviar") || text.includes("aqui")) {
    return {
      messages: ["Perfecto! Enviame tu imagen o archivo ahora."],
      newContext: {
        ...context,
        flow: "upload_image",
        step: 0,
        data: {},
      },
    };
  }
  if (
    text === "2" ||
    text.includes("formulario") ||
    text.includes("web")
  ) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://printup.cl";
    const refParam = context.cliente_id
      ? `?ref=${context.cliente_id}`
      : "";
    return {
      messages: [
        `Abre este link para llenar el formulario:\n\n` +
          `${siteUrl}/contacto${refParam}\n\n` +
          `Ahi puedes subir archivos de hasta 50MB.`,
      ],
      newContext: { ...context, flow: null, data: {} },
    };
  }
  return {
    messages: ["Responde con:\n1. Enviar imagen aqui\n2. Ir al formulario web"],
    newContext: context,
  };
}

async function handleEstadoPedido(
  context: BotContext,
  text: string
): Promise<BotResponse> {
  const supabase = getSupabaseAdmin();
  const orderNum = text.replace("#", "").trim();
  const isEmail = text.includes("@");

  let query = supabase
    .from("pedidos")
    .select("numero_pedido, estado, total, created_at");

  if (isEmail) {
    query = query.eq("cliente_email", text.trim());
  } else {
    query = query.eq("numero_pedido", parseInt(orderNum) || 0);
  }

  const { data: pedidos } = await query.limit(1);

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
    return {
      messages: [
        `Pedido #${p.numero_pedido}\n` +
          `Estado: ${estados[p.estado] || p.estado}\n` +
          `Total: $${p.total?.toLocaleString("es-CL")}\n` +
          `Fecha: ${new Date(p.created_at).toLocaleDateString("es-CL")}`,
      ],
      newContext: { ...context, flow: null, data: {} },
    };
  }

  return {
    messages: [
      "No encontre ese pedido. Verifica el numero o escribe 6 para contactar a un ejecutivo.",
    ],
    newContext: { ...context, flow: null, data: {} },
  };
}

function handleCotizarChoice(
  context: BotContext,
  text: string
): BotResponse {
  const tipos: Record<string, string> = {
    "1": "DTF Textil",
    "2": "DTF UV",
    "3": "Sublimacion",
    "4": "Vinilo / Pendones",
    "5": "Otro",
  };

  const tipo = tipos[text];
  if (!tipo) {
    return {
      messages: [
        "Elige una opcion:\n\n" +
          "1. DTF Textil\n2. DTF UV\n3. Sublimacion\n4. Vinilo / Pendones\n5. Otro",
      ],
      newContext: context,
    };
  }

  if (tipo === "Otro") {
    return {
      messages: [
        "Para cotizaciones especiales, te conecto con un ejecutivo. Responderemos a la brevedad.",
      ],
      newContext: { ...context, flow: null, data: {} },
      escalate: true,
      notify: {
        type: "escalacion",
        data: {
          cliente_nombre: context.cliente_id || "Cliente",
          canal: "whatsapp",
          mensaje: `Solicita cotizacion manual de tipo: Otro`,
        },
      },
    };
  }

  // Por ahora escalar cotizaciones formales (Fase 12 las automatizara)
  return {
    messages: [
      `Anotado: ${tipo}.\n\n` +
        `Para darte un precio necesitamos ver tu diseno. ` +
        `Puedes enviarlo aqui o por nuestro formulario:\n` +
        `printup.cl/contacto\n\n` +
        `Un ejecutivo te contactara con la cotizacion formal.`,
    ],
    newContext: { ...context, flow: null, data: {} },
    notify: {
      type: "escalacion",
      data: {
        cliente_nombre: context.cliente_id || "Cliente",
        canal: "whatsapp",
        mensaje: `Solicita cotizacion de: ${tipo}`,
      },
    },
  };
}
