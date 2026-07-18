import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  getServiceBySlug,
  listServices,
  listWorkCategories,
} from '../controllers/content.controller.js';

const router: ExpressRouter = Router();

// operationId: listServices
router.get('/services', listServices);
// operationId: getServiceBySlug
router.get('/services/:slug', getServiceBySlug);
// operationId: listWorkCategories
router.get('/work-categories', listWorkCategories);

export default router;
