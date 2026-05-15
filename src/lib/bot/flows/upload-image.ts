import { getSupabaseAdmin } from "@/lib/supabase";
import { downloadMetaMedia } from "../media";
import type { BotContext, BotResponse, IncomingMessage } from "../types";

/**
 * Maneja la recepcion de imagenes/documentos directamente por chat.
 * Steps:
 *   0: Recibir imagen
 *   1: Preguntar tipo de impresion
 *   2: Preguntar instrucciones adicionales -> crear formulario
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
      if (
        msg.tipo !== "imagen" &&
        msg.tipo !== "documento" &&
        msg.tipo !== "video"
      ) {
        return {
          messages: [
            "Enviame la imagen o archivo de tu diseno directamente aqui.\n\n" +
              "Formatos aceptados: JPG, PNG, PDF, AI, PSD",
          ],
          newContext: { ...context, flow: "upload_image", step: 0 },
        };
      }

      // Descargar media de Meta
      const mediaResult = await downloadMetaMedia(
        msg.mediaUrl,
        msg.canal
      );

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
            "5. No se, asesorame",
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
      let nombre = msg.senderName || "Cliente por chat";
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
      const archivoNombre = (archivo?.nombre as string) || "imagen";

      return {
        messages: [
          `Perfecto! Tu solicitud quedo registrada:\n\n` +
            `Archivo: ${archivoNombre}\n` +
            `Material: ${data.material}\n` +
            `${data.mensaje ? `Notas: ${data.mensaje}\n` : ""}` +
            `\nEstamos revisando tu imagen y te contactaremos pronto!`,
        ],
        newContext: {
          ...context,
          flow: null,
          step: 0,
          data: {},
        },
        createFormulario: {
          nombre,
          email,
          telefono,
          material: data.material as string,
          mensaje: `[Via ${msg.canal}] ${(data.mensaje as string) || "Sin instrucciones adicionales"}`,
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
