import type { NextRequest } from "next/server";

/**
 * Origen público del sitio para construir links absolutos en el servidor.
 *
 * OJO: `NEXT_PUBLIC_APP_URL` se inlinea en BUILD time → en el contenedor de
 * Cloud Run queda vacío y los routes caían al origin interno (0.0.0.0:3000).
 * Por eso aquí se prefiere el env RUNTIME `APP_URL` (no se inlinea) y, si hay
 * request, el host reenviado por el proxy de Cloud Run.
 */
export function publicOrigin(request?: NextRequest): string {
  const env = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (env) return env.replace(/\/+$/, "");

  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host) {
      const proto = request.headers.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`;
    }
    try {
      return request.nextUrl.origin;
    } catch {
      /* noop */
    }
  }
  return "https://printup.cl";
}
