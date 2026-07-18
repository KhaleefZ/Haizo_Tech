/**
 * Public content reads. Maps database rows to the shapes the OpenAPI contract
 * declares — the API surface is deliberately not "whatever Prisma returns", so a
 * column added for internal use can't leak onto the public site by accident.
 */
import type { Service, ServiceList, WorkCategoryList } from '@haizo/types';
import { contentRepository } from '../repositories/content.repository.js';
import { notFound } from '../lib/errors.js';

type ServiceRow = Awaited<ReturnType<typeof contentRepository.findPublishedServiceBySlug>>;
type CategoryRow = Awaited<ReturnType<typeof contentRepository.listWorkCategories>>[number];

function toService(row: NonNullable<ServiceRow>): Service {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    icon: row.icon,
    stack: row.stack,
    deliverables: row.deliverables,
    timeline: row.timeline,
    order: row.order,
    published: row.published,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

/** Slugify a category name so the public filter has a stable URL-safe key. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const contentService = {
  async listServices(page: number, pageSize: number): Promise<ServiceList> {
    const [rows, total] = await contentRepository.listPublishedServices({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toService),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getServiceBySlug(slug: string): Promise<Service> {
    const row = await contentRepository.findPublishedServiceBySlug(slug);
    if (!row) throw notFound('Service');
    return toService(row);
  },

  async listWorkCategories(): Promise<WorkCategoryList> {
    const rows = await contentRepository.listWorkCategories();
    return {
      data: rows.map((c: CategoryRow) => ({
        id: c.id,
        slug: slugify(c.name),
        name: c.name,
        order: c.order,
      })),
    };
  },
};
