/**
 * Máquina de estados de pedidos (Patrón 1). Pura: define las transiciones
 * permitidas y rechaza saltos ilegales. Refleja los estados REALES que usa la
 * app (pendiente → confirmado → preparando → enviado → entregado, con ramas
 * cancelado/devuelto), no nombres idealizados.
 */
export type EstadoPedido =
  | "pendiente"
  | "confirmado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "devuelto";

const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["preparando", "enviado", "cancelado"],
  preparando: ["enviado", "cancelado"],
  enviado: ["entregado", "devuelto"],
  entregado: ["devuelto"],
  cancelado: [],
  devuelto: [],
};

export const ESTADOS = Object.keys(TRANSICIONES) as EstadoPedido[];

function esEstadoConocido(e: string): e is EstadoPedido {
  return e in TRANSICIONES;
}

/** ¿Es válida la transición `from → to`? Mismo estado = no-op permitido. */
export function puedeTransicionar(from: string, to: string): boolean {
  if (from === to) return true;
  // Estados legados desconocidos: no bloquear (no romper pedidos antiguos).
  if (!esEstadoConocido(from)) return true;
  if (!esEstadoConocido(to)) return false;
  return TRANSICIONES[from].includes(to);
}

/** Lanza si la transición es ilegal. */
export function validarTransicion(from: string, to: string): void {
  if (!puedeTransicionar(from, to)) {
    throw new Error(`Transición de pedido ilegal: ${from} → ${to}`);
  }
}
