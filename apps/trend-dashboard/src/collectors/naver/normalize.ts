import { searchTrendConfig } from "@/lib/search-trend-config";
import type { SearchTrendAgeGroup, ShoppingInsightAgeGroup } from "@/types/search-trend";
import type { NaverApiHubSearchTrendResponse, NaverApiHubShoppingKeywordAgeResponse, NaverShoppingAgePoint, NaverTrendPoint } from "@/collectors/naver/types";

export function normalizeSearchTrendResponse(input: {
  response: NaverApiHubSearchTrendResponse;
  keywordName: string;
  ageGroup: SearchTrendAgeGroup;
  collectedAt: Date;
}): NaverTrendPoint[] {
  const result = input.response.results.find((item) => item.title === input.keywordName) ?? input.response.results[0];
  if (!result) return [];

  return result.data.map((point) => ({
    keywordName: input.keywordName,
    source: searchTrendConfig.source,
    ageGroup: input.ageGroup,
    gender: "ALL",
    period: new Date(`${point.period}T00:00:00.000Z`),
    ratio: point.ratio,
    collectedAt: input.collectedAt
  }));
}

export function normalizeShoppingKeywordAgeResponse(input: {
  response: NaverApiHubShoppingKeywordAgeResponse;
  keywordName: string;
  collectedAt: Date;
}): NaverShoppingAgePoint[] {
  const result = input.response.results.find((item) => item.title === input.keywordName) ?? input.response.results[0];
  if (!result) return [];

  const points: NaverShoppingAgePoint[] = [];
  for (const point of result.data) {
    const ageGroup = mapShoppingAgeGroup(point.group);
    if (!ageGroup) continue;
    points.push({
      keywordName: input.keywordName,
      source: searchTrendConfig.shoppingSource,
      ageGroup,
      gender: "ALL",
      period: new Date(`${point.period}T00:00:00.000Z`),
      ratio: point.ratio,
      collectedAt: input.collectedAt
    });
  }
  return points;
}

export function mapShoppingAgeGroup(group: string): ShoppingInsightAgeGroup | null {
  if (group === "10") return "10-19";
  if (group === "20") return "20-29";
  return null;
}
