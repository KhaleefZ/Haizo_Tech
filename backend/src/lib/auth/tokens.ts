/**
 * Staff session tokens.
 *
 * Two short JWTs, both signed with JWT_SECRET and stamped `aud: 'staff'`:
 *   • access  (hz_at) — 15 min, carries role for cheap authorization.
 *   • refresh (hz_rt) — 30 days, carries nothing but identity + tokenVersion.
 *
 * The `aud` claim is the load-bearing part of the visitor-token defence: the
 * visitor widget (Phase 8) signs with a SEPARATE secret and `aud: 'visitor'`,
 * so a stolen visitor token fails staff verification twice over — wrong key AND
 * wrong audience. We assert the audience on verify, never just decode.
 *
 * `tokenVersion` (`tv`) is copied from the user row at sign time and re-checked
 * against the live row on every request. Bumping the column invalidates every
 * outstanding token for that user — the mechanism behind "log out everywhere"
 * and secret rotation, without maintaining a blocklist.
 */
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { config } from '../../config/env.js';
import type { Role } from '@haizo/types';

const STAFF_AUDIENCE = 'staff';
const ISSUER = 'haizotech';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';

export interface AccessClaims {
  sub: string;
  role: Role;
  tv: number;
  /** Unix seconds; set by verify from the token's own `exp`. Undefined at sign time. */
  exp?: number;
}

export interface RefreshClaims {
  sub: string;
  tv: number;
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign({ role: claims.role, tv: claims.tv, typ: 'access' }, config.jwtSecret, {
    subject: claims.sub,
    audience: STAFF_AUDIENCE,
    issuer: ISSUER,
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(claims: RefreshClaims): string {
  return jwt.sign({ tv: claims.tv, typ: 'refresh' }, config.jwtSecret, {
    subject: claims.sub,
    audience: STAFF_AUDIENCE,
    issuer: ISSUER,
    expiresIn: REFRESH_TTL,
  });
}

/** Thrown for any invalid/expired/wrong-audience token. Callers map it to 401. */
export class TokenError extends Error {}

function verify(token: string, expectedType: 'access' | 'refresh'): jwt.JwtPayload {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret, {
      audience: STAFF_AUDIENCE,
      issuer: ISSUER,
    });
  } catch (err) {
    throw new TokenError(err instanceof Error ? err.message : 'Invalid token');
  }
  if (typeof payload === 'string' || payload.typ !== expectedType || typeof payload.sub !== 'string') {
    // A refresh token presented where an access token is required (or vice versa)
    // is a category error, not a valid session — reject it explicitly.
    throw new TokenError('Wrong token type');
  }
  return payload;
}

export function verifyAccessToken(token: string): AccessClaims {
  const p = verify(token, 'access');
  return {
    sub: p.sub as string,
    role: p.role as Role,
    tv: Number(p.tv),
    ...(typeof p.exp === 'number' ? { exp: p.exp } : {}),
  };
}

export function verifyRefreshToken(token: string): RefreshClaims {
  const p = verify(token, 'refresh');
  return { sub: p.sub as string, tv: Number(p.tv) };
}

/**
 * The CSRF value. Not a JWT — it just has to be unguessable and echoed back in
 * a header the double-submit check compares against the cookie. 32 random bytes
 * is plenty and keeps the cookie small.
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}
