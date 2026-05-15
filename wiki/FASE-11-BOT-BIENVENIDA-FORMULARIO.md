# Fase 11: Bot de Bienvenida + Onboarding + Formulario Inteligente

> Documento tecnico completo para construir con Claude Code.
> Cubre: mensaje RRSS -> bienvenida -> onboarding -> dudas tipicas -> formulario -> imagen.

---

## 1. Resumen del Flujo Objetivo

```
CLIENTE                              BOT                                BD / ADMIN
-------                              ---                                ----------

Envia "Hola" por WA/IG/FB ---------> Detecta primer contacto
                                      (busca telefono/ID en clientes)

                                      SI es nuevo:
                                      "Hola! Soy el asistente de PrintUp.
                                       Antes de ayudarte, eres...
                                       1. Persona natural
                                       2. Empresa"

Cliente responde "1" --------------> Guarda tipo_cliente = "persona"
                                      "Como te llamas?"

"Maria Gonzalez" ------------------> Guarda nombre
                                      "Tu email para enviarte info?"

"maria@gmail.com" -----------------> Guarda email -----------------> INSERT clientes
                                      "Listo Maria! En que te ayudo?   {nombre, email,
                                       1. Cotizar un trabajo            telefono, tipo,
                                       2. Subir archivo/diseno          canal_origen}
                                       3. Ver catalogo
                                       4. Estado de pedido
                                       5. Horarios y ubicacion
                                       6. Hablar con una persona"

                                      SI es recurrente:
                                      "Hola Maria! Que bueno verte
                                       de nuevo. En que te ayudo?"
                                       + mismo menu

"Quiero subir un diseno" ----------> "Perfecto! Puedes enviarme la
                                      imagen directamente aqui, o
                                      llenar nuestro formulario web
                                      con mas detalles:
                                      printup.cl/contacto?ref={convId}

                                      Que prefieres?
                                      1. Enviar imagen aqui
                                      2. Ir al formulario web"

[Opcion 1: envia imagen aqui]
Cliente envia foto -----------------> Descarga media de Meta API
                                      Sube a Supabase Storage
                                      Crea formulario automatico -----> INSERT formularios
                                      "Recibi tu imagen!                {nombre, email,
                                       Que tipo de impresion?            archivos, estado,
                                       1. DTF Textil                     telefono...}
                                       2. DTF UV
                                       3. Sublimacion                   INSERT nextcloud
                                       4. No se, asesórame"             sync queue

                                      Notifica a PrintUp ------------> Email + WA al negocio
                                      "Nuevo diseno de Maria Gonzalez
                                       Ver: admin/formularios/{id}"

[Opcion 2: formulario web]
Cliente abre link ------------------> Formulario prellenado con
                                      nombre, email, telefono
                                      (datos del onboarding)
                                      Cliente sube archivo
                                      Envia formulario

                                      Bot recibe notificacion -------> Webhook Supabase
                                      "Maria, recibimos tu formulario!
                                       Estamos revisando tu imagen.
                                       Te avisaremos pronto."

[Cualquier otra pregunta]
"Cuanto cuesta una polera?" --------> Busca en respuestas_automaticas
                                      Si matchea keyword -> respuesta
                                      Si no matchea -> Claude Haiku
                                      clasifica + responde

"Donde quedan?" -------------------> Keyword "donde" -> respuesta auto
                                      "PrintUp - Errazuriz 09, Donihue
                                       L-V 9:00-18:00..."
```

---

## 2. Que Existe HOY (no reescribir, extender)

### Archivos que se MODIFICAN:

| Archivo | Que tiene | Que se agrega |
|---|---|---|
| `src/app/api/webhooks/meta/route.ts` | Recibe mensajes, guarda en BD, auto-reply por keywords | Integrar motor de bot con flujos conversacionales |
| `src/lib/meta.ts` | sendWhatsApp/Instagram/Facebook + verify | Funcion para descargar media de WA (GET /{media-id}) |
| `src/lib/types.ts` | Tipos de Formulario, Cliente, etc. | Agregar campos nuevos a Cliente, tipo FlowContext |
| `src/app/(tienda)/contacto/page.tsx` | Formulario de contacto con upload | Leer query params ?ref= para prellenar datos |
| `src/app/api/upload/route.ts` | Guarda formulario + sync NextCloud | Disparar notificacion a PrintUp (email + WA) |

### Archivos NUEVOS:

| Archivo | Proposito |
|---|---|
| `src/lib/bot/engine.ts` | Motor principal del bot - procesa mensaje y decide respuesta |
| `src/lib/bot/flows/onboarding.ts` | Flujo de registro de cliente nuevo |
| `src/lib/bot/flows/menu.ts` | Menu principal y respuestas a opciones |
| `src/lib/bot/flows/upload-image.ts` | Recibir imagen por chat y crear formulario |
| `src/lib/bot/intents.ts` | Deteccion de intenciones (keywords + IA) |
| `src/lib/bot/ai.ts` | Integracion con Claude API para respuestas inteligentes |
| `src/lib/bot/notifications.ts` | Enviar avisos a PrintUp (email + WA) |
| `src/lib/bot/media.ts` | Descargar archivos de Meta Cloud API |
| `src/lib/bot/types.ts` | Tipos del bot |
| `src/app/api/webhooks/supabase/formulario/route.ts` | Webhook cuando se crea formulario -> notificar al cliente por WA |

---

## 3. Esquema de Base de Datos

### 3.1 - Modificar tabla `clientes`

```sql
-- Agregar columnas a la tabla clientes existente
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'persona';
  -- valores: 'persona' | 'empresa'
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS instagram_id TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS facebook_id TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS canal_origen TEXT;
  -- valores: 'whatsapp' | 'instagram' | 'facebook' | 'web'
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS onboarding_completo BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS conversacion_id TEXT;
  -- link a la conversacion activa en la tabla conversaciones

-- Indice para buscar por telefono rapido (bot busca por telefono)
CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp_phone ON clientes(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_clientes_instagram_id ON clientes(instagram_id);
CREATE INDEX IF NOT EXISTS idx_clientes_facebook_id ON clientes(facebook_id);
```

### 3.2 - Agregar contexto de flujo a `conversaciones`

```sql
-- La tabla conversaciones ya existe (Fase 7)
-- Solo agregar campo de contexto para el bot
ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS bot_context JSONB DEFAULT '{}';
-- Estructura del bot_context:
-- {
--   "flow": "onboarding" | "menu" | "upload_image" | null,
--   "step": 1,
--   "data": { "tipo_cliente": "persona", "nombre": "Maria", ... },
--   "cliente_id": "uuid-del-cliente" | null
-- }

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
-- Link directo al cliente registrado (null si aun no se registra)
```

### 3.3 - Cache de intenciones IA (opcional, optimizacion)

```sql
CREATE TABLE IF NOT EXISTS bot_intent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_hash TEXT UNIQUE NOT NULL,
  intent TEXT NOT NULL,
  confianza REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Limpiar cache viejo automaticamente
CREATE INDEX IF NOT EXISTS idx_bot_intent_cache_created ON bot_intent_cache(created_at);
```

---

## 4. Codigo Detallado

### 4.1 - Tipos del Bot

```typescript
// src/lib/bot/types.ts

export type BotFlow = "onboarding" | "menu" | "upload_image" | null;

export type BotIntent =
  | "saludo"
  | "cotizar"
  | "estado_pedido"
  | "catalogo"
  | "subir_archivo"
  | "horario"
  | "humano"
  | "precio"
  | "formulario"
  | "desconocido";

export interface BotContext {
  flow: BotFlow;
  step: number;
  data: Record<string, unknown>;
  cliente_id: string | null;
}

export interface BotResponse {
  messages: string[];          // Textos a enviar (pueden ser multiples)
  newContext: BotContext;       // Contexto actualizado
  notify?: {                   // Notificacion a PrintUp (opcional)
    type: "nuevo_cliente" | "nuevo_formulario" | "escalacion" | "imagen_recibida";
    data: Record<string, unknown>;
  };
  createFormulario?: {         // Crear formulario automatico (opcional)
    nombre: string;
    email: string;
    telefono: string;
    material: string;
    mensaje: string;
    archivos: { nombre: string; tamano: number; tipo: string; url: string }[];
  };
}

export interface IncomingMessage {
  canal: "whatsapp" | "instagram" | "facebook";
  senderId: string;
  senderName: string;
  senderPhone: string;
  senderUsername: string;
  messageId: string;
  tipo: "texto" | "imagen" | "audio" | "video" | "documento" | "sticker" | "ubicacion" | "template";
  contenido: string;
  mediaUrl: string;  // media ID para WA, URL directa para IG/FB
  mediaType: string;
}
```

### 4.2 - Motor del Bot

```typescript
// src/lib/bot/engine.ts

import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMessageByChannel } from "@/lib/meta";
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

/**
 * Procesa un mensaje entrante y ejecuta la logica del bot.
 * Se llama desde el webhook de Meta despues de guardar el mensaje en BD.
 */
export async function processBotMessage(
  conversacionId: string,
  msg: IncomingMessage
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // 1. Leer contexto actual de la conversacion
  const { data: conv } = await supabase
    .from("conversaciones")
    .select("bot_context, cliente_id, estado")
    .eq("id", conversacionId)
    .single();

  // Si la conversacion esta escalada a humano, no responder
  if (conv?.estado === "escalada" || conv?.estado === "archivada") return;

  const context: BotContext = (conv?.bot_context as BotContext) || { ...EMPTY_CONTEXT };

  // Si hay cliente_id en la conversacion, ponerlo en el contexto
  if (conv?.cliente_id && !context.cliente_id) {
    context.cliente_id = conv.cliente_id;
  }

  // 2. Determinar respuesta segun el estado del flujo
  let response: BotResponse;

  if (context.flow === "onboarding") {
    response = await handleOnboarding(context, msg);
  } else if (context.flow === "upload_image") {
    response = await handleUploadImage(context, msg);
  } else if (context.flow === "menu") {
    response = await handleMenu(context, msg);
  } else {
    // Sin flujo activo - detectar intencion
    response = await handleNewMessage(context, msg);
  }

  // 3. Enviar mensajes de respuesta
  for (const text of response.messages) {
    await sendMessageByChannel(msg.canal, msg.senderId, text);

    // Guardar mensaje saliente en BD
    await supabase.from("mensajes").insert({
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
    ultimo_mensaje: response.messages[response.messages.length - 1] || "",
    ultimo_mensaje_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Si se creo/encontro un cliente, linkear
  if (response.newContext.cliente_id) {
    updateData.cliente_id = response.newContext.cliente_id;
  }

  await supabase
    .from("conversaciones")
    .update(updateData)
    .eq("id", conversacionId);

  // 5. Crear formulario si el bot lo solicita
  if (response.createFormulario) {
    const { data: form } = await supabase
      .from("formularios")
      .insert({
        nombre: response.createFormulario.nombre,
        email: response.createFormulario.email,
        telefono: response.createFormulario.telefono,
        material: response.createFormulario.material,
        mensaje: response.createFormulario.mensaje,
        archivos: response.createFormulario.archivos,
        estado: "nuevo",
        nextcloud_synced: false,
        email_enviado: false,
      })
      .select("id")
      .single();

    // Actualizar notify con el formulario_id
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
  if (msg.tipo === "imagen" || msg.tipo === "documento") {
    return handleUploadImage(
      { ...context, flow: "upload_image", step: 0 },
      msg
    );
  }

  // Buscar si el contacto ya es cliente registrado
  const supabase = getSupabaseAdmin();
  const cliente = await findClienteByContact(supabase, msg);

  if (cliente) {
    context.cliente_id = cliente.id;
  }

  // Detectar intencion
  const intent = await detectIntent(msg.contenido);

  switch (intent) {
    case "saludo": {
      if (cliente?.onboarding_completo) {
        // Cliente recurrente
        return {
          messages: [
            `Hola ${cliente.nombre}! Que bueno verte de nuevo.\n\n` +
            `En que te puedo ayudar?\n\n` +
            `1. Cotizar un trabajo\n` +
            `2. Subir archivo/diseno\n` +
            `3. Ver catalogo\n` +
            `4. Estado de mi pedido\n` +
            `5. Horarios y ubicacion\n` +
            `6. Hablar con una persona`,
          ],
          newContext: { ...context, flow: "menu", step: 0, cliente_id: cliente.id },
        };
      } else {
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
        newContext: { ...context, flow: "menu", step: 0, data: { ...context.data, pending_action: "upload_choice" } },
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
        newContext: context,
      };

    case "catalogo":
      return {
        messages: [
          `Visita nuestro catalogo completo en:\n` +
          `printup.cl/productos\n\n` +
          `Tenemos poleras, pendones, tazones, adhesivos, DTF y mas!`,
        ],
        newContext: context,
      };

    case "humano":
      return {
        messages: [
          `Entendido, te conecto con un ejecutivo de PrintUp. ` +
          `Responderemos a la brevedad.`,
        ],
        newContext: { ...context, flow: null },
        notify: {
          type: "escalacion",
          data: {
            cliente_nombre: cliente?.nombre || msg.senderName || msg.senderId,
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
        newContext: { ...context, flow: "menu", step: 0, data: { ...context.data, pending_action: "cotizar" } },
      };

    case "estado_pedido":
      return {
        messages: [
          `Ingresa tu numero de pedido (ej: #1001) o el email con que compraste:`,
        ],
        newContext: { ...context, flow: "menu", step: 0, data: { ...context.data, pending_action: "estado_pedido" } },
      };

    default: {
      // Pregunta libre -> responder con IA
      const aiResponse = await handleAIResponse(msg.contenido, cliente);
      return {
        messages: [aiResponse],
        newContext: context,
      };
    }
  }
}

/**
 * Busca un cliente registrado por telefono, instagram_id o facebook_id
 */
async function findClienteByContact(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  msg: IncomingMessage
) {
  let query;

  if (msg.canal === "whatsapp" && msg.senderPhone) {
    query = supabase
      .from("clientes")
      .select("*")
      .eq("whatsapp_phone", msg.senderPhone);
  } else if (msg.canal === "instagram") {
    query = supabase
      .from("clientes")
      .select("*")
      .eq("instagram_id", msg.senderId);
  } else if (msg.canal === "facebook") {
    query = supabase
      .from("clientes")
      .select("*")
      .eq("facebook_id", msg.senderId);
  } else {
    return null;
  }

  const { data } = await query.limit(1).single();
  return data;
}
```

### 4.3 - Flujo de Onboarding

```typescript
// src/lib/bot/flows/onboarding.ts

import { getSupabaseAdmin } from "@/lib/supabase";
import type { BotContext, BotResponse, IncomingMessage } from "../types";

/**
 * Flujo de registro de cliente nuevo.
 * Steps:
 *   1: Preguntar persona/empresa
 *   2: Pedir nombre
 *   3: Pedir email
 *   4: (Si empresa) Pedir razon social y RUT
 *   5: Confirmar y guardar
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
          messages: ["Perfecto! Como te llamas? (tu nombre de contacto)"],
          newContext: { ...context, step: 2, data },
        };
      }
      // No entendio
      return {
        messages: [
          "No entendi. Responde con:\n\n1. Persona natural\n2. Empresa",
        ],
        newContext: context,
      };
    }

    // ---- STEP 2: Nombre ----
    case 2: {
      // Validar que parece un nombre (al menos 2 caracteres, no es un numero)
      if (text.length < 2 || /^\d+$/.test(text)) {
        return {
          messages: ["Ingresa tu nombre completo (ej: Maria Gonzalez):"],
          newContext: context,
        };
      }
      data.nombre = text;

      // Si tenemos el nombre del perfil de WA y no lo escribio, usar ese
      if (!data.nombre && msg.senderName) {
        data.nombre = msg.senderName;
      }

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
      // Intentar parsear "Razon Social - RUT"
      const parts = text.split(/[-–]/).map((s: string) => s.trim());
      data.razon_social = parts[0] || text;
      data.rut = parts[1] || "";

      return finishOnboarding(context, data, msg);
    }

    default:
      return {
        messages: ["Algo salio mal. Empecemos de nuevo.\n\nEres persona o empresa?\n1. Persona\n2. Empresa"],
        newContext: { ...context, step: 1, data: {} },
      };
  }
}

/**
 * Guarda el cliente en BD y muestra el menu principal
 */
async function finishOnboarding(
  context: BotContext,
  data: Record<string, string>,
  msg: IncomingMessage
): Promise<BotResponse> {
  const supabase = getSupabaseAdmin();

  // Construir objeto de cliente
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

  // Verificar si ya existe un cliente con ese email
  const { data: existing } = await supabase
    .from("clientes")
    .select("id")
    .eq("email", data.email)
    .limit(1)
    .single();

  let clienteId: string;

  if (existing) {
    // Actualizar cliente existente con datos de RRSS
    await supabase
      .from("clientes")
      .update({
        ...clienteData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    clienteId = existing.id;
  } else {
    // Crear nuevo cliente (sin auth.users, es cliente de RRSS)
    const { data: newCliente, error } = await supabase
      .from("clientes")
      .insert({
        ...clienteData,
        id: crypto.randomUUID(), // ID propio, no ligado a auth.users
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
          `En que te puedo ayudar?\n\n` +
          `1. Cotizar un trabajo\n` +
          `2. Subir archivo/diseno\n` +
          `3. Ver catalogo\n` +
          `4. Estado de mi pedido\n` +
          `5. Horarios y ubicacion\n` +
          `6. Hablar con una persona`,
        ],
        newContext: { flow: "menu", step: 0, data: {}, cliente_id: null },
      };
    }
    clienteId = newCliente.id;
  }

  const tipoLabel = data.tipo_cliente === "empresa"
    ? ` (${data.razon_social || "empresa"})`
    : "";

  return {
    messages: [
      `Listo ${data.nombre}${tipoLabel}! Quedaste registrado.\n\n` +
      `En que te puedo ayudar?\n\n` +
      `1. Cotizar un trabajo\n` +
      `2. Subir archivo/diseno\n` +
      `3. Ver catalogo\n` +
      `4. Estado de mi pedido\n` +
      `5. Horarios y ubicacion\n` +
      `6. Hablar con una persona`,
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
```

### 4.4 - Flujo de Subida de Imagen por Chat

```typescript
// src/lib/bot/flows/upload-image.ts

import { getSupabaseAdmin } from "@/lib/supabase";
import { downloadMetaMedia } from "../media";
import type { BotContext, BotResponse, IncomingMessage } from "../types";

/**
 * Maneja la recepcion de imagenes/documentos directamente por chat.
 * Steps:
 *   0: Recibir imagen (se llama automaticamente cuando detecta tipo=imagen)
 *   1: Preguntar tipo de impresion
 *   2: Preguntar instrucciones adicionales
 */
export async function handleUploadImage(
  context: BotContext,
  msg: IncomingMessage
): Promise<BotResponse> {
  const data = { ...context.data } as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  switch (context.step) {
    // ---- STEP 0: Recibir imagen ----
    case 0: {
      if (msg.tipo !== "imagen" && msg.tipo !== "documento") {
        return {
          messages: [
            "Enviame la imagen o archivo de tu diseno directamente aqui.\n\n" +
            "Formatos aceptados: JPG, PNG, PDF, AI, PSD",
          ],
          newContext: { ...context, flow: "upload_image", step: 0 },
        };
      }

      // Descargar media de Meta
      const mediaResult = await downloadMetaMedia(msg.mediaUrl, msg.canal);

      if (!mediaResult) {
        return {
          messages: [
            "No pude descargar tu archivo. Intenta enviarlo de nuevo, " +
            "o usa nuestro formulario web: printup.cl/contacto",
          ],
          newContext: { ...context, flow: null },
        };
      }

      // Subir a Supabase Storage
      const fileName = `chat_${Date.now()}_${mediaResult.fileName}`;
      const storagePath = `formularios/chat/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("archivos")
        .upload(storagePath, mediaResult.buffer, {
          contentType: mediaResult.mimeType,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return {
          messages: [
            "Hubo un error al guardar tu archivo. " +
            "Intenta de nuevo o usa printup.cl/contacto",
          ],
          newContext: { ...context, flow: null },
        };
      }

      // Obtener URL publica
      const { data: urlData } = supabase.storage
        .from("archivos")
        .getPublicUrl(storagePath);

      data.archivo = {
        nombre: mediaResult.fileName,
        tamano: mediaResult.buffer.byteLength,
        tipo: mediaResult.mimeType,
        url: urlData.publicUrl,
        storage_path: storagePath,
      };

      return {
        messages: [
          "Recibi tu archivo!\n\n" +
          "Que tipo de impresion necesitas?\n\n" +
          "1. DTF Textil (poleras, telas)\n" +
          "2. DTF UV (rigidos, stickers)\n" +
          "3. Sublimacion\n" +
          "4. Vinilo / Pendones\n" +
          "5. No se, asesórame",
        ],
        newContext: { ...context, step: 1, data },
      };
    }

    // ---- STEP 1: Tipo de impresion ----
    case 1: {
      const tipos: Record<string, string> = {
        "1": "DTF Textil",
        "2": "DTF UV",
        "3": "Sublimacion",
        "4": "Vinilo / Pendones",
        "5": "Por definir",
      };

      const text = msg.contenido.trim();
      data.material = tipos[text] || text;

      return {
        messages: [
          "Alguna instruccion adicional? (cantidad, tamano, acabado, etc.)\n\n" +
          "Si no tienes, escribe 'No' y listo.",
        ],
        newContext: { ...context, step: 2, data },
      };
    }

    // ---- STEP 2: Instrucciones + Crear formulario ----
    case 2: {
      const text = msg.contenido.trim();
      data.mensaje = text.toLowerCase() === "no" ? "" : text;

      // Buscar datos del cliente
      let nombre = "Cliente por chat";
      let email = "";
      let telefono = msg.senderPhone || "";

      if (context.cliente_id) {
        const { data: cliente } = await supabase
          .from("clientes")
          .select("nombre, email, telefono")
          .eq("id", context.cliente_id)
          .single();

        if (cliente) {
          nombre = cliente.nombre || nombre;
          email = cliente.email || "";
          telefono = cliente.telefono || telefono;
        }
      }

      const archivo = data.archivo as Record<string, unknown>;

      return {
        messages: [
          `Perfecto! Tu solicitud quedo registrada:\n\n` +
          `Archivo: ${(archivo?.nombre as string) || "imagen"}\n` +
          `Material: ${data.material}\n` +
          `${data.mensaje ? `Notas: ${data.mensaje}\n` : ""}` +
          `\nEstamos revisando tu imagen y te contactaremos pronto!`,
        ],
        newContext: { ...context, flow: null, step: 0, data: {} },
        createFormulario: {
          nombre,
          email,
          telefono,
          material: data.material as string,
          mensaje: `[Via ${msg.canal}] ${data.mensaje || "Sin instrucciones adicionales"}`,
          archivos: archivo
            ? [
                {
                  nombre: archivo.nombre as string,
                  tamano: archivo.tamano as number,
                  tipo: archivo.tipo as string,
                  url: archivo.url as string,
                },
              ]
            : [],
        },
        notify: {
          type: "imagen_recibida",
          data: {
            cliente_nombre: nombre,
            material: data.material,
            canal: msg.canal,
          },
        },
      };
    }

    default:
      return {
        messages: ["Enviame tu imagen o archivo para continuar."],
        newContext: { ...context, step: 0 },
      };
  }
}
```

### 4.5 - Descarga de Media de Meta

```typescript
// src/lib/bot/media.ts

import { getMetaConfig } from "@/lib/meta";

interface MediaDownloadResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Descarga un archivo de la API de Meta.
 *
 * WhatsApp: envia un media_id que primero hay que resolver a URL
 *           GET https://graph.facebook.com/v21.0/{media-id}
 *           -> { url: "https://..." }
 *           -> GET url con Authorization header
 *
 * Instagram/Facebook: envia URL directa del attachment
 */
export async function downloadMetaMedia(
  mediaIdOrUrl: string,
  canal: string
): Promise<MediaDownloadResult | null> {
  try {
    const config = await getMetaConfig();
    let downloadUrl: string;
    let mimeType = "application/octet-stream";

    if (canal === "whatsapp") {
      // Paso 1: Obtener URL real del media
      const mediaInfoRes = await fetch(
        `https://graph.facebook.com/v21.0/${mediaIdOrUrl}`,
        {
          headers: { Authorization: `Bearer ${config.pageAccessToken}` },
        }
      );

      if (!mediaInfoRes.ok) {
        console.error("Error fetching media info:", await mediaInfoRes.text());
        return null;
      }

      const mediaInfo = await mediaInfoRes.json();
      downloadUrl = mediaInfo.url;
      mimeType = mediaInfo.mime_type || mimeType;
    } else {
      // Instagram/Facebook: URL directa
      downloadUrl = mediaIdOrUrl;
    }

    if (!downloadUrl) return null;

    // Paso 2: Descargar el archivo
    const downloadRes = await fetch(downloadUrl, {
      headers:
        canal === "whatsapp"
          ? { Authorization: `Bearer ${config.pageAccessToken}` }
          : {},
    });

    if (!downloadRes.ok) {
      console.error("Error downloading media:", downloadRes.status);
      return null;
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determinar extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
      "image/svg+xml": "svg",
    };
    const ext = extMap[mimeType] || "bin";
    const fileName = `diseno_${Date.now()}.${ext}`;

    return { buffer, mimeType, fileName };
  } catch (error) {
    console.error("downloadMetaMedia error:", error);
    return null;
  }
}
```

### 4.6 - Deteccion de Intenciones

```typescript
// src/lib/bot/intents.ts

import type { BotIntent } from "./types";

/**
 * Detecta la intencion del mensaje.
 * Primero intenta con keywords (gratis, instantaneo).
 * Si no matchea, usa Claude Haiku como fallback.
 */
export async function detectIntent(text: string): Promise<BotIntent> {
  const intent = detectByKeywords(text);
  if (intent !== "desconocido") return intent;

  // Fallback: clasificar con IA (solo si no matcheo keywords)
  return classifyWithAI(text);
}

function detectByKeywords(text: string): BotIntent {
  const lower = text.toLowerCase().trim();

  const keywords: Record<BotIntent, string[]> = {
    saludo: [
      "hola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
      "hey", "menu", "inicio", "empezar", "hi", "hello",
    ],
    cotizar: [
      "cotizar", "cotizacion", "presupuesto", "cuanto cuesta",
      "cuanto sale", "cuanto vale",
    ],
    precio: [
      "precio", "precios", "tarifa", "tarifas", "valor",
    ],
    estado_pedido: [
      "pedido", "mi pedido", "seguimiento", "tracking",
      "donde esta mi", "estado",
    ],
    catalogo: [
      "productos", "catalogo", "que venden", "que tienen",
      "ver productos", "que ofrecen",
    ],
    subir_archivo: [
      "subir", "enviar diseno", "mandar archivo", "enviar archivo",
      "adjuntar", "imagen", "foto",
    ],
    formulario: [
      "formulario", "contacto", "formulario web",
    ],
    horario: [
      "horario", "direccion", "donde quedan", "ubicacion",
      "atencion", "abierto", "cerrado", "como llego",
    ],
    humano: [
      "persona", "humano", "ejecutivo", "hablar con alguien",
      "agente", "ayuda real",
    ],
    desconocido: [],
  };

  // Tambien detectar opciones numericas del menu
  if (lower === "1") return "cotizar";
  if (lower === "2") return "subir_archivo";
  if (lower === "3") return "catalogo";
  if (lower === "4") return "estado_pedido";
  if (lower === "5") return "horario";
  if (lower === "6") return "humano";

  for (const [intent, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) {
      return intent as BotIntent;
    }
  }

  return "desconocido";
}

/**
 * Clasifica con Claude Haiku API cuando keywords no matchean.
 * Costo: ~$0.0005 por llamada.
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
    const classification = (data.content?.[0]?.text || "").trim().toLowerCase();

    const validIntents: BotIntent[] = [
      "saludo", "cotizar", "precio", "estado_pedido", "catalogo",
      "subir_archivo", "formulario", "horario", "humano",
    ];

    if (validIntents.includes(classification as BotIntent)) {
      return classification as BotIntent;
    }

    return "desconocido";
  } catch {
    return "desconocido";
  }
}
```

### 4.7 - Respuestas con IA

```typescript
// src/lib/bot/ai.ts

import { getSupabaseAdmin } from "@/lib/supabase";

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
    // Obtener productos para contexto
    const supabase = getSupabaseAdmin();
    const { data: productos } = await supabase
      .from("productos")
      .select("nombre, precio, stock")
      .eq("activo", true)
      .limit(15);

    const productosCtx = (productos || [])
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
```

### 4.8 - Notificaciones a PrintUp

```typescript
// src/lib/bot/notifications.ts

import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/meta";
import type { IncomingMessage } from "./types";

const PRINTUP_PHONE = "56966126645"; // Numero de PrintUp
const PRINTUP_EMAIL = "guerrafelipe93@gmail.com"; // Email de notificaciones
const ADMIN_URL = "https://printup.cl/admin"; // URL del admin panel

interface NotifyPayload {
  type: "nuevo_cliente" | "nuevo_formulario" | "escalacion" | "imagen_recibida";
  data: Record<string, unknown>;
}

export async function notifyPrintUp(
  payload: NotifyPayload,
  msg: IncomingMessage
): Promise<void> {
  const subject = getSubject(payload);
  const body = getBody(payload);
  const whatsappMsg = getWhatsAppMsg(payload);

  // Enviar email
  await sendEmailNotification(subject, body);

  // Enviar WhatsApp al numero de PrintUp
  await sendWhatsAppNotification(whatsappMsg);
}

function getSubject(payload: NotifyPayload): string {
  switch (payload.type) {
    case "nuevo_cliente":
      return `Nuevo cliente: ${payload.data.nombre} (${payload.data.canal})`;
    case "nuevo_formulario":
      return `Nuevo formulario: ${payload.data.cliente_nombre}`;
    case "escalacion":
      return `Atencion requerida: ${payload.data.cliente_nombre} pide hablar con persona`;
    case "imagen_recibida":
      return `Nueva imagen recibida: ${payload.data.cliente_nombre} - ${payload.data.material}`;
    default:
      return "Notificacion PrintUp Bot";
  }
}

function getBody(payload: NotifyPayload): string {
  const d = payload.data;
  switch (payload.type) {
    case "nuevo_cliente":
      return (
        `<h2>Nuevo cliente registrado via bot</h2>` +
        `<p><strong>Nombre:</strong> ${d.nombre}</p>` +
        `<p><strong>Email:</strong> ${d.email}</p>` +
        `<p><strong>Tipo:</strong> ${d.tipo}</p>` +
        `<p><strong>Canal:</strong> ${d.canal}</p>` +
        `<p><a href="${ADMIN_URL}/contactos">Ver en admin</a></p>`
      );
    case "imagen_recibida":
      return (
        `<h2>Imagen recibida por chat</h2>` +
        `<p><strong>Cliente:</strong> ${d.cliente_nombre}</p>` +
        `<p><strong>Material:</strong> ${d.material}</p>` +
        `<p><strong>Canal:</strong> ${d.canal}</p>` +
        (d.formulario_id
          ? `<p><a href="${ADMIN_URL}/formularios/${d.formulario_id}">Ver formulario</a></p>`
          : "")
      );
    case "escalacion":
      return (
        `<h2>Cliente solicita atencion humana</h2>` +
        `<p><strong>Cliente:</strong> ${d.cliente_nombre}</p>` +
        `<p><strong>Canal:</strong> ${d.canal}</p>` +
        `<p><strong>Mensaje:</strong> ${d.mensaje}</p>` +
        `<p><a href="${ADMIN_URL}/mensajeria">Ir a mensajeria</a></p>`
      );
    default:
      return `<p>Notificacion del bot: ${JSON.stringify(d)}</p>`;
  }
}

function getWhatsAppMsg(payload: NotifyPayload): string {
  const d = payload.data;
  switch (payload.type) {
    case "nuevo_cliente":
      return `[Bot] Nuevo cliente: ${d.nombre} (${d.tipo}) via ${d.canal}`;
    case "imagen_recibida":
      return (
        `[Bot] Imagen recibida de ${d.cliente_nombre}\n` +
        `Material: ${d.material}\n` +
        `Ver: ${ADMIN_URL}/formularios/${d.formulario_id || ""}`
      );
    case "escalacion":
      return (
        `[Bot] ${d.cliente_nombre} pide hablar con persona\n` +
        `Canal: ${d.canal}\n` +
        `Ver: ${ADMIN_URL}/mensajeria`
      );
    default:
      return `[Bot] Notificacion: ${payload.type}`;
  }
}

async function sendEmailNotification(subject: string, html: string) {
  try {
    const supabase = getSupabaseAdmin();
    let apiKey = process.env.RESEND_API_KEY || "";

    const { data: config } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "resend_api_key")
      .single();
    if (config?.valor) apiKey = config.valor;

    if (!apiKey) return;

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.FROM_NAME || "PrintUp Bot";

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [PRINTUP_EMAIL],
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1B2A6B,#00B4D8);padding:16px 24px;">
            <h1 style="color:#fff;margin:0;font-size:16px;">PrintUp Bot</h1>
          </div>
          <div style="padding:24px;background:#fff;">
            ${html}
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("Email notification error:", e);
  }
}

async function sendWhatsAppNotification(message: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: config } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "meta_page_access_token")
      .single();

    const { data: phoneConfig } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "meta_whatsapp_phone_number_id")
      .single();

    const token = config?.valor;
    const phoneId = phoneConfig?.valor;

    if (!token || !phoneId) return;

    await sendWhatsAppMessage(PRINTUP_PHONE, message, token, phoneId);
  } catch (e) {
    console.error("WhatsApp notification error:", e);
  }
}
```

### 4.9 - Menu Principal

```typescript
// src/lib/bot/flows/menu.ts

import type { BotContext, BotResponse, IncomingMessage } from "../types";

/**
 * Maneja las opciones del menu principal.
 * Redirige a otros flujos o responde directamente.
 */
export async function handleMenu(
  context: BotContext,
  msg: IncomingMessage
): Promise<BotResponse> {
  const text = msg.contenido.trim().toLowerCase();
  const pending = context.data.pending_action as string | undefined;

  // Manejar opcion pendiente de upload choice
  if (pending === "upload_choice") {
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
    if (text === "2" || text.includes("formulario") || text.includes("web")) {
      const refParam = context.cliente_id ? `?ref=${context.cliente_id}` : "";
      return {
        messages: [
          `Abre este link para llenar el formulario:\n\n` +
          `printup.cl/contacto${refParam}\n\n` +
          `Ahi puedes subir archivos de hasta 50MB.`,
        ],
        newContext: { ...context, flow: null, data: {} },
      };
    }
  }

  // Opciones del menu estandar
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
        newContext: { ...context, data: { ...context.data, pending_action: "cotizar" } },
      };

    case "2":
      return {
        messages: [
          `Puedes enviarme la imagen directamente aqui, ` +
          `o llenar nuestro formulario web:\n\n` +
          `printup.cl/contacto\n\n` +
          `Que prefieres?\n1. Enviar imagen aqui\n2. Ir al formulario web`,
        ],
        newContext: { ...context, data: { ...context.data, pending_action: "upload_choice" } },
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
        messages: ["Ingresa tu numero de pedido (ej: #1001) o tu email:"],
        newContext: { ...context, data: { ...context.data, pending_action: "estado_pedido" } },
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
        notify: {
          type: "escalacion",
          data: {
            cliente_nombre: msg.senderName || msg.senderId,
            canal: msg.canal,
            mensaje: "Solicito hablar con persona",
          },
        },
      };

    default:
      // Si no es opcion valida, salir del menu y procesar como mensaje libre
      return {
        messages: [
          "No entendi esa opcion. Puedo ayudarte con:\n\n" +
          "1. Cotizar un trabajo\n" +
          "2. Subir archivo/diseno\n" +
          "3. Ver catalogo\n" +
          "4. Estado de mi pedido\n" +
          "5. Horarios y ubicacion\n" +
          "6. Hablar con una persona",
        ],
        newContext: context,
      };
  }
}
```

---

## 5. Modificacion al Webhook Existente

El cambio principal en `src/app/api/webhooks/meta/route.ts` es reemplazar la funcion `checkAndSendAutoReply` por el motor del bot:

```typescript
// En processIncomingMessage(), reemplazar la linea 383-391:

// ANTES (borrar):
// if (msg.contenido) {
//   await checkAndSendAutoReply(supabase, conversacionId, msg, accessToken);
// }

// DESPUES (nuevo):
import { processBotMessage } from "@/lib/bot/engine";

// ... dentro de processIncomingMessage, al final:

// 3. Procesar con el motor del bot (reemplaza auto-reply basico)
await processBotMessage(conversacionId, msg);
```

Se mantiene toda la logica de parsing de mensajes y creacion de conversaciones. Solo cambia la parte de respuesta.

---

## 6. Modificacion al Formulario Web

Agregar lectura de query param `ref` para prellenar datos del cliente:

```typescript
// En src/app/(tienda)/contacto/page.tsx
// Agregar al inicio del componente:

import { useSearchParams } from "next/navigation";

// Dentro del componente:
const searchParams = useSearchParams();
const clienteRef = searchParams.get("ref");

// useEffect para prellenar si viene ref
useEffect(() => {
  if (!clienteRef) return;

  fetch(`/api/clientes/${clienteRef}`)
    .then(res => res.json())
    .then(data => {
      if (data.nombre) {
        (document.getElementById("nombre") as HTMLInputElement).value = data.nombre;
      }
      if (data.email) {
        (document.getElementById("email") as HTMLInputElement).value = data.email;
      }
      if (data.telefono) {
        (document.getElementById("telefono") as HTMLInputElement).value = data.telefono;
      }
    })
    .catch(() => {}); // silenciar si falla
}, [clienteRef]);
```

---

## 7. Variable de Entorno Nueva

```env
# Agregar a .env.local
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

Esta es la unica variable nueva necesaria. Todo lo demas ya esta configurado.

---

## 8. Resumen de Archivos a Crear/Modificar

### Crear (8 archivos nuevos):
```
src/lib/bot/types.ts              - Tipos del bot
src/lib/bot/engine.ts             - Motor principal
src/lib/bot/intents.ts            - Deteccion de intenciones
src/lib/bot/ai.ts                 - Respuestas con Claude
src/lib/bot/media.ts              - Descarga de media de Meta
src/lib/bot/notifications.ts      - Notificaciones a PrintUp
src/lib/bot/flows/onboarding.ts   - Flujo de registro
src/lib/bot/flows/menu.ts         - Menu principal
src/lib/bot/flows/upload-image.ts - Recibir imagen por chat
```

### Modificar (3 archivos existentes):
```
src/app/api/webhooks/meta/route.ts  - Integrar motor del bot
src/app/(tienda)/contacto/page.tsx  - Prellenar con ref=clienteId
src/lib/types.ts                    - Agregar campos a Cliente
```

### SQL (1 migracion):
```
supabase/schema-fase11.sql          - ALTER TABLE clientes + conversaciones
```

---

## 9. Orden de Construccion con Claude Code

```
Paso 1: SQL - Ejecutar migracion en Supabase (ALTER TABLE)
Paso 2: src/lib/bot/types.ts
Paso 3: src/lib/bot/intents.ts
Paso 4: src/lib/bot/ai.ts
Paso 5: src/lib/bot/media.ts
Paso 6: src/lib/bot/notifications.ts
Paso 7: src/lib/bot/flows/onboarding.ts
Paso 8: src/lib/bot/flows/menu.ts
Paso 9: src/lib/bot/flows/upload-image.ts
Paso 10: src/lib/bot/engine.ts
Paso 11: Modificar webhooks/meta/route.ts (integrar bot)
Paso 12: Modificar contacto/page.tsx (prellenar ref)
Paso 13: Agregar ANTHROPIC_API_KEY a .env.local
Paso 14: Testear flujo completo
```

---

## 10. Casos de Prueba

| # | Escenario | Input | Respuesta esperada |
|---|---|---|---|
| 1 | Primer mensaje de cliente nuevo | "Hola" | Pregunta persona/empresa |
| 2 | Responde tipo | "1" (persona) | Pide nombre |
| 3 | Da nombre | "Maria Gonzalez" | Pide email |
| 4 | Da email | "maria@gmail.com" | Registra + muestra menu |
| 5 | Cliente recurrente saluda | "Hola" | Saludo personalizado + menu |
| 6 | Pregunta horario | "Donde quedan?" | Info de direccion/horario |
| 7 | Quiere subir archivo | "2" (del menu) | Ofrece chat o formulario web |
| 8 | Elige enviar por chat | "1" | Pide que envie imagen |
| 9 | Envia foto | [imagen] | Descarga, guarda, pide tipo impresion |
| 10 | Elige tipo | "1" (DTF Textil) | Pide instrucciones |
| 11 | Da instrucciones | "50cm x 1m, mate" | Crea formulario + notifica PrintUp |
| 12 | Pregunta libre | "Pueden hacer stickers transparentes?" | Claude responde contextualizado |
| 13 | Quiere humano | "6" | Escala + notifica PrintUp |
| 14 | Empresa nueva | "2" en step 1 | Pide nombre, email, razon social + RUT |
| 15 | Formulario web con ref | Abre /contacto?ref=uuid | Campos prellenados |
