/**
 * Niveles de autonomía del bot (Patrón 7).
 *  - verde   : info segura -> el bot responde solo.
 *  - amarillo: cotización / propuesta -> borrador a la cola de aprobación.
 *  - rojo    : pago, reclamo, dato sensible -> escala a humano.
 *
 * Clasificación híbrida: primero keywords (gratis); si no matchea, el llamador
 * puede recurrir a Claude (ver ai.ts) y cachear el resultado (bot_intent_cache).
 */
export type Nivel = "verde" | "amarillo" | "rojo";

const ROJO = [
  "pagué", "pague", "ya pague", "transferí", "transferi", "comprobante",
  "reclamo", "queja", "estafa", "denuncia", "abogado", "demanda",
  "factura", "boleta", "sii", "confirmen", "confírmenme", "urgente",
  "no llegó", "no llego", "molesto", "pésimo", "pesimo",
];

const AMARILLO = [
  "cotiz", "cotizar", "presupuesto", "precio", "cuánto", "cuanto", "valor",
  "descuento", "mayorista", "por mayor",
];

/** Clasifica un texto en un nivel de autonomía por keywords. */
export function clasificarNivel(texto: string): Nivel {
  const t = texto.toLowerCase();
  if (ROJO.some((k) => t.includes(k))) return "rojo";
  if (AMARILLO.some((k) => t.includes(k))) return "amarillo";
  return "verde";
}

/** Nivel asociado a un intent ya detectado (cuando aplica). */
export function nivelDeIntent(intent: string): Nivel | null {
  switch (intent) {
    case "cotizar":
    case "precio":
      return "amarillo";
    default:
      return null;
  }
}
