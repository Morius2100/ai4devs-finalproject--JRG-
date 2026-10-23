import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma singleton (TKT-003).
 * En desarrollo, Next.js recarga los módulos en caliente; guardar la
 * instancia en `globalThis` evita agotar las conexiones de PostgreSQL.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
