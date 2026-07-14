/**
 * utils/api.ts — Frontend API Client
 * ====================================
 * Typed fetch wrappers for cross-origin backend communication.
 * Connects to the Express backend running on port 5000.
 */

export interface KeywordResult {
  keyword: string;
  description: string;
  summary: string;
}

export interface KeywordsApiResponse {
  success: boolean;
  count?: number;
  data?: KeywordResult[];
  error?: string;
}

// ── Read the backend URL securely from environment variables ───────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/**
 * Sends text and/or an image to the backend to generate SEO keywords and metadata.
 * @param text - Optional raw text string (max 100 words)
 * @param image - Optional base64 encoded image object (must be image/jpeg)
 * @returns An array of typed KeywordResult objects
 */
export async function generateKeywords(
  text?: string,
  image?: { mimeType: 'image/jpeg'; data: string }
): Promise<KeywordResult[]> {
  try {
    const response = await fetch(`${API_BASE}/api/keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, image }),
    });

    const result = (await response.json()) as KeywordsApiResponse;

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP Error ${response.status}: Failed to generate keywords`);
    }

    return result.data ?? [];
  } catch (error) {
    console.error('❌ [API Client Error] generateKeywords failed:', error);
    throw error; // Re-throw so the UI can catch and display the error state
  }
}
