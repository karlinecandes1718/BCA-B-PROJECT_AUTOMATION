/**
 * services/geminiService.ts — Typed SEO Keyword Analysis Service
 * ================================================================
 * Uses the official @google/genai SDK with full TypeScript typing.
 * Model is HARDCODED to free-tier only — gemini-2.5-flash / gemini-1.5-flash.
 * Structured JSON output enforced via responseSchema.
 * API key sourced exclusively from the validated `env` object — never from raw process.env.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.js';
import type { KeywordResult } from '../types/keyword.js';

// ─── Allowed Free-Tier Models ─────────────────────────────────────────────────
export const ALLOWED_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'] as const;
export type AllowedModel = typeof ALLOWED_MODELS[number];

const DEFAULT_MODEL: AllowedModel = 'gemini-2.5-flash';

// ─── Initialize SDK with the validated, type-safe API key ─────────────────────
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// ─── Internal Model Guard ─────────────────────────────────────────────────────
/**
 * Validates the requested model against the allowed free-tier list.
 * Throws a descriptive error if a Pro/Ultra model is attempted.
 */
function resolveModel(requestedModel?: string): AllowedModel {
  if (requestedModel !== undefined) {
    if (!(ALLOWED_MODELS as readonly string[]).includes(requestedModel)) {
      throw new Error(
        `Model "${requestedModel}" is not permitted. ` +
        `Only free-tier flash models are allowed: ${ALLOWED_MODELS.join(', ')}.`
      );
    }
    return requestedModel as AllowedModel;
  }
  return DEFAULT_MODEL;
}

// ─── Core Service Function ────────────────────────────────────────────────────
/**
 * Generates SEO descriptions and summaries for an array of keywords.
 * Uses Gemini structured output to guarantee a typed `KeywordResult[]` response.
 *
 * @param keywordList - A non-empty array of keyword strings to analyze.
 * @param model       - Optional free-tier model override (defaults to gemini-2.5-flash).
 * @returns           - A typed Promise resolving to a `KeywordResult[]` array.
 * @throws            - A safe, sanitized error if the API call fails.
 */
async function generateKeywordData(
  keywordList: string[],
  image?: { mimeType: string; data: string },
  model?: string
): Promise<KeywordResult[]> {

  // ── 1. Input Validation ───────────────────────────────────────────────────
  const sanitizedKeywords: string[] = Array.isArray(keywordList) 
    ? keywordList.map((k) => String(k).trim()).filter((k) => k.length > 0)
    : [];

  if (sanitizedKeywords.length === 0 && !image) {
    throw new Error('You must provide either valid keywords or an image to analyze.');
  }

  const resolvedModel = resolveModel(model);

  // ── 2. Determine Workflow & Build Payload ─────────────────────────────────
  let contentsPayload: any;
  const isImageOnly = sanitizedKeywords.length === 0 && image;
  const isHybrid = sanitizedKeywords.length > 0 && image;

  if (isImageOnly && image) {
    // Workflow 2: Image Only
    contentsPayload = [
      { inlineData: { mimeType: image.mimeType, data: image.data.replace(/^data:image\/\w+;base64,/, "") } },
      { text: `You are an expert SEO content strategist.
Extract the dominant items, objects, or themes from this image and treat them as keywords.
For EACH extracted keyword provide:
1. "description": a precise, keyword-rich description in exactly 30 words.
2. "summary": a single compelling sentence summarizing its SEO search value.

Return ONLY a valid JSON array with one object per keyword. No markdown, no extra text.` }
    ];
  } else if (isHybrid && image) {
    // Workflow 3: Fused Hybrid
    contentsPayload = [
      { inlineData: { mimeType: image.mimeType, data: image.data.replace(/^data:image\/\w+;base64,/, "") } },
      { text: `You are an expert SEO content strategist.
Analyze the following keywords and fuse them with the visual context from the provided image.
For EACH keyword provide:
1. "description": a precise, keyword-rich description in exactly 30 words incorporating visual details from the image.
2. "summary": a single compelling sentence summarizing its SEO search value.

Keywords to analyze: ${sanitizedKeywords.join(', ')}

Return ONLY a valid JSON array with one object per keyword. No markdown, no extra text.` }
    ];
  } else {
    // Workflow 1: Keywords Only
    contentsPayload = `You are an expert SEO content strategist.
Analyze the following keywords and for EACH keyword provide:
1. "description": a precise, keyword-rich description in exactly 30 words.
2. "summary": a single compelling sentence summarizing its SEO search value.

Keywords to analyze: ${sanitizedKeywords.join(', ')}

Return ONLY a valid JSON array with one object per keyword. No markdown, no extra text.`;
  }

  // ── 3. API Call ───────────────────────────────────────────────────────────
  try {
    const response = await ai.models.generateContent({
      model: resolvedModel,
      contents: contentsPayload,
      config: {
        // ── Structured Output: Forces Gemini to return parseable JSON ────────
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword:     { type: Type.STRING },
              description: { type: Type.STRING },
              summary:     { type: Type.STRING },
            },
            required: ['keyword', 'description', 'summary'],
          },
        },
      },
    });

    // ── 4. Safe Parsing ──────────────────────────────────────────────────────
    const rawText = response.text;

    if (!rawText || rawText.trim() === '') {
      throw new Error('Gemini returned an empty response body.');
    }

    const parsed: unknown = JSON.parse(rawText);

    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response did not return a JSON array as expected.');
    }

    // ── Type narrowing: ensure each item has the required shape ────────────
    const results: KeywordResult[] = parsed.map((item: unknown, index: number) => {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof (item as Record<string, unknown>)['keyword'] !== 'string' ||
        typeof (item as Record<string, unknown>)['description'] !== 'string' ||
        typeof (item as Record<string, unknown>)['summary'] !== 'string'
      ) {
        throw new Error(`Gemini response item at index ${index} is missing required fields.`);
      }

      const record = item as Record<string, string>;
      return {
        keyword:     record['keyword'],
        description: record['description'],
        summary:     record['summary'],
      };
    });

    return results;

  } catch (error: unknown) {
    // ── 5. Safe Error Handling ───────────────────────────────────────────────
    const rawMessage = error instanceof Error ? error.message : String(error);

    // Detect unreadable image errors from the API (safety, corrupted, bad format, etc.)
    const isImageError = /image|format|safety|content/i.test(rawMessage);
    if (image && isImageError) {
      throw new Error("Unable to read the image. Please delete it and add a clearer image, or add a text description instead.");
    }

    // Redact the API key from the message in case it appears in an SDK error
    const safeMessage = rawMessage.replaceAll(env.GEMINI_API_KEY, '[REDACTED]');
    console.error(`[geminiService] Gemini API error: ${safeMessage}`);

    // Throw a generic operational error — safe for upstream route handlers
    throw new Error(`Gemini API call failed. Please try again later.`);
  }
}

export { generateKeywordData };
