import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const uploadRepository = {
  create(data: Prisma.AttachmentCreateInput) {
    return prisma.attachment.create({ data });
  },

  findById(id: string) {
    return prisma.attachment.findUnique({ where: { id } });
  },

  markReady(id: string) {
    return prisma.attachment.update({ where: { id }, data: { status: 'READY' } });
  },
};
