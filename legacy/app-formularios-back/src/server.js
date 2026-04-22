// ============================================
// PrintUp Backend — Servidor Principal
// Fastify 5 · Node.js 22 LTS
// ============================================

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { uploadRoute } from './routes/upload.js';
import { checkNextcloudConnection } from './services/nextcloud.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Config ---
const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '100') * 1024 * 1024;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map(s => s.trim());

// --- Fastify ---
const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss' }
    }
  },
  bodyLimit: MAX_FILE_SIZE + 1048576
});

// --- Plugins ---
await app.register(cors, {
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'OPTIONS']
});

await app.register(multipart, {
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: parseInt(process.env.MAX_FILES || '10'),
    fieldSize: 102400
  }
});

await app.register(rateLimit, {
  max: 20,
  timeWindow: 60000
});

// Sirve el frontend desde /public
await app.register(fastifyStatic, {
  root: join(__dirname, '..', 'public'),
  prefix: '/'
});

// --- Rutas ---
app.register(uploadRoute);

app.get('/api/health', async () => {
  const nc = await checkNextcloudConnection();
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    nextcloud: nc
  };
});

// --- Iniciar ---
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`\n  PrintUp Backend v1.0 corriendo en http://localhost:${PORT}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
