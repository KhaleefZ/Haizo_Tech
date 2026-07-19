/**
 * Self-service profile reads/writes for the signed-in user. Separate from the
 * team/user repository because this one deals in the caller's OWN record and
 * includes the `bio` field the session view omits.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  bio: true,
  avatarUrl: true,
  notificationsEnabled: true,
} as const;

// What issueSession needs back after a password change (incl. the bumped tv).
const SESSION_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  notificationsEnabled: true,
  tokenVersion: true,
} as const;

export const profileRepository = {
  findProfile(id: string) {
    return prisma.user.findUnique({ where: { id }, select: PROFILE_SELECT });
  },

  updateProfile(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: PROFILE_SELECT });
  },

  findPasswordHash(id: string) {
    return prisma.user.findUnique({ where: { id }, select: { password: true } });
  },

  /** Set a new hash AND bump tokenVersion so other sessions are invalidated. */
  setPassword(id: string, password: string) {
    return prisma.user.update({
      where: { id },
      data: { password, tokenVersion: { increment: 1 } },
      select: SESSION_SELECT,
    });
  },
};
