import {
  pedidosRepo,
  aprobacionesRepo,
  domainEventsRepo,
} from "@/server/repositories";
import type { ItemPedido } from "@/server/domain";
import { crearOPDesdePedido } from "@/server/services/op-desde-pedido";
import type { Cotizacion } from "./pricing";

/**
 * Cierre de pedido por el BOT (Fase F3). Cuando la autonomía es VERDE y el
 * cliente confirma una cotización determinística (por planilla), el bot crea el
 * pedido y lo encola en la comanda — la MISMA que alimenta la web (servicio
 * `crearOPDesdePedido`). El cobro queda por transferencia y el dueño valida el
 * pago desde la cola de aprobación (no se cobra solo). Cero intervención para
 * crear el pedido y la comanda.
 */
export interface CierrePedidoBotInput {
  cliente_id?: string | null;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  cliente_email?: string | null;
  canal: "whatsapp" | "instagram" | "facebook";
  tipo: string;
  cantidad: number;
  cotizacion: Cotizacion;
}

export interface CierrePedidoBotResult {
  pedidoId: string;
  numeroPedido: number;
  total: number;
}

export async function crearPedidoDesdeBot(
  input: CierrePedidoBotInput
): Promise<CierrePedidoBotResult | null> {
  const nombre = (input.cliente_nombre || "Cliente WhatsApp").trim();
  const tel = (input.cliente_telefono || "").replace(/\D/g, "");
  // cliente_email es NOT NULL: si no lo dio, sintetizamos uno trazable.
  const email =
    input.cliente_email?.trim() ||
    (tel ? `${tel}@wa.printup.cl` : "whatsapp@wa.printup.cl");
  const c = input.cotizacion;

  const items: ItemPedido[] = [
    {
      producto_id: `planilla:${input.tipo}`,
      nombre: `${input.tipo} x${input.cantidad}`,
      cantidad: input.cantidad,
      precio_unitario: c.precio_unitario,
      variante: null,
    },
  ];
  if (c.con_diseno && c.precio_diseno > 0) {
    items.push({
      producto_id: `diseno:${input.tipo}`,
      nombre: "Diseño",
      cantidad: 1,
      precio_unitario: c.precio_diseno,
      variante: null,
    });
  }

  let pedido;
  try {
    pedido = await pedidosRepo.create({
      cliente_nombre: nombre,
      cliente_email: email,
      cliente_telefono: input.cliente_telefono || null,
      tipo_entrega: "retiro_tienda",
      items,
      subtotal: c.subtotal + (c.con_diseno ? c.precio_diseno : 0),
      costo_envio: 0,
      total: c.total,
      pago_metodo: "transferencia",
      notas: `Pedido tomado por el bot (${input.canal}).`,
      cliente_id: input.cliente_id || null,
    });
  } catch (e) {
    console.error("bot crear pedido:", e);
    return null;
  }

  // Etiqueta el canal (best-effort: la columna puede no estar migrada).
  try {
    await pedidosRepo.update(pedido.id, { canal: input.canal });
  } catch {
    /* columna canal no aplicada todavía */
  }

  // Evento de dominio + cola de aprobación de pago (el dueño valida la
  // transferencia; NO se cobra solo). Mismo patrón que el checkout web.
  // Best-effort: si fallan, el pedido y la comanda igual quedan creados.
  try {
    await domainEventsRepo.emit("pedido.creado", {
      pedido_id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      cliente_nombre: nombre,
      total: c.total,
    });
  } catch (e) {
    console.error("bot: emit pedido.creado (no fatal):", e);
  }
  try {
    await aprobacionesRepo.crear({
      tipo: "validar_pago",
      titulo: `Validar pago pedido #${pedido.numero_pedido}`,
      descripcion: `${nombre} — $${c.total.toLocaleString("es-CL")} (transferencia · bot)`,
      payload: { pedido_id: pedido.id, numero_pedido: pedido.numero_pedido },
      creada_por: "bot",
    });
  } catch (e) {
    console.error("bot: crear aprobacion (no fatal):", e);
  }

  // Encola la comanda (misma OP que la web). Aquí está el "verde cierra".
  await crearOPDesdePedido(pedido.id);

  return {
    pedidoId: pedido.id,
    numeroPedido: pedido.numero_pedido,
    total: c.total,
  };
}

/**
 * Opt-in de marketing (política WhatsApp/IA 2026): solo se pueden enviar promos
 * a clientes que aceptaron. Las utilidades transaccionales (estado de pedido,
 * cotización que pidió el cliente) NO requieren opt-in.
 */
export function puedeEnviarPromo(
  cliente: { preferencias?: { newsletter?: boolean } | null } | null | undefined
): boolean {
  return cliente?.preferencias?.newsletter === true;
}
