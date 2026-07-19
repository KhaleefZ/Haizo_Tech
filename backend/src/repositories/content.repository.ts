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

  listPublishedIndustries() {
    return prisma.industry.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  },

  /**
   * Provenance is part of the WHERE clause, not a filter applied afterwards.
   * A published testimonial missing sourceUrl or verifiedAt is unreachable by
   * construction — which is the point of the whole guard.
   */
  listPublishedTestimonials() {
    return prisma.testimonial.findMany({
      where: {
        published: true,
        sourceUrl: { not: null },
        verifiedAt: { not: null },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  },

  listPublishedWork({ skip, take, category }: { skip: number; take: number; category?: string }) {
    const where = { published: true, ...(category ? { category } : {}) };
    return prisma.$transaction([
      prisma.work.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.work.count({ where }),
    ]);
  },

  listPublishedPosts({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.blog.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { author: { select: { name: true } } },
      }),
      prisma.blog.count({ where: { published: true } }),
    ]);
  },

  createInquiry(data: {
    name: string;
    email: string;
    message: string;
    phone?: string | null;
    service?: string | null;
  }) {
    return prisma.inquiry.create({ data });
  },
};
