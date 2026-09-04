import { trendConfig } from "@/lib/trend-config";
import type { TrendStatus } from "@/types/trend";

export type RankPoint = {
  rank: number;
  collectedAt: Date;
};

export function rankChange(currentRank: number, previousRank: number | null | undefined) {
  if (previousRank == null) return null;
  return previousRank - currentRank;
}

export function classifyTrend(points: RankPoint[]): TrendStatus {
  const sorted = [...points].sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime());
  const current = sorted[0];
  if (!current || sorted.length < 2) return "INSUFFICIENT_DATA";

  const change3d = rankChange(current.rank, sorted[3]?.rank);
  const hadPreviousTop100 = sorted.slice(1).some((point) => point.rank <= trendConfig.topRankBoundary);
  if (!hadPreviousTop100 && current.rank <= trendConfig.topRankBoundary) return "NEW_ENTRY";
  if ((change3d ?? 0) >= trendConfig.surgingChange3d) return "SURGING";

  const latestWindow = sorted.slice(0, trendConfig.sustainedDays + 1);
  if (
    latestWindow.length >= trendConfig.sustainedDays + 1 &&
    latestWindow.every((point, index) => index === 0 || latestWindow[index - 1]!.rank < point.rank)
  ) {
    return "STEADY_RISING";
  }

  if ((change3d ?? 0) <= trendConfig.decliningChange3d) return "DECLINING";
  if (current.rank <= trendConfig.stableTopRank && Math.abs(change3d ?? 0) <= trendConfig.stableMaxMovement3d) {
    return "STABLE";
  }
  return "STABLE";
}
