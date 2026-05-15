import { getSupabaseAdmin } from "@/lib/supabase";
import type { BotContext, BotResponse, IncomingMessage } from "../types";

/**
 * Flujo de registro de cliente nuevo.
 * Steps:
 *   1: Preguntar persona/empresa
 *   2: Pedir nombre
 *   3: Pedir email
 *   4: (Si empresa) Pedir razon social y RUT
 */
export async function handleOnboarding(
  context: BotContext,
  msg: IncomingMessage
): Promise<BotResponse> {
  const text = msg.contenido.trim();
  const textLower = text.toLowerCase();
  const data = { ...context.data } as Record<string, string>;

  switch (context.step) {
    // ---- STEP 1: Persona o Empresa ----
    case 1: {
      if (textLower.includes("1") || textLower.includes("persona")) {
        data.tipo_cliente = "persona";
        return {
          messages: ["Perfecto! Como te llamas?"],
          newContext: { ...context, step: 2, data },
        };
      }
      if (textLower.includes("2") || textLower.includes("empresa")) {
        data.tipo_cliente = "empresa";
        return {
          messages: [
            "Perfecto! Como te llamas? (tu nombre de contacto)",
          ],
          newContext: { ...context, step: 2, data },
        };
      }
      return {
        messages: [
          "No entendi. Responde con:\n\n1. Persona natural\n2. Empresa",
        ],
        newContext: context,
      };
    }

    // ---- STEP 2: Nombre ----
    case 2: {
      if (text.length < 2 || /^\d+$/.test(text)) {
        return {
          messages: [
            "Ingresa tu nombre completo (ej: Maria Gonzalez):",
          ],
          newContext: context,
        };
      }
      data.nombre = text;

      return {
        messages: [
          `Gracias ${data.nombre}! Ahora necesito tu email para enviarte informacion:`,
        ],
        newContext: { ...context, step: 3, data },
      };
    }

    // ---- STEP 3: Email ----
    case 3: {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        return {
          messages: [
            "Ese no parece un email valido. Ingresa tu correo (ej: maria@gmail.com):",
          ],
          newContext: context,
        };
      }
      data.email = text.toLowerCase();

      if (data.tipo_cliente === "empresa") {
        return {
          messages: [
            `Perfecto! Como es empresa, necesito:\n\n` +
              `Razon social y RUT (ej: Mi Empresa SpA - 76.123.456-7):`,
          ],
          newContext: { ...context, step: 4, data },
        };
      }

      // Persona natural - guardar y terminar
      return finishOnboarding(context, data, msg);
    }

    // ---- STEP 4: Razon social + RUT (solo empresa) ----
    case 4: {
      const parts = text.split(/[-\u2013]/).map((s: string) => s.trim());
      data.razon_social = parts[0] || text;
      data.rut = parts[1] || "";

      return finishOnboarding(context, data, msg);
    }

    default:
      return {
        messages: [
          "Algo salio mal. Empecemos de nuevo.\n\nEres persona o empresa?\n1. Persona\n2. Empresa",
        ],
        newContext: { ...context, step: 1, data: {} },
      };
  }
}

async function finishOnboarding(
  context: BotContext,
  data: Record<string, string>,
  msg: IncomingMessage
): Promise<BotResponse> {
  const supabase = getSupabaseAdmin();

  const clienteData: Record<string, unknown> = {
    nombre: data.nombre,
    email: data.email,
    tipo: data.tipo_cliente || "persona",
    telefono: msg.senderPhone || null,
    whatsapp_phone: msg.canal === "whatsapp" ? msg.senderPhone : null,
    instagram_id: msg.canal === "instagram" ? msg.senderId : null,
    facebook_id: msg.canal === "facebook" ? msg.senderId : null,
    canal_origen: msg.canal,
    onboarding_completo: true,
    preferencias: { newsletter: true, notificaciones: true },
  };

  if (data.tipo_cliente === "empresa") {
    clienteData.razon_social = data.razon_social || null;
    clienteData.rut = data.rut || null;
  }

  // Verificar si ya existe por email
  const { data: existing } = await supabase
    .from("clientes")
    .select("id")
    .eq("email", data.email)
    .limit(1)
    .single();

  let clienteId: string;

  if (existing) {
    await supabase
      .from("clientes")
      .update({
        ...clienteData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    clienteId = existing.id;
  } else {
    const { data: newCliente, error } = await supabase
      .from("clientes")
      .insert({
        ...clienteData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating cliente:", error);
      return {
        messages: [
          `Gracias ${data.nombre}! Tus datos quedaron registrados.\n\n` +
            MENU_TEXT,
        ],
        newContext: {
          flow: "menu",
          step: 0,
          data: {},
          cliente_id: null,
        },
      };
    }
    clienteId = newCliente.id;
  }

  const tipoLabel =
    data.tipo_cliente === "empresa"
      ? ` (${data.razon_social || "empresa"})`
      : "";

  return {
    messages: [
      `Listo ${data.nombre}${tipoLabel}! Quedaste registrado.\n\n` +
        MENU_TEXT,
    ],
    newContext: {
      flow: "menu",
      step: 0,
      data: {},
      cliente_id: clienteId,
    },
    notify: {
      type: "nuevo_cliente",
      data: {
        nombre: data.nombre,
        email: data.email,
        tipo: data.tipo_cliente,
        canal: msg.canal,
      },
    },
  };
}

const MENU_TEXT =
  `En que te puedo ayudar?\n\n` +
  `1. Cotizar un trabajo\n` +
  `2. Subir archivo/diseno\n` +
  `3. Ver catalogo\n` +
  `4. Estado de mi pedido\n` +
  `5. Horarios y ubicacion\n` +
  `6. Hablar con una persona`;
