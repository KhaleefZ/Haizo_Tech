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
  AdminTestimonial,
  AdminTestimonialList,
  CreateTestimonial,
  UpdateTestimonial,
  AdminWork,
  AdminWorkList,
  CreateWork,
  UpdateWork,
  AdminBlog,
  AdminBlogList,
  CreateBlog,
  UpdateBlog,
} from '@haizo/types';
import { adminContentRepository } from '../repositories/admin-content.repository.js';
import { conflict, notFound, validationFailed } from '../lib/errors.js';
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

function revalidateTestimonials(): void {
  void revalidate('testimonial.changed', [tags.testimonials, tags.home]);
}

function revalidateWorkItem(slug?: string | null): void {
  const t: string[] = [tags.works, tags.home, tags.sitemap];
  if (slug) t.push(tags.work(slug));
  void revalidate('work.changed', t);
}

function revalidateBlogItem(slug?: string | null): void {
  const t: string[] = [tags.blogs, tags.home, tags.sitemap];
  if (slug) t.push(tags.blog(slug));
  void revalidate('blog.changed', t);
}

/**
 * The anti-fabrication guard, enforced in the domain layer, not the UI.
 * A testimonial can only be published if it has BOTH a source URL and a
 * verification timestamp — so an unverifiable quote is structurally unpublishable.
 * This is why the "Sarah Chen"/"Michael Chang" class of fake testimonial can't
 * recur through this API.
 */
function assertProvenanceForPublish(
  published: boolean,
  sourceUrl: string | null,
  verifiedAt: Date | null,
): void {
  if (!published) return;
  const details = [];
  if (!sourceUrl) details.push({ path: 'sourceUrl', message: 'A source URL is required to publish' });
  if (!verifiedAt) details.push({ path: 'verifiedAt', message: 'Verification is required to publish' });
  if (details.length) throw validationFailed(details);
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

  /* ---- Testimonials ---- */

  async listTestimonials(page: number, pageSize: number): Promise<AdminTestimonialList> {
    const [rows, total] = await adminContentRepository.listTestimonials({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminTestimonial),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getTestimonial(id: string): Promise<AdminTestimonial> {
    const row = await adminContentRepository.findTestimonialById(id);
    if (!row) throw notFound('Testimonial');
    return toAdminTestimonial(row);
  },

  async createTestimonial(input: CreateTestimonial): Promise<AdminTestimonial> {
    const published = input.published ?? false;
    const sourceUrl = input.sourceUrl ?? null;
    const verifiedAt = input.verifiedAt ? new Date(input.verifiedAt) : null;
    assertProvenanceForPublish(published, sourceUrl, verifiedAt);

    const row = await adminContentRepository.createTestimonial({
      author: input.author,
      role: input.role ?? null,
      company: input.company ?? null,
      quote: input.quote,
      avatarUrl: input.avatarUrl ?? null,
      sourceUrl,
      verifiedAt,
      order: input.order ?? 0,
      published,
      ...(input.serviceId ? { service: { connect: { id: input.serviceId } } } : {}),
    });
    revalidateTestimonials();
    return toAdminTestimonial(row);
  },

  async updateTestimonial(id: string, input: UpdateTestimonial): Promise<AdminTestimonial> {
    const existing = await adminContentRepository.findTestimonialById(id);
    if (!existing) throw notFound('Testimonial');

    // Evaluate the guard against the RESULTING state, so a partial update that
    // flips `published` true without provenance is rejected just like a create.
    const published = input.published ?? existing.published;
    const sourceUrl = input.sourceUrl !== undefined ? input.sourceUrl : existing.sourceUrl;
    const verifiedAt =
      input.verifiedAt !== undefined
        ? input.verifiedAt
          ? new Date(input.verifiedAt)
          : null
        : existing.verifiedAt;
    assertProvenanceForPublish(published, sourceUrl, verifiedAt);

    const data: Prisma.TestimonialUpdateInput = {
      ...(input.author !== undefined ? { author: input.author } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.company !== undefined ? { company: input.company } : {}),
      ...(input.quote !== undefined ? { quote: input.quote } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
      ...(input.verifiedAt !== undefined ? { verifiedAt } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(input.serviceId !== undefined
        ? input.serviceId
          ? { service: { connect: { id: input.serviceId } } }
          : { service: { disconnect: true } }
        : {}),
    };

    const row = await adminContentRepository.updateTestimonial(id, data);
    revalidateTestimonials();
    return toAdminTestimonial(row);
  },

  async deleteTestimonial(id: string): Promise<void> {
    try {
      await adminContentRepository.deleteTestimonial(id);
      revalidateTestimonials();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Testimonial');
      }
      throw err;
    }
  },

  /* ---- Work ---- */

  async listWork(page: number, pageSize: number): Promise<AdminWorkList> {
    const [rows, total] = await adminContentRepository.listWork({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminWork),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getWork(id: string): Promise<AdminWork> {
    const row = await adminContentRepository.findWorkById(id);
    if (!row) throw notFound('Work');
    return toAdminWork(row);
  },

  async createWork(input: CreateWork): Promise<AdminWork> {
    try {
      const row = await adminContentRepository.createWork({
        slug: input.slug,
        title: input.title,
        category: input.category,
        description: input.description,
        imageUrls: input.imageUrls ?? [],
        liveUrl: input.liveUrl ?? null,
        published: input.published ?? false,
      });
      revalidateWorkItem(row.slug);
      return toAdminWork(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A work with that slug already exists');
      throw err;
    }
  },

  async updateWork(id: string, input: UpdateWork): Promise<AdminWork> {
    const existing = await adminContentRepository.findWorkById(id);
    if (!existing) throw notFound('Work');

    const data: Prisma.WorkUpdateInput = {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrls !== undefined ? { imageUrls: input.imageUrls } : {}),
      ...(input.liveUrl !== undefined ? { liveUrl: input.liveUrl } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
    };

    try {
      const row = await adminContentRepository.updateWork(id, data);
      revalidateWorkItem(row.slug);
      return toAdminWork(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A work with that slug already exists');
      throw err;
    }
  },

  async deleteWork(id: string): Promise<void> {
    try {
      await adminContentRepository.deleteWork(id);
      revalidateWorkItem();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Work');
      }
      throw err;
    }
  },

  /* ---- Blog ---- */

  async listBlog(page: number, pageSize: number): Promise<AdminBlogList> {
    const [rows, total] = await adminContentRepository.listBlog({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminBlog),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getBlog(id: string): Promise<AdminBlog> {
    const row = await adminContentRepository.findBlogById(id);
    if (!row) throw notFound('Blog post');
    return toAdminBlog(row);
  },

  /** authorId is the signed-in user, supplied by the controller — never the client. */
  async createBlog(input: CreateBlog, authorId: string): Promise<AdminBlog> {
    try {
      const row = await adminContentRepository.createBlog({
        slug: input.slug,
        title: input.title,
        content: input.content,
        tags: input.tags ?? [],
        imageUrl: input.imageUrl ?? null,
        published: input.published ?? false,
        author: { connect: { id: authorId } },
      });
      revalidateBlogItem(row.slug);
      return toAdminBlog(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A post with that slug already exists');
      throw err;
    }
  },

  async updateBlog(id: string, input: UpdateBlog): Promise<AdminBlog> {
    const existing = await adminContentRepository.findBlogById(id);
    if (!existing) throw notFound('Blog post');

    const data: Prisma.BlogUpdateInput = {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
    };

    try {
      const row = await adminContentRepository.updateBlog(id, data);
      revalidateBlogItem(row.slug);
      return toAdminBlog(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('A post with that slug already exists');
      throw err;
    }
  },

  async deleteBlog(id: string): Promise<void> {
    try {
      await adminContentRepository.deleteBlog(id);
      revalidateBlogItem();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Blog post');
      }
      throw err;
    }
  },
};

type TestimonialRow = NonNullable<
  Awaited<ReturnType<typeof adminContentRepository.findTestimonialById>>
>;

function toAdminTestimonial(row: TestimonialRow): AdminTestimonial {
  return {
    id: row.id,
    author: row.author,
    role: row.role,
    company: row.company,
    quote: row.quote,
    avatarUrl: row.avatarUrl,
    sourceUrl: row.sourceUrl,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    serviceId: row.serviceId,
    order: row.order,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type WorkRow = NonNullable<Awaited<ReturnType<typeof adminContentRepository.findWorkById>>>;
type BlogRow = NonNullable<Awaited<ReturnType<typeof adminContentRepository.findBlogById>>>;

function toAdminWork(row: WorkRow): AdminWork {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
    imageUrls: row.imageUrls,
    liveUrl: row.liveUrl,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAdminBlog(row: BlogRow): AdminBlog {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    tags: row.tags,
    imageUrl: row.imageUrl,
    authorId: row.authorId,
    authorName: row.author?.name ?? null,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

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
