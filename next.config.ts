import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Salida autocontenida para imagen Docker liviana (Cloud Run, Fase 8/9).
  output: "standalone",
  // Fija la raíz del trazado en este proyecto (evita que el standalone quede
  // anidado bajo rutas superiores cuando hay lockfiles en carpetas padre).
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zynopkkubpojllkhkfsn.supabase.co",
      },
      {
        protocol: "https",
        hostname: "printup.cl",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
};

// withSentryConfig habilita instrumentación de Sentry. Sin auth token solo
// instrumenta en runtime (no sube source maps). silent evita ruido en build.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  disableLogger: true,
});
