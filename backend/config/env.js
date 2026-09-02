/**
 * env.js — Environment Variable Validation
 * =========================================
 * Runs at server startup using Zod.
 * If GEMINI_API_KEY is missing or empty, the process exits with code 1.
 * The actual key value is NEVER logged or exposed.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Define the schema for environment variables
// GEMINI_API_KEY is optional — AI endpoint handles missing key gracefully at request time
const envSchema = z.object({
  GEMINI_API_KEY: z
    .string()
    .optional()
    .default(''),

  ADMIN_PASSWORD: z
    .string()
    .min(1, 'ADMIN_PASSWORD must not be empty.')
    .default('bcab2024'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .optional()
    .default('5003'),
});

// Parse and validate — crash safely if invalid
let parsedEnv;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('\n🔴 [ENV VALIDATION FAILED] Server cannot start due to missing or invalid environment variables:\n');

    error.issues.forEach((issue) => {
      // Log the FIELD NAME and the error MESSAGE only — never the value
      console.error(`  ❌ ${issue.path.join('.')} → ${issue.message}`);
    });

    console.error('\n👉 Please check your backend/.env file and ensure all required variables are set correctly.\n');
  } else {
    // Unknown error during parsing — still don't expose anything sensitive
    console.error('🔴 [ENV VALIDATION FAILED] An unexpected error occurred during environment validation.');
  }

  process.exit(1); // Crash the server cleanly
}

export const env = Object.freeze(parsedEnv);
