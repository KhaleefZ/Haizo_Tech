/**
 * The one API every producer calls. It PERSISTS a notification always (in-app
 * history isn't opt-out-able), then resolves the socket/email channels against
 * the recipient's master switch + per-type preference. Security types email
 * regardless. Titles/links come from the catalogue, never inline.
 *
 * emit() never throws: notifications are best-effort and must not break the
 * domain operation that fired them.
 */
import type { Role } from '@prisma/client';
import { notificationRepository } from '../repositories/notification.repository.js';
import { catalogue, type NotificationType, type NotifParams } from '../lib/notifications/catalogue.js';
import { emitToUser } from '../sockets/io.js';
import { sendMail } from '../lib/mailer.js';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';

type NotificationRow = Awaited<ReturnType<typeof notificationRepository.create>>;

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string | null;
  isRead: boolean;
  createdAt: string;
}

export function toNotificationDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    url: row.url,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

interface RecipientSettings {
  notificationsEnabled: boolean;
  notificationPrefs: unknown;
}

/** Socket/email allowed? Master switch first, then a per-type opt-out. */
function channelAllowed(s: RecipientSettings, type: NotificationType): boolean {
  if (!s.notificationsEnabled) return false;
  const prefs = (s.notificationPrefs ?? null) as Record<string, boolean> | null;
  return prefs?.[type] !== false;
}

interface EmitInput {
  type: NotificationType;
  recipientIds: string[];
  actorId?: string | null;
  entity?: { type: string; id: string };
  params: NotifParams;
  groupKey?: string;
}

export const notificationService = {
  async emit(input: EmitInput): Promise<void> {
    try {
      const entry = catalogue[input.type];
      const settings = await notificationRepository.findRecipientSettings(input.recipientIds);
      const byId = new Map(settings.map((s) => [s.id, s]));

      for (const userId of input.recipientIds) {
        const s = byId.get(userId);
        if (!s) continue;

        // Persist — always, opt-out or not.
        const row = await notificationRepository.create({
          userId,
          type: input.type,
          title: entry.title(input.params),
          message: entry.message(input.params),
          url: entry.url(input.params),
          actorId: input.actorId ?? null,
          entityType: input.entity?.type ?? null,
          entityId: input.entity?.id ?? null,
          groupKey: input.groupKey ?? null,
        });

        const allowed = channelAllowed(s, input.type);
        if (allowed) emitToUser(userId, 'notification:new', toNotificationDto(row));

        // Ordinary types roll up into the daily digest; only security-relevant
        // types (alwaysEmail) email immediately, ignoring the master switch.
        if (entry.alwaysEmail) {
          const url = row.url ? `${config.adminUrl}${row.url}` : config.adminUrl;
          void sendMail({
            to: s.email,
            subject: row.title,
            html: `<p>${row.message}</p><p><a href="${url}">Open the dashboard</a></p>`,
            text: `${row.message}\n${url}`,
          });
        }
      }
    } catch (err) {
      logger.error({ err, type: input.type }, 'notification emit failed');
    }
  },

  /** Convenience for role-targeted notifications (resolves recipients by role). */
  async emitToRoles(
    roles: Role[],
    input: Omit<EmitInput, 'recipientIds'> & { excludeUserId?: string },
  ): Promise<void> {
    const users = await notificationRepository.findUserIdsByRoles(roles);
    const recipientIds = users.map((u) => u.id).filter((id) => id !== input.excludeUserId);
    if (recipientIds.length) await this.emit({ ...input, recipientIds });
  },

  async list(userId: string, cursor: string | undefined, limit: number) {
    const rows = await notificationRepository.listForUser(userId, { cursor, limit });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const unreadCount = await notificationRepository.unreadCount(userId);
    return {
      data: page.map(toNotificationDto),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
      unreadCount,
    };
  },

  unreadCount(userId: string) {
    return notificationRepository.unreadCount(userId);
  },

  async markRead(id: string, userId: string): Promise<void> {
    await notificationRepository.markRead(id, userId);
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },

  async remove(id: string, userId: string): Promise<void> {
    await notificationRepository.deleteOne(id, userId);
  },
};
