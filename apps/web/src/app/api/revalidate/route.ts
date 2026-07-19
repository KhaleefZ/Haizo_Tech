import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Receives invalidation from the API when content is published.
 *
 * This is the other half of the ten-minute-delay fix. Pages fetch with cache tags
 * and a long `revalidate` floor; this route is what makes an edit appear
 * immediately instead of whenever the floor happens to expire.
 *
 * Security, in order of what an attacker would try:
 *   • Forged request      → HMAC-SHA256 over `timestamp.body` with a shared secret.
 *   • Replayed request    → timestamp must be within 5 minutes, and it is signed,
 *                           so it cannot be moved forward.
 *   • Signature guessing  → constant-time compare; a plain === leaks the prefix.
 *   • Cache stampede      → only named tags are invalidated, never everything.
 */

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

function verify(secret: string, timestamp: number, body: string, provided: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    // Fail closed. A missing secret must never mean "allow anyone".
    return Response.json({ error: { code: 'NOT_CONFIGURED', message: 'Revalidation is not configured' } }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get('x-haizo-signature') ?? '';
  const ts = Number(req.headers.get('x-haizo-timestamp') ?? 0);

  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) {
    return Response.json({ error: { code: 'STALE_TIMESTAMP', message: 'Request is outside the replay window' } }, { status: 401 });
  }

  if (!verify(secret, ts, raw, signature)) {
    return Response.json({ error: { code: 'BAD_SIGNATURE', message: 'Signature did not verify' } }, { status: 401 });
  }

  let payload: { event?: string; tags?: unknown; paths?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: { code: 'BAD_JSON', message: 'Body was not valid JSON' } }, { status: 400 });
  }

  // Reject anything that isn't a list of plain tag strings — this endpoint must
  // not be steerable into revalidating arbitrary paths.
  const tags = Array.isArray(payload.tags)
    ? payload.tags.filter((t): t is string => typeof t === 'string' && /^[a-z0-9:_-]{1,120}$/i.test(t))
    : [];
  const paths = Array.isArray(payload.paths)
    ? payload.paths.filter((p): p is string => typeof p === 'string' && p.startsWith('/') && !p.includes('..'))
    : [];

  if (tags.length === 0 && paths.length === 0) {
    return Response.json({ error: { code: 'NOTHING_TO_DO', message: 'No valid tags or paths supplied' } }, { status: 400 });
  }

  tags.forEach((t) => revalidateTag(t));
  paths.forEach((p) => revalidatePath(p));

  return Response.json({ revalidated: { tags, paths }, at: Date.now() });
}
