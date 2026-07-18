import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router: ExpressRouter = Router();

// operationId: getHealth
router.get('/health', getHealth);

export default router;
