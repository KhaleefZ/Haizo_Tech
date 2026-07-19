import { prisma } from '../lib/prisma.js';

export const dashboardRepository = {
  getStats() {
    return prisma.$transaction([
      prisma.inquiry.count({ where: { status: 'NEW' } }),
      // "Open" = anything not marked Completed.
      prisma.project.count({ where: { NOT: { status: 'Completed' } } }),
      prisma.service.count({ where: { published: true } }),
      prisma.blog.count({ where: { published: false } }),
      prisma.inquiry.findMany({ orderBy: { submissionDate: 'desc' }, take: 5 }),
    ]);
  },
};
