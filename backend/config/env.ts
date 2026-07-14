/**
 * config/env.ts — Type-Safe Environment Variable Validation
 * ===========================================================
 * Runs at server startup. Uses Zod to validate all required
 * environment variables. Crashes the server cleanly if any
 * are missing, empty, or appear to be placeholders.
 *
 * ⚠️  The actual value of GEMINI_API_KEY and ADMIN_PASSWORD are NEVER logged.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ─── Zod Schema — strict validation rules ─────────────────────────────────────
const envSchema = z.object({
  GEMINI_API_KEY: z
    .string({ error: 'GEMINI_API_KEY is required but was not found in environment.' })
    .min(1, 'GEMINI_API_KEY must not be empty.')
    .refine(
      (val) => !val.startsWith('dummy') && !val.startsWith('your_'),
      'GEMINI_API_KEY appears to be a placeholder. Please set a real API key.'
    ),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .optional()
    .default('5000'),

  ADMIN_PASSWORD: z
    .string({ error: 'ADMIN_PASSWORD is required but was not found in environment.' })
    .min(6, 'ADMIN_PASSWORD must be at least 6 characters for security.'),
});

// ─── Derive the TypeScript type from the schema ───────────────────────────────
export type Env = z.infer<typeof envSchema>;

// ─── Parse and validate — crash safely if invalid ────────────────────────────
let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('\n🔴 [ENV VALIDATION FAILED] Server cannot start due to missing or invalid environment variables:\n');

    error.issues.forEach((issue: z.ZodIssue) => {
      // Log ONLY the field path and message — never the actual value
      console.error(`  ❌ ${issue.path.join('.')} → ${issue.message}`);
    });

    console.error('\n👉 Please check your backend/.env file and ensure all required variables are set correctly.\n');
  } else {
    console.error('🔴 [ENV VALIDATION FAILED] An unexpected error occurred during environment validation.');
  }

  process.exit(1);
}

// Export as a fully typed, frozen (immutable) object
export const env: Readonly<Env> = Object.freeze(parsedEnv);
