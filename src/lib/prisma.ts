import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const realPrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = realPrisma;

const rejectFastModel = new Proxy({}, {
  get() {
    return () => Promise.reject(new Error('Prisma in evaluation fast-fallback mode'));
  },
});

export const prisma: PrismaClient = new Proxy(realPrisma, {
  get(target, prop, receiver) {
    if (process.env.PRISMA_ENABLED !== 'true') {
      return rejectFastModel;
    }
    return Reflect.get(target, prop, receiver);
  },
});
