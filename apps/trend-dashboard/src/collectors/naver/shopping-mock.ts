import { fashionKeywordSeeds } from "@/collectors/naver/keywords";
import type { NaverShoppingAgeCollectResult, NaverTrendCollectOptions } from "@/collectors/naver/types";
import { searchTrendConfig } from "@/lib/search-trend-config";
import type { ShoppingInsightAgeGroup } from "@/types/search-trend";

export class NaverShoppingInsightMockAdapter {
  mode = "mock" as const;
  source = searchTrendConfig.shoppingSource;

  async collect(options: NaverTrendCollectOptions = {}): Promise<NaverShoppingAgeCollectResult> {
    const keywords = (options.keywords ?? fashionKeywordSeeds).filter((keyword) => keyword.active !== false).slice(0, options.limit ?? undefined);
    const collectedAt = new Date();
    const periods = recentWeekPeriods(options.weeks ?? 12);

    const points = keywords.flatMap((keyword, keywordIndex) =>
      (searchTrendConfig.shoppingAgeGroups as readonly ShoppingInsightAgeGroup[]).flatMap((ageGroup) =>
        periods.map((period, weekIndex) => ({
          keywordName: keyword.name,
          source: this.source,
          ageGroup,
          gender: "ALL" as const,
          period,
          ratio: shoppingMockRatio(keywordIndex, ageGroup, weekIndex),
          collectedAt
        }))
      )
    );

    return {
      source: this.source,
      mode: this.mode,
      fetchedCount: points.length,
      points,
      failures: []
    };
  }
}

function recentWeekPeriods(count: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const day = today.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const latestMonday = new Date(today);
  latestMonday.setUTCDate(today.getUTCDate() + mondayOffset);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(latestMonday);
    date.setUTCDate(latestMonday.getUTCDate() - (count - 1 - index) * 7);
    return date;
  });
}

function shoppingMockRatio(keywordIndex: number, ageGroup: ShoppingInsightAgeGroup, weekIndex: number) {
  const pattern = keywordIndex % 6;
  const teenBase = pattern === 0 ? 74 : pattern === 2 ? 66 : pattern === 3 ? 22 : pattern === 4 ? 24 : 42;
  const twentiesBase = pattern === 1 ? 78 : pattern === 2 ? 72 : pattern === 3 ? 26 : pattern === 5 ? 76 : 44;
  const base = ageGroup === "10-19" ? teenBase : twentiesBase;
  const direction = pattern === 3 ? -1.1 : pattern === 4 ? -0.4 : 0.8;
  const noise = Math.sin((keywordIndex + weekIndex) / 2) * 2;
  return clamp(base + weekIndex * direction + noise);
}

function clamp(value: number) {
  return Math.round(Math.max(1, Math.min(100, value)) * 10) / 10;
}
