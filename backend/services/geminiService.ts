/**
 * services/geminiService.ts — Typed SEO Keyword Analysis Service
 * ================================================================
 * Uses the official @google/genai SDK with full TypeScript typing.
 * Model is HARDCODED to free-tier only — gemini-2.5-flash / gemini-1.5-flash.
 * Structured JSON output enforced via responseSchema.
 * API key sourced exclusively from the validated `env` object — never from raw process.env.
 */

import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import type { EventResult } from '../types/keyword.js';

// ─── Allowed Free-Tier Models ─────────────────────────────────────────────────
export const ALLOWED_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'] as const;
export type AllowedModel = typeof ALLOWED_MODELS[number];

const DEFAULT_MODEL: AllowedModel = 'gemini-2.5-flash';

// ─── Initialize SDK with the validated, type-safe API key ─────────────────────
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// ─── Internal Model Guard ─────────────────────────────────────────────────────
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

const SYSTEM_PROMPT = `You are an AI assistant built into an event management portal. Your job is to analyze the provided inputs—which may be a list of keywords, an uploaded image (like a flyer or photo), or a mix of both—and generate a structured event description.

You must strictly adhere to the following rules:

Length: Keep the entire response under 150 words.

Tone: Engaging, informative, and professional.

Missing Info: If the image or keywords lack specific details (like exact time or date), write the description smoothly without inventing fake dates. Use placeholders like "[Date]" only if absolutely necessary, but prefer natural phrasing like "Coming this weekend."

You MUST use this exact layout for the output:

[Catchy Event Title]

Overview:
[A 1-2 sentence introduction explaining what the event/workshop/announcement is about based on the image or text details.]

Key Details:

What to Expect: [A brief bullet point detailing the main activity or takeaway.]

Who It's For: [A brief bullet point defining the target audience or a major highlight like "Beginner friendly" or "Free Entry".]

Call to Action:
[A final punchy sentence inviting users to register, join, or learn more.]`;

// ─── Core Service Function ────────────────────────────────────────────────────
async function generateEventDescription(
  keywordList: string[],
  image?: { mimeType: string; data: string },
  model?: string
): Promise<EventResult> {

  // ── 1. Input Validation ───────────────────────────────────────────────────
  const sanitizedKeywords: string[] = Array.isArray(keywordList) 
    ? keywordList.map((k) => String(k).trim()).filter((k) => k.length > 0)
    : [];

  if (sanitizedKeywords.length === 0 && !image) {
    throw new Error('You must provide either valid keywords or an image to analyze.');
  }

  const resolvedModel = resolveModel(model);

  // ── 2. Determine Workflow & Build Payload ─────────────────────────────────
  let contentsPayload: any[] = [];
  
  // Add the user input text if keywords are provided
  let userInput = '';
  if (sanitizedKeywords.length > 0) {
    userInput = `User Input Keywords: ${sanitizedKeywords.join(', ')}`;
  } else if (image) {
    userInput = `User Input: (No keywords provided. Please analyze the image and generate the description based entirely on what you see in the flyer/photo.)`;
  }

  contentsPayload.push(SYSTEM_PROMPT);

  if (image) {
    contentsPayload.push({ inlineData: { mimeType: image.mimeType, data: image.data.replace(/^data:image\/\w+;base64,/, "") } });
  }

  if (userInput) {
    contentsPayload.push(userInput);
  }

  // ── 3. API Call ───────────────────────────────────────────────────────────
  try {
    const response = await ai.models.generateContent({
      model: resolvedModel,
      contents: contentsPayload,
    });

    // ── 4. Safe Parsing ──────────────────────────────────────────────────────
    const rawText = response.text;
    const usage = response.usageMetadata?.totalTokenCount || 0;

    if (!rawText || rawText.trim() === '') {
      throw new Error('Gemini returned an empty response body.');
    }

    return { description: rawText.trim(), usage };

  } catch (error: unknown) {
    // ── 5. Safe Error Handling ───────────────────────────────────────────────
    console.error('[geminiService] Gemini API error:', JSON.stringify(error));
    
    // Check if it's an API key error (e.g. leaked or invalid key)
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.status === 403 || (err.error && err.error.code === 403) || err.message?.includes('API key')) {
        throw new Error(err.message || err.error?.message || 'Invalid or leaked API key. Please update your backend .env file with a new key.');
      }
    }

    const rawMessage = error instanceof Error ? error.message : String(error);

    const isImageError = /image|format|safety|content/i.test(rawMessage);
    if (image && isImageError) {
      throw new Error("Unable to read the image. Please delete it and add a clearer image, or add a text description instead.");
    }

    throw new Error(`Gemini API call failed. Please try again later.`);
  }
}

export { generateEventDescription };
