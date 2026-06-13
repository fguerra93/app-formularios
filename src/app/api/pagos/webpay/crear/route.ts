import { NextRequest, NextResponse } from "next/server";
import { publicOrigin } from "@/lib/url";
import { pedidosRepo, pagosRepo } from "@/server/repositories";
import { getWebpayTransaction } from "@/server/services/webpay";

/**
 * Inicia una transacción Webpay Plus para un pedido ya creado.
 * Devuelve { url, token }: el navegador redirige a `${url}?token_ws=${token}`.
 */
export async function POST(request: NextRequest) {
  try {
    const { pedido_id } = await request.json();
    if (!pedido_id) {
      return NextResponse.json({ error: "pedido_id requerido" }, { status: 400 });
    }

    const pedido = await pedidosRepo.findById(pedido_id);
    if (!pedido) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (pedido.pago_estado === "pagado") {
      return NextResponse.json({ error: "El pedido ya está pagado" }, { status: 409 });
    }

    // Host público real (Cloud Run reenvía el host; env runtime de respaldo).
    const appUrl = publicOrigin(request);
    // buyOrder máx. 26 chars; sessionId lleva el id del pedido para el retorno.
    const buyOrder = `PU-${pedido.numero_pedido}`;
    const sessionId = String(pedido_id).slice(0, 61);
    const returnUrl = `${appUrl}/api/pagos/webpay/retorno?pedido=${encodeURIComponent(pedido_id)}`;

    const tx = await getWebpayTransaction();
    const resp = await tx.create(buyOrder, sessionId, pedido.total, returnUrl);

    await pagosRepo.logWebhook({
      tipo: "webpay.create",
      payload: { pedido_id, buy_order: buyOrder, token: resp.token, monto: pedido.total },
    });

    return NextResponse.json({ url: resp.url, token: resp.token });
  } catch (err) {
    console.error("Webpay create error:", err);
    return NextResponse.json({ error: "Error al iniciar el pago con Webpay" }, { status: 500 });
  }
}
