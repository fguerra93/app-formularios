/**
 * Máquina de estados del taller para Órdenes de Producción (Patrón 1).
 * en_cola → imprimiendo → acabado → control_calidad → listo → entregado.
 * Se permite retroceder un paso (corrección) salvo desde 'entregado'.
 */
export type EstadoOP =
  | "en_cola"
  | "imprimiendo"
  | "acabado"
  | "control_calidad"
  | "listo"
  | "entregado";

export const ESTADOS_OP: EstadoOP[] = [
  "en_cola",
  "imprimiendo",
  "acabado",
  "control_calidad",
  "listo",
  "entregado",
];

export function puedeTransicionarOP(from: string, to: string): boolean {
  if (from === to) return true;
  const i = ESTADOS_OP.indexOf(from as EstadoOP);
  const j = ESTADOS_OP.indexOf(to as EstadoOP);
  if (i === -1 || j === -1) return false;
  // Avanzar de a un paso, o retroceder de a un paso (no desde entregado).
  if (j === i + 1) return true;
  if (j === i - 1 && from !== "entregado") return true;
  return false;
}
