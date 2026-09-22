import assert from "node:assert/strict";
import { NEON_CONNECTION_TIMEOUT_MS, createNeonPoolConfig } from "../src/db/neon-pool-config.js";

const connectionString = "postgresql://test:test@ep-example-pooler.example.neon.tech/test";
assert.deepEqual(createNeonPoolConfig(connectionString), {
  connectionString,
  connectionTimeoutMillis: 10_000
});
assert.equal(NEON_CONNECTION_TIMEOUT_MS, 10_000);
assert.deepEqual(createNeonPoolConfig(undefined), {
  connectionTimeoutMillis: 10_000
});

console.log("Prisma Neon runtime pool configuration passed.");
