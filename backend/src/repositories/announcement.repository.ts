import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const WITH_AUTHOR = { author: { select: { name: true } } } as const;

export const announcementRepository = {
  listAnnouncements({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, skip, take, include: WITH_AUTHOR }),
      prisma.announcement.count(),
    ]);
  },

  findById(id: string) {
    return prisma.announcement.findUnique({ where: { id }, include: WITH_AUTHOR });
  },

  create(data: Prisma.AnnouncementCreateInput) {
    return prisma.announcement.create({ data, include: WITH_AUTHOR });
  },

  update(id: string, data: Prisma.AnnouncementUpdateInput) {
    return prisma.announcement.update({ where: { id }, data, include: WITH_AUTHOR });
  },

  delete(id: string) {
    return prisma.announcement.delete({ where: { id } });
  },
};
