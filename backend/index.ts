/**
 * index.ts — Backend Entry Point (TypeScript)
 * =============================================
 * ⚠️  env.ts MUST be the very first import.
 *     It validates all environment variables and calls process.exit(1)
 *     if anything is missing — before any other module can run.
 */

// ── Env validation runs first — always ────────────────────────────────────────
import './config/env.js';

import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import keywordsRouter from './routes/keywords.js';
import authRouter from './routes/auth.js';

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// CORS — only allow requests from the Next.js frontend origin
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'  // ← update this before deploying
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Security: strip the default Express fingerprint header
app.disable('x-powered-by');

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', env: env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/keywords', keywordsRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// This MUST have 4 parameters so Express recognises it as an error handler.
// NEVER sends the API key, stack trace, or raw env strings to the client.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isDev = env.NODE_ENV === 'development';

  // Redact the API key in case it somehow surfaces in an error message
  const safeMessage = (err.message ?? 'Unknown error').replaceAll(
    env.GEMINI_API_KEY,
    '[REDACTED]'
  );

  console.error(`[Global Error Handler] ${safeMessage}`);

  // In production: generic message only — never expose internals
  res.status(500).json({
    success: false,
    error: isDev ? safeMessage : 'An internal server error occurred.',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = Number(env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend server running → http://localhost:${PORT}`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Routes      : POST /api/auth/admin | POST /api/keywords | GET /health`);
});

export default app;
