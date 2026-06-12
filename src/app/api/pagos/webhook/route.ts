import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  configuracionRepo,
  domainEventsRepo,
  pagosRepo,
  pedidosRepo,
  stockRepo,
  webhookEventosRepo,
} from "@/server/repositories";
import { verifyMpSignature } from "@/lib/mercadopago";
import { emitirDocumento } from "@/server/services/dte";
import { emailPagoConfirmado } from "@/server/services/emails";
import type { Pedido } from "@/server/domain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log webhook
    await pagosRepo.logWebhook({
      tipo: body.type || body.action || "unknown",
      payload: body,
    });

    // Only handle payment notifications
    if (body.type !== "payment" && body.action !== "payment.updated") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // --- Firma del webhook (Patrón 4) -----------------------------------
    // Si hay secreto configurado, una firma inválida se rechaza con 401.
    // Sin secreto (sandbox) se degrada con advertencia (no bloquea el demo).
    const mpSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || "";
    if (mpSecret) {
      const valid = verifyMpSignature({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId: String(paymentId),
        secret: mpSecret,
      });
      if (!valid) {
        console.error("MercadoPago webhook: firma inválida");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn(
        "MERCADOPAGO_WEBHOOK_SECRET no configurado: firma de webhook NO verificada (modo sandbox)."
      );
    }

    // --- Idempotencia (Patrón 4) ----------------------------------------
    // Cada notificación se procesa una sola vez. Distintas notificaciones del
    // mismo pago (pending -> approved) SÍ se procesan (clave = id de notificación).
    const eventoId = String(body.id ?? `${paymentId}:${body.action || body.type}`);
    if (await webhookEventosRepo.yaProcesado("mercadopago", eventoId)) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    // Get MercadoPago credentials (config overrides env)
    const accessToken =
      (await configuracionRepo.get("mercadopago_access_token")) ||
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      "";

    if (!accessToken) {
      return NextResponse.json({ error: "No MP config" }, { status: 400 });
    }

    // Fetch payment details from MercadoPago
    const client = new MercadoPagoConfig({ accessToken });
    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: paymentId });

    const pedidoId = payment.external_reference;
    if (!pedidoId) {
      return NextResponse.json({ ok: true });
    }

    // Update order based on payment status
    const updateData: Record<string, unknown> = {
      pago_referencia: String(paymentId),
      updated_at: new Date().toISOString(),
    };

    if (payment.status === "approved") {
      updateData.pago_estado = "pagado";
      updateData.estado = "confirmado";
    } else if (payment.status === "rejected") {
      updateData.pago_estado = "fallido";
    } else if (payment.status === "pending" || payment.status === "in_process") {
      updateData.pago_estado = "pendiente";
    }

    let pedido: Pedido | null = null;
    try {
      pedido = await pedidosRepo.update(pedidoId, updateData);
    } catch {
      pedido = null;
    }

    // Pago aprobado: confirmar la reserva de stock + emitir evento de dominio.
    if (payment.status === "approved" && pedido) {
      try {
        await stockRepo.confirmarReserva(pedidoId);
      } catch (e) {
        console.error("confirmar_reserva no disponible (no fatal):", e);
      }
      await domainEventsRepo.emit("pedido.pagado", {
        pedido_id: pedidoId,
        numero_pedido: pedido.numero_pedido,
      });
      try {
        await emitirDocumento(pedido);
      } catch (e) {
        console.error("emitir DTE (no fatal):", e);
      }
    }

    // Email de pago confirmado — servicio único
    if (payment.status === "approved" && pedido) {
      try {
        await emailPagoConfirmado(pedido);
      } catch (e) {
        console.error("Error sending payment email:", e);
      }
    }

    // Marcar la notificación como procesada (idempotencia).
    await webhookEventosRepo.registrar("mercadopago", eventoId, body);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
