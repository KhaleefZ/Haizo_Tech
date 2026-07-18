/**
 * Structured logging. Pretty in development, JSON in production so the VPS log
 * shipper can parse it.
 *
 * `redact` is not optional: the previous backend logged whole request bodies in
 * places, which means passwords and client PII in plaintext logs. DPDP and GDPR
 * both care about that.
 */
import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.isTest ? 'silent' : config.isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.email',
    ],
    censor: '[redacted]',
  },
  // Pretty output is a development convenience only. In production we want JSON for
  // the log shipper, and in tests the transport must not load at all — it spawns a
  // worker thread, which makes the suite fail if pino-pretty isn't installed and
  // leaks a handle even when it is.
  ...(config.isProduction || config.isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }),
});

export type Logger = typeof logger;
