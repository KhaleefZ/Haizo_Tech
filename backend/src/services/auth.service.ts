/**
 * Authentication logic. Controllers call this and translate the result into
 * cookies + HTTP; they never verify a password or mint a token themselves.
 *
 * A successful login or refresh returns both the public `CurrentUser` view and a
 * `SessionTokens` triple. The service does not know about cookies — that keeps it
 * testable without an HTTP layer, and keeps cookie policy in one place
 * (config/domains.ts + the controller).
 */
import type { CurrentUser } from '@haizo/types';
import { authRepository } from '../repositories/auth.repository.js';
import type { AuthUser } from '../middleware/auth.js';
import { verifyPassword } from '../lib/auth/password.js';
import {
  signAccessToken,
  signRefreshToken,
  generateCsrfToken,
  verifyRefreshToken,
  TokenError,
} from '../lib/auth/tokens.js';
import { unauthenticated } from '../lib/errors.js';

export interface SessionTokens {
  access: string;
  refresh: string;
  csrf: string;
}

// A well-formed bcrypt hash of a random string. When the email doesn't exist we
// still run a compare against this so a missing user and a wrong password take
// the same time — no user enumeration via response latency.
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Pr6Vb8xGxD3zqz3n4yV5w1bqk1a';

function issueSession(user: AuthUser): SessionTokens {
  return {
    access: signAccessToken({ sub: user.id, role: user.role, tv: user.tokenVersion }),
    refresh: signRefreshToken({ sub: user.id, tv: user.tokenVersion }),
    csrf: generateCsrfToken(),
  };
}

export function toCurrentUser(user: AuthUser): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    notificationsEnabled: user.notificationsEnabled,
  };
}

export const authService = {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: CurrentUser; tokens: SessionTokens }> {
    const row = await authRepository.findCredentialsByEmail(email.trim().toLowerCase());

    // Always compare, even when the user is missing, to keep timing uniform.
    const ok = await verifyPassword(password, row?.password ?? DUMMY_HASH);

    // One generic message for both "no such email" and "wrong password" — telling
    // them apart is a gift to credential-stuffing.
    if (!row || !ok) throw unauthenticated('Email or password is incorrect');

    const { password: _pw, ...user } = row;
    return { user: toCurrentUser(user), tokens: issueSession(user) };
  },

  /**
   * Exchange a refresh token for a fresh session. Re-reads the user so a
   * tokenVersion bump (logout-everywhere, secret rotation) invalidates the
   * refresh token too, and so the rotated access token carries the current role.
   */
  async refresh(refreshToken: string): Promise<{ user: CurrentUser; tokens: SessionTokens }> {
    let claims;
    try {
      claims = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err instanceof TokenError) throw unauthenticated('Please sign in again');
      throw err;
    }

    const user = await authRepository.findAuthUserById(claims.sub);
    if (!user || user.tokenVersion !== claims.tv) {
      throw unauthenticated('Please sign in again');
    }

    return { user: toCurrentUser(user), tokens: issueSession(user) };
  },
};
