import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifica la firma del webhook de MercadoPago (Patrón 4).
 *
 * MP envía el header `x-signature: ts=<unix>,v1=<hmac>` y `x-request-id`.
 * El manifiesto firmado es: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * con HMAC-SHA256 usando el secreto del webhook (MERCADOPAGO_WEBHOOK_SECRET).
 *
 * Devuelve true si la firma es válida. Si no hay secreto configurado,
 * devuelve false (el llamador decide si rechaza o degrada en sandbox).
 *
 * Ref: https://www.mercadopago.cl/developers (Webhooks > Validar origen).
 */
export function verifyMpSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = opts;
  if (!xSignature || !secret) return false;

  // Parse "ts=...,v1=..."
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of xSignature.split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (k === "ts") ts = v;
    else if (k === "v1") v1 = v;
  }
  if (!ts || !v1) return false;

  // El template usa data.id en minúsculas cuando es alfanumérico.
  const id = (dataId || "").toLowerCase();
  const manifest = `id:${id};request-id:${xRequestId || ""};ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
