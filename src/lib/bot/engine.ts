import { clientesRepo, formulariosRepo, mensajeriaRepo } from "@/server/repositories";
import { sendMessageByChannel } from "@/lib/meta";
import { clasificarNivel } from "./autonomy";
import { handleOnboarding } from "./flows/onboarding";
import { handleMenu } from "./flows/menu";
import { handleUploadImage } from "./flows/upload-image";
import { detectIntent } from "./intents";
import { handleAIResponse } from "./ai";
import { notifyPrintUp } from "./notifications";
import type { BotContext, BotResponse, IncomingMessage } from "./types";

const EMPTY_CONTEXT: BotContext = {
  flow: null,
  step: 0,
  data: {},
  cliente_id: null,
};

const MENU_TEXT =
  `En que te puedo ayudar?\n\n` +
  `1. Cotizar un trabajo\n` +
  `2. Subir archivo/diseno\n` +
  `3. Ver catalogo\n` +
  `4. Estado de mi pedido\n` +
  `5. Horarios y ubicacion\n` +
  `6. Hablar con una persona`;

/**
 * Procesa un mensaje entrante y ejecuta la logica del bot.
 * Se llama desde el webhook de Meta despues de guardar el mensaje en BD.
 */
export async function processBotMessage(
  conversacionId: string,
  msg: IncomingMessage
): Promise<void> {
  // 1. Leer contexto actual de la conversacion
  const conv = await mensajeriaRepo.getConversacionContext(conversacionId);

  // Si la conversacion esta escalada a humano, no responder
  if (conv?.estado === "escalada" || conv?.estado === "archivada") return;

  const context: BotContext =
    (conv?.bot_context as BotContext) || { ...EMPTY_CONTEXT };

  // Si hay cliente_id en la conversacion, ponerlo en el contexto
  if (conv?.cliente_id && !context.cliente_id) {
    context.cliente_id = conv.cliente_id;
  }

  // 2. Determinar respuesta segun el estado del flujo
  let response: BotResponse;

  try {
    if (context.flow === "onboarding") {
      response = await handleOnboarding(context, msg);
    } else if (context.flow === "upload_image") {
      response = await handleUploadImage(context, msg);
    } else if (context.flow === "menu") {
      response = await handleMenu(context, msg);
    } else {
      response = await handleNewMessage(context, msg);
    }
  } catch (err) {
    console.error("Bot flow error:", err);
    response = {
      messages: [
        "Disculpa, tuve un problema. Puedo ayudarte con:\n\n" +
          MENU_TEXT,
      ],
      newContext: { ...context, flow: "menu", step: 0, data: {} },
    };
  }

  // 3. Enviar mensajes de respuesta
  for (const text of response.messages) {
    await sendMessageByChannel(msg.canal, msg.senderId, text);

    // Guardar mensaje saliente en BD
    await mensajeriaRepo.insertMensaje({
      conversacion_id: conversacionId,
      direccion: "saliente",
      tipo: "texto",
      contenido: text,
      estado_envio: "enviado",
      respuesta_automatica: true,
      created_at: new Date().toISOString(),
    });
  }

  // 4. Actualizar contexto en la conversacion
  const updateData: Record<string, unknown> = {
    bot_context: response.newContext,
    ultimo_mensaje:
      response.messages[response.messages.length - 1] || "",
    ultimo_mensaje_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (response.newContext.cliente_id) {
    updateData.cliente_id = response.newContext.cliente_id;
  }

  // Si el bot pidio escalar, cambiar estado de la conversacion
  if (response.escalate) {
    updateData.estado = "escalada";
  }

  await mensajeriaRepo.updateConversacion(conversacionId, updateData);

  // 5. Crear formulario si el bot lo solicita
  if (response.createFormulario) {
    const form = await formulariosRepo.create({
      nombre: response.createFormulario.nombre,
      email: response.createFormulario.email,
      telefono: response.createFormulario.telefono,
      material: response.createFormulario.material,
      mensaje: response.createFormulario.mensaje,
      archivos: response.createFormulario.archivos,
      estado: "nuevo",
      nextcloud_synced: false,
      email_enviado: false,
    });

    if (response.notify && form) {
      response.notify.data.formulario_id = form.id;
    }
  }

  // 6. Enviar notificacion a PrintUp si corresponde
  if (response.notify) {
    await notifyPrintUp(response.notify, msg);
  }
}

/**
 * Maneja un mensaje sin flujo activo.
 * Detecta intencion y decide que hacer.
 */
async function handleNewMessage(
  context: BotContext,
  msg: IncomingMessage
): Promise<BotResponse> {
  // Si envia imagen sin flujo activo, iniciar upload
  if (
    msg.tipo === "imagen" ||
    msg.tipo === "documento" ||
    msg.tipo === "video"
  ) {
    return handleUploadImage(
      { ...context, flow: "upload_image", step: 0 },
      msg
    );
  }

  // Buscar si el contacto ya es cliente registrado
  const cliente = await clientesRepo.findByContacto(
    msg.canal,
    msg.senderPhone || "",
    msg.senderId
  );

  if (cliente) {
    context.cliente_id = cliente.id as string;
  }

  // Autonomía (Patrón 7): clasificar antes de responder.
  // ROJO (pago, reclamo, dato sensible) -> escalar a humano de inmediato.
  const nivel = clasificarNivel(msg.contenido);
  if (nivel === "rojo") {
    return {
      messages: [
        "Entiendo. Te conecto con un ejecutivo de PrintUp para ayudarte " +
          "personalmente. Responderemos a la brevedad.",
      ],
      newContext: { ...context, flow: null, data: {} },
      escalate: true,
      notify: {
        type: "escalacion",
        data: {
          cliente_nombre: cliente?.nombre || msg.senderName || msg.senderId,
          canal: msg.canal,
          mensaje: msg.contenido,
        },
      },
    };
  }

  // Detectar intencion
  const intent = await detectIntent(msg.contenido);

  switch (intent) {
    case "saludo": {
      if (cliente?.onboarding_completo) {
        return {
          messages: [
            `Hola ${cliente.nombre}! Que bueno verte de nuevo.\n\n` +
              MENU_TEXT,
          ],
          newContext: {
            ...context,
            flow: "menu",
            step: 0,
            cliente_id: cliente.id as string,
          },
        };
      }
      // Cliente nuevo - iniciar onboarding
      return {
        messages: [
          `Hola! Soy el asistente virtual de PrintUp, tu aliado en impresion.\n\n` +
            `Para atenderte mejor, me puedes decir:\n\n` +
            `1. Soy persona natural\n` +
            `2. Soy empresa`,
        ],
        newContext: {
          flow: "onboarding",
          step: 1,
          data: {
            canal: msg.canal,
            sender_id: msg.senderId,
            sender_name: msg.senderName,
            sender_phone: msg.senderPhone,
          },
          cliente_id: null,
        },
      };
    }

    case "subir_archivo":
    case "formulario":
      return {
        messages: [
          `Puedes enviarme la imagen directamente aqui, ` +
            `o llenar nuestro formulario web con mas detalles:\n\n` +
            `printup.cl/contacto\n\n` +
            `Que prefieres?\n` +
            `1. Enviar imagen aqui\n` +
            `2. Ir al formulario web`,
        ],
        newContext: {
          ...context,
          flow: "menu",
          step: 0,
          data: { pending_action: "upload_choice" },
        },
      };

    case "horario":
      return {
        messages: [
          `PrintUp - Servicios Graficos\n\n` +
            `Direccion: Errazuriz 09, Donihue\n` +
            `Horario: Lunes a Viernes 9:00 - 18:00\n` +
            `Despachos: Miercoles y Viernes\n` +
            `Envio gratis sobre $50.000\n\n` +
            `Tienda online: printup.cl`,
        ],
        newContext: { ...context, flow: null, data: {} },
      };

    case "catalogo":
      return {
        messages: [
          `Visita nuestro catalogo completo en:\n` +
            `printup.cl/productos\n\n` +
            `Tenemos poleras, pendones, tazones, adhesivos, DTF y mas!`,
        ],
        newContext: { ...context, flow: null, data: {} },
      };

    case "humano":
      return {
        messages: [
          `Entendido, te conecto con un ejecutivo de PrintUp. ` +
            `Responderemos a la brevedad.`,
        ],
        newContext: { ...context, flow: null, data: {} },
        escalate: true,
        notify: {
          type: "escalacion",
          data: {
            cliente_nombre:
              cliente?.nombre || msg.senderName || msg.senderId,
            canal: msg.canal,
            mensaje: msg.contenido,
          },
        },
      };

    case "cotizar":
    case "precio":
      return {
        messages: [
          `Para cotizar necesito algunos datos.\n\n` +
            `Que tipo de impresion necesitas?\n\n` +
            `1. DTF Textil (poleras, telas)\n` +
            `2. DTF UV (rigidos, stickers)\n` +
            `3. Sublimacion\n` +
            `4. Vinilo / Pendones\n` +
            `5. Otro (cotizacion manual)`,
        ],
        newContext: {
          ...context,
          flow: "menu",
          step: 0,
          data: { pending_action: "cotizar" },
        },
      };

    case "estado_pedido":
      return {
        messages: [
          `Ingresa tu numero de pedido (ej: #1001) o el email con que compraste:`,
        ],
        newContext: {
          ...context,
          flow: "menu",
          step: 0,
          data: { pending_action: "estado_pedido" },
        },
      };

    default: {
      // Pregunta libre -> responder con IA
      const aiResponse = await handleAIResponse(
        msg.contenido,
        cliente
      );
      return {
        messages: [aiResponse],
        newContext: context,
      };
    }
  }
}
