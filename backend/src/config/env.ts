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
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve .env relative to THIS file, not to process.cwd(). Turbo, vitest and a
// PM2 deploy all invoke the server from different working directories, and
// cwd-relative loading silently yields an empty env in at least one of them.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') });

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

  /**
   * SMTP for notification emails + the daily digest. All optional: with no
   * SMTP_PASS the mailer is a logged no-op, so the app runs fine until real
   * credentials are supplied. Defaults are Gmail's submission endpoint.
   */
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  /** Where deep links in emails point (the admin app). */
  ADMIN_URL: z.string().url().default('http://localhost:3001'),

  /**
   * Object storage for uploads (Cloudflare R2 / any S3-compatible). All optional:
   * without them the upload endpoints return 503 and image fields stay plain URLs.
   */
  S3_ENDPOINT: z.string().optional(), // R2: https://<accountid>.r2.cloudflarestorage.com
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(), // public base for objects, e.g. https://cdn.haizotech.com
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

  smtpHost: raw.SMTP_HOST,
  smtpPort: raw.SMTP_PORT,
  smtpUser: raw.SMTP_USER,
  smtpPass: raw.SMTP_PASS,
  // Fall back to the SMTP user as the From address if not set explicitly.
  mailFrom: raw.MAIL_FROM ?? raw.SMTP_USER,
  adminUrl: raw.ADMIN_URL,

  s3Endpoint: raw.S3_ENDPOINT,
  s3Region: raw.S3_REGION,
  s3Bucket: raw.S3_BUCKET,
  s3AccessKeyId: raw.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: raw.S3_SECRET_ACCESS_KEY,
  s3PublicUrl: raw.S3_PUBLIC_URL,
} as const;

export type Config = typeof config;
