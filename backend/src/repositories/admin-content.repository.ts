/**
 * Database access for authenticated content management. Unlike the public
 * content repository, these queries are NOT filtered by `published` — the admin
 * sees drafts too. The only Prisma-touching layer for admin content.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const adminContentRepository = {
  listServices({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.service.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.service.count(),
    ]);
  },

  findServiceById(id: string) {
    return prisma.service.findUnique({ where: { id } });
  },

  createService(data: Prisma.ServiceCreateInput) {
    return prisma.service.create({ data });
  },

  updateService(id: string, data: Prisma.ServiceUpdateInput) {
    return prisma.service.update({ where: { id }, data });
  },

  deleteService(id: string) {
    return prisma.service.delete({ where: { id } });
  },

  /* ---- Industries ---- */

  listIndustries({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.industry.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }], skip, take }),
      prisma.industry.count(),
    ]);
  },

  findIndustryById(id: string) {
    return prisma.industry.findUnique({ where: { id } });
  },

  createIndustry(data: Prisma.IndustryCreateInput) {
    return prisma.industry.create({ data });
  },

  updateIndustry(id: string, data: Prisma.IndustryUpdateInput) {
    return prisma.industry.update({ where: { id }, data });
  },

  deleteIndustry(id: string) {
    return prisma.industry.delete({ where: { id } });
  },

  /* ---- Work categories ---- */

  listWorkCategories() {
    return prisma.workCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
  },

  findWorkCategoryById(id: string) {
    return prisma.workCategory.findUnique({ where: { id } });
  },

  createWorkCategory(data: Prisma.WorkCategoryCreateInput) {
    return prisma.workCategory.create({ data });
  },

  updateWorkCategory(id: string, data: Prisma.WorkCategoryUpdateInput) {
    return prisma.workCategory.update({ where: { id }, data });
  },

  deleteWorkCategory(id: string) {
    return prisma.workCategory.delete({ where: { id } });
  },

  /* ---- Testimonials ---- */

  listTestimonials({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.testimonial.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.testimonial.count(),
    ]);
  },

  findTestimonialById(id: string) {
    return prisma.testimonial.findUnique({ where: { id } });
  },

  createTestimonial(data: Prisma.TestimonialCreateInput) {
    return prisma.testimonial.create({ data });
  },

  updateTestimonial(id: string, data: Prisma.TestimonialUpdateInput) {
    return prisma.testimonial.update({ where: { id }, data });
  },

  deleteTestimonial(id: string) {
    return prisma.testimonial.delete({ where: { id } });
  },

  /* ---- Work ---- */

  listWork({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.work.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.work.count(),
    ]);
  },

  findWorkById(id: string) {
    return prisma.work.findUnique({ where: { id } });
  },

  createWork(data: Prisma.WorkCreateInput) {
    return prisma.work.create({ data });
  },

  updateWork(id: string, data: Prisma.WorkUpdateInput) {
    return prisma.work.update({ where: { id }, data });
  },

  deleteWork(id: string) {
    return prisma.work.delete({ where: { id } });
  },

  /* ---- Blog ---- */

  listBlog({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.blog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { author: { select: { name: true } } },
      }),
      prisma.blog.count(),
    ]);
  },

  findBlogById(id: string) {
    return prisma.blog.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });
  },

  createBlog(data: Prisma.BlogCreateInput) {
    return prisma.blog.create({ data, include: { author: { select: { name: true } } } });
  },

  updateBlog(id: string, data: Prisma.BlogUpdateInput) {
    return prisma.blog.update({
      where: { id },
      data,
      include: { author: { select: { name: true } } },
    });
  },

  deleteBlog(id: string) {
    return prisma.blog.delete({ where: { id } });
  },
};
