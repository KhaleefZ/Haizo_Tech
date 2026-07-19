import { prisma } from '../lib/prisma.js';

export const analyticsRepository = {
  createPageView(data: { path: string; referrer: string | null }) {
    return prisma.pageView.create({ data });
  },

  countViewsBetween(start: Date, end: Date) {
    return prisma.pageView.count({ where: { createdAt: { gte: start, lt: end } } });
  },

  upsertDaily(date: Date, views: number) {
    return prisma.metricDaily.upsert({ where: { date }, create: { date, views }, update: { views } });
  },

  dailySince(since: Date) {
    return prisma.metricDaily.findMany({ where: { date: { gte: since } }, orderBy: { date: 'asc' } });
  },

  topPathsSince(since: Date, take: number) {
    return prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: since } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take,
    });
  },
};
