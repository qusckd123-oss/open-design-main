// Cloudflare Workers build only: next.config.ts aliases "@/db/client" to this
// module when CF_WORKER_BUILD=1. Uses the Rust-free `workerClient` generator
// (query compiler WASM) instead of the native-engine `@prisma/client`.
import { PrismaClient, Prisma } from "../generated/prisma-worker/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPostgresPoolConfig } from "./postgres-pool-config";

export { Prisma };

// A Worker isolate can be reused for multiple requests, but workerd does not
// allow a TCP socket created for one request to be reused by another. Keep the
// generated Prisma client module-scoped, while forcing node-postgres to retire
// each checked-out connection when it is released. This preserves transactions
// within one checkout without leaving an idle socket for the next request.
const adapter = new PrismaPg({
  ...createPostgresPoolConfig(process.env.DATABASE_URL),
  maxUses: 1
});

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
