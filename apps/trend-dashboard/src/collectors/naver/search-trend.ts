import { fashionKeywordSeeds } from "@/collectors/naver/keywords";
import { normalizeSearchTrendResponse } from "@/collectors/naver/normalize";
import type { NaverApiHubSearchTrendResponse, NaverKeywordSeed, NaverTrendCollectOptions, NaverTrendCollectResult } from "@/collectors/naver/types";
import { searchTrendConfig } from "@/lib/search-trend-config";
import type { SearchTrendAgeGroup } from "@/types/search-trend";

const searchTrendBatchSize = 5;

export class NaverSearchTrendRealAdapter {
  mode = "real" as const;
  source = searchTrendConfig.source;

  async collect(options: NaverTrendCollectOptions = {}): Promise<NaverTrendCollectResult> {
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

    for (const ageGroup of searchTrendConfig.collectionAgeGroups) {
      for (const batch of chunks(keywords, searchTrendBatchSize)) {
        try {
          const response = await requestSearchTrend({
            keywords: batch,
            ageGroup,
            clientId,
            clientSecret,
            weeks
          });
          for (const keyword of batch) {
            points.push(...normalizeSearchTrendResponse({ response, keywordName: keyword.name, ageGroup, collectedAt }));
          }
        } catch (error) {
          for (const keyword of batch) {
            failures.push({
              keywordName: keyword.name,
              ageGroup,
              reason: error instanceof Error ? error.message : String(error),
              timestamp: new Date()
            });
          }
        }
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

async function requestSearchTrend(input: {
  keywords: NaverKeywordSeed[];
  ageGroup: SearchTrendAgeGroup;
  clientId: string;
  clientSecret: string;
  weeks: number;
}) {
  const baseUrl = process.env.NAVER_API_HUB_BASE_URL ?? "https://naverapihub.apigw.ntruss.com";
  const { startDate, endDate } = searchWindow(input.weeks);
  const ageCode = searchTrendConfig.naverSearchTrendAgeCodes[input.ageGroup];
  const body: Record<string, unknown> = {
    startDate,
    endDate,
    timeUnit: "week",
    keywordGroups: input.keywords.map((keyword) => ({
      groupName: keyword.name,
      keywords: [keyword.name, ...keyword.aliases].slice(0, 20)
    }))
  };
  if (ageCode) body.ages = [ageCode];

  const response = await fetch(`${baseUrl}/search-trend/v1/search`, {
    method: "POST",
    headers: {
      "X-NCP-APIGW-API-KEY-ID": input.clientId,
      "X-NCP-APIGW-API-KEY": input.clientSecret,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`NAVER API HUB HTTP ${response.status}: ${JSON.stringify(payload)}`);
  return payload as NaverApiHubSearchTrendResponse;
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

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0);
}
