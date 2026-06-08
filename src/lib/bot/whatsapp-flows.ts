/**
 * WhatsApp Flows (Fase F3) — formularios in-chat para tomar datos sin salir del
 * chat (tipo de trabajo, cantidad, medidas). ANDAMIAJE documentado: el Flow se
 * publica en Meta (Flow Builder) y se referencia por `flow_id`; aquí queda la
 * definición JSON, el parser de la respuesta y el puente al MISMO motor de
 * precios (`calcularCotizacion` / `cotizarGangSheet`). No se prueba contra Meta
 * en este repo (requiere número y app aprobada); ver wiki para el wiring.
 *
 * Refs: WhatsApp Business Platform — Flows (formularios), catálogo nativo y
 * plantillas. Cumplimiento 2026: bot acotado a tareas + opt-in para promos.
 */
import { calcularCotizacion, cotizarGangSheet, type Cotizacion } from "./pricing";
import type { GangSheetResult } from "@/server/domain/gang-sheet";

/** Definición del Flow de cotización (se publica en Meta Flow Builder). */
export const FLOW_COTIZACION = {
  version: "7.0",
  screens: [
    {
      id: "COTIZAR",
      title: "Cotiza tu impresión",
      terminal: true,
      data: {},
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "Dropdown",
            name: "tipo",
            label: "Tipo de impresión",
            required: true,
            "data-source": [
              { id: "DTF Textil", title: "DTF Textil (poleras, telas)" },
              { id: "DTF UV", title: "DTF UV (rígidos, stickers)" },
              { id: "Sublimacion", title: "Sublimación" },
            ],
          },
          {
            type: "TextInput",
            name: "cantidad",
            label: "Cantidad (unidades)",
            "input-type": "number",
            required: true,
          },
          {
            type: "Footer",
            label: "Cotizar",
            "on-click-action": {
              name: "complete",
              payload: { tipo: "${form.tipo}", cantidad: "${form.cantidad}" },
            },
          },
        ],
      },
    },
  ],
} as const;

export interface FlowCotizacionData {
  tipo: string;
  cantidad: number;
}

/** Extrae {tipo, cantidad} de la respuesta de un Flow (payload de Meta). */
export function parseFlowCotizacion(
  payload: Record<string, unknown> | null | undefined
): FlowCotizacionData | null {
  if (!payload) return null;
  const tipo = String(payload.tipo ?? "").trim();
  const cantidad = parseInt(String(payload.cantidad ?? "").replace(/\D/g, ""), 10);
  if (!tipo || !cantidad || cantidad < 1) return null;
  return { tipo, cantidad };
}

/** Cotiza la respuesta del Flow con el MISMO motor que la web/menú. */
export async function cotizarDesdeFlow(
  data: FlowCotizacionData
): Promise<Cotizacion | null> {
  return calcularCotizacion({ tipo: data.tipo, cantidad: data.cantidad });
}

/** Cotiza un pliego desde un Flow de gang sheet (medidas in-chat). */
export async function cotizarPliegoDesdeFlow(input: {
  material: string;
  items: { w_cm: number; h_cm: number; cantidad?: number }[];
}): Promise<GangSheetResult> {
  return cotizarGangSheet({ material: input.material, items: input.items });
}

/**
 * Mensaje interactivo que ABRE el Flow (para enviar por Cloud API). Se envía con
 * POST /{phone-number-id}/messages. `flowId` y `flowToken` vienen de Meta.
 */
export function construirMensajeFlow(opts: {
  to: string;
  flowId: string;
  flowToken: string;
  cta?: string;
}): Record<string, unknown> {
  return {
    messaging_product: "whatsapp",
    to: opts.to,
    type: "interactive",
    interactive: {
      type: "flow",
      body: { text: "Cotiza tu impresión en 10 segundos 👇" },
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3",
          flow_token: opts.flowToken,
          flow_id: opts.flowId,
          flow_cta: opts.cta || "Cotizar ahora",
          flow_action: "navigate",
          flow_action_payload: { screen: "COTIZAR" },
        },
      },
    },
  };
}
