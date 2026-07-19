/**
 * All database access for authentication. Nothing above this layer touches Prisma.
 *
 * `findAuthUserById` selects exactly the columns the session needs and — crucially
 * — NOT the password hash, so the hash never travels past the repository except on
 * the one path (`findCredentialsByEmail`) that has to compare it.
 */
import { prisma } from '../lib/prisma.js';
import type { AuthUser } from '../middleware/auth.js';

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  notificationsEnabled: true,
  tokenVersion: true,
} as const;

export const authRepository = {
  /** Login path only — the single place the password hash is read. */
  findCredentialsByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { ...AUTH_USER_SELECT, password: true },
    });
  },

  findAuthUserById(id: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({ where: { id }, select: AUTH_USER_SELECT });
  },

  /** Bumps tokenVersion, invalidating every outstanding token for the user. */
  async incrementTokenVersion(id: string): Promise<number> {
    const row = await prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });
    return row.tokenVersion;
  },
};
