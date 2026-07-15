/**
 * routes/keywords.ts — Keywords API Route (TypeScript)
 * ======================================================
 * Exposes: POST /api/keywords
 * Delegates to processKeywordsForClient and returns a
 * clean, typed KeywordsApiResponse — no metadata, no env leaks.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { processEventDescriptionForClient } from '../services/keywordProcessor.js';
import type { KeywordsApiResponse, KeywordsApiErrorResponse } from '../types/keyword.js';

const router = Router();

/**
 * POST /api/keywords
 * Body: {
 *   "text"?: "seo, nextjs, react",
 *   "image"?: { "mimeType": "image/jpeg", "data": "base64..." }
 * }
 */
router.post(
  '/',
  async (
    req: Request,
    res: Response<KeywordsApiResponse | KeywordsApiErrorResponse>,
    next: NextFunction
  ) => {
    try {
      const { text, image } = req.body as {
        text?: string;
        image?: { mimeType: string; data: string };
      };

      // ── 1. Require at least one input ─────────────────────────────────────────
      if (!text && !image) {
        res.status(400).json({
          success: false,
          error: 'Request must include either text or an image.',
        });
        return;
      }

      // ── 2. Image Guardrails ───────────────────────────────────────────────────
      if (image) {
        if (image.mimeType !== 'image/jpeg' && image.mimeType !== 'image/png' && image.mimeType !== 'image/webp') {
          res.status(400).json({
            success: false,
            error: 'Unsupported image format.',
          });
          return;
        }
        if (!image.data || typeof image.data !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Image data must be a base64 encoded string.',
          });
          return;
        }
      }

      // ── 3. Text Guardrails & Parsing ──────────────────────────────────────────
      let parsedKeywords: string[] = [];
      if (text && typeof text === 'string') {
        const rawText = text.trim();
        // Calculate word count (splitting by whitespace)
        const wordCount = rawText.split(/\s+/).filter((w) => w.length > 0).length;
        
        if (wordCount > 100) {
          res.status(400).json({
            success: false,
            error: 'Text input exceeds the maximum limit of 100 words.',
          });
          return;
        }

        // Parse into a string array (split by commas or newlines)
        parsedKeywords = rawText
          .split(/[\n,]+/)
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }

      // ── Orchestrate through the processor ─────────────────────────────────
      const data = await processEventDescriptionForClient(parsedKeywords, image);

      // ── Return ONLY the clean typed payload — no metadata, no tokens ───────
      res.status(200).json({
        success: true,
        data,
      });

    } catch (error) {
      // Delegate to global error handler
      next(error);
    }
  }
);

export default router;
