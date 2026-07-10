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

import { generateKeywordData } from './geminiService.js';
import type { KeywordResult } from '../types/keyword.js';

/**
 * Processes a raw array of keyword strings and an optional image through the Gemini Flash service
 * and returns a clean, client-safe `KeywordResult[]`.
 *
 * @param parsedKeywords - Array of keyword strings.
 * @param image          - Optional Base64 encoded image object.
 * @returns              - A typed Promise resolving to a clean `KeywordResult[]`.
 * @throws               - A sanitized operational error (never leaks system internals).
 */
async function processKeywordsForClient(
  parsedKeywords: string[],
  image?: { mimeType: string; data: string }
): Promise<KeywordResult[]> {

  // ── Pre-flight validation ───────────────────────────────────────────────────
  if (parsedKeywords.length === 0 && !image) {
    throw new Error('At least one keyword or an image is required.');
  }

  // ── Forward to Gemini service ──────────────────────────────────────────────
  const rawResults = await generateKeywordData(parsedKeywords, image);

  // ── Safe array verification ────────────────────────────────────────────────
  // Even though generateKeywordData already narrows the type, we verify here
  // as an explicit defensive layer in this orchestration boundary.
  if (!Array.isArray(rawResults)) {
    throw new Error('Upstream service returned an unexpected non-array payload.');
  }

  // ── Strip & map to exact KeywordResult shape ───────────────────────────────
  // Explicitly whitelist only the fields defined in KeywordResult.
  // This prevents any extra fields (metadata, token info, SDK internals)
  // from leaking into the HTTP response, even if the upstream shape changes.
  const cleanResults: KeywordResult[] = rawResults.map((item) => ({
    keyword:     item.keyword,
    description: item.description,
    summary:     item.summary,
  }));

  return cleanResults;
}

export { processKeywordsForClient };
