import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const notificationRepository = {
  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  },

  /** Recipients' channel settings, fetched once per emit. */
  findRecipientSettings(userIds: string[]) {
    return prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, notificationsEnabled: true, notificationPrefs: true },
    });
  },

  /** Cursor pagination by createdAt desc; fetch limit+1 to know if there's more. */
  listForUser(userId: string, { cursor, limit }: { cursor?: string; limit: number }) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  markRead(id: string, userId: string) {
    // Scoped by userId so one user can't mark another's notification.
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },

  deleteOne(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  },

  /** Users in the given roles — the recipients for role-targeted notifications. */
  findUserIdsByRoles(roles: Role[]) {
    return prisma.user.findMany({ where: { role: { in: roles } }, select: { id: true } });
  },

  /* ---- Digest ---- */

  /** Users eligible for a digest (master switch on). */
  digestRecipients() {
    return prisma.user.findMany({
      where: { notificationsEnabled: true },
      select: { id: true, email: true, name: true, notificationPrefs: true },
    });
  },

  /** A user's unread notifications not yet included in any digest email. */
  unemailedUnread(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isRead: false, emailedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  },

  markEmailed(ids: string[]) {
    return prisma.notification.updateMany({ where: { id: { in: ids } }, data: { emailedAt: new Date() } });
  },
};
