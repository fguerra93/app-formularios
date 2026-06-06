import * as Sentry from "@sentry/nextjs";

const DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: DSN,
      enabled: !!DSN, // sin DSN, Sentry queda inactivo (sandbox sin monitoreo)
      tracesSampleRate: 0.1,
    });
  }
}

// Captura automática de errores en rutas/Server Components (Next 16).
export const onRequestError = Sentry.captureRequestError;
