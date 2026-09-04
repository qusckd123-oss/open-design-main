import { prisma } from "@/db/client";
import { demandSignalConfig } from "@/config/demand-signal";
import { searchTrendConfig } from "@/lib/search-trend-config";
import type { PlanningGenderFilter } from "@/lib/planning-filters";

// DEMAND SIGNAL = NAVER Shopping Insight only (official NAVER API Hub
// `/shopping/v1/category/keyword/age`). This is a relative shopping
// search/click interest index, never absolute search volume and never sales.
// It is a separate semantic axis from EDITORIAL (magazine trend) and STORE
// (verified ranking) - see docs/DEMAND_SIGNAL.md.

export type DemandAgeGroup = "10-19" | "20-29";
export type DemandObservation = "관심 증가" | "관심 유지" | "관심 감소" | "신규 관심 관측" | "데이터 부족";

export type DemandAgePoint = {
  current: number | null;
  change7d: number | null; // point (index) change, never a % of the ratio
  change14d: number | null;
};

export type DemandItemRow = {
  specificItem: string;
  planningGender: "UNISEX" | "WOMEN" | null;
  keywordName: string;
  keywordAliases: string[];
  byAge: Record<DemandAgeGroup, DemandAgePoint>;
  observation: DemandObservation;
  latestPeriod: Date | null;
  sampleWeeks: number;
};

export type NaverCredentialStatus = "CONFIGURED" | "MISSING";

export function getNaverCredentialStatus(): NaverCredentialStatus {
  const clientId = firstNonEmpty(process.env.NAVER_API_KEY_ID, process.env.NAVER_API_HUB_CLIENT_ID);
  const clientSecret = firstNonEmpty(process.env.NAVER_API_KEY, process.env.NAVER_API_HUB_CLIENT_SECRET);
  return clientId && clientSecret ? "CONFIGURED" : "MISSING";
}

export async function getDemandSignalRows(gender: PlanningGenderFilter = "all"): Promise<DemandItemRow[]> {
  const keywords = await prisma.trendKeyword.findMany({
    where: {
      active: true,
      specificItem: { not: null },
      ...(gender === "uni" ? { planningGender: "UNISEX" } : gender === "women" ? { planningGender: "WOMEN" } : {})
    },
    include: {
      // REAL only - mock demo data must never enter the DEMAND dashboard.
      shoppingAgeSnapshots: {
        where: { source: searchTrendConfig.shoppingSource, dataMode: "real" },
        orderBy: { period: "asc" }
      }
    }
  });

  return keywords
    .map((keyword) => {
      const byAge = Object.fromEntries(
        (searchTrendConfig.shoppingAgeGroups as readonly DemandAgeGroup[]).map((ageGroup) => [
          ageGroup,
          demandAgePoint(keyword.shoppingAgeSnapshots.filter((snapshot) => snapshot.ageGroup === ageGroup))
        ])
      ) as Record<DemandAgeGroup, DemandAgePoint>;
      const latestPeriod = keyword.shoppingAgeSnapshots.reduce<Date | null>(
        (latest, snapshot) => (!latest || snapshot.period > latest ? snapshot.period : latest),
        null
      );
      const sampleWeeks = new Set(keyword.shoppingAgeSnapshots.map((snapshot) => snapshot.period.toISOString())).size;

      return {
        specificItem: keyword.specificItem!,
        planningGender: keyword.planningGender as "UNISEX" | "WOMEN" | null,
        keywordName: keyword.name,
        keywordAliases: parseAliases(keyword.aliases),
        byAge,
        observation: classifyDemandObservation(byAge),
        latestPeriod,
        sampleWeeks
      };
    })
    .filter((row) => row.sampleWeeks > 0)
    .sort((a, b) => (maxChange7d(b) ?? -999) - (maxChange7d(a) ?? -999));
}

export async function getDemandDataQuality() {
  const credentialStatus = getNaverCredentialStatus();
  const [realSnapshotCount, mockSnapshotCount, specificItemKeywords, dateRange, recentErrors] = await Promise.all([
    prisma.keywordShoppingAgeSnapshot.count({ where: { source: searchTrendConfig.shoppingSource, dataMode: "real" } }),
    prisma.keywordShoppingAgeSnapshot.count({ where: { source: searchTrendConfig.shoppingSource, dataMode: "mock" } }),
    prisma.trendKeyword.count({ where: { specificItem: { not: null }, active: true } }),
    prisma.keywordShoppingAgeSnapshot.aggregate({
      where: { source: searchTrendConfig.shoppingSource, dataMode: "real" },
      _min: { period: true },
      _max: { period: true }
    }),
    prisma.collectionError.findMany({
      where: { source: searchTrendConfig.shoppingSource },
      orderBy: { timestamp: "desc" },
      take: 10
    })
  ]);

  return {
    credentialStatus,
    realSnapshotCount,
    mockSnapshotCount,
    specificItemKeywords,
    dateRange: { start: dateRange._min.period, end: dateRange._max.period },
    recentErrors: recentErrors.map((error) => ({ keyword: error.externalId, reason: error.reason, timestamp: error.timestamp }))
  };
}

// Only compares points within the SAME weekly series for the SAME keyword
// and age group - i.e. the same single API response's normalization
// context. Never compares across separately-requested series/age groups.
function demandAgePoint(snapshots: { period: Date; ratio: number }[]): DemandAgePoint {
  const series = [...snapshots].sort((a, b) => a.period.getTime() - b.period.getTime());
  const current = series.at(-1)?.ratio ?? null;
  const previous7d = series.at(-2)?.ratio ?? null; // 1 week back (weekly series)
  const previous14d = series.at(-3)?.ratio ?? null; // 2 weeks back
  return {
    current,
    change7d: pointChange(current, previous7d),
    change14d: pointChange(current, previous14d)
  };
}

function pointChange(current: number | null, previous: number | null) {
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 10) / 10;
}

// Conservative wording only - never "수요 폭발"/"판매 급증". Uses whichever
// age group has the clearest signal; if both are inconclusive, reports data
// shortage honestly instead of guessing.
function classifyDemandObservation(byAge: Record<DemandAgeGroup, DemandAgePoint>): DemandObservation {
  const points = Object.values(byAge);
  if (points.every((point) => point.current == null)) return "데이터 부족";
  const anyNewlyObserved = points.some((point) => point.current != null && point.change7d == null && point.change14d == null);
  const change = maxAbsChange(points);
  if (change == null) return anyNewlyObserved ? "신규 관심 관측" : "데이터 부족";
  if (change >= demandSignalConfig.changeThresholdPt) return "관심 증가";
  if (change <= -demandSignalConfig.changeThresholdPt) return "관심 감소";
  return "관심 유지";
}

function maxAbsChange(points: DemandAgePoint[]) {
  const values = points.map((point) => point.change7d).filter((value): value is number => value != null);
  if (values.length === 0) return null;
  return values.reduce((max, value) => (Math.abs(value) > Math.abs(max) ? value : max), values[0]!);
}

function maxChange7d(row: { byAge: Record<DemandAgeGroup, DemandAgePoint> }) {
  const values = Object.values(row.byAge)
    .map((point) => point.change7d)
    .filter((value): value is number => value != null);
  return values.length ? Math.max(...values) : null;
}

function parseAliases(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0);
}
