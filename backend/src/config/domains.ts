/**
 * Domain topology. Confirmed by the client:
 *
 *   haizotech.com          public marketing site   (frontend)
 *   admin.haizotech.com    internal dashboard      (admin-frontend)
 *   api.haizotech.com      the API                 (backend)
 *
 * All three share the registrable domain `haizotech.com`. That is what makes
 * cookie auth workable: `Domain=.haizotech.com` with `SameSite=Lax` is honoured
 * across the subdomains, so we keep CSRF protection instead of dropping to
 * `SameSite=None`. If the admin ever moves to a different registrable domain
 * this whole model breaks and would need a BFF proxy instead — so treat these
 * as load-bearing, not incidental.
 */
import { config } from './env.js';

/** Everything under this domain shares session cookies. */
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? (config.isProduction ? '.haizotech.com' : undefined);

export const cookieNames = {
  access: 'hz_at',
  refresh: 'hz_rt',
  csrf: 'hz_csrf',
} as const;

/**
 * Cookie options, split by role.
 *
 * The refresh cookie is Path-scoped to /v1/auth so it is NOT sent on every
 * ordinary API call — it only travels when it is actually needed, which shrinks
 * its exposure considerably. SameSite=Strict on it too, since no cross-site
 * navigation should ever be refreshing a session.
 */
export const cookieOptions = {
  access: {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax' as const,
    domain: COOKIE_DOMAIN,
    path: '/',
    maxAge: 15 * 60 * 1000,
  },
  refresh: {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict' as const,
    domain: COOKIE_DOMAIN,
    path: '/v1/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
  /** Readable by JS on purpose — this is the double-submit CSRF value. */
  csrf: {
    httpOnly: false,
    secure: config.isProduction,
    sameSite: 'lax' as const,
    domain: COOKIE_DOMAIN,
    path: '/',
  },
} as const;

/**
 * Origin allow-list. Wildcards are illegal with `credentials: true` anyway, and
 * a mistake here is the classic "works on localhost, breaks in production" bug —
 * so the production origins are written down rather than derived.
 */
export const PRODUCTION_ORIGINS = [
  'https://haizotech.com',
  'https://www.haizotech.com',
  'https://admin.haizotech.com',
] as const;

export function isAllowedOrigin(origin: string): boolean {
  return config.corsOrigins.includes(origin);
}
