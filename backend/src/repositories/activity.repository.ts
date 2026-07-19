import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const activityRepository = {
  create(data: Prisma.ActivityEventCreateInput) {
    return prisma.activityEvent.create({ data });
  },

  list({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.activityEvent.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.activityEvent.count(),
    ]);
  },
};
