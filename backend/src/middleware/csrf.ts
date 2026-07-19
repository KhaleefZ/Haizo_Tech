/**
 * Double-submit CSRF check.
 *
 * On login/refresh we set `hz_csrf` as a NON-HttpOnly cookie; the SPA reads it
 * and echoes it in the `X-CSRF-Token` header on every state-changing call. A
 * cross-site attacker can ride the user's cookies but, blocked by the same-origin
 * policy, cannot read that cookie to forge the header — so the two failing to
 * match is the signal that the request didn't originate from our own app.
 *
 * This complements, not replaces, `SameSite`: SameSite=Lax already stops most
 * cross-site POSTs, and the double-submit token covers the residual cases
 * (older browsers, top-level GET-to-POST tricks) at near-zero cost.
 */
import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { cookieNames } from '../config/domains.js';
import { forbidden } from '../lib/errors.js';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // timingSafeEqual throws on length mismatch; guard first, but still compare
  // (against a same-length dummy) so length isn't leaked by early return timing.
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  const cookie = (req.cookies as Record<string, string> | undefined)?.[cookieNames.csrf];
  const header = req.header('x-csrf-token');

  if (!cookie || !header || !safeEqual(cookie, header)) {
    return next(forbidden('Invalid or missing CSRF token'));
  }
  next();
}
