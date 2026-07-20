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

  /** Bind an upload to a chat message (its owning message). */
  attachToMessage(id: string, messageId: string) {
    return prisma.attachment.update({ where: { id }, data: { messageId } });
  },
};
