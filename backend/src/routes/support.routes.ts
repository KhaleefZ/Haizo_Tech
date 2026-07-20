/**
 * Public visitor support endpoints (mounted under /v1).
 *
 * `/support/availability` and `/support/session` are open — a visitor is
 * anonymous. The message endpoints require a visitor token (requireVisitor),
 * which scopes them to the single session the token was minted for.
 */
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireVisitor } from '../middleware/visitorAuth.js';
import {
  supportAvailability,
  startSupportSession,
  getSupportThread,
  postSupportMessage,
} from '../controllers/support.controller.js';

const router: ExpressRouter = Router();

// operationId: supportAvailability
router.get('/support/availability', supportAvailability);
// operationId: startSupportSession
router.post('/support/session', startSupportSession);
// operationId: getSupportThread
router.get('/support/messages', requireVisitor, getSupportThread);
// operationId: postSupportMessage
router.post('/support/messages', requireVisitor, postSupportMessage);

export default router;
