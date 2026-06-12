import { NextRequest, NextResponse } from "next/server";
import {
  domainEventsRepo,
  pagosRepo,
  pedidosRepo,
  stockRepo,
  webhookEventosRepo,
} from "@/server/repositories";
import { getWebpayTransaction } from "@/server/services/webpay";
import { emitirDocumento } from "@/server/services/dte";
import { emailPagoConfirmado } from "@/server/services/emails";

/**
 * Retorno de Webpay Plus. Transbank redirige aquí con:
 * - `token_ws`            → flujo normal: hay que hacer commit.
 * - `TBK_TOKEN`           → el cliente anuló el pago en el formulario.
 * - solo `TBK_ID_SESION`  → timeout del formulario (10 min).
 *
 * El commit es idempotente vía `webhook_eventos` (clave = token_ws):
 * un refresh del navegador sobre esta URL no duplica el procesamiento.
 */
async function handleRetorno(request: NextRequest, params: URLSearchParams) {
  const appUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const pedidoId =
    request.nextUrl.searchParams.get("pedido") || params.get("TBK_ID_SESION") || "";

  const confirmacion = (estado: string) =>
    NextResponse.redirect(
      pedidoId
        ? `${appUrl}/checkout/confirmacion/${pedidoId}?pago=${estado}`
        : `${appUrl}/carrito?pago=${estado}`,
      303,
    );

  const tokenWs = params.get("token_ws");
  const tbkToken = params.get("TBK_TOKEN");

  // Anulación del cliente o timeout: no hay nada que commitear.
  if (!tokenWs) {
    await pagosRepo.logWebhook({
      tipo: tbkToken ? "webpay.anulado" : "webpay.timeout",
      payload: { pedido_id: pedidoId, tbk_token: tbkToken },
    });
    return confirmacion("cancelado");
  }

  // Idempotencia: un token ya procesado no se vuelve a commitear.
  // (best-effort: sin la tabla en local se sigue, y el fallback de status()
  // de más abajo cubre el caso de un commit repetido.)
  try {
    if (await webhookEventosRepo.yaProcesado("webpay", tokenWs)) {
      return confirmacion("ok");
    }
  } catch (e) {
    console.error("webhook_eventos no disponible (no fatal):", e);
  }

  type RespuestaTbk = {
    response_code?: number;
    status?: string;
    buy_order?: string;
    authorization_code?: string;
    session_id?: string;
    amount?: number;
  };
  let resp: RespuestaTbk;
  const tx = await getWebpayTransaction();
  try {
    resp = await tx.commit(tokenWs);
  } catch (err) {
    // Un refresh o doble retorno llega aquí con "transacción ya finalizada".
    // Antes de declarar error, consultamos el estado real: si quedó
    // AUTHORIZED, el pago ES válido y se procesa igual (idempotencia real).
    try {
      const st: RespuestaTbk = await tx.status(tokenWs);
      if (st.response_code === 0 && st.status === "AUTHORIZED") {
        resp = st;
      } else {
        throw err;
      }
    } catch {
      console.error("Webpay commit error:", err);
      try {
        await pagosRepo.logWebhook({
          tipo: "webpay.commit_error",
          payload: { pedido_id: pedidoId, error: String(err) },
        });
      } catch { /* log best-effort */ }
      return confirmacion("error");
    }
  }

  try {
    await pagosRepo.logWebhook({ tipo: "webpay.commit", payload: { pedido_id: pedidoId, ...resp } });
  } catch { /* log best-effort */ }

  const aprobado = resp.response_code === 0 && resp.status === "AUTHORIZED";
  const idPedido = pedidoId || resp.session_id || "";

  const updateData: Record<string, unknown> = {
    pago_metodo: "webpay",
    pago_referencia: `${resp.buy_order || ""}/${resp.authorization_code || ""}`,
    pago_estado: aprobado ? "pagado" : "fallido",
    updated_at: new Date().toISOString(),
  };
  if (aprobado) updateData.estado = "confirmado";

  let pedido = null;
  try {
    pedido = idPedido ? await pedidosRepo.update(idPedido, updateData) : null;
  } catch (e) {
    console.error("Webpay: error actualizando pedido (no fatal):", e);
  }

  // Después del commit el cliente YA PAGÓ: todo lo que sigue es best-effort
  // y jamás puede botar la respuesta.
  if (aprobado && pedido) {
    try {
      await stockRepo.confirmarReserva(idPedido);
    } catch (e) {
      console.error("confirmar_reserva no disponible (no fatal):", e);
    }
    try {
      await domainEventsRepo.emit("pedido.pagado", {
        pedido_id: idPedido,
        numero_pedido: pedido.numero_pedido,
        metodo: "webpay",
      });
    } catch (e) {
      console.error("domain event no disponible (no fatal):", e);
    }
    try {
      await emitirDocumento(pedido);
    } catch (e) {
      console.error("emitir DTE (no fatal):", e);
    }
    try {
      await emailPagoConfirmado(pedido);
    } catch (e) {
      console.error("email pago confirmado (no fatal):", e);
    }
  }

  try {
    await webhookEventosRepo.registrar("webpay", tokenWs, {
      pedido_id: idPedido,
      status: resp.status,
      response_code: resp.response_code,
    });
  } catch (e) {
    console.error("registrar webhook_evento no disponible (no fatal):", e);
  }

  return confirmacion(aprobado ? "ok" : "error");
}

export async function GET(request: NextRequest) {
  return handleRetorno(request, request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params = new URLSearchParams();
  form.forEach((value, key) => {
    if (typeof value === "string") params.set(key, value);
  });
  return handleRetorno(request, params);
}
