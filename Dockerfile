# ============================================================
# PrintUp — Imagen para Cloud Run (Next.js 16 standalone)
# Multi-stage: deps -> build -> runner liviano (node 22-slim).
# ============================================================

# ---- 1. Dependencias ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- 2. Build ----
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Variables públicas (NEXT_PUBLIC_*) se inlinean en el bundle del cliente en
# build-time. Son valores públicos (sandbox); las secretas van por env en runtime.
ARG NEXT_PUBLIC_MODO=sandbox
ARG NEXT_PUBLIC_SUPABASE_URL=https://zynopkkubpojllkhkfsn.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bm9wa2t1YnBvamxsa2hrZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODc5MzYsImV4cCI6MjA5MjQ2MzkzNn0.eomJOEbBoQLPz9RZEnzXU10XUuILKqkvriOkwdprR3A
ARG NEXT_PUBLIC_APP_URL=
ENV NEXT_PUBLIC_MODO=$NEXT_PUBLIC_MODO \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

# ---- 3. Runner ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Usuario no-root.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Output standalone: incluye server.js + node_modules mínimos.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
