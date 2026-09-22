import type { PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export const POSTGRES_CONNECTION_TIMEOUT_MS = 10_000;

export function createPostgresPoolConfig(connectionString: string | undefined): PoolConfig {
  return {
    ...(connectionString ? { connectionString } : {}),
    connectionTimeoutMillis: POSTGRES_CONNECTION_TIMEOUT_MS
  };
}

export function createRuntimePostgresAdapter(connectionString = process.env.DATABASE_URL): PrismaPg {
  return new PrismaPg(createPostgresPoolConfig(connectionString));
}
