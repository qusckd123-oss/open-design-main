import { PrismaClient, Prisma } from "@prisma/client";
import { createRuntimePostgresAdapter } from "./postgres-pool-config";

export { Prisma };

const adapter = createRuntimePostgresAdapter();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
