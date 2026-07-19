import type { AdminActivity, AdminActivityList } from '@haizo/types';
import { activityRepository } from '../repositories/activity.repository.js';
import { logger } from '../lib/logger.js';

type ActivityRow = Awaited<ReturnType<typeof activityRepository.list>>[0][number];

function toDto(row: ActivityRow): AdminActivity {
  return {
    id: row.id,
    actorName: row.actorName,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    entityLabel: row.entityLabel,
    path: row.path,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface RecordInput {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  path?: string | null;
}

export const activityService = {
  /** Append-only; best-effort — recording must never affect the request. */
  async record(input: RecordInput): Promise<void> {
    try {
      await activityRepository.create({
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel ?? null,
        path: input.path ?? null,
      });
    } catch (err) {
      logger.error({ err }, 'activity record failed');
    }
  },

  async list(page: number, pageSize: number): Promise<AdminActivityList> {
    const [rows, total] = await activityRepository.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toDto),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },
};
