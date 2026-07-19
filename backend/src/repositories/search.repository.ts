/**
 * Cross-entity search. Case-insensitive `contains` (Postgres ILIKE) across the
 * searchable columns of each entity, a handful of rows each. At this data size
 * ILIKE is ample; a tsvector + pg_trgm index is the future optimisation if the
 * tables grow large.
 */
import { prisma } from '../lib/prisma.js';

export function searchAll(q: string, take: number) {
  const contains = { contains: q, mode: 'insensitive' as const };
  return prisma.$transaction([
    prisma.service.findMany({ where: { title: contains }, take, select: { id: true, title: true, slug: true } }),
    prisma.work.findMany({ where: { title: contains }, take, select: { id: true, title: true, slug: true } }),
    prisma.blog.findMany({ where: { title: contains }, take, select: { id: true, title: true } }),
    prisma.testimonial.findMany({
      where: { OR: [{ author: contains }, { company: contains }] },
      take,
      select: { id: true, author: true, company: true },
    }),
    prisma.industry.findMany({ where: { name: contains }, take, select: { id: true, name: true } }),
    prisma.project.findMany({ where: { name: contains }, take, select: { id: true, name: true, status: true } }),
    prisma.task.findMany({
      where: { title: contains },
      take,
      select: { id: true, title: true, column: { select: { projectId: true } } },
    }),
    prisma.client.findMany({
      where: { OR: [{ organization: contains }, { contactName: contains }] },
      take,
      select: { id: true, organization: true, contactName: true },
    }),
    prisma.inquiry.findMany({
      where: { OR: [{ name: contains }, { email: contains }] },
      take,
      select: { id: true, name: true, email: true },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: contains }, { email: contains }] },
      take,
      select: { id: true, name: true, email: true },
    }),
  ]);
}
