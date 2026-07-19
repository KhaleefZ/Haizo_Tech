/**
 * Public content reads. Maps database rows to the shapes the OpenAPI contract
 * declares — the API surface is deliberately not "whatever Prisma returns", so a
 * column added for internal use can't leak onto the public site by accident.
 */
import type {
  BlogPostList,
  IndustryList,
  InquiryReceipt,
  Service,
  ServiceList,
  TestimonialList,
  WorkCategoryList,
  WorkList,
} from '@haizo/types';
import { contentRepository } from '../repositories/content.repository.js';
import { notificationService } from './notification.service.js';
import { notFound } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { randomUUID } from 'node:crypto';

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

  async listIndustries(): Promise<IndustryList> {
    const rows = await contentRepository.listPublishedIndustries();
    return {
      data: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        capability: r.capability,
        icon: r.icon,
        order: r.order,
      })),
    };
  },

  async listTestimonials(): Promise<TestimonialList> {
    const rows = await contentRepository.listPublishedTestimonials();
    return {
      data: rows.map((r) => ({
        id: r.id,
        author: r.author,
        role: r.role,
        company: r.company,
        quote: r.quote,
        avatarUrl: r.avatarUrl,
        // Exposed so the public site can show a "verified" marker honestly.
        // sourceUrl is deliberately NOT exposed — it is often a private email
        // thread, and provenance is for us to hold, not to publish.
        verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
        order: r.order,
      })),
    };
  },

  async listWork(page: number, pageSize: number, category?: string): Promise<WorkList> {
    const [rows, total] = await contentRepository.listPublishedWork({
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(category ? { category } : {}),
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        description: r.description,
        imageUrls: r.imageUrls,
        liveUrl: r.liveUrl,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async listBlogPosts(page: number, pageSize: number): Promise<BlogPostList> {
    const [rows, total] = await contentRepository.listPublishedPosts({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        tags: r.tags,
        imageUrl: r.imageUrl,
        authorName: r.author?.name ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  /**
   * Contact form submissions.
   *
   * The honeypot is handled here rather than in the controller because the
   * response has to be indistinguishable from success — a bot that learns it was
   * caught just removes the field next time. We return a well-formed receipt with
   * a throwaway id and write nothing.
   */
  async createInquiry(input: {
    name: string;
    email: string;
    message: string;
    phone?: string | null;
    company?: string | null;
    projectType?: string | null;
    budgetRange?: string | null;
    website?: string | null;
  }): Promise<InquiryReceipt> {
    if (input.website && input.website.trim() !== '') {
      logger.warn({ email: input.email }, 'Honeypot triggered — enquiry discarded');
      // A literal marker like id:'discarded' would let a bot detect it had been
      // caught and simply drop the field next time. Return a well-formed random
      // id so the rejection is indistinguishable from a real receipt.
      return { id: randomUUID(), receivedAt: new Date().toISOString() };
    }

    // `service` is the existing production column; projectType is the newer
    // public-facing name. Map rather than rename — the old backend still reads it.
    const row = await contentRepository.createInquiry({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      message: input.message.trim(),
      phone: input.phone ?? null,
      service: input.projectType ?? null,
    });

    // Tell the team a lead came in. Best-effort — emit never throws.
    await notificationService.emitToRoles(['SUPER_ADMIN', 'MANAGER'], {
      type: 'inquiry.received',
      entity: { type: 'inquiry', id: row.id },
      params: { name: row.name },
    });

    return { id: row.id, receivedAt: row.submissionDate.toISOString() };
  },
};
