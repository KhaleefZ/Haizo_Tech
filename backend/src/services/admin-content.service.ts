/**
 * Content-management business logic.
 *
 * Two rules live here rather than in the controller or the schema, because
 * neither of those can express them:
 *   • `publishedAt` is derived, never client-supplied. It stamps the moment a
 *     service first goes live and clears when it's unpublished, so the field is
 *     always trustworthy regardless of what a client sends.
 *   • A duplicate slug is a 409, not a 500 — translated from Prisma's unique
 *     constraint error into our error envelope.
 */
import { Prisma } from '@prisma/client';
import type {
  AdminService,
  AdminServiceList,
  CreateService,
  UpdateService,
  AdminIndustry,
  AdminIndustryList,
  CreateIndustry,
  UpdateIndustry,
  AdminWorkCategory,
  AdminWorkCategoryList,
  CreateWorkCategory,
  UpdateWorkCategory,
} from '@haizo/types';
import { adminContentRepository } from '../repositories/admin-content.repository.js';
import { conflict, notFound } from '../lib/errors.js';
import { revalidate, tags } from '../lib/revalidate.js';

/**
 * Refresh the public site after a service changes. Fire-and-forget: `revalidate`
 * catches its own errors and no-ops when the webhook isn't configured (tests), so
 * a slow or missing front end never blocks or fails an admin write. The durable
 * outbox-backed version arrives with the notification rebuild; this is the direct
 * transport in the meantime.
 */
function revalidateServices(slug?: string): void {
  const t: string[] = [tags.services, tags.home, tags.sitemap];
  if (slug) t.push(tags.service(slug));
  void revalidate('service.changed', t);
}

function revalidateIndustries(): void {
  void revalidate('industry.changed', [tags.industries, tags.home, tags.sitemap]);
}

function revalidateWorks(): void {
  // Categories drive the public Work filter, so a category change is a works change.
  void revalidate('work-category.changed', [tags.works, tags.home]);
}

type ServiceRow = NonNullable<
  Awaited<ReturnType<typeof adminContentRepository.findServiceById>>
>;

function toAdminService(row: ServiceRow): AdminService {
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
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export const adminContentService = {
  async listServices(page: number, pageSize: number): Promise<AdminServiceList> {
    const [rows, total] = await adminContentRepository.listServices({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminService),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getService(id: string): Promise<AdminService> {
    const row = await adminContentRepository.findServiceById(id);
    if (!row) throw notFound('Service');
    return toAdminService(row);
  },

  async createService(input: CreateService): Promise<AdminService> {
    const published = input.published ?? false;
    try {
      const row = await adminContentRepository.createService({
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        body: input.body ?? null,
        icon: input.icon ?? null,
        stack: input.stack ?? [],
        deliverables: input.deliverables ?? [],
        timeline: input.timeline ?? null,
        order: input.order ?? 0,
        published,
        // Derived: live now if published, otherwise not live.
        publishedAt: published ? new Date() : null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      });
      revalidateServices(row.slug);
      return toAdminService(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A service with that slug already exists');
      throw err;
    }
  },

  async updateService(id: string, input: UpdateService): Promise<AdminService> {
    const existing = await adminContentRepository.findServiceById(id);
    if (!existing) throw notFound('Service');

    // Recompute publishedAt only when the publish state actually flips, so an
    // edit that leaves `published` untouched never disturbs the original stamp.
    const data: Prisma.ServiceUpdateInput = {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.stack !== undefined ? { stack: input.stack } : {}),
      ...(input.deliverables !== undefined ? { deliverables: input.deliverables } : {}),
      ...(input.timeline !== undefined ? { timeline: input.timeline } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    };

    if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;

    if (input.published !== undefined && input.published !== existing.published) {
      data.published = input.published;
      data.publishedAt = input.published ? (existing.publishedAt ?? new Date()) : null;
    } else if (input.published !== undefined) {
      data.published = input.published;
    }

    try {
      const row = await adminContentRepository.updateService(id, data);
      revalidateServices(row.slug);
      return toAdminService(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A service with that slug already exists');
      throw err;
    }
  },

  async deleteService(id: string): Promise<void> {
    try {
      await adminContentRepository.deleteService(id);
      revalidateServices();
    } catch (err) {
      // P2025 = record to delete not found.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Service');
      }
      throw err;
    }
  },

  /* ---- Industries ---- */

  async listIndustries(page: number, pageSize: number): Promise<AdminIndustryList> {
    const [rows, total] = await adminContentRepository.listIndustries({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminIndustry),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getIndustry(id: string): Promise<AdminIndustry> {
    const row = await adminContentRepository.findIndustryById(id);
    if (!row) throw notFound('Industry');
    return toAdminIndustry(row);
  },

  async createIndustry(input: CreateIndustry): Promise<AdminIndustry> {
    try {
      const row = await adminContentRepository.createIndustry({
        slug: input.slug,
        name: input.name,
        capability: input.capability,
        icon: input.icon ?? null,
        order: input.order ?? 0,
        published: input.published ?? true,
      });
      revalidateIndustries();
      return toAdminIndustry(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('An industry with that slug already exists');
      throw err;
    }
  },

  async updateIndustry(id: string, input: UpdateIndustry): Promise<AdminIndustry> {
    const existing = await adminContentRepository.findIndustryById(id);
    if (!existing) throw notFound('Industry');

    const data: Prisma.IndustryUpdateInput = {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.capability !== undefined ? { capability: input.capability } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
    };

    try {
      const row = await adminContentRepository.updateIndustry(id, data);
      revalidateIndustries();
      return toAdminIndustry(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('An industry with that slug already exists');
      throw err;
    }
  },

  async deleteIndustry(id: string): Promise<void> {
    try {
      await adminContentRepository.deleteIndustry(id);
      revalidateIndustries();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Industry');
      }
      throw err;
    }
  },

  /* ---- Work categories ---- */

  async listWorkCategories(): Promise<AdminWorkCategoryList> {
    const rows = await adminContentRepository.listWorkCategories();
    return { data: rows.map(toAdminWorkCategory) };
  },

  async createWorkCategory(input: CreateWorkCategory): Promise<AdminWorkCategory> {
    try {
      const row = await adminContentRepository.createWorkCategory({
        name: input.name,
        order: input.order ?? 0,
      });
      revalidateWorks();
      return toAdminWorkCategory(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A category with that name already exists');
      throw err;
    }
  },

  async updateWorkCategory(id: string, input: UpdateWorkCategory): Promise<AdminWorkCategory> {
    const existing = await adminContentRepository.findWorkCategoryById(id);
    if (!existing) throw notFound('Category');

    const data: Prisma.WorkCategoryUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    };

    try {
      const row = await adminContentRepository.updateWorkCategory(id, data);
      revalidateWorks();
      return toAdminWorkCategory(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A category with that name already exists');
      throw err;
    }
  },

  async deleteWorkCategory(id: string): Promise<void> {
    try {
      await adminContentRepository.deleteWorkCategory(id);
      revalidateWorks();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Category');
      }
      throw err;
    }
  },
};

type IndustryRow = NonNullable<
  Awaited<ReturnType<typeof adminContentRepository.findIndustryById>>
>;
type WorkCategoryRow = NonNullable<
  Awaited<ReturnType<typeof adminContentRepository.findWorkCategoryById>>
>;

function toAdminIndustry(row: IndustryRow): AdminIndustry {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    capability: row.capability,
    icon: row.icon,
    order: row.order,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAdminWorkCategory(row: WorkCategoryRow): AdminWorkCategory {
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
