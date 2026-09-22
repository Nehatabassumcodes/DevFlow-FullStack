import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';
import { parseOrigins } from '../utils/origins';

// Load backend/.env whichever directory the process is started from
// (src/config and dist/config are both two levels below the backend root).
// Variables already present in the real environment take precedence.
loadDotenv({ path: path.resolve(__dirname, '../../.env') });

// Only used outside production, so a fresh local setup works without configuration.
const DEV_FRONTEND_ORIGIN = 'http://localhost:3000';

function blankToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    SESSION_SECRET: z.string().min(32).optional(),
    // AI task generation (optional: without a key the endpoint answers 503 and the rest of the API works).
    // A blank value (e.g. `GEMINI_API_KEY=` copied from .env.example) counts as "not set".
    GEMINI_API_KEY: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    GEMINI_MODEL: z.preprocess(blankToUndefined, z.string().min(1).default('gemini-3.1-flash-lite')),
    GEMINI_BASE_URL: z.preprocess(
      blankToUndefined,
      z.string().url('GEMINI_BASE_URL must be a valid URL').default('https://generativelanguage.googleapis.com')
    ),
    // One origin, or several separated by commas.
    FRONTEND_ORIGIN: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.SESSION_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'SESSION_SECRET is required when NODE_ENV=production',
      });
    }
    const raw = data.FRONTEND_ORIGIN?.trim();
    if (!raw) {
      if (data.NODE_ENV === 'production') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['FRONTEND_ORIGIN'],
          message: 'FRONTEND_ORIGIN is required when NODE_ENV=production',
        });
      }
      return;
    }
    const { origins, invalid } = parseOrigins(raw);
    for (const value of invalid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_ORIGIN'],
        message: `"${value}" is not a valid http(s) URL`,
      });
    }
    if (origins.length === 0 && invalid.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_ORIGIN'],
        message: 'At least one origin is required',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.') || 'env'}: ${issue.message}`);
  }
  console.error('Check backend/.env (see backend/.env.example).');
  process.exit(1);
}

const frontendOrigin = parsed.data.FRONTEND_ORIGIN?.trim() || DEV_FRONTEND_ORIGIN;

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  sessionSecret: parsed.data.SESSION_SECRET || 'devflow-development-session-secret-change-me',
  frontendOrigins: parseOrigins(frontendOrigin).origins,
  // Server-side only. The key is never sent to the browser or written to logs or responses.
  ai: {
    apiKey: parsed.data.GEMINI_API_KEY,
    model: parsed.data.GEMINI_MODEL,
    baseUrl: parsed.data.GEMINI_BASE_URL.replace(/\/+$/, ''),
  },
} as const;
