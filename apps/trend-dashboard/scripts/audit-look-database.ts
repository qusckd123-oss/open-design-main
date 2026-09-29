import { Client } from "pg";

// Read-only production pre/post migration check. Never prints the connection string.
const url = process.env.POSTGRES_MIGRATION_URL;
if (!url) throw new Error("POSTGRES_MIGRATION_URL is required");
const target = new URL(url);
if (!(["postgres:", "postgresql:"].includes(target.protocol))) throw new Error("PostgreSQL URL required");
console.log(`Target: ${target.hostname}${target.pathname}`);

const client = new Client({ connectionString: url });
try {
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const names = ["EditorialPost", "EditorialMention", "MarketProduct", "WatchlistSnapshot", "LookSourceAccount", "LookObservation", "LookCluster", "LookClusterObservation", "ReviewedLookTag"];
  for (const name of names) {
    const exists = await client.query<{ exists: string | null }>("SELECT to_regclass(format('public.%I', $1::text))::text AS exists", [name]);
    if (!exists.rows[0]?.exists) { console.log(`${name}: absent`); continue; }
    // Identifiers are limited to the closed, hard-coded list above.
    const rows = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM "${name}"`);
    console.log(`${name}: ${rows.rows[0]?.count}`);
  }
  const migration = await client.query<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>(
    "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name = $1",
    ["20260929120000_add_look_observation_foundation"]
  );
  console.log(`LOOK migration: ${JSON.stringify(migration.rows)}`);
  await client.query("ROLLBACK");
} finally {
  await client.end();
}
