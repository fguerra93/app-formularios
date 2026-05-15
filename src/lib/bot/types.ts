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
  messages: string[];
  newContext: BotContext;
  notify?: {
    type:
      | "nuevo_cliente"
      | "nuevo_formulario"
      | "escalacion"
      | "imagen_recibida";
    data: Record<string, unknown>;
  };
  createFormulario?: {
    nombre: string;
    email: string;
    telefono: string;
    material: string;
    mensaje: string;
    archivos: {
      nombre: string;
      tamano: number;
      tipo: string;
      url: string;
    }[];
  };
  escalate?: boolean;
}

export interface IncomingMessage {
  canal: "whatsapp" | "instagram" | "facebook";
  senderId: string;
  senderName: string;
  senderPhone: string;
  senderUsername: string;
  messageId: string;
  tipo:
    | "texto"
    | "imagen"
    | "audio"
    | "video"
    | "documento"
    | "sticker"
    | "ubicacion"
    | "template";
  contenido: string;
  mediaUrl: string;
  mediaType: string;
}
