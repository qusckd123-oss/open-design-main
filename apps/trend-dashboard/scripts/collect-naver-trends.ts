import { loadEnvFile } from "node:process";
import { NaverSearchTrendMockAdapter } from "../src/collectors/naver/mock";
import { NaverSearchTrendRealAdapter } from "../src/collectors/naver/search-trend";
import { NaverShoppingInsightRealAdapter } from "../src/collectors/naver/shopping-insight-keyword-age";
import { NaverShoppingInsightMockAdapter } from "../src/collectors/naver/shopping-mock";
import { prisma } from "../src/db/client";
import { persistNaverShoppingAgeCollection, persistNaverTrendCollection } from "../src/services/naver-trend-collection-service";
import { getActiveNaverKeywordInputs, seedTrendKeywords } from "../src/services/keyword-seed-service";

try {
  loadEnvFile(".env");
} catch {
  // Optional local env file.
}

async function main() {
  const startedAt = new Date();
  const args = parseArgs(process.argv.slice(2));
  const mode = (process.env.NAVER_DATA_MODE ?? args.mode ?? "mock").toLowerCase();
  await seedTrendKeywords();
  const keywords = await getActiveNaverKeywordInputs();
  const searchAdapter = mode === "real" ? new NaverSearchTrendRealAdapter() : new NaverSearchTrendMockAdapter();
  const shoppingAdapter = mode === "real" ? new NaverShoppingInsightRealAdapter() : new NaverShoppingInsightMockAdapter();
  const searchResult = await searchAdapter.collect({ limit: args.limit, keywords });
  const shoppingResult = await shoppingAdapter.collect({ limit: args.limit, keywords });
  const persistedSearch = await persistNaverTrendCollection(searchResult, startedAt);
  const persistedShopping = await persistNaverShoppingAgeCollection(shoppingResult, startedAt);

  console.log("");
  console.log("NAVER SEARCH TREND COLLECTION COMPLETE");
  console.log(`Mode: ${searchAdapter.mode.toUpperCase()}`);
  console.log(`Search status: ${persistedSearch.status}`);
  console.log(`Search stored snapshots: ${persistedSearch.snapshots}`);
  console.log(`Shopping status: ${persistedShopping.status}`);
  console.log(`Shopping stored snapshots: ${persistedShopping.snapshots}`);
  console.log(`Failed: ${persistedSearch.failed + persistedShopping.failed}`);
  console.log(`Elapsed: ${((persistedSearch.elapsedMs + persistedShopping.elapsedMs) / 1000).toFixed(1)}s`);
  const failures = [...searchResult.failures, ...shoppingResult.failures];
  if (failures.length > 0) {
    console.log("Failures:");
    for (const failure of failures.slice(0, 10)) {
      console.log(`- ${failure.keywordName}${failure.ageGroup ? `/${failure.ageGroup}` : ""}: ${failure.reason}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("NAVER trend collection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function parseArgs(args: string[]) {
  const parsed: { limit?: number; mode?: string } = {};
  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      const value = Number(arg.replace("--limit=", ""));
      if (Number.isFinite(value) && value > 0) parsed.limit = value;
    }
    if (arg.startsWith("--mode=")) parsed.mode = arg.replace("--mode=", "");
  }
  return parsed;
}
