/**
 * Visitor session tokens for the public support widget.
 *
 * Deliberately kept apart from the staff tokens in tokens.ts, and signed with a
 * DIFFERENT secret (VISITOR_JWT_SECRET) and a DIFFERENT audience ('visitor'). A
 * stolen visitor token therefore fails staff verification twice over — wrong key
 * AND wrong audience — and a forged staff token can't pass here either. This is
 * the load-bearing boundary that stops a public, anonymous token from ever
 * reaching staff chat, notifications, or any authenticated endpoint.
 *
 * A visitor token only authorizes one thing: acting within the single support
 * session it was minted for (`sid`). It carries no role and grants no staff
 * capability. TTL is generous (a visitor may return to the same tab) because its
 * blast radius is one anonymous conversation.
 */
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';

const VISITOR_AUDIENCE = 'visitor';
const ISSUER = 'haizotech';
const VISITOR_TTL = '30d';

export interface VisitorClaims {
  /** Visitor id. */
  sub: string;
  /** The support session this token is scoped to. */
  sid: string;
}

/** Reuses the staff TokenError shape so callers map both to a clean 401. */
export class VisitorTokenError extends Error {}

export function signVisitorToken(claims: VisitorClaims): string {
  return jwt.sign({ sid: claims.sid, typ: 'visitor' }, config.visitorJwtSecret, {
    subject: claims.sub,
    audience: VISITOR_AUDIENCE,
    issuer: ISSUER,
    expiresIn: VISITOR_TTL,
  });
}

export function verifyVisitorToken(token: string): VisitorClaims {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.visitorJwtSecret, {
      audience: VISITOR_AUDIENCE,
      issuer: ISSUER,
    });
  } catch (err) {
    throw new VisitorTokenError(err instanceof Error ? err.message : 'Invalid visitor token');
  }
  if (
    typeof payload === 'string' ||
    payload.typ !== 'visitor' ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string'
  ) {
    throw new VisitorTokenError('Malformed visitor token');
  }
  return { sub: payload.sub, sid: payload.sid };
}
