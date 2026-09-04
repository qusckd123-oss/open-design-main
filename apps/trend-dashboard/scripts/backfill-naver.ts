import { loadEnvFile } from "node:process";
import { NaverSearchTrendMockAdapter } from "../src/collectors/naver/mock";
import { NaverSearchTrendRealAdapter } from "../src/collectors/naver/search-trend";
import { NaverShoppingInsightRealAdapter } from "../src/collectors/naver/shopping-insight-keyword-age";
import { NaverShoppingInsightMockAdapter } from "../src/collectors/naver/shopping-mock";
import { prisma } from "../src/db/client";
import { getActiveNaverKeywordInputs, seedTrendKeywords } from "../src/services/keyword-seed-service";
import { persistNaverShoppingAgeCollection, persistNaverTrendCollection } from "../src/services/naver-trend-collection-service";
import { getKeywordQualityRows } from "../src/services/search-trend-service";

try {
  loadEnvFile(".env");
} catch {
  // Optional local env file.
}

async function main() {
  const startedAt = new Date();
  const args = parseArgs(process.argv.slice(2));
  const weeks = args.weeks ?? 104;
  const mode = (process.env.NAVER_DATA_MODE ?? args.mode ?? "mock").toLowerCase();
  await seedTrendKeywords();
  const keywords = await getActiveNaverKeywordInputs();
  const searchAdapter = mode === "real" ? new NaverSearchTrendRealAdapter() : new NaverSearchTrendMockAdapter();
  const shoppingAdapter = mode === "real" ? new NaverShoppingInsightRealAdapter() : new NaverShoppingInsightMockAdapter();

  const searchResult = await searchAdapter.collect({ weeks, keywords, limit: args.limit });
  const shoppingResult = await shoppingAdapter.collect({ weeks, keywords, limit: args.limit });
  const persistedSearch = await persistNaverTrendCollection(searchResult, startedAt);
  const persistedShopping = await persistNaverShoppingAgeCollection(shoppingResult, startedAt);
  const rows = await getKeywordQualityRows();
  const topSignals = rows
    .filter((row) => row.trendType === "EMERGING" || row.trendType === "HOT" || row.signal === "HOT")
    .sort((a, b) => (b.change4w ?? -999) - (a.change4w ?? -999))
    .slice(0, 5);

  console.log("");
  console.log("NAVER BACKFILL COMPLETE");
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`History: ${weeks} weeks`);
  console.log(`Keywords: ${keywords.length}`);
  console.log(`Search snapshots: ${persistedSearch.snapshots}`);
  console.log(`Shopping snapshots: ${persistedShopping.snapshots}`);
  console.log(`Failed API requests: ${persistedSearch.failed + persistedShopping.failed}`);
  console.log("");
  console.log("DATA QUALITY");
  for (const row of rows.slice(0, 25)) {
    console.log(`${row.name}\tSearch ${row.searchDataQuality}\tShopping ${row.shoppingDataQuality}\t${combinedQuality(row.searchDataQuality, row.shoppingDataQuality)}`);
  }
  if (topSignals.length > 0) {
    console.log("");
    console.log("TOP SIGNALS");
    topSignals.forEach((row, index) => console.log(`${index + 1}. ${row.name}`));
  }
}

main()
  .catch((error) => {
    console.error("NAVER backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function parseArgs(args: string[]) {
  const parsed: { weeks?: number; limit?: number; mode?: string } = {};
  for (const arg of args) {
    if (arg.startsWith("--weeks=")) {
      const value = Number(arg.replace("--weeks=", ""));
      if (Number.isFinite(value) && value > 0) parsed.weeks = value;
    }
    if (arg.startsWith("--limit=")) {
      const value = Number(arg.replace("--limit=", ""));
      if (Number.isFinite(value) && value > 0) parsed.limit = value;
    }
    if (arg.startsWith("--mode=")) parsed.mode = arg.replace("--mode=", "");
  }
  return parsed;
}

function combinedQuality(search: string, shopping: string) {
  if (search === "GOOD" && shopping === "GOOD") return "GOOD";
  if (search === "NO_DATA" && shopping === "NO_DATA") return "NO_DATA";
  if (search === "POOR" || shopping === "POOR" || search === "NO_DATA" || shopping === "NO_DATA") return "POOR";
  return "CHECK";
}
