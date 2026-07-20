/**
 * Process entry point. Kept separate from app.ts so tests can mount the app with
 * supertest without binding a port.
 */
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import cron from 'node-cron';
import { attachSockets } from './sockets/index.js';
import { runDigest } from './jobs/digest.js';
import { runSupportSweep } from './jobs/supportSweep.js';
import { analyticsService } from './services/analytics.service.js';

const httpServer = createServer(createApp());

// Socket.IO shares the HTTP server: one port, one process, one auth mechanism.
attachSockets(httpServer);

// Daily notification digest at 08:00 server time. No-ops cleanly until SMTP is
// configured, so it's safe to schedule in every environment.
cron.schedule('0 8 * * *', () => {
  void runDigest();
});

// Nightly analytics rollup at 00:15 — finalise yesterday, refresh today.
cron.schedule('15 0 * * *', () => {
  void analyticsService.nightlyRollup();
});

// Every 5 minutes, spill unanswered visitor chats into inquiries so a question
// asked while everyone was away is never lost.
cron.schedule('*/5 * * * *', () => {
  void runSupportSweep();
});

httpServer.listen(config.port, () => {
  logger.info(`API listening on :${config.port} (${config.nodeEnv})`);
});

/**
 * Graceful shutdown. Without this, a deploy can cut off in-flight requests and
 * leave Postgres connections dangling until they time out.
 */
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced exit after 10s');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
