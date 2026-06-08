import { NextRequest, NextResponse } from "next/server";
import {
  domainEventsRepo,
  notificacionesRepo,
  ordenesProduccionRepo,
  pedidosRepo,
  gangSheetsRepo,
} from "@/server/repositories";
import { getMetaConfig, sendWhatsAppMessage } from "@/lib/meta";
import type { Pedido, ItemPedido } from "@/server/domain";

/** Crea la Orden de Producción de un pedido pagado (idempotente). */
async function crearOPDesdePedido(pedidoId: string): Promise<void> {
  try {
    if (await ordenesProduccionRepo.existePorPedido(pedidoId)) return;
    const pedido = (await pedidosRepo.findById(pedidoId)) as Pedido | null;
    if (!pedido) return;
    const items = (Array.isArray(pedido.items) ? pedido.items : []) as ItemPedido[];
    const cantidad = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0) || 1;
    let tipo = items[0]?.nombre || "Trabajo";

    // Si el pedido incluye un pliego (gang sheet), la OP nace con su archivo
    // listo, material y dimensiones (Fase F1). Cero armado manual.
    const datosOP: Record<string, unknown> = {
      pedido_id: pedidoId,
      cantidad,
      precio_total: pedido.total,
      tipo_entrega: pedido.tipo_entrega,
      estado: "en_cola",
    };
    const itemPliego = items.find(
      (i) => (i.variante as Record<string, string> | null)?.gang_sheet_id
    );
    const gangSheetId = (itemPliego?.variante as Record<string, string> | null)?.gang_sheet_id;
    let gangSheet: Record<string, unknown> | null = null;
    if (gangSheetId) {
      gangSheet = await gangSheetsRepo.findById(gangSheetId);
      if (gangSheet) {
        const mat = String(gangSheet.material || "");
        tipo = `Pliego ${mat}`;
        datosOP.material = mat;
        datosOP.dimensiones = `${String(gangSheet.ancho_pliego_cm)}×${String(gangSheet.alto_pliego_cm)} cm`;
        datosOP.archivo_diseno_url = `/api/gang-sheets/${gangSheetId}/pliego`;
      }
    }
    datosOP.tipo = tipo;

    const op = await ordenesProduccionRepo.create(datosOP);

    // Etiqueta el canal del pedido en la OP (web|whatsapp|manual). Best-effort:
    // si la columna aún no existe (migración F2 sin aplicar) no rompe la OP.
    if (op) {
      const canal = (pedido as { canal?: string }).canal || "web";
      try {
        await ordenesProduccionRepo.update(String(op.id), { canal });
      } catch {
        /* columna canal no aplicada todavía: ignorar */
      }
    }

    // Enlaza el pliego a su OP/pedido (trazabilidad).
    if (gangSheet && op) {
      await gangSheetsRepo.update(String(gangSheet.id), {
        pedido_id: pedidoId,
        op_id: op.id,
        estado: "en_op",
      });
    }
  } catch (e) {
    console.error("crear OP (no fatal):", e);
  }
}

export const dynamic = "force-dynamic";

/** Envía un WhatsApp al cliente del pedido (best-effort, requiere config Meta). */
async function avisarCliente(pedidoId: string, mensaje: string): Promise<void> {
  try {
    const pedido = await pedidosRepo.findById(pedidoId);
    const tel = pedido?.cliente_telefono as string | undefined;
    if (!tel) return;
    const cfg = await getMetaConfig();
    if (!cfg.pageAccessToken || !cfg.whatsappPhoneNumberId) return;
    await sendWhatsAppMessage(tel, mensaje, cfg.pageAccessToken, cfg.whatsappPhoneNumberId);
  } catch (e) {
    console.error("avisarCliente (no fatal):", e);
  }
}

/**
 * Worker del outbox (Patrón 2). Lee eventos pendientes y dispara efectos
 * (por ahora: notificación in-app). Idempotente: solo procesa 'pendiente' y
 * los marca 'procesado'; un reintento no duplica. Protegido con CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let pendientes;
  try {
    pendientes = await domainEventsRepo.listPendientes(100);
  } catch (e) {
    console.error("Error leyendo eventos:", e);
    return NextResponse.json({ error: "Error al leer eventos" }, { status: 500 });
  }

  let procesados = 0;
  let errores = 0;

  for (const evento of pendientes) {
    const id = evento.id as string;
    const intentos = (evento.intentos as number) || 0;
    try {
      await dispatch(
        evento.tipo as string,
        (evento.payload as Record<string, unknown>) || {}
      );
      await domainEventsRepo.marcarProcesado(id);
      procesados++;
    } catch (e) {
      console.error(`Error procesando evento ${id}:`, e);
      await domainEventsRepo.marcarFallo(
        id,
        intentos,
        e instanceof Error ? e.message : "error"
      );
      errores++;
    }
  }

  return NextResponse.json({ ok: true, procesados, errores, total: pendientes.length });
}

/** Efectos por tipo de evento. Hoy: notificación in-app para el dueño. */
async function dispatch(tipo: string, payload: Record<string, unknown>): Promise<void> {
  const numero = payload.numero_pedido ?? payload.pedido_id ?? "";
  const pedidoId = payload.pedido_id as string | undefined;
  const enlace = pedidoId ? `/admin/pedidos?id=${pedidoId}` : "/admin/pedidos";

  switch (tipo) {
    case "pedido.creado":
      await notificacionesRepo.crear({
        tipo: "pedido",
        titulo: `Nuevo pedido #${numero}`,
        cuerpo: `Cliente: ${payload.cliente_nombre ?? ""} — Total: $${payload.total ?? ""}`,
        enlace,
      });
      break;
    case "pedido.pagado":
      await notificacionesRepo.crear({
        tipo: "pago",
        titulo: `Pago confirmado #${numero}`,
        cuerpo: "El pago del pedido fue aprobado.",
        enlace,
      });
      if (pedidoId) {
        await avisarCliente(
          pedidoId,
          `¡Pago confirmado! Tu pedido #${numero} está confirmado y entró a producción. Te avisamos cuando esté listo. — PrintUp`
        );
        // Genera automáticamente la Orden de Producción (Fase 7).
        await crearOPDesdePedido(pedidoId);
      }
      break;
    case "pedido.estado": {
      const estado = String(payload.estado ?? "");
      await notificacionesRepo.crear({
        tipo: "pedido",
        titulo: `Pedido #${numero} → ${estado}`,
        cuerpo: null,
        enlace,
      });
      // Bot proactivo: avisar al cliente en hitos relevantes.
      const mensajesCliente: Record<string, string> = {
        preparando: `Tu pedido #${numero} ya está en preparación. — PrintUp`,
        listo: `¡Tu pedido #${numero} está listo para retiro! — PrintUp`,
        enviado: `Tu pedido #${numero} va en camino. — PrintUp`,
        entregado: `Tu pedido #${numero} fue entregado. ¡Gracias por comprar en PrintUp!`,
      };
      if (pedidoId && mensajesCliente[estado]) {
        await avisarCliente(pedidoId, mensajesCliente[estado]);
      }
      break;
    }
    default:
      // Tipo no manejado: se considera procesado (no-op) para no reintentar.
      console.warn("Evento sin handler:", tipo);
  }
}
