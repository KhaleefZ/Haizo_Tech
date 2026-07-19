/**
 * Process entry point. Kept separate from app.ts so tests can mount the app with
 * supertest without binding a port.
 */
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { attachSockets } from './sockets/index.js';

const httpServer = createServer(createApp());

// Socket.IO shares the HTTP server: one port, one process, one auth mechanism.
attachSockets(httpServer);

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
