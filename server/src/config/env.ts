/**
 * Environment configuration.
 *
 * Ported from the existing backend's `config/env.ts`, which already did the right
 * thing: validate at boot with zod and crash loudly rather than discover a missing
 * variable halfway through a request.
 *
 * Additions for the rebuild: a separate visitor-token secret (so a public chat
 * token can never be verified as a staff token), and the revalidation webhook
 * secret. Both are declared here from day one so a deploy can't discover them late.
 */
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  VISITOR_JWT_SECRET: z
    .string()
    .min(32, 'VISITOR_JWT_SECRET must be at least 32 characters'),

  /** Comma-separated allow-list. Wildcards are illegal with credentialed CORS. */
  CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS is required'),

  REVALIDATE_SECRET: z.string().min(8).optional(),
  WEB_REVALIDATE_URL: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Print every problem at once rather than one per restart.
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  console.error(`\n✖ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

/**
 * The visitor secret must differ from the staff secret. Equal secrets would let a
 * forged visitor token pass staff verification, which is the whole risk the
 * separate key exists to prevent — so this is a boot failure, not a warning.
 */
if (raw.JWT_SECRET === raw.VISITOR_JWT_SECRET) {
  console.error('\n✖ JWT_SECRET and VISITOR_JWT_SECRET must be different.\n');
  process.exit(1);
}

export const config = {
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  port: raw.PORT,
  databaseUrl: raw.DATABASE_URL,
  jwtSecret: raw.JWT_SECRET,
  visitorJwtSecret: raw.VISITOR_JWT_SECRET,
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  revalidateSecret: raw.REVALIDATE_SECRET,
  webRevalidateUrl: raw.WEB_REVALIDATE_URL,
} as const;

export type Config = typeof config;
