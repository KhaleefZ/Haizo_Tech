import { Prisma } from '@prisma/client';
import type {
  AdminAnnouncement,
  AdminAnnouncementList,
  AnnouncementAudience,
  CreateAnnouncement,
  UpdateAnnouncement,
} from '@haizo/types';
import type { Role } from '@prisma/client';
import { announcementRepository } from '../repositories/announcement.repository.js';
import { notificationService } from './notification.service.js';
import { notFound } from '../lib/errors.js';

const ALL_ROLES: Role[] = ['SUPER_ADMIN', 'MANAGER', 'DEV'];

type AnnouncementRow = NonNullable<Awaited<ReturnType<typeof announcementRepository.findById>>>;

function toAdminAnnouncement(row: AnnouncementRow): AdminAnnouncement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    // The column is a plain String; the API narrows it to the audience union.
    audience: row.audience as AnnouncementAudience,
    authorId: row.authorId,
    authorName: row.author?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const announcementService = {
  async list(page: number, pageSize: number): Promise<AdminAnnouncementList> {
    const [rows, total] = await announcementRepository.listAnnouncements({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminAnnouncement),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async create(input: CreateAnnouncement, authorId: string): Promise<AdminAnnouncement> {
    const audience = input.audience ?? 'ALL';
    const row = await announcementRepository.create({
      title: input.title,
      content: input.content,
      audience,
      author: { connect: { id: authorId } },
    });

    // Fan out to the audience, minus the author who wrote it.
    const roles = audience === 'ALL' ? ALL_ROLES : [audience as Role];
    await notificationService.emitToRoles(roles, {
      type: 'announcement.published',
      actorId: authorId,
      excludeUserId: authorId,
      entity: { type: 'announcement', id: row.id },
      params: { announcementTitle: input.title },
    });

    return toAdminAnnouncement(row);
  },

  async update(id: string, input: UpdateAnnouncement): Promise<AdminAnnouncement> {
    const existing = await announcementRepository.findById(id);
    if (!existing) throw notFound('Announcement');
    const row = await announcementRepository.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.audience !== undefined ? { audience: input.audience } : {}),
    });
    return toAdminAnnouncement(row);
  },

  async remove(id: string): Promise<void> {
    try {
      await announcementRepository.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Announcement');
      }
      throw err;
    }
  },
};
