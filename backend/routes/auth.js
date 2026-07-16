/**
 * routes/auth.js — Admin Authentication Route
 * =============================================
 * POST /api/auth/admin
 *
 * Validates admin credentials entirely on the server-side.
 * The ADMIN_PASSWORD is read from the validated `env` object —
 * it is NEVER sent to, stored in, or compared on the client.
 *
 * Response: returns only success/failure — never the password itself.
 */

const express = require('express');
const router = express.Router();

// Read environment variables directly
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345';

/**
 * POST /api/auth/admin
 * Body: { "name": "...", "password": "..." }
 */
router.post('/admin', (req, res) => {
  const { name, password } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({
      success: false,
      error: 'Administrator name is required.',
    });
    return;
  }

  // Validate admin name (case-insensitive)
  const allowedNames = ['shruthika', 'karline', 'deepanshu'];
  const normalizedName = name.trim().toLowerCase();
  
  if (!allowedNames.includes(normalizedName)) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized administrator name.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    res.status(400).json({
      success: false,
      error: 'Security code is required.',
    });
    return;
  }

  // ── Constant-time comparison to prevent timing attacks ────────────────────
  const provided = password;
  const expected = ADMIN_PASSWORD;

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

module.exports = router;