/**
 * On-demand cache invalidation — the fix for the ten-minute content delay.
 *
 * The live site fetches with `next: { revalidate: 600 }`, so a published edit can
 * sit invisible for ten minutes. The cache TAGS were already declared there; only
 * the invalidation call was missing. This is that call.
 *
 * Auth is HMAC-SHA256 over `timestamp.body` rather than a bearer token, for two
 * reasons: a leaked bearer token in a log is replayable forever, and a signature
 * bound to a timestamp gives a replay window we can actually close (5 minutes).
 *
 * Delivery is best-effort HERE but durable in the CALLER: contentService writes an
 * OutboxEvent in the same transaction as the content change, so a failed POST is
 * retried rather than lost. This function is the transport, not the guarantee.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { logger } from './logger.js';

/** Tag vocabulary. Must match the tags the Next app declares on its fetches. */
export const tags = {
  services: 'services',
  service: (slug: string) => `service:${slug}`,
  works: 'works',
  work: (slug: string) => `work:${slug}`,
  blogs: 'blogs',
  blog: (slug: string) => `blog:${slug}`,
  testimonials: 'testimonials',
  industries: 'industries',
  home: 'home',
  sitemap: 'sitemap',
} as const;

export interface RevalidatePayload {
  event: string;
  tags: string[];
  paths?: string[];
  ts: number;
}

export function sign(secret: string, timestamp: number, body: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

/**
 * Constant-time comparison. A plain `===` on a signature leaks its prefix through
 * timing, which is enough to forge one given patience.
 */
export function verify(secret: string, timestamp: number, body: string, provided: string): boolean {
  const expected = sign(secret, timestamp, body);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const REPLAY_WINDOW_MS = 5 * 60 * 1000;

export async function revalidate(event: string, tagList: string[], paths: string[] = []) {
  if (!config.revalidateSecret || !config.webRevalidateUrl) {
    logger.debug({ event }, 'Revalidation not configured — skipping');
    return { ok: false, reason: 'not-configured' as const };
  }

  const ts = Date.now();
  const body = JSON.stringify({ event, tags: tagList, paths, ts } satisfies RevalidatePayload);

  try {
    const res = await fetch(config.webRevalidateUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-haizo-timestamp': String(ts),
        'x-haizo-signature': sign(config.revalidateSecret, ts, body),
      },
      body,
      // Without a timeout a hung front end would hold this request open and, in a
      // publish flow, block the admin response behind it.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      logger.error({ event, status: res.status }, 'Revalidation rejected');
      return { ok: false, reason: 'rejected' as const, status: res.status };
    }

    logger.info({ event, tags: tagList }, 'Revalidated');
    return { ok: true as const };
  } catch (err) {
    logger.error({ event, err }, 'Revalidation request failed');
    return { ok: false, reason: 'unreachable' as const };
  }
}
