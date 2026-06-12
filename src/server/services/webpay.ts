import {
  WebpayPlus,
  Options,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import { configuracionRepo } from "@/server/repositories";

/**
 * Webpay Plus (Transbank) — configuración del SDK.
 *
 * Sin credenciales propias usa el ambiente de INTEGRACIÓN de Transbank
 * (credenciales públicas de prueba, tarjeta VISA 4051 8856 0044 6623),
 * igual que el resto de servicios: la config de BD pisa a las env vars.
 * Para producción: webpay_commerce_code + webpay_api_key + webpay_env=produccion.
 */
export async function getWebpayTransaction() {
  const cfg = await configuracionRepo.getMany([
    "webpay_commerce_code",
    "webpay_api_key",
    "webpay_env",
  ]);

  const commerceCode = cfg["webpay_commerce_code"] || process.env.WEBPAY_COMMERCE_CODE || "";
  const apiKey = cfg["webpay_api_key"] || process.env.WEBPAY_API_KEY || "";
  const env = cfg["webpay_env"] || process.env.WEBPAY_ENV || "integracion";

  if (env === "produccion" && commerceCode && apiKey) {
    return new WebpayPlus.Transaction(new Options(commerceCode, apiKey, Environment.Production));
  }

  return new WebpayPlus.Transaction(
    new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration),
  );
}
