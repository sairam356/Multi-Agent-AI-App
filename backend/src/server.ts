/**
 * Express server entry point.
 *
 * Loads env vars, sets up CORS + JSON middleware,
 * mounts API routes, and starts listening.
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from packages/backend/ (one level up from src/)
config({ path: join(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import { streamRouter } from './routes/stream.route.js';
import { chatRouter } from './routes/chat.route.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'my-multi-agent-app backend',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', streamRouter);
app.use('/api', chatRouter);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Backend server running at http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log(`  SSE stream:   http://localhost:${PORT}/api/stream?message=hello&sessionId=s1&userId=u1`);
  console.log(`  Chat API:     POST http://localhost:${PORT}/api/chat`);
});

export default app;
