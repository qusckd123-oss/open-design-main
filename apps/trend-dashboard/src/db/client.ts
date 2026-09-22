import { PrismaClient } from "@prisma/client";
import { createRuntimePostgresAdapter } from "./postgres-pool-config";

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
