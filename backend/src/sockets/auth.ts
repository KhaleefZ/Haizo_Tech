/**
 * Socket handshake authentication.
 *
 * A browser sends its cookies on the WebSocket upgrade request, so the socket
 * layer reads `hz_at` from `handshake.headers.cookie` — the SAME token the HTTP
 * layer uses. One session mechanism covers both transports; there is no separate
 * socket token to leak (the previous system read a localStorage JWT here, which
 * is exactly the XSS exposure the cookie migration removes).
 *
 * The `Authorization: Bearer` fallback mirrors requireAuth's, for the same
 * one-release cutover window, and is removed with it.
 */
import { verifyAccessToken, TokenError } from '../lib/auth/tokens.js';
import { cookieNames } from '../config/domains.js';
import { authRepository } from '../repositories/auth.repository.js';
import type { AuthUser } from '../middleware/auth.js';

/**
 * Just the handshake fields we read. Declared locally rather than imported from
 * socket.io's internals so a library restructure can't break the build; the real
 * `socket.handshake` is structurally assignable to this.
 */
export interface HandshakeLike {
  headers: { cookie?: string; authorization?: string };
  auth: unknown;
}

/** Minimal RFC-6265 cookie-header parse — enough to pull one named value. */
export function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

function tokenFromHandshake(handshake: HandshakeLike): string | null {
  const fromCookie = parseCookie(handshake.headers.cookie, cookieNames.access);
  if (fromCookie) return fromCookie;

  const auth = handshake.auth as { token?: string } | undefined;
  if (auth?.token) return auth.token;

  const header = handshake.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();

  return null;
}

export interface SocketAuth {
  user: AuthUser;
  /** Unix seconds the access token expires — used to disconnect on lapse. */
  expiresAt: number;
}

/** Thrown when a handshake can't be authenticated; the caller maps it to a refused connection. */
export class SocketAuthError extends Error {}

export async function authenticateHandshake(handshake: HandshakeLike): Promise<SocketAuth> {
  const token = tokenFromHandshake(handshake);
  if (!token) throw new SocketAuthError('No session');

  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof TokenError) throw new SocketAuthError('Invalid or expired session');
    throw err;
  }

  const user = await authRepository.findAuthUserById(claims.sub);
  if (!user || user.tokenVersion !== claims.tv) {
    throw new SocketAuthError('Session no longer valid');
  }

  return { user, expiresAt: claims.exp ?? 0 };
}
