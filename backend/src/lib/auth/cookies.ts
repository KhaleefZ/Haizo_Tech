/**
 * The one place session cookies are written or cleared. Both the auth controller
 * (login/refresh/logout) and the self-service password change use these, so the
 * cookie policy lives in exactly one spot.
 */
import type { Response } from 'express';
import type { SessionTokens } from '../../services/auth.service.js';
import { cookieNames, cookieOptions } from '../../config/domains.js';

export function setSessionCookies(res: Response, tokens: SessionTokens): void {
  res.cookie(cookieNames.access, tokens.access, cookieOptions.access);
  res.cookie(cookieNames.refresh, tokens.refresh, cookieOptions.refresh);
  // CSRF cookie outlives the access token so it's present for /auth/refresh.
  res.cookie(cookieNames.csrf, tokens.csrf, {
    ...cookieOptions.csrf,
    maxAge: cookieOptions.refresh.maxAge,
  });
}

export function clearSessionCookies(res: Response): void {
  // clearCookie only clears when domain+path match; drop maxAge so Express sets
  // its own past expiry (a maxAge on clearCookie sets a FUTURE expiry in v4).
  const { maxAge: _a, ...access } = cookieOptions.access;
  const { maxAge: _r, ...refresh } = cookieOptions.refresh;
  res.clearCookie(cookieNames.access, access);
  res.clearCookie(cookieNames.refresh, refresh);
  res.clearCookie(cookieNames.csrf, cookieOptions.csrf);
}
