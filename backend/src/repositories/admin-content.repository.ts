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
};
