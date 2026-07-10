/**
 * routes/keywords.js — Keywords API Router
 * ==========================================
 * Exposes POST /api/keywords
 * Calls geminiService and returns structured SEO data.
 */

import { Router } from 'express';
import { generateKeywordData } from '../geminiService.js';

const router = Router();

/**
 * POST /api/keywords
 * Body: { "keywords": ["seo", "nextjs", "react"] }
 */
router.post('/', async (req, res, next) => {
  try {
    const { keywords } = req.body;

    // Basic request validation — never trust client input
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body must include a non-empty "keywords" array.',
      });
    }

    if (keywords.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'A maximum of 20 keywords can be analyzed per request.',
      });
    }

    const data = await generateKeywordData(keywords);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    // Pass to global error handler
    next(error);
  }
});

export default router;
