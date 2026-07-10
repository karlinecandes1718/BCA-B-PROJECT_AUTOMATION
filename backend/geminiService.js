/**
 * geminiService.js — SEO Keyword Analysis Service
 * =================================================
 * Uses the official @google/genai SDK.
 * Model is HARDCODED to gemini-2.5-flash only — no Pro/Ultra allowed.
 * Structured output enforced via responseMimeType: "application/json".
 * Export this function and use it inside any API router.
 */

import { GoogleGenAI } from '@google/genai';
import { env } from './config/env.js';

// ─── Allowed Models (Free Tier Only) ─────────────────────────────────────────
const ALLOWED_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];
const DEFAULT_MODEL = 'gemini-2.5-flash';

// ─── Initialize SDK with validated API key ────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// ─── Internal model guard ─────────────────────────────────────────────────────
function resolveModel(requestedModel) {
  if (requestedModel && !ALLOWED_MODELS.includes(requestedModel)) {
    throw new Error(
      `Model "${requestedModel}" is not permitted. Only free-tier models are allowed: ${ALLOWED_MODELS.join(', ')}.`
    );
  }
  return requestedModel ?? DEFAULT_MODEL;
}

// ─── Main Service Function ────────────────────────────────────────────────────
/**
 * Generates SEO descriptions and summaries for an array of keywords.
 *
 * @param {string[]} keywordList - Array of keywords to analyze.
 * @param {string}   [model]     - Optional model override (must be a free-tier model).
 * @returns {Promise<Array<{ keyword: string, description: string, summary: string }>>}
 */
async function generateKeywordData(keywordList, model) {
  // Input validation
  if (!Array.isArray(keywordList) || keywordList.length === 0) {
    throw new Error('keywordList must be a non-empty array of strings.');
  }

  const sanitizedKeywords = keywordList
    .map((k) => String(k).trim())
    .filter((k) => k.length > 0);

  if (sanitizedKeywords.length === 0) {
    throw new Error('keywordList contained no valid (non-empty) keywords after sanitization.');
  }

  const resolvedModel = resolveModel(model);

  try {
    const response = await ai.models.generateContent({
      model: resolvedModel,
      contents: `You are an expert SEO content strategist.
Analyze the following keywords and for EACH keyword provide:
1. A "description": a precise, keyword-rich description in exactly 30 words.
2. A "summary": a single, compelling sentence summarizing its SEO value.

Keywords to analyze: ${sanitizedKeywords.join(', ')}

Return ONLY a JSON array. Do not include any markdown, explanation, or extra text.`,
      config: {
        // Structured output — enforces a clean, parseable JSON array response
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              keyword:     { type: 'STRING' },
              description: { type: 'STRING' },
              summary:     { type: 'STRING' },
            },
            required: ['keyword', 'description', 'summary'],
          },
        },
      },
    });

    // Parse and return the validated JSON — this will throw if the response is malformed
    const parsed = JSON.parse(response.text);

    if (!Array.isArray(parsed)) {
      throw new Error('Gemini returned an unexpected non-array response.');
    }

    return parsed;
  } catch (error) {
    // Never expose the API key in the error message
    const safeMessage = error.message?.replace(env.GEMINI_API_KEY, '[REDACTED]') ?? 'Unknown error';
    console.error(`[geminiService] Error calling Gemini API: ${safeMessage}`);
    throw new Error(`Gemini API call failed: ${safeMessage}`);
  }
}

export { generateKeywordData, ALLOWED_MODELS, DEFAULT_MODEL };
