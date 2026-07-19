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
} from '../controllers/admin-content.controller.js';

// Content is managed by admins and managers; developers and visitors cannot.
const manage = [requireAuth, requireRole('SUPER_ADMIN', 'MANAGER')] as const;
const mutate = [...manage, requireCsrf] as const;

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

export default router;
