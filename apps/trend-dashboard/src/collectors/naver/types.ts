import type { SearchTrendAgeGroup, ShoppingInsightAgeGroup } from "@/types/search-trend";

export type NaverTrendMode = "mock" | "real";

export type NaverKeywordSeed = {
  name: string;
  category: "TOP" | "BOTTOM" | "ACCESSORY";
  aliases: string[];
  shoppingKeyword?: string | null;
  naverShoppingCategory?: string | null;
  active?: boolean;
  // SPECIFIC_ITEM taxonomy code this keyword represents (see
  // src/config/taxonomy.ts). Only set once real search-intent evidence
  // exists for the mapping - broad/ambiguous keywords stay unmapped.
  specificItem?: string | null;
  // PLANNING gender ("UNISEX" | "WOMEN") for this keyword's product area.
  // This is NEVER the NAVER shopper gender.
  planningGender?: "UNISEX" | "WOMEN" | null;
};

export type NaverTrendPoint = {
  keywordName: string;
  source: "NAVER_SEARCH";
  ageGroup: SearchTrendAgeGroup;
  gender: "ALL" | "FEMALE" | "MALE"; // NAVER shopper gender - never the product's planning gender
  period: Date;
  ratio: number;
  collectedAt: Date;
};

export type NaverShoppingAgePoint = {
  keywordName: string;
  source: "NAVER_SHOPPING_INSIGHT";
  ageGroup: ShoppingInsightAgeGroup;
  gender: "ALL" | "FEMALE" | "MALE"; // NAVER shopper gender - never the product's planning gender
  period: Date;
  ratio: number;
  collectedAt: Date;
};

export type NaverTrendFailure = {
  keywordName: string;
  ageGroup?: SearchTrendAgeGroup;
  reason: string;
  timestamp: Date;
};

export type NaverTrendCollectOptions = {
  limit?: number;
  weeks?: number;
  keywords?: NaverKeywordSeed[];
};

export type NaverTrendCollectResult = {
  source: "NAVER_SEARCH";
  mode: NaverTrendMode;
  fetchedCount: number;
  points: NaverTrendPoint[];
  failures: NaverTrendFailure[];
};

export type NaverShoppingAgeCollectResult = {
  source: "NAVER_SHOPPING_INSIGHT";
  mode: NaverTrendMode;
  fetchedCount: number;
  points: NaverShoppingAgePoint[];
  failures: NaverTrendFailure[];
};

export type NaverApiHubSearchTrendResponse = {
  startDate: string;
  endDate: string;
  timeUnit: "date" | "week" | "month";
  results: {
    title: string;
    keywords: string[];
    data: {
      period: string;
      ratio: number;
    }[];
  }[];
};

export type NaverApiHubShoppingKeywordAgeResponse = {
  startDate: string;
  endDate: string;
  timeUnit: "date" | "week" | "month";
  results: {
    title: string;
    keyword: string[];
    data: {
      period: string;
      group: "10" | "20" | "30" | "40" | "50" | "60";
      ratio: number;
    }[];
  }[];
};
