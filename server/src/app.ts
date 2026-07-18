/**
 * Express application wiring.
 *
 * Order matters and is deliberate:
 *   requestId → logging → security → parsers → rate limit → spec validation
 *   → routes → notFound → errorHandler
 *
 * Spec validation sits *before* the routes so a malformed request never reaches a
 * controller, and response validation (development and test only) sits with it so
 * an endpoint that returns something the contract doesn't describe fails loudly
 * during development rather than silently in production.
 */
import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import * as OpenApiValidator from 'express-openapi-validator';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { config } from './config/env.js';
import { logger } from './lib/logger.js';
import { requestId } from './middleware/requestId.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SPEC_PATH = path.resolve(here, '../openapi/openapi.yaml');

export function createApp(): Express {
  const app = express();

  // Behind nginx on the VPS. Without this, rate limiting sees the proxy's IP for
  // every request and limits the whole internet as one client.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      // Reuse the id we already assigned so the log line and the error response
      // carry the same value.
      genReqId: (req) => (req as express.Request).id,
      autoLogging: { ignore: (req) => req.url === '/v1/health' },
    }),
  );

  app.use(helmet());

  // No wildcard: `credentials: true` forbids it, and cookie auth needs credentials.
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use(
    '/v1',
    rateLimit({
      windowMs: 60_000,
      limit: config.isProduction ? 120 : 1000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      // Route through the normal error path so even a 429 has the standard shape.
      handler: (_req, res) =>
        res.status(429).json({
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' },
        }),
    }),
  );

  app.use(
    OpenApiValidator.middleware({
      apiSpec: SPEC_PATH,
      validateRequests: true,
      // Response validation is expensive and, more importantly, must never turn a
      // working production response into a 500. It earns its keep in dev and CI.
      validateResponses: !config.isProduction,
      validateSecurity: false, // auth middleware owns this (Phase 3)
      ignorePaths: (p: string) => !p.startsWith('/v1'),
    }),
  );

  app.use('/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
