import { assortmentCollectorSources, createMarketCollector, supportedCollectorSources, verifiedRankingCollectorSources } from "../src/collectors/market/index";
import { rankingCategories, sourceCategoryConfigs, type RankingCategory } from "../src/config/market-category-map";
import { marketSources, normalizeMarketSource, type MarketSource } from "../src/config/market-sources";
import { prisma } from "../src/db/client";
import { persistMarketCollectionResult } from "../src/services/market-collection-service";

type Args = {
  source?: MarketSource;
  category?: RankingCategory;
  limit: number;
  all: boolean;
  allCategories: boolean;
  verifiedOnly: boolean;
  assortmentOnly: boolean;
};

const priorityCategories: RankingCategory[] = ["SHORT_SLEEVE_TSHIRT", "JACKET", "PANTS", "BAG", "HEADWEAR"];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = args.verifiedOnly ? verifiedRankingCollectorSources() : args.assortmentOnly ? assortmentCollectorSources() : args.all ? supportedCollectorSources() : [args.source ?? "SLAM_JAM"];
  const categories = args.allCategories ? priorityCategories : [args.category ?? "SHORT_SLEEVE_TSHIRT"];
  const started = Date.now();
  const summaries = [];

  for (const source of sources) {
    const sourceCategories = categories.filter((category) => sourceCategoryConfigs[source]?.categories[category]);
    for (const category of sourceCategories) {
      try {
        const collector = createMarketCollector(source);
        const result = await collector.collect({ category, limit: args.limit });
        const saved = await persistMarketCollectionResult(result);
        summaries.push(saved);
        console.log(`${source} ${category}: ${saved.status} fetched=${saved.fetched} saved=${saved.saved} failed=${saved.failed}`);
      } catch (error) {
        const result = await persistMarketCollectionResult({
          source,
          category,
          audienceSegment: "ALL",
          collectedAt: new Date(),
          status: "FAILED",
          method: "COLLECTOR_EXCEPTION",
          fetchedCount: 0,
          products: [],
          errors: [{ source, category, reason: error instanceof Error ? error.message : String(error), timestamp: new Date() }]
        });
        summaries.push(result);
        console.log(`${source} ${category}: ${result.status} fetched=${result.fetched} saved=${result.saved} failed=${result.failed}`);
      }
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
  console.log(args.verifiedOnly ? "VERIFIED MARKET COLLECTION COMPLETE" : args.assortmentOnly ? "ASSORTMENT MARKET COLLECTION COMPLETE" : "MARKET COLLECTION COMPLETE");
  console.log(`Sources: ${[...new Set(summaries.map((item) => item.source))].join(", ") || "-"}`);
  console.log(`Categories: ${[...new Set(summaries.map((item) => item.category))].join(", ") || "-"}`);
  console.log(`Fetched: ${totals.fetched}`);
  console.log(`Saved snapshots: ${totals.saved}`);
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
    assortmentOnly: pairs.get("assortment-only") === true
  };
}

function parseCategory(value: string): RankingCategory {
  const normalized = value.trim().toUpperCase();
  const category = rankingCategories.find((candidate) => candidate === normalized);
  if (!category) throw new Error(`Unsupported ranking category: ${value}`);
  return category;
}

main()
  .catch((error) => {
    console.error("Market collection failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
