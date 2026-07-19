/**
 * Auth HTTP layer. The ONLY place cookies are written or cleared — the service
 * returns tokens, the controller decides how they travel. No token ever appears
 * in a response body: credentials never touch JavaScript.
 */
import type { NextFunction, Request, Response } from 'express';
import { authService, toCurrentUser } from '../services/auth.service.js';
import type { SessionTokens } from '../services/auth.service.js';
import { cookieNames, cookieOptions } from '../config/domains.js';
import { unauthenticated } from '../lib/errors.js';

function setSessionCookies(res: Response, tokens: SessionTokens): void {
  res.cookie(cookieNames.access, tokens.access, cookieOptions.access);
  res.cookie(cookieNames.refresh, tokens.refresh, cookieOptions.refresh);
  // The CSRF cookie must outlive the access token so it is still present when the
  // client calls /auth/refresh — give it the refresh lifetime.
  res.cookie(cookieNames.csrf, tokens.csrf, {
    ...cookieOptions.csrf,
    maxAge: cookieOptions.refresh.maxAge,
  });
}

function clearSessionCookies(res: Response): void {
  // clearCookie only clears if domain+path match how the cookie was set, so reuse
  // the same options — but strip maxAge. In Express 4 a maxAge passed to
  // clearCookie is still applied, which sets a FUTURE expiry and leaves the cookie
  // in place. Dropping it lets clearCookie set its own past expiry.
  const { maxAge: _a, ...access } = cookieOptions.access;
  const { maxAge: _r, ...refresh } = cookieOptions.refresh;
  res.clearCookie(cookieNames.access, access);
  res.clearCookie(cookieNames.refresh, refresh);
  res.clearCookie(cookieNames.csrf, cookieOptions.csrf);
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    // Shape, email format and length were enforced by the spec validator.
    const { email, password } = req.body as { email: string; password: string };
    const { user, tokens } = await authService.login(email, password);
    setSessionCookies(res, tokens);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees req.user; the guard keeps the type-checker honest.
    if (!req.user) throw unauthenticated();
    res.json(toCurrentUser(req.user));
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.[cookieNames.refresh];
    if (!token) throw unauthenticated('Please sign in again');
    const { user, tokens } = await authService.refresh(token);
    setSessionCookies(res, tokens);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    clearSessionCookies(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
