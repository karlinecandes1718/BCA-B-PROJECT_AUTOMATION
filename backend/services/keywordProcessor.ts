/**
 * services/keywordProcessor.ts — Client-Safe Data Orchestrator
 * ==============================================================
 * Sits between the API route and geminiService.
 * Orchestrates, validates, and strips all metadata before
 * returning a clean KeywordResult[] to the HTTP layer.
 *
 * Nothing in this function leaks: no env strings, no token counts,
 * no SDK headers, no internal error details.
 */

import { generateEventDescription } from './geminiService.js';
import type { EventResult } from '../types/keyword.js';

/**
 * Processes a raw array of keyword strings and an optional image through the Gemini service
 * and returns a clean, client-safe `EventResult`.
 *
 * @param parsedKeywords - Array of keyword strings.
 * @param image          - Optional Base64 encoded image object.
 * @returns              - A typed Promise resolving to a clean `EventResult`.
 * @throws               - A sanitized operational error (never leaks system internals).
 */
async function processEventDescriptionForClient(
  parsedKeywords: string[],
  image?: { mimeType: string; data: string }
): Promise<EventResult> {

  // ── Pre-flight validation ───────────────────────────────────────────────────
  if (parsedKeywords.length === 0 && !image) {
    throw new Error('At least one keyword or an image is required.');
  }

  // ── Forward to Gemini service ──────────────────────────────────────────────
  const result = await generateEventDescription(parsedKeywords, image);

  // ── Return clean result ──────────────────────────────────────────────────
  return {
    description: result.description,
    usage: result.usage,
  };
}

export { processEventDescriptionForClient };
