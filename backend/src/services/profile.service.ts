import { Prisma } from '@prisma/client';
import type { AdminProfile, NotificationPrefs, UpdateProfile } from '@haizo/types';
import { profileRepository } from '../repositories/profile.repository.js';
import { verifyPassword, hashPassword } from '../lib/auth/password.js';
import { issueSession } from './auth.service.js';
import type { SessionTokens } from './auth.service.js';
import { notFound, unauthenticated } from '../lib/errors.js';

type ProfileRow = NonNullable<Awaited<ReturnType<typeof profileRepository.findProfile>>>;

function toAdminProfile(row: ProfileRow): AdminProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    notificationsEnabled: row.notificationsEnabled,
    notificationPrefs: (row.notificationPrefs ?? null) as NotificationPrefs,
  };
}

export const profileService = {
  async getProfile(userId: string): Promise<AdminProfile> {
    const row = await profileRepository.findProfile(userId);
    if (!row) throw notFound('User');
    return toAdminProfile(row);
  },

  async updateProfile(userId: string, input: UpdateProfile): Promise<AdminProfile> {
    const row = await profileRepository.updateProfile(userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.notificationsEnabled !== undefined
        ? { notificationsEnabled: input.notificationsEnabled }
        : {}),
      // Prisma needs DbNull (not JS null) to clear a nullable Json column.
      ...(input.notificationPrefs !== undefined
        ? { notificationPrefs: input.notificationPrefs ?? Prisma.DbNull }
        : {}),
    });
    return toAdminProfile(row);
  },

  /**
   * Verify the current password, store the new hash, and return a fresh session.
   * setPassword bumps tokenVersion (killing OTHER sessions); re-issuing here keeps
   * THIS session alive so the user isn't logged out of the tab they changed it in.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<SessionTokens> {
    const creds = await profileRepository.findPasswordHash(userId);
    if (!creds) throw notFound('User');

    const ok = await verifyPassword(currentPassword, creds.password);
    if (!ok) throw unauthenticated('Your current password is incorrect');

    const hash = await hashPassword(newPassword);
    const updated = await profileRepository.setPassword(userId, hash);
    return issueSession(updated);
  },
};
