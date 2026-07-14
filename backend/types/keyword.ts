/**
 * types/keyword.ts — Shared TypeScript Types
 * ============================================
 * Single source of truth for the KeywordResult shape.
 * Used by geminiService, processKeywordsForClient, and API routes.
 * All fields are plain JSON-serializable primitives — safe for HTTP responses.
 */

// ─── Core Response Interface ──────────────────────────────────────────────────
/**
 * Represents the SEO analysis result for a single keyword.
 * Matches the Gemini structured output schema exactly.
 */
export interface KeywordResult {
  /** The original keyword string that was analyzed. */
  keyword: string;

  /** A precise, keyword-rich SEO description in approximately 30 words. */
  description: string;

  /** A single compelling sentence summarizing the keyword's SEO value. */
  summary: string;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────
/**
 * The clean HTTP response envelope sent back to the frontend.
 * Contains ONLY the serialized keyword data — no metadata, no tokens, no env strings.
 */
export interface KeywordsApiResponse {
  success: true;
  count: number;
  data: KeywordResult[];
}

/**
 * Standard error response envelope for the API.
 */
export interface KeywordsApiErrorResponse {
  success: false;
  error: string;
}
