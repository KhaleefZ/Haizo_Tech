/**
 * One Prisma client for the process.
 *
 * The `globalThis` cache exists for `tsx watch`: without it every reload opens a
 * new pool and Postgres runs out of connections within a few saves.
 */
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isProduction ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!config.isProduction) globalForPrisma.prisma = prisma;
