import { Client } from "pg";

// READ-ONLY: reports LOOK observation review/image state exactly as stored. Never prints the connection string.
const url = process.env.POSTGRES_MIGRATION_URL;
if (!url) throw new Error("POSTGRES_MIGRATION_URL is required");
const target = new URL(url);
if (!(["postgres:", "postgresql:"].includes(target.protocol))) throw new Error("PostgreSQL URL required");
console.log(`Target: ${target.hostname}${target.pathname}`);

const client = new Client({ connectionString: url });
try {
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const stored = await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'LookObservation' AND column_name = 'storedImageKey'");
  const storedCols = stored.rowCount ? `, o."storedImageKey" IS NOT NULL AS "hasStoredImage"` : "";
  const rows = await client.query(
    `SELECT o.id, a.handle, o."postUrl", o."observationType", o."imageIndex", o."reviewStatus", o."genderCandidate",
            o."reviewedBy", o."reviewedAt", o."createdAt", o."updatedAt"${storedCols}
     FROM "LookObservation" o JOIN "LookSourceAccount" a ON a.id = o."sourceAccountId" ORDER BY o."createdAt", o.id`
  );
  console.log(JSON.stringify(rows.rows, null, 2));
  const clusters = await client.query(`SELECT count(*)::int AS links FROM "LookClusterObservation"`);
  const tags = await client.query(`SELECT count(*)::int AS tags FROM "ReviewedLookTag"`);
  console.log(`cluster links: ${clusters.rows[0].links}, reviewed tags: ${tags.rows[0].tags}`);
  await client.query("ROLLBACK");
} finally {
  await client.end();
}
