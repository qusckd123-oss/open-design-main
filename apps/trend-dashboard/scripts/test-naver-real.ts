import { loadEnvFile } from "node:process";
import { NaverSearchTrendRealAdapter } from "../src/collectors/naver/search-trend";
import { NaverShoppingInsightRealAdapter } from "../src/collectors/naver/shopping-insight-keyword-age";
import { defaultNaverShoppingCategory } from "../src/config/naver-shopping-category";
import { prisma } from "../src/db/client";

try {
  loadEnvFile(".env");
} catch {
  // Optional local env file.
}

async function main() {
  const hasKey = Boolean(firstNonEmpty(process.env.NAVER_API_KEY_ID, process.env.NAVER_API_HUB_CLIENT_ID)) &&
    Boolean(firstNonEmpty(process.env.NAVER_API_KEY, process.env.NAVER_API_HUB_CLIENT_SECRET));

  console.log("");
  console.log("NAVER REAL API TEST");
  if (!hasKey) {
    console.log("");
    console.log("API authentication: MISSING");
    console.log("Set NAVER_API_KEY_ID and NAVER_API_KEY, or NAVER_API_HUB_CLIENT_ID and NAVER_API_HUB_CLIENT_SECRET in .env.");
    return;
  }

  const keyword = {
    name: "그래픽 반팔",
    category: "TOP" as const,
    aliases: ["그래픽 티셔츠", "그래픽 반팔티", "graphic tee"],
    shoppingKeyword: "그래픽 반팔",
    naverShoppingCategory: defaultNaverShoppingCategory("그래픽 반팔"),
    active: true
  };
  const search = await new NaverSearchTrendRealAdapter().collect({ weeks: 12, keywords: [keyword] });
  const shopping = await new NaverShoppingInsightRealAdapter().collect({ weeks: 12, keywords: [keyword] });

  console.log("");
  console.log("Search Trend");
  console.log(`Status: ${search.failures.length === 0 && search.points.length > 0 ? "SUCCESS" : "FAILED"}`);
  console.log(`Periods: ${new Set(search.points.filter((point) => point.ageGroup === "ALL").map((point) => point.period.toISOString())).size}`);
  console.log("");
  console.log("Shopping Insight");
  console.log(`Status: ${shopping.failures.length === 0 && shopping.points.length > 0 ? "SUCCESS" : "FAILED"}`);
  console.log(`Teen periods: ${new Set(shopping.points.filter((point) => point.ageGroup === "10-19").map((point) => point.period.toISOString())).size}`);
  console.log(`20s periods: ${new Set(shopping.points.filter((point) => point.ageGroup === "20-29").map((point) => point.period.toISOString())).size}`);
  console.log("");
  console.log(`API authentication: ${search.failures.length === 0 && shopping.failures.length === 0 ? "OK" : "CHECK"}`);
  for (const failure of [...search.failures, ...shopping.failures]) {
    console.log(`- ${failure.keywordName}${failure.ageGroup ? `/${failure.ageGroup}` : ""}: ${failure.reason}`);
  }
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0);
}

main()
  .catch((error) => {
    console.error("NAVER real API test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
