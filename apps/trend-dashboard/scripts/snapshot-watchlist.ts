import { pathToFileURL } from "node:url";
import { prisma } from "../src/db/client";
import type { PlanningGenderFilter } from "../src/lib/planning-filters";
import { captureWatchlistSnapshot, resolveWatchlistSnapshotData } from "../src/services/watchlist-snapshot-service";

/**
 * WATCHLIST SNAPSHOT CLI (Phase 6A - Archive foundation).
 *
 * Usage:
 *   npx tsx scripts/snapshot-watchlist.ts --dry-run [--gender=all|uni|women] [--data-mode=real]
 *   npx tsx scripts/snapshot-watchlist.ts [--gender=all|uni|women] [--data-mode=real] [--manual|--scheduled]
 *
 * --dry-run resolves the Watchlist exactly as the home page would render it
 * and prints a sanitized summary - ZERO DB writes (see
 * resolveWatchlistSnapshotData in src/services/watchlist-snapshot-service.ts,
 * which only reads). Without --dry-run, this performs ONE append-only
 * `prisma.watchlistSnapshot.create` write (header + items, one nested
 * create - see captureWatchlistSnapshot).
 *
 * --manual (default) / --scheduled only record provenance (`triggeredBy`);
 * neither changes what gets captured.
 *
 * Any unrecognized flag fails fast (non-zero exit, no DB access) - same
 * fail-fast contract as scripts/refresh-editorial.ts's CLI, so a typo can
 * never silently fall through into a live write.
 */

const USAGE = `Usage: snapshot:watchlist [--dry-run] [--gender=all|uni|women] [--data-mode=real] [--manual|--scheduled] [--help]`;

type ParsedArgs =
  | { action: "help" }
  | { action: "error"; message: string }
  | { action: "run"; dryRun: boolean; gender: PlanningGenderFilter; dataMode: string; triggeredBy: "manual" | "scheduled" };

export function parseSnapshotCliArgs(argv: string[]): ParsedArgs {
  if (argv.includes("--help") || argv.includes("-h")) return { action: "help" };

  let dryRun = false;
  let gender: PlanningGenderFilter = "all";
  let dataMode = "real";
  let triggeredBy: "manual" | "scheduled" = "manual";

  for (const token of argv) {
    if (token === "--dry-run") {
      dryRun = true;
    } else if (token === "--manual") {
      triggeredBy = "manual";
    } else if (token === "--scheduled") {
      triggeredBy = "scheduled";
    } else if (token.startsWith("--gender=")) {
      const value = token.slice("--gender=".length);
      if (value !== "all" && value !== "uni" && value !== "women") return { action: "error", message: `Unrecognized --gender value: ${value} (expected all|uni|women)` };
      gender = value;
    } else if (token.startsWith("--data-mode=")) {
      dataMode = token.slice("--data-mode=".length);
      if (!dataMode) return { action: "error", message: "--data-mode= requires a non-empty value" };
    } else {
      return { action: "error", message: `Unrecognized argument: ${token}` };
    }
  }

  return { action: "run", dryRun, gender, dataMode, triggeredBy };
}

async function main() {
  const parsed = parseSnapshotCliArgs(process.argv.slice(2));

  if (parsed.action === "help") {
    console.log(USAGE);
    return;
  }
  if (parsed.action === "error") {
    console.error(`${parsed.message}\n`);
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const { dryRun, gender, dataMode, triggeredBy } = parsed;
  console.log("=== WATCHLIST SNAPSHOT ===");
  console.log(`Mode: ${dryRun ? "DRY RUN (no DB writes)" : "LIVE (append-only write)"}`);
  console.log(`dataMode=${dataMode} gender=${gender} triggeredBy=${triggeredBy}\n`);

  if (dryRun) {
    const data = await resolveWatchlistSnapshotData(dataMode, gender);
    console.log(`businessDate=${data.businessDate} algorithmVersion=${data.algorithmVersion}`);
    console.log(`sourceEditorialPostCount=${data.sourceEditorialPostCount} sourceLatestPublishedAt=${data.sourceLatestPublishedAt?.toISOString() ?? "-"}`);
    console.log(`items=${data.items.length}\n`);
    for (const item of data.items) {
      console.log(`  #${item.rank} ${item.signalName} - ${item.evidenceStrength} - ${item.bundleArticlePresence}개 기사 · ${item.bundleSourceSpread}개 매체${item.isPrimarySignal ? " [PRIMARY]" : ""}`);
    }
    console.log("\nDRY RUN complete - no rows were written.");
    return;
  }

  const result = await captureWatchlistSnapshot({ dataMode, gender, triggeredBy });
  console.log(`Captured WatchlistSnapshot ${result.snapshotId} (businessDate=${result.businessDate}, items=${result.itemCount}).`);
}

// Only auto-run when this file is executed directly as the CLI entry point
// (`tsx scripts/snapshot-watchlist.ts ...`) - NOT when another module (e.g.
// scripts/test-watchlist-snapshot.ts) imports `parseSnapshotCliArgs` from it.
// Without this guard, importing anything from this file would trigger a
// full argv-driven run (defaulting to a LIVE, non-dry-run write) plus an
// early `prisma.$disconnect()` as an unwanted side effect of the import
// itself - the same guard scripts/collect-market.ts already uses.
const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error("Watchlist snapshot failed:", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
