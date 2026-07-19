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
import { activityLogger } from '../middleware/activityLogger.js';
import { adminListActivity } from '../controllers/activity.controller.js';
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
import { adminGetDashboard } from '../controllers/dashboard.controller.js';
import {
  adminListNotifications,
  adminUnreadCount,
  adminMarkNotificationRead,
  adminMarkAllNotificationsRead,
  adminDeleteNotification,
} from '../controllers/notification.controller.js';
import {
  adminListClients,
  adminGetClient,
  adminCreateClient,
  adminUpdateClient,
  adminDeleteClient,
} from '../controllers/client.controller.js';
import {
  adminListAnnouncements,
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminDeleteAnnouncement,
} from '../controllers/announcement.controller.js';
import {
  adminGetProfile,
  adminUpdateProfile,
  adminChangePassword,
} from '../controllers/profile.controller.js';
import {
  adminListProjects,
  adminGetProject,
  adminCreateProject,
  adminUpdateProject,
  adminDeleteProject,
  adminCreateColumn,
  adminUpdateColumn,
  adminDeleteColumn,
  adminCreateTask,
  adminUpdateTask,
  adminDeleteTask,
} from '../controllers/project.controller.js';

// Content is managed by admins and managers; developers and visitors cannot.
const manage = [requireAuth, requireRole('SUPER_ADMIN', 'MANAGER')] as const;
const mutate = [...manage, requireCsrf] as const;

// User/team management is the top privilege — super-admin only.
const superOnly = [requireAuth, requireRole('SUPER_ADMIN')] as const;
const superMutate = [...superOnly, requireCsrf] as const;

// Self-service: any signed-in user acting on their OWN account. No role gate.
const selfMutate = [requireAuth, requireCsrf] as const;

const router: ExpressRouter = Router();

// Records every successful admin mutation to the activity feed. Reads req.user at
// response-finish time, after the per-route requireAuth has populated it.
router.use(activityLogger);

// operationId: adminListActivity
router.get('/admin/activity', ...manage, adminListActivity);

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

// --- Notifications (self-service: your own) ---
// operationId: adminListNotifications
router.get('/admin/notifications', requireAuth, adminListNotifications);
// operationId: adminUnreadCount
router.get('/admin/notifications/unread-count', requireAuth, adminUnreadCount);
// operationId: adminMarkAllNotificationsRead
router.post('/admin/notifications/read-all', ...selfMutate, adminMarkAllNotificationsRead);
// operationId: adminMarkNotificationRead
router.post('/admin/notifications/:id/read', ...selfMutate, adminMarkNotificationRead);
// operationId: adminDeleteNotification
router.delete('/admin/notifications/:id', ...selfMutate, adminDeleteNotification);

// operationId: adminGetDashboard
router.get('/admin/dashboard', ...manage, adminGetDashboard);

// --- Projects + kanban board ---
// operationId: adminListProjects
router.get('/admin/projects', ...manage, adminListProjects);
// operationId: adminCreateProject
router.post('/admin/projects', ...mutate, adminCreateProject);
// operationId: adminGetProject
router.get('/admin/projects/:id', ...manage, adminGetProject);
// operationId: adminUpdateProject
router.patch('/admin/projects/:id', ...mutate, adminUpdateProject);
// operationId: adminDeleteProject
router.delete('/admin/projects/:id', ...mutate, adminDeleteProject);
// operationId: adminCreateColumn
router.post('/admin/projects/:id/columns', ...mutate, adminCreateColumn);
// operationId: adminUpdateColumn
router.patch('/admin/columns/:id', ...mutate, adminUpdateColumn);
// operationId: adminDeleteColumn
router.delete('/admin/columns/:id', ...mutate, adminDeleteColumn);
// operationId: adminCreateTask
router.post('/admin/columns/:id/tasks', ...mutate, adminCreateTask);
// operationId: adminUpdateTask
router.patch('/admin/tasks/:id', ...mutate, adminUpdateTask);
// operationId: adminDeleteTask
router.delete('/admin/tasks/:id', ...mutate, adminDeleteTask);

// operationId: adminListAnnouncements
router.get('/admin/announcements', ...manage, adminListAnnouncements);
// operationId: adminCreateAnnouncement
router.post('/admin/announcements', ...mutate, adminCreateAnnouncement);
// operationId: adminUpdateAnnouncement
router.patch('/admin/announcements/:id', ...mutate, adminUpdateAnnouncement);
// operationId: adminDeleteAnnouncement
router.delete('/admin/announcements/:id', ...mutate, adminDeleteAnnouncement);

// Self-service profile — any signed-in user, their own account.
// operationId: adminGetProfile
router.get('/admin/me', requireAuth, adminGetProfile);
// operationId: adminUpdateProfile
router.patch('/admin/me', ...selfMutate, adminUpdateProfile);
// operationId: adminChangePassword
router.post('/admin/me/password', ...selfMutate, adminChangePassword);

// Listing teammates is allowed for managers too (needed for task assignment);
// only changing roles is super-admin-only.
// operationId: adminListUsers
router.get('/admin/users', ...manage, adminListUsers);
// operationId: adminUpdateUserRole
router.patch('/admin/users/:id', ...superMutate, adminUpdateUserRole);

export default router;
