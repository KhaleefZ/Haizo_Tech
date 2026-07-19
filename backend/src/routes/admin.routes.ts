/**
 * Authenticated content management, mounted under /admin.
 *
 * Gates are attached PER ROUTE rather than with a blanket router.use(), for two
 * reasons: it reads as an explicit contract at each line, and the route-gate
 * coverage test inspects each route's own middleware stack — a route that forgot
 * its gate would slip past a router-level use() but fails the test this way.
 *
 *   manage → requireAuth + requireRole   (reads)
 *   mutate → manage + requireCsrf         (writes)
 */
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import {
  adminListServices,
  adminGetService,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  adminListIndustries,
  adminGetIndustry,
  adminCreateIndustry,
  adminUpdateIndustry,
  adminDeleteIndustry,
  adminListWorkCategories,
  adminCreateWorkCategory,
  adminUpdateWorkCategory,
  adminDeleteWorkCategory,
  adminListTestimonials,
  adminGetTestimonial,
  adminCreateTestimonial,
  adminUpdateTestimonial,
  adminDeleteTestimonial,
  adminListWork,
  adminGetWork,
  adminCreateWork,
  adminUpdateWork,
  adminDeleteWork,
  adminListBlog,
  adminGetBlog,
  adminCreateBlog,
  adminUpdateBlog,
  adminDeleteBlog,
} from '../controllers/admin-content.controller.js';
import {
  adminListInquiries,
  adminGetInquiry,
  adminUpdateInquiry,
  adminDeleteInquiry,
} from '../controllers/inquiry.controller.js';
import { adminListUsers, adminUpdateUserRole } from '../controllers/user.controller.js';
import {
  adminListClients,
  adminGetClient,
  adminCreateClient,
  adminUpdateClient,
  adminDeleteClient,
} from '../controllers/client.controller.js';

// Content is managed by admins and managers; developers and visitors cannot.
const manage = [requireAuth, requireRole('SUPER_ADMIN', 'MANAGER')] as const;
const mutate = [...manage, requireCsrf] as const;

// User/team management is the top privilege — super-admin only.
const superOnly = [requireAuth, requireRole('SUPER_ADMIN')] as const;
const superMutate = [...superOnly, requireCsrf] as const;

const router: ExpressRouter = Router();

// operationId: adminListServices
router.get('/admin/services', ...manage, adminListServices);
// operationId: adminCreateService
router.post('/admin/services', ...mutate, adminCreateService);
// operationId: adminGetService
router.get('/admin/services/:id', ...manage, adminGetService);
// operationId: adminUpdateService
router.patch('/admin/services/:id', ...mutate, adminUpdateService);
// operationId: adminDeleteService
router.delete('/admin/services/:id', ...mutate, adminDeleteService);

// operationId: adminListIndustries
router.get('/admin/industries', ...manage, adminListIndustries);
// operationId: adminCreateIndustry
router.post('/admin/industries', ...mutate, adminCreateIndustry);
// operationId: adminGetIndustry
router.get('/admin/industries/:id', ...manage, adminGetIndustry);
// operationId: adminUpdateIndustry
router.patch('/admin/industries/:id', ...mutate, adminUpdateIndustry);
// operationId: adminDeleteIndustry
router.delete('/admin/industries/:id', ...mutate, adminDeleteIndustry);

// operationId: adminListWorkCategories
router.get('/admin/work-categories', ...manage, adminListWorkCategories);
// operationId: adminCreateWorkCategory
router.post('/admin/work-categories', ...mutate, adminCreateWorkCategory);
// operationId: adminUpdateWorkCategory
router.patch('/admin/work-categories/:id', ...mutate, adminUpdateWorkCategory);
// operationId: adminDeleteWorkCategory
router.delete('/admin/work-categories/:id', ...mutate, adminDeleteWorkCategory);

// operationId: adminListTestimonials
router.get('/admin/testimonials', ...manage, adminListTestimonials);
// operationId: adminCreateTestimonial
router.post('/admin/testimonials', ...mutate, adminCreateTestimonial);
// operationId: adminGetTestimonial
router.get('/admin/testimonials/:id', ...manage, adminGetTestimonial);
// operationId: adminUpdateTestimonial
router.patch('/admin/testimonials/:id', ...mutate, adminUpdateTestimonial);
// operationId: adminDeleteTestimonial
router.delete('/admin/testimonials/:id', ...mutate, adminDeleteTestimonial);

// operationId: adminListWork
router.get('/admin/work', ...manage, adminListWork);
// operationId: adminCreateWork
router.post('/admin/work', ...mutate, adminCreateWork);
// operationId: adminGetWork
router.get('/admin/work/:id', ...manage, adminGetWork);
// operationId: adminUpdateWork
router.patch('/admin/work/:id', ...mutate, adminUpdateWork);
// operationId: adminDeleteWork
router.delete('/admin/work/:id', ...mutate, adminDeleteWork);

// operationId: adminListBlog
router.get('/admin/blog', ...manage, adminListBlog);
// operationId: adminCreateBlog
router.post('/admin/blog', ...mutate, adminCreateBlog);
// operationId: adminGetBlog
router.get('/admin/blog/:id', ...manage, adminGetBlog);
// operationId: adminUpdateBlog
router.patch('/admin/blog/:id', ...mutate, adminUpdateBlog);
// operationId: adminDeleteBlog
router.delete('/admin/blog/:id', ...mutate, adminDeleteBlog);

// operationId: adminListInquiries
router.get('/admin/inquiries', ...manage, adminListInquiries);
// operationId: adminGetInquiry
router.get('/admin/inquiries/:id', ...manage, adminGetInquiry);
// operationId: adminUpdateInquiry
router.patch('/admin/inquiries/:id', ...mutate, adminUpdateInquiry);
// operationId: adminDeleteInquiry
router.delete('/admin/inquiries/:id', ...mutate, adminDeleteInquiry);

// operationId: adminListClients
router.get('/admin/clients', ...manage, adminListClients);
// operationId: adminCreateClient
router.post('/admin/clients', ...mutate, adminCreateClient);
// operationId: adminGetClient
router.get('/admin/clients/:id', ...manage, adminGetClient);
// operationId: adminUpdateClient
router.patch('/admin/clients/:id', ...mutate, adminUpdateClient);
// operationId: adminDeleteClient
router.delete('/admin/clients/:id', ...mutate, adminDeleteClient);

// operationId: adminListUsers
router.get('/admin/users', ...superOnly, adminListUsers);
// operationId: adminUpdateUserRole
router.patch('/admin/users/:id', ...superMutate, adminUpdateUserRole);

export default router;
