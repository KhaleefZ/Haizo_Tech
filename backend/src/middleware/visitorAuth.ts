/**
 * Authenticates the public support widget's visitor token (a Bearer JWT, not a
 * cookie — visitors are cross-origin and anonymous). It grants exactly one thing:
 * acting within the single support session the token was minted for. It never
 * populates `req.user`, so no visitor request can slip into a staff-gated handler.
 */
import type { NextFunction, Request, Response } from 'express';
import { verifyVisitorToken, VisitorTokenError } from '../lib/auth/visitorTokens.js';
import { unauthenticated } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      visitor?: { visitorId: string; sessionId: string };
    }
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
}

export function requireVisitor(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) return next(unauthenticated('This needs a support session'));
  try {
    const claims = verifyVisitorToken(token);
    req.visitor = { visitorId: claims.sub, sessionId: claims.sid };
    next();
  } catch (err) {
    if (err instanceof VisitorTokenError) return next(unauthenticated('Your support session has expired'));
    next(err);
  }
}
