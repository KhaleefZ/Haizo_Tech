import { Prisma } from '@prisma/client';
import type { InquiryStatus } from '@prisma/client';
import type { AdminInquiry, AdminInquiryList } from '@haizo/types';
import { inquiryRepository } from '../repositories/inquiry.repository.js';
import { notFound } from '../lib/errors.js';

type InquiryRow = NonNullable<Awaited<ReturnType<typeof inquiryRepository.findInquiryById>>>;

function toAdminInquiry(row: InquiryRow): AdminInquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    phone: row.phone,
    service: row.service,
    status: row.status,
    submissionDate: row.submissionDate.toISOString(),
  };
}

export const inquiryService = {
  async listInquiries(page: number, pageSize: number, status?: InquiryStatus): Promise<AdminInquiryList> {
    const [rows, total] = await inquiryRepository.listInquiries({
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(status ? { status } : {}),
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toAdminInquiry),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getInquiry(id: string): Promise<AdminInquiry> {
    const row = await inquiryRepository.findInquiryById(id);
    if (!row) throw notFound('Enquiry');
    return toAdminInquiry(row);
  },

  async updateStatus(id: string, status: InquiryStatus): Promise<AdminInquiry> {
    try {
      const row = await inquiryRepository.updateStatus(id, status);
      return toAdminInquiry(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Enquiry');
      }
      throw err;
    }
  },

  async deleteInquiry(id: string): Promise<void> {
    try {
      await inquiryRepository.deleteInquiry(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Enquiry');
      }
      throw err;
    }
  },
};
