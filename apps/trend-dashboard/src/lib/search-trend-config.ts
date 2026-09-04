import type { SearchTrendAgeGroup } from "@/types/search-trend";

export const searchTrendConfig = {
  source: "NAVER_SEARCH",
  shoppingSource: "NAVER_SHOPPING_INSIGHT",
  metric: "Relative Search Index",
  shoppingMetric: "Relative Shopping Click Index",
  ageGroups: ["13-18", "19-24", "25-29"] as SearchTrendAgeGroup[],
  collectionAgeGroups: ["ALL", "13-18", "19-24", "25-29"] as SearchTrendAgeGroup[],
  shoppingAgeGroups: ["10-19", "20-29"] as const,
  naverSearchTrendAgeCodes: {
    ALL: null,
    "13-18": "2",
    "19-24": "3",
    "25-29": "4"
  },
  hotChange1w: 12,
  hotChange4w: 30,
  risingChange1w: 8,
  coolingChange1w: -10,
  newSignalCurrentRatio: 65
} as const;
