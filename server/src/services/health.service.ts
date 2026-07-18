/**
 * Services hold business logic and own transactions. They call repositories, never
 * Prisma, and they know nothing about HTTP — no req, no res, no status codes.
 */
import type { Health } from '@haizo/types';
import { healthRepository } from '../repositories/health.repository.js';
import { logger } from '../lib/logger.js';

const startedAt = Date.now();
const VERSION = process.env.npm_package_version ?? '0.1.0';

export const healthService = {
  async check(): Promise<Health> {
    const checks: Record<string, string> = {};
    let status: Health['status'] = 'ok';

    try {
      await healthRepository.ping();
      checks.database = 'ok';
    } catch (err) {
      // Degraded, not failed: the process is alive and can still say so. A 500 here
      // would make a load balancer kill an instance that might recover on its own.
      logger.error({ err }, 'Database health check failed');
      checks.database = 'unreachable';
      status = 'degraded';
    }

    return {
      status,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      version: VERSION,
      checks,
    };
  },
};
