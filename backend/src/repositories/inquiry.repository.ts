/**
 * Admin reads/writes for contact enquiries. The public create path lives in the
 * content repository; this is the ops side — triage and status.
 */
import type { InquiryStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const inquiryRepository = {
  listInquiries({ skip, take, status }: { skip: number; take: number; status?: InquiryStatus }) {
    const where: Prisma.InquiryWhereInput = status ? { status } : {};
    return prisma.$transaction([
      prisma.inquiry.findMany({ where, orderBy: { submissionDate: 'desc' }, skip, take }),
      prisma.inquiry.count({ where }),
    ]);
  },

  findInquiryById(id: string) {
    return prisma.inquiry.findUnique({ where: { id } });
  },

  updateStatus(id: string, status: InquiryStatus) {
    return prisma.inquiry.update({ where: { id }, data: { status } });
  },

  deleteInquiry(id: string) {
    return prisma.inquiry.delete({ where: { id } });
  },
};
