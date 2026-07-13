/**
 * index.js — Backend Entry Point
 * ================================
 * env.js is imported FIRST so that validation runs before
 * any other module tries to access environment variables.
 */

// ⚠️ MUST be the very first import — validates env vars and crashes safely if invalid
import './config/env.js';

import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import keywordsRouter from './routes/keywords.js';
import authRouter from './routes/auth.js';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Security: Remove server fingerprinting ───────────────────────────────────
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.disable('x-powered-by');

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/keywords', keywordsRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches any error thrown from routes/middleware
// NEVER sends the API key or internal stack traces to the client
app.use((err, req, res, next) => {
  const isDev = env.NODE_ENV === 'development';

  // Safe error log — redact key if it somehow appears
  const safeMessage = err.message?.replace(process.env.GEMINI_API_KEY ?? '', '[REDACTED]');
  console.error(`[Global Error Handler] ${safeMessage}`);

  res.status(err.status ?? 500).json({
    success: false,
    // In production, only show a generic message — never internal details
    error: isDev ? safeMessage : 'An internal server error occurred.',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});
