/**
 * routes/keywords.ts — Keywords API Route (TypeScript)
 * ======================================================
 * Exposes: POST /api/keywords
 * Delegates to processKeywordsForClient and returns a
 * clean, typed KeywordsApiResponse — no metadata, no env leaks.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { processKeywordsForClient } from '../services/keywordProcessor.js';
import type { KeywordsApiResponse, KeywordsApiErrorResponse } from '../types/keyword.js';

const router = Router();

/**
 * POST /api/keywords
 * Body: { "keywords": ["seo", "nextjs", "react"] }
 */
router.post(
  '/',
  async (
    req: Request,
    res: Response<KeywordsApiResponse | KeywordsApiErrorResponse>,
    next: NextFunction
  ) => {
    try {
      const { keywords } = req.body as { keywords?: unknown };

      // ── Request validation — never trust client input ──────────────────────
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Request body must include a non-empty "keywords" array.',
        });
        return;
      }

      if (keywords.length > 20) {
        res.status(400).json({
          success: false,
          error: 'A maximum of 20 keywords can be analyzed per request.',
        });
        return;
      }

      // Ensure every element is a non-empty string
      const allStrings = keywords.every(
        (k) => typeof k === 'string' && k.trim().length > 0
      );

      if (!allStrings) {
        res.status(400).json({
          success: false,
          error: 'All keywords must be non-empty strings.',
        });
        return;
      }

      // ── Orchestrate through the processor ─────────────────────────────────
      const data = await processKeywordsForClient(keywords as string[]);

      // ── Return ONLY the clean typed payload — no metadata, no tokens ───────
      res.status(200).json({
        success: true,
        count: data.length,
        data,
      });

    } catch (error) {
      // Delegate to global error handler
      next(error);
    }
  }
);

export default router;
