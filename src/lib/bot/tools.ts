import { pedidosRepo } from "@/server/repositories";
import { calcularCotizacion, type Cotizacion } from "./pricing";

/**
 * Herramientas SEGURAS para el bot (tool-use, Patrón 7). El modelo/flujo puede
 * invocarlas para informar o cotizar, pero NUNCA confirman pagos ni crean
 * pedidos: esas acciones siempre pasan por la cola de aprobación del dueño.
 */

export function consultarHorario(): string {
  return (
    "PrintUp — Servicios Gráficos\n" +
    "Dirección: Errazuriz 09, Doñihue\n" +
    "Horario: Lunes a Viernes 9:00 - 18:00\n" +
    "Despachos: Miércoles y Viernes\n" +
    "Envío gratis sobre $50.000\n" +
    "Web: printup.cl"
  );
}

/** Busca el estado de un pedido por número (#1001) o email. Solo lectura. */
export async function buscarPedido(textoOEmail: string): Promise<Record<string, unknown> | null> {
  const isEmail = textoOEmail.includes("@");
  const numero = parseInt(textoOEmail.replace("#", "").trim()) || 0;
  return pedidosRepo.findEstadoParaBot({ isEmail, text: textoOEmail, numero });
}

/** Cotiza por planilla. Solo cálculo; el envío requiere aprobación. */
export async function cotizar(
  tipo: string,
  cantidad: number,
  conDiseno = false
): Promise<Cotizacion | null> {
  return calcularCotizacion({ tipo, cantidad, conDiseno });
}

/** Render legible de una cotización para el cliente. */
export function formatearCotizacion(c: Cotizacion): string {
  const fmt = (n: number) => `$${n.toLocaleString("es-CL")}`;
  return (
    `Cotización ${c.tipo} x${c.cantidad}\n` +
    `Valor unitario: ${fmt(c.precio_unitario)}\n` +
    `Subtotal: ${fmt(c.subtotal)}\n` +
    (c.con_diseno ? `Diseño: ${fmt(c.precio_diseno)}\n` : "") +
    `Total: ${fmt(c.total)}\n` +
    `Plazo: ${c.dias_produccion} días hábiles`
  );
}
