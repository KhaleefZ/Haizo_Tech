/**
 * Visitor socket handshake. A visitor connects with `auth: { visitorToken }` —
 * NEVER a cookie — so it can't ride a staff session. The token is verified with
 * the visitor secret + audience, exactly like the REST path, and yields only the
 * session the visitor is scoped to. The connection handler joins that one support
 * room and nothing else.
 */
import { verifyVisitorToken, VisitorTokenError } from '../lib/auth/visitorTokens.js';

export interface VisitorSocketAuth {
  visitorId: string;
  sessionId: string;
}

export class VisitorSocketAuthError extends Error {}

export function authenticateVisitorHandshake(handshake: { auth: unknown }): VisitorSocketAuth {
  const auth = handshake.auth as { visitorToken?: string } | undefined;
  const token = auth?.visitorToken;
  if (!token) throw new VisitorSocketAuthError('No visitor token');
  try {
    const claims = verifyVisitorToken(token);
    return { visitorId: claims.sub, sessionId: claims.sid };
  } catch (err) {
    if (err instanceof VisitorTokenError) throw new VisitorSocketAuthError('Invalid visitor token');
    throw err;
  }
}
