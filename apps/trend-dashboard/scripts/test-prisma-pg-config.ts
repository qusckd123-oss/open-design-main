import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { POSTGRES_CONNECTION_TIMEOUT_MS, createPostgresPoolConfig, createRuntimePostgresAdapter } from "../src/db/postgres-pool-config.js";
import { prisma } from "../src/db/client.js";

const connectionString = "postgresql://test:test@ep-example-pooler.example.neon.tech/test";
const poolConfig = createPostgresPoolConfig(connectionString);
assert.deepEqual(poolConfig, {
  connectionString,
  connectionTimeoutMillis: 10_000
});
assert.equal(POSTGRES_CONNECTION_TIMEOUT_MS, 10_000);
assert.ok(createRuntimePostgresAdapter(connectionString) instanceof PrismaPg);
const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = connectionString;
assert.deepEqual(createPostgresPoolConfig(process.env.DATABASE_URL), poolConfig, "runtime config reads DATABASE_URL");
if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
else process.env.DATABASE_URL = previousDatabaseUrl;
assert.equal((await import("../src/db/client.js")).prisma, prisma, "runtime Prisma client is module-singleton reused");

console.log("PrismaPg runtime configuration and singleton test passed.");
