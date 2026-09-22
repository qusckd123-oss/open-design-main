import type { PoolConfig } from "@neondatabase/serverless";

export const NEON_CONNECTION_TIMEOUT_MS = 10_000;

export function createNeonPoolConfig(connectionString: string | undefined): PoolConfig {
  return {
    ...(connectionString ? { connectionString } : {}),
    connectionTimeoutMillis: NEON_CONNECTION_TIMEOUT_MS
  };
}
