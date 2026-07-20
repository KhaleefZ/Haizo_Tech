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
import { uploadsDir } from './lib/storage.js';
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
      // Authorization is the visitor support widget's bearer token (staff auth is
      // cookie-based and needs no header). Without it here, the preflight fails.
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-Id', 'Authorization'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Uploaded files live on local disk and are served straight back from there —
  // this is the "public URL" side of an upload. `nosniff` (from helmet) plus a
  // long cache are enough; keys are uuid-prefixed so they're effectively
  // immutable. Sits outside `/v1`, so the OpenAPI validator ignores it.
  //
  // These are public images meant to be embedded cross-origin (the marketing site
  // and admin both load them from this API host), so override helmet's default
  // Cross-Origin-Resource-Policy: same-origin — otherwise the browser blocks the
  // <img> and a blog cover / avatar silently vanishes.
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      index: false,
      dotfiles: 'ignore',
      maxAge: '30d',
      immutable: true,
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    }),
  );

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
      // Parse multipart uploads into memory (req.file/req.files) and cap the size
      // here so an oversized file is rejected before it's fully buffered.
      fileUploader: { limits: { fileSize: 10 * 1024 * 1024 } },
      ignorePaths: (p: string) => !p.startsWith('/v1'),
    }),
  );

  app.use('/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
