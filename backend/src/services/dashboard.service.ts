import type { AdminInquiry, DashboardStats } from '@haizo/types';
import { dashboardRepository } from '../repositories/dashboard.repository.js';

type InquiryRow = Awaited<ReturnType<typeof dashboardRepository.getStats>>[4][number];

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

export const dashboardService = {
  async getDashboard(): Promise<DashboardStats> {
    const [newInquiries, openProjects, publishedServices, draftPosts, recent] =
      await dashboardRepository.getStats();
    return {
      newInquiries,
      openProjects,
      publishedServices,
      draftPosts,
      recentInquiries: recent.map(toAdminInquiry),
    };
  },
};
