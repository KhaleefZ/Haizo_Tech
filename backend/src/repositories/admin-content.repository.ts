/**
 * Database access for authenticated content management. Unlike the public
 * content repository, these queries are NOT filtered by `published` — the admin
 * sees drafts too. The only Prisma-touching layer for admin content.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const adminContentRepository = {
  listServices({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.service.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.service.count(),
    ]);
  },

  findServiceById(id: string) {
    return prisma.service.findUnique({ where: { id } });
  },

  createService(data: Prisma.ServiceCreateInput) {
    return prisma.service.create({ data });
  },

  updateService(id: string, data: Prisma.ServiceUpdateInput) {
    return prisma.service.update({ where: { id }, data });
  },

  deleteService(id: string) {
    return prisma.service.delete({ where: { id } });
  },
};
