import { fashionKeywordSeeds } from "@/collectors/naver/keywords";
import { normalizeShoppingKeywordAgeResponse } from "@/collectors/naver/normalize";
import type { NaverApiHubShoppingKeywordAgeResponse, NaverKeywordSeed, NaverShoppingAgeCollectResult, NaverTrendCollectOptions } from "@/collectors/naver/types";
import { defaultNaverShoppingCategory } from "@/config/naver-shopping-category";
import { searchTrendConfig } from "@/lib/search-trend-config";

export class NaverShoppingInsightRealAdapter {
  mode = "real" as const;
  source = searchTrendConfig.shoppingSource;

  async collect(options: NaverTrendCollectOptions = {}): Promise<NaverShoppingAgeCollectResult> {
    const clientId = firstNonEmpty(process.env.NAVER_API_KEY_ID, process.env.NAVER_API_HUB_CLIENT_ID);
    const clientSecret = firstNonEmpty(process.env.NAVER_API_KEY, process.env.NAVER_API_HUB_CLIENT_SECRET);
    const collectedAt = new Date();
    if (!clientId || !clientSecret) {
      return {
        source: this.source,
        mode: this.mode,
        fetchedCount: 0,
        points: [],
        failures: [
          {
            keywordName: "ALL",
            reason: "Missing NAVER_API_HUB_CLIENT_ID/NAVER_API_KEY_ID or NAVER_API_HUB_CLIENT_SECRET/NAVER_API_KEY.",
            timestamp: collectedAt
          }
        ]
      };
    }

    const keywords = activeKeywords(options.keywords ?? fashionKeywordSeeds).slice(0, options.limit ?? undefined);
    const points = [];
    const failures = [];
    const weeks = options.weeks ?? 12;

    for (const keyword of keywords) {
      try {
        const response = await requestShoppingKeywordAge({
          keywordName: keyword.shoppingKeyword ?? keyword.name,
          category: keyword.naverShoppingCategory ?? defaultNaverShoppingCategory(keyword.name),
          clientId,
          clientSecret,
          weeks
        });
        points.push(...normalizeShoppingKeywordAgeResponse({ response, keywordName: keyword.name, collectedAt }));
      } catch (error) {
        failures.push({
          keywordName: keyword.name,
          reason: classifyApiFailure(error),
          timestamp: new Date()
        });
      }
    }

    return {
      source: this.source,
      mode: this.mode,
      fetchedCount: points.length,
      points,
      failures
    };
  }
}

async function requestShoppingKeywordAge(input: {
  keywordName: string;
  category: string;
  clientId: string;
  clientSecret: string;
  weeks: number;
}) {
  const baseUrl = process.env.NAVER_API_HUB_BASE_URL ?? "https://naverapihub.apigw.ntruss.com";
  const { startDate, endDate } = searchWindow(input.weeks);
  const response = await fetch(`${baseUrl}/shopping/v1/category/keyword/age`, {
    method: "POST",
    headers: {
      "X-NCP-APIGW-API-KEY-ID": input.clientId,
      "X-NCP-APIGW-API-KEY": input.clientSecret,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      startDate,
      endDate,
      timeUnit: "week",
      category: input.category,
      keyword: input.keywordName,
      ages: ["10", "20"]
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`NAVER Shopping Insight HTTP ${response.status}: ${JSON.stringify(payload)}`);
  return payload as NaverApiHubShoppingKeywordAgeResponse;
}

function searchWindow(weeks: number) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 7 * weeks);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function activeKeywords(keywords: NaverKeywordSeed[]) {
  return keywords.filter((keyword) => keyword.active !== false);
}

function classifyApiFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("401") || message.includes("403")) return `AUTH_ERROR: ${message}`;
  if (message.includes("429")) return `RATE_LIMIT: ${message}`;
  if (message.includes("400")) return `REQUEST_ERROR: ${message}`;
  return message;
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0);
}
