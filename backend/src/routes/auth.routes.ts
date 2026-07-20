import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getCurrentUser, refresh, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';

/**
 * Login is the brute-force surface, so it gets its own tight limit independent of
 * the global one — ten attempts per 15 minutes per IP is far more than a human
 * needs and useless for password spraying.
 */
const loginLimiter = rateLimit({
  // Up to 40 attempts, then a 3-minute cool-off — generous enough for a fat-
  // fingered password, tight enough to blunt online guessing.
  windowMs: 3 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 3 minutes.' },
    }),
});

const router: ExpressRouter = Router();

// operationId: login
router.post('/auth/login', loginLimiter, login);
// operationId: getCurrentUser
router.get('/auth/me', requireAuth, getCurrentUser);
// operationId: refresh — CSRF-guarded; works with an expired access token, so no requireAuth.
router.post('/auth/refresh', requireCsrf, refresh);
// operationId: logout — CSRF-guarded, idempotent, works with an expired session.
router.post('/auth/logout', requireCsrf, logout);

export default router;
