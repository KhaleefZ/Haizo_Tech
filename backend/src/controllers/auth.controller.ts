/**
 * Auth HTTP layer. The ONLY place cookies are written or cleared — the service
 * returns tokens, the controller decides how they travel. No token ever appears
 * in a response body: credentials never touch JavaScript.
 */
import type { NextFunction, Request, Response } from 'express';
import { authService, toCurrentUser } from '../services/auth.service.js';
import { cookieNames } from '../config/domains.js';
import { setSessionCookies, clearSessionCookies } from '../lib/auth/cookies.js';
import { unauthenticated } from '../lib/errors.js';

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
