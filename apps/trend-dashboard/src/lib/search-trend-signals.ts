import { searchTrendConfig } from "@/lib/search-trend-config";
import { combinedTrendSignalConfig } from "@/config/trend-signal";
import type { DataQualityStatus, PlanningTrendType, SearchTrendSignal, ShoppingInsightAgeGroup, TargetAgeSignal } from "@/types/search-trend";

export function percentChange(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function classifySearchTrend(input: {
  current: number | null;
  previous1w: number | null;
  previous4w: number | null;
  sampleCount: number;
}): SearchTrendSignal {
  if (input.sampleCount < 2) {
    if ((input.current ?? 0) >= searchTrendConfig.newSignalCurrentRatio) return "NEW_SIGNAL";
    return "INSUFFICIENT_DATA";
  }

  const change1w = percentChange(input.current, input.previous1w);
  const change4w = percentChange(input.current, input.previous4w);

  if ((change1w ?? 0) >= searchTrendConfig.hotChange1w && (change4w ?? 0) >= searchTrendConfig.hotChange4w) return "HOT";
  if ((change1w ?? 0) >= searchTrendConfig.risingChange1w) return "RISING";
  if ((change1w ?? 0) <= searchTrendConfig.coolingChange1w) return "COOLING";
  return "STABLE";
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function combinedTrendSignal(input: {
  maxSearchChange1w: number | null;
  maxSearchChange4w: number | null;
  maxShoppingRatio: number | null;
}): SearchTrendSignal {
  if (
    (input.maxSearchChange4w ?? -Infinity) >= combinedTrendSignalConfig.hotSearchChange4w &&
    (input.maxShoppingRatio ?? -Infinity) >= combinedTrendSignalConfig.hotShoppingRatio
  ) {
    return "HOT";
  }
  if (
    (input.maxSearchChange1w ?? -Infinity) >= combinedTrendSignalConfig.risingSearchChange1w ||
    (input.maxSearchChange4w ?? -Infinity) >= combinedTrendSignalConfig.hotSearchChange4w
  ) {
    return "RISING";
  }
  if (
    (input.maxSearchChange1w ?? Infinity) <= combinedTrendSignalConfig.coolingSearchChange1w &&
    (input.maxShoppingRatio ?? Infinity) <= combinedTrendSignalConfig.coolingShoppingRatio
  ) {
    return "COOLING";
  }
  return "STABLE";
}

export function targetAgeSignal(input: {
  teenSearchChange4w: number | null;
  twentiesSearchChange4w: number | null;
  teenShoppingRatio: number | null;
  twentiesShoppingRatio: number | null;
}): TargetAgeSignal {
  const teenStrong =
    (input.teenSearchChange4w ?? -Infinity) >= combinedTrendSignalConfig.targetSearchChange4w ||
    (input.teenShoppingRatio ?? -Infinity) >= combinedTrendSignalConfig.targetShoppingRatio;
  const twentiesStrong =
    (input.twentiesSearchChange4w ?? -Infinity) >= combinedTrendSignalConfig.targetSearchChange4w ||
    (input.twentiesShoppingRatio ?? -Infinity) >= combinedTrendSignalConfig.targetShoppingRatio;

  if (
    (input.teenShoppingRatio == null && input.teenSearchChange4w == null) ||
    (input.twentiesShoppingRatio == null && input.twentiesSearchChange4w == null)
  ) {
    return teenStrong ? "TEEN" : twentiesStrong ? "20S" : "UNCLEAR";
  }
  if (teenStrong && twentiesStrong) return "TEEN + 20S";
  if (teenStrong) return "TEEN";
  if (twentiesStrong) return "20S";
  const hasAnyShopping = input.teenShoppingRatio != null || input.twentiesShoppingRatio != null;
  return hasAnyShopping ? "WEAK" : "UNCLEAR";
}

export function maxNullable(values: Array<number | null>) {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length ? Math.max(...finite) : null;
}

export function shoppingLabel(ageGroup: ShoppingInsightAgeGroup) {
  return ageGroup === "10-19" ? "Teen Shopping" : "20s Shopping";
}

export function classifyDataQuality(input: { expectedPeriods: number; actualPeriods: number; averageRatio: number | null }): DataQualityStatus {
  if (input.actualPeriods === 0) return "NO_DATA";
  const coverage = input.actualPeriods / Math.max(input.expectedPeriods, 1);
  if (coverage >= combinedTrendSignalConfig.qualityGoodCoverage && (input.averageRatio ?? 0) >= combinedTrendSignalConfig.qualityLowAverageRatio) {
    return "GOOD";
  }
  if (coverage >= combinedTrendSignalConfig.qualityCheckCoverage) return "CHECK";
  return "POOR";
}

export function classifyPlanningTrendType(input: {
  signal: SearchTrendSignal;
  maxSearchChange4w: number | null;
  maxSearchChange1w: number | null;
  maxShoppingRatio: number | null;
  yoyChange: number | null;
  currentVsPeak: number | null;
}): PlanningTrendType {
  if (input.signal === "INSUFFICIENT_DATA") return "INSUFFICIENT_DATA";
  if (input.signal === "COOLING") return "COOLING";
  if (
    (input.maxSearchChange4w ?? -Infinity) >= combinedTrendSignalConfig.hotSearchChange4w &&
    (input.yoyChange ?? -Infinity) >= combinedTrendSignalConfig.emergingYoY &&
    (input.maxShoppingRatio ?? -Infinity) >= combinedTrendSignalConfig.targetShoppingRatio
  ) {
    return "EMERGING";
  }
  if (
    (input.maxSearchChange4w ?? -Infinity) >= combinedTrendSignalConfig.hotSearchChange4w &&
    Math.abs((input.yoyChange ?? 0) - (input.maxSearchChange4w ?? 0)) <= combinedTrendSignalConfig.seasonalYoYTolerance
  ) {
    return "SEASONAL";
  }
  if ((input.maxShoppingRatio ?? -Infinity) >= combinedTrendSignalConfig.hotShoppingRatio) return "HOT";
  if ((input.maxSearchChange1w ?? -Infinity) >= combinedTrendSignalConfig.risingSearchChange1w) return "WATCH";
  return "STABLE";
}
