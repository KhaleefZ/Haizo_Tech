/**
 * All database access for public content. Nothing above this layer imports Prisma.
 */
import { prisma } from '../lib/prisma.js';

export const contentRepository = {
  listPublishedServices({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.service.findMany({
        where: { published: true },
        orderBy: [{ order: 'asc' }, { title: 'asc' }],
        skip,
        take,
      }),
      prisma.service.count({ where: { published: true } }),
    ]);
  },

  findPublishedServiceBySlug(slug: string) {
    // `published` is part of the lookup, not a post-filter: an unpublished slug
    // must be indistinguishable from a slug that doesn't exist.
    return prisma.service.findFirst({ where: { slug, published: true } });
  },

  listWorkCategories() {
    return prisma.workCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
  },
};
