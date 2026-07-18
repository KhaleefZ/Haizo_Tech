/**
 * Repositories are the ONLY place that touches the database. Controllers and
 * services never import Prisma directly — that rule is what keeps business logic
 * testable and stops raw queries reappearing in HTTP handlers.
 */
import { prisma } from '../lib/prisma.js';

export const healthRepository = {
  /** Cheapest possible round-trip that proves the connection actually works. */
  async ping(): Promise<boolean> {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  },
};
