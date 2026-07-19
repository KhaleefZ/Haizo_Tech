/**
 * Authentication and authorization gates.
 *
 * `requireAuth` establishes WHO you are; `requireRole` decides WHAT you may do.
 * They are separate so the role-coverage test can assert that every protected
 * route mounts `requireAuth`, and that every write route additionally mounts
 * `requireRole` — a route that forgets either fails the test rather than
 * shipping an open endpoint.
 *
 * Token source, in order:
 *   1. the `hz_at` cookie (the real mechanism);
 *   2. an `Authorization: Bearer` header — a deliberate, TIME-LIMITED fallback so
 *      users mid-session during the cutover release aren't bounced. It is removed
 *      one release later (see DEPLOYMENT cutover T+72h). Cookie wins if both exist.
 */
import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@haizo/types';
import { verifyAccessToken, TokenError } from '../lib/auth/tokens.js';
import { cookieNames } from '../config/domains.js';
import { authRepository } from '../repositories/auth.repository.js';
import { unauthenticated, forbidden } from '../lib/errors.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
  tokenVersion: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[cookieNames.access];
  if (cookieToken) return cookieToken;

  const header = req.header('authorization');
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();

  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw unauthenticated();

    let claims;
    try {
      claims = verifyAccessToken(token);
    } catch (err) {
      if (err instanceof TokenError) throw unauthenticated('Your session has expired');
      throw err;
    }

    // The DB read does double duty: it re-checks tokenVersion (so a revoked
    // session dies within the access-token lifetime at the latest, immediately
    // in practice) AND yields the live role/name, so a role change takes effect
    // without waiting for the token to expire.
    const user = await authRepository.findAuthUserById(claims.sub);
    if (!user || user.tokenVersion !== claims.tv) {
      throw unauthenticated('Your session is no longer valid');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Gate by role. Must run AFTER requireAuth. SUPER_ADMIN is not implicitly
 * allowed everywhere — if an endpoint should admit them, list them. Explicit
 * beats a magic super-role that silently widens access.
 */
export function requireRole(...allowed: Role[]) {
  // Named (not an anonymous arrow) so the route-gate coverage test can detect it
  // on a route's middleware stack — an admin route that forgets it fails the test.
  return function requireRole(req: Request, _res: Response, next: NextFunction) {
    if (!req.user) return next(unauthenticated());
    if (!allowed.includes(req.user.role)) return next(forbidden());
    next();
  };
}
