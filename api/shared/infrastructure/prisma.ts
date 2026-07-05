import { PrismaClient } from '@prisma/client';

declare global {
   
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient instance.
 *
 * Uses a global cache to prevent multiple instances being created during
 * hot-module reloads in development (ts-node / tsx watch mode).
 *
 * In production, the module cache ensures a single instance anyway.
 */
export const prisma: PrismaClient =
  global.__prisma ?? new PrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  global.__prisma = prisma;
}
