export type SearchTrendSignal = "HOT" | "RISING" | "STABLE" | "COOLING" | "NEW_SIGNAL" | "INSUFFICIENT_DATA";
export type PlanningTrendType = "EMERGING" | "SEASONAL" | "HOT" | "COOLING" | "WATCH" | "STABLE" | "INSUFFICIENT_DATA";

export type SearchTrendAgeGroup = "ALL" | "13-18" | "19-24" | "25-29";
export type ShoppingInsightAgeGroup = "10-19" | "20-29";
export type TargetAgeSignal = "TEEN" | "20S" | "TEEN + 20S" | "WEAK" | "UNCLEAR";
export type DataQualityStatus = "GOOD" | "CHECK" | "POOR" | "NO_DATA";

export type SearchMomentum = {
  current: number | null;
  change1w: number | null;
  change4w: number | null;
  change12w: number | null;
};

export type ShoppingAgeSignal = {
  current: number | null;
  change1w: number | null;
  change4w: number | null;
};

export type KeywordTrendRow = {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  shoppingKeyword: string | null;
  naverShoppingCategory: string | null;
  active: boolean;
  source: string;
  metric: "Relative Search Index";
  currentByAge: Record<SearchTrendAgeGroup, number | null>;
  searchMomentumByAge: Record<SearchTrendAgeGroup, SearchMomentum>;
  shoppingByAge: Record<ShoppingInsightAgeGroup, ShoppingAgeSignal>;
  change1w: number | null;
  change4w: number | null;
  change12w: number | null;
  yoyChange: number | null;
  signal: SearchTrendSignal;
  trendType: PlanningTrendType;
  targetAgeSignal: TargetAgeSignal;
  strongestMomentumAge: SearchTrendAgeGroup | null;
  searchDataQuality: DataQualityStatus;
  shoppingDataQuality: DataQualityStatus;
  peakMonth: string | null;
  currentVsPeak: number | null;
  lastYearPeak: string | null;
  updatedAt: Date | null;
};
