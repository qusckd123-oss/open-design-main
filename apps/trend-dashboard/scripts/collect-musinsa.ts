import { MusinsaMockAdapter } from "../src/collectors/musinsa";
import { MusinsaRealAdapter } from "../src/collectors/musinsa-real";
import { persistCollectionResult } from "../src/services/collection-service";
import { prisma } from "../src/db/client";

async function main() {
  const startedAt = new Date();
  const args = parseArgs(process.argv.slice(2));
  const dataSource = (process.env.DATA_SOURCE ?? args.source ?? "mock").toLowerCase();
  const adapter = dataSource === "musinsa" || dataSource === "real" ? new MusinsaRealAdapter() : new MusinsaMockAdapter();
  const result = await adapter.collect({ limit: args.limit });
  const persisted = await persistCollectionResult(result, startedAt);

  console.log("");
  console.log("MUSINSA COLLECTION COMPLETE");
  console.log(`Mode: ${adapter.mode.toUpperCase()}`);
  console.log(`Status: ${persisted.status}`);
  console.log(`Fetched: ${persisted.fetched}`);
  console.log(`Inserted products: ${persisted.insertedProducts}`);
  console.log(`Updated products: ${persisted.updatedProducts}`);
  console.log(`Snapshots: ${persisted.snapshots}`);
  console.log(`Failed: ${persisted.failed}`);
  console.log(`Elapsed: ${(persisted.elapsedMs / 1000).toFixed(1)}s`);
  if (result.failures.length > 0) {
    console.log("Failures:");
    for (const failure of result.failures.slice(0, 10)) {
      console.log(`- ${failure.source} ${failure.externalId ?? failure.url ?? "unknown"}: ${failure.reason}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("Musinsa collection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function parseArgs(args: string[]) {
  const parsed: { limit?: number; source?: string } = {};
  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      const value = Number(arg.replace("--limit=", ""));
      if (Number.isFinite(value) && value > 0) parsed.limit = value;
    }
    if (arg.startsWith("--source=")) parsed.source = arg.replace("--source=", "");
  }
  return parsed;
}
