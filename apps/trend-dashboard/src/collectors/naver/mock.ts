import { fashionKeywordSeeds } from "@/collectors/naver/keywords";
import type { NaverTrendCollectOptions, NaverTrendCollectResult } from "@/collectors/naver/types";
import { searchTrendConfig } from "@/lib/search-trend-config";

export class NaverSearchTrendMockAdapter {
  mode = "mock" as const;
  source = searchTrendConfig.source;

  async collect(options: NaverTrendCollectOptions = {}): Promise<NaverTrendCollectResult> {
    const keywords = (options.keywords ?? fashionKeywordSeeds).filter((keyword) => keyword.active !== false).slice(0, options.limit ?? undefined);
    const collectedAt = new Date();
    const periods = recentWeekPeriods(options.weeks ?? 12);

    const points = keywords.flatMap((keyword, keywordIndex) =>
      searchTrendConfig.collectionAgeGroups.flatMap((ageGroup, ageIndex) =>
        periods.map((period, weekIndex) => ({
          keywordName: keyword.name,
          source: this.source,
          ageGroup,
          gender: "ALL" as const,
          period,
          ratio: mockRatio(keywordIndex, ageIndex, weekIndex),
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

function mockRatio(keywordIndex: number, ageIndex: number, weekIndex: number) {
  const pattern = keywordIndex % 4;
  const ageBoost = ageIndex === 0 ? 8 : ageIndex === 1 ? 3 : -4;
  const base = 24 + (keywordIndex % 8) * 5 + ageBoost;
  const seasonalNoise = Math.sin((weekIndex + keywordIndex) / 2) * 3;
  if (pattern === 0) return clamp(base + weekIndex * 4.8 + seasonalNoise);
  if (pattern === 1) return clamp(base + Math.max(0, weekIndex - 7) * 10 + seasonalNoise);
  if (pattern === 2) return clamp(base + 42 - weekIndex * 3.7 + seasonalNoise);
  return clamp(base + seasonalNoise + (weekIndex % 3) * 1.4);
}

function clamp(value: number) {
  return Math.round(Math.max(1, Math.min(100, value)) * 10) / 10;
}
