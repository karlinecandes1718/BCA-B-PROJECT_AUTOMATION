/**
 * routes/auth.ts — Admin Authentication Route
 * =============================================
 * POST /api/auth/admin
 *
 * Validates admin credentials entirely on the server-side.
 * The ADMIN_PASSWORD is read from the validated `env` object —
 * it is NEVER sent to, stored in, or compared on the client.
 *
 * Response: returns only success/failure — never the password itself.
 */

import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';

const router = Router();

/**
 * POST /api/auth/admin
 * Body: { "password": "..." }
 */
router.post('/admin', (req: Request, res: Response) => {
  const { password } = req.body as { password?: unknown };

  // ── Input validation ──────────────────────────────────────────────────────
  if (!password || typeof password !== 'string' || password.trim() === '') {
    res.status(400).json({
      success: false,
      error: 'Password is required.',
    });
    return;
  }

  // ── Constant-time comparison to prevent timing attacks ────────────────────
  // We use a character-by-character approach to avoid early exit
  // that could reveal password length via response timing.
  const provided = password;
  const expected = env.ADMIN_PASSWORD;

  let mismatch = provided.length !== expected.length ? 1 : 0;
  const maxLen = Math.max(provided.length, expected.length);
  for (let i = 0; i < maxLen; i++) {
    const a = provided.charCodeAt(i) || 0;
    const b = expected.charCodeAt(i) || 0;
    mismatch |= a ^ b;
  }

  if (mismatch !== 0) {
    // Intentional generic message — never hint at what was wrong
    res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials.',
    });
    return;
  }

  // ── Authenticated — return only a success flag, never echo the password ───
  res.status(200).json({
    success: true,
  });
});

export default router;
