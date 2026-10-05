import { PrismaClient } from '@prisma/client';

// Prisma remains the local schema/seed client. Cloudflare Worker requests use
// the D1 repository layer, which avoids bundling Prisma's WASM query compiler.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function getPrisma(): PrismaClient {
  return prisma;
}
