import { pathToFileURL } from "node:url";
import { assortmentCollectorSources, createMarketCollector, supportedCollectorSources, verifiedRankingCollectorSources } from "../src/collectors/market/index";
import { rankingCategories, sourceCategoryConfigs, type RankingCategory } from "../src/config/market-category-map";
import { marketSources, normalizeMarketSource, type MarketSource } from "../src/config/market-sources";
import { prisma } from "../src/db/client";
import { persistMarketCollectionResult } from "../src/services/market-collection-service";
import type { MarketCollectionResult } from "../src/collectors/market/types";

type Args = {
  source?: MarketSource;
  category?: RankingCategory;
  limit: number;
  all: boolean;
  allCategories: boolean;
  verifiedOnly: boolean;
  assortmentOnly: boolean;
  dryRun: boolean;
};

type CollectionSummary = { source: string; category: string; status: string; fetched: number; saved: number; failed: number; importRunId?: string };

const priorityCategories: RankingCategory[] = ["SHORT_SLEEVE_TSHIRT", "JACKET", "PANTS", "BAG", "HEADWEAR"];

/**
 * Runs one source/category collection and returns its raw
 * `MarketCollectionResult` - a real network collection (or a real
 * `COLLECTOR_EXCEPTION` result if `collector.collect()` throws), but never
 * anything DB-related. Extracted out of `main()` specifically so the
 * dry-run/persist decision boundary below is a small, separately callable,
 * separately testable seam rather than buried inside the CLI's argv-parsing
 * and console-printing loop (see scripts/smoke-test.ts
 * "verifyMarketDryRunNeverPersists" for the actual proof that
 * `persistMarketCollectionResult` is unreachable when `dryRun: true`).
 */
export async function runOneCollection(source: MarketSource, category: RankingCategory, limit: number): Promise<MarketCollectionResult> {
  const collector = createMarketCollector(source);
  try {
    return await collector.collect({ category, limit });
  } catch (error) {
    return {
      source,
      category,
      audienceSegment: "ALL",
      collectedAt: new Date(),
      status: "FAILED",
      method: "COLLECTOR_EXCEPTION",
      fetchedCount: 0,
      products: [],
      errors: [{ source, category, reason: error instanceof Error ? error.message : String(error), timestamp: new Date() }]
    };
  }
}

/**
 * THE persistence boundary for the whole CLI. `dryRun: true` returns
 * immediately after summarizing - `persistMarketCollectionResult` is not
 * imported into any branch reachable from that `if`, so there is no
 * "persist then roll back" or "write an ImportRun and call that dry"
 * possibility: the DB-writing call is structurally never reached, not
 * merely skipped after being entered.
 */
export async function handleCollectionResult(source: MarketSource, category: RankingCategory, result: MarketCollectionResult, dryRun: boolean): Promise<CollectionSummary> {
  if (dryRun) {
    printDryRunSummary(source, category, result);
    return { source, category, status: result.status, fetched: result.fetchedCount, saved: 0, failed: result.errors.length };
  }

  const saved = await persistMarketCollectionResult(result);
  console.log(`${source} ${category}: ${saved.status} fetched=${saved.fetched} saved=${saved.saved} failed=${saved.failed}`);
  return saved;
}

function printDryRunSummary(source: MarketSource, category: RankingCategory, result: MarketCollectionResult) {
  console.log("");
  console.log("DRY RUN — NO DATABASE WRITES");
  console.log(`${source} ${category}: ${result.status} fetched=${result.fetchedCount} products=${result.products.length} errors=${result.errors.length}`);
  for (const product of result.products) {
    console.log(
      `  #${product.externalProductId} "${product.name}" sourcePosition=${product.sourcePosition ?? "-"} observedCategory=${product.observedCategory} rankingCategory=${product.rankingCategory} price=${product.price ?? "null"} mainColor=${product.mainColor ?? "null"} rank=${product.rank ?? "null"} rankingVerified=${product.rankingVerified} rankingScope=${product.rankingScope} url=${product.url}`
    );
  }
  if (result.errors.length > 0) {
    console.log("  errors:");
    for (const error of result.errors) {
      console.log(`    #${error.externalProductId ?? "-"}: ${error.reason}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = args.verifiedOnly ? verifiedRankingCollectorSources() : args.assortmentOnly ? assortmentCollectorSources() : args.all ? supportedCollectorSources() : [args.source ?? "SLAM_JAM"];
  const categories = args.allCategories ? priorityCategories : [args.category ?? "SHORT_SLEEVE_TSHIRT"];
  const started = Date.now();
  const summaries: CollectionSummary[] = [];

  for (const source of sources) {
    const sourceCategories = categories.filter((category) => sourceCategoryConfigs[source]?.categories[category]);
    for (const category of sourceCategories) {
      const result = await runOneCollection(source, category, args.limit);
      summaries.push(await handleCollectionResult(source, category, result, args.dryRun));
    }
  }

  const totals = summaries.reduce(
    (acc, item) => ({
      fetched: acc.fetched + item.fetched,
      saved: acc.saved + item.saved,
      failed: acc.failed + item.failed
    }),
    { fetched: 0, saved: 0, failed: 0 }
  );

  console.log("");
  console.log(
    args.dryRun
      ? "DRY RUN COMPLETE — NO DATABASE WRITES"
      : args.verifiedOnly
        ? "VERIFIED MARKET COLLECTION COMPLETE"
        : args.assortmentOnly
          ? "ASSORTMENT MARKET COLLECTION COMPLETE"
          : "MARKET COLLECTION COMPLETE"
  );
  console.log(`Sources: ${[...new Set(summaries.map((item) => item.source))].join(", ") || "-"}`);
  console.log(`Categories: ${[...new Set(summaries.map((item) => item.category))].join(", ") || "-"}`);
  console.log(`Fetched: ${totals.fetched}`);
  console.log(`Saved snapshots: ${args.dryRun ? "N/A (dry run - nothing persisted)" : totals.saved}`);
  console.log(`Failed: ${totals.failed}`);
  console.log(`Elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

function parseArgs(argv: string[]): Args {
  const pairs = new Map<string, string | boolean>();
  for (const arg of argv) {
    if (arg.startsWith("--") && arg.includes("=")) {
      const [key, value] = arg.slice(2).split("=");
      if (key) pairs.set(key, value ?? "");
    } else if (arg.startsWith("--")) {
      pairs.set(arg.slice(2), true);
    }
  }

  const sourceInput = String(pairs.get("source") ?? "");
  const source = sourceInput ? normalizeMarketSource(sourceInput) : undefined;
  if (source && !marketSources.includes(source)) throw new Error(`Unsupported source: ${sourceInput}`);

  const categoryInput = String(pairs.get("category") ?? "");
  const category = categoryInput ? parseCategory(categoryInput) : undefined;
  const limit = Number(pairs.get("limit") ?? 50);
  if (!Number.isFinite(limit) || limit < 1 || limit > 250) throw new Error("--limit must be between 1 and 250.");

  return {
    source,
    category,
    limit,
    all: pairs.get("all") === true,
    allCategories: pairs.get("all-categories") === true,
    verifiedOnly: pairs.get("verified-only") === true,
    assortmentOnly: pairs.get("assortment-only") === true,
    dryRun: pairs.get("dry-run") === true
  };
}

function parseCategory(value: string): RankingCategory {
  const normalized = value.trim().toUpperCase();
  const category = rankingCategories.find((candidate) => candidate === normalized);
  if (!category) throw new Error(`Unsupported ranking category: ${value}`);
  return category;
}

// Only auto-run when this file is executed directly as the CLI entry point
// (`tsx scripts/collect-market.ts ...`) - NOT when another module (e.g. a
// test file) imports `runOneCollection`/`handleCollectionResult` from it.
// Without this guard, importing anything from this file would trigger a
// full argv-driven collection run plus an early `prisma.$disconnect()` as
// an unwanted side effect of the import itself.
const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error("Market collection failed:", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
