/**
 * Everything mounted under /v1.
 *
 * The contract test walks this router and fails if a route exists here that the
 * OpenAPI spec doesn't declare — that's how phantom endpoints get caught.
 */
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import healthRoutes from './health.routes.js';
import contentRoutes from './content.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';

const router: ExpressRouter = Router();

router.use(healthRoutes);
router.use(contentRoutes);
router.use(authRoutes);
router.use(adminRoutes);

export default router;
