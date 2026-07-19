import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createInquiry,
  getServiceBySlug,
  listBlogPosts,
  listIndustries,
  listServices,
  listTestimonials,
  listWork,
  listWorkCategories,
} from '../controllers/content.controller.js';
import { recordPageView } from '../controllers/analytics.controller.js';

/**
 * Tight limit on the public write endpoint, separate from the global one.
 * Five submissions an hour per IP is generous for a human and useless for a bot.
 */
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many enquiries from this address. Please email us directly.',
      },
    }),
});

const router: ExpressRouter = Router();

// operationId: listServices
router.get('/services', listServices);
// operationId: getServiceBySlug
router.get('/services/:slug', getServiceBySlug);
// operationId: listWorkCategories
router.get('/work-categories', listWorkCategories);
// operationId: listIndustries
router.get('/industries', listIndustries);
// operationId: listTestimonials
router.get('/testimonials', listTestimonials);
// operationId: listWork
router.get('/work', listWork);
// operationId: listBlogPosts
router.get('/blog', listBlogPosts);
// operationId: createInquiry
router.post('/inquiries', inquiryLimiter, createInquiry);

// Page-view beacon from the marketing site. Loose limit — a normal browsing
// session fires many, but this caps a single IP flooding the events table.
const pageViewLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Slow down.' } }),
});
// operationId: recordPageView
router.post('/analytics/pageview', pageViewLimiter, recordPageView);

export default router;
