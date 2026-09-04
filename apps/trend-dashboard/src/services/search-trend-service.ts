import { prisma } from "@/db/client";
import { searchTrendConfig } from "@/lib/search-trend-config";
import {
  classifyDataQuality,
  classifyPlanningTrendType,
  combinedTrendSignal,
  maxNullable,
  percentChange,
  targetAgeSignal
} from "@/lib/search-trend-signals";
import type { KeywordTrendRow, SearchMomentum, SearchTrendAgeGroup, ShoppingAgeSignal, ShoppingInsightAgeGroup } from "@/types/search-trend";

export async function getSearchTrendRows(options: { includeInactive?: boolean } = {}): Promise<KeywordTrendRow[]> {
  const keywords = await prisma.trendKeyword.findMany({
    where: options.includeInactive ? undefined : { active: true },
    include: {
      snapshots: {
        where: { source: searchTrendConfig.source },
        orderBy: { period: "asc" }
      },
      shoppingAgeSnapshots: {
        where: { source: searchTrendConfig.shoppingSource },
        orderBy: { period: "asc" }
      }
    },
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });

  return keywords.map((keyword) => {
    const searchMomentumByAge = Object.fromEntries(
      searchTrendConfig.collectionAgeGroups.map((ageGroup) => [
        ageGroup,
        momentumForSeries(keyword.snapshots.filter((snapshot) => snapshot.ageGroup === ageGroup))
      ])
    ) as Record<SearchTrendAgeGroup, SearchMomentum>;
    const shoppingByAge = Object.fromEntries(
      searchTrendConfig.shoppingAgeGroups.map((ageGroup) => [
        ageGroup,
        shoppingForSeries(keyword.shoppingAgeSnapshots.filter((snapshot) => snapshot.ageGroup === ageGroup))
      ])
    ) as Record<ShoppingInsightAgeGroup, ShoppingAgeSignal>;
    const currentByAge = Object.fromEntries(
      searchTrendConfig.collectionAgeGroups.map((ageGroup) => [ageGroup, searchMomentumByAge[ageGroup].current])
    ) as Record<SearchTrendAgeGroup, number | null>;
    const strongestMomentumAge = strongestAgeByChange4w(searchMomentumByAge);
    const maxSearchChange1w = maxNullable(searchTrendConfig.ageGroups.map((ageGroup) => searchMomentumByAge[ageGroup].change1w));
    const maxSearchChange4w = maxNullable(searchTrendConfig.ageGroups.map((ageGroup) => searchMomentumByAge[ageGroup].change4w));
    const maxShoppingRatio = maxNullable(searchTrendConfig.shoppingAgeGroups.map((ageGroup) => shoppingByAge[ageGroup].current));
    const allSearchSeries = keyword.snapshots.filter((snapshot) => snapshot.ageGroup === "ALL").sort((a, b) => a.period.getTime() - b.period.getTime());
    const fallbackSeries = keyword.snapshots.filter((snapshot) => snapshot.ageGroup === "13-18").sort((a, b) => a.period.getTime() - b.period.getTime());
    const seasonalitySeries = allSearchSeries.length > 0 ? allSearchSeries : fallbackSeries;
    const yoyChange = percentChange(seasonalitySeries.at(-1)?.ratio ?? null, seasonalitySeries.at(-53)?.ratio ?? null);
    const seasonality = seasonalityFor(seasonalitySeries);
    const signal = combinedTrendSignal({ maxSearchChange1w, maxSearchChange4w, maxShoppingRatio });

    return {
      id: keyword.id,
      name: keyword.name,
      category: keyword.category,
      aliases: parseAliases(keyword.aliases),
      shoppingKeyword: keyword.shoppingKeyword,
      naverShoppingCategory: keyword.naverShoppingCategory,
      active: keyword.active,
      source: searchTrendConfig.source,
      metric: searchTrendConfig.metric,
      currentByAge,
      searchMomentumByAge,
      shoppingByAge,
      change1w: maxSearchChange1w,
      change4w: maxSearchChange4w,
      change12w: maxNullable(searchTrendConfig.ageGroups.map((ageGroup) => searchMomentumByAge[ageGroup].change12w)),
      yoyChange,
      signal,
      trendType: classifyPlanningTrendType({
        signal,
        maxSearchChange1w,
        maxSearchChange4w,
        maxShoppingRatio,
        yoyChange,
        currentVsPeak: seasonality.currentVsPeak
      }),
      targetAgeSignal: targetAgeSignal({
        teenSearchChange4w: searchMomentumByAge["13-18"].change4w,
        twentiesSearchChange4w: maxNullable([searchMomentumByAge["19-24"].change4w, searchMomentumByAge["25-29"].change4w]),
        teenShoppingRatio: shoppingByAge["10-19"].current,
        twentiesShoppingRatio: shoppingByAge["20-29"].current
      }),
      strongestMomentumAge,
      searchDataQuality: classifyDataQuality({
        expectedPeriods: 104,
        actualPeriods: seasonalitySeries.length,
        averageRatio: average(seasonalitySeries.map((snapshot) => snapshot.ratio))
      }),
      shoppingDataQuality: classifyDataQuality({
        expectedPeriods: 104 * 2,
        actualPeriods: keyword.shoppingAgeSnapshots.length,
        averageRatio: average(keyword.shoppingAgeSnapshots.map((snapshot) => snapshot.ratio))
      }),
      peakMonth: seasonality.peakMonth,
      currentVsPeak: seasonality.currentVsPeak,
      lastYearPeak: seasonality.lastYearPeak,
      updatedAt: latestCollectedAt([...keyword.snapshots, ...keyword.shoppingAgeSnapshots])
    };
  });
}

export async function getSearchTrendDashboardData() {
  const rows = await getSearchTrendRows();
  const [latestSearchRun, latestShoppingRun, historyWeeks] = await Promise.all([
    prisma.collectionRun.findFirst({ where: { source: searchTrendConfig.source }, orderBy: { startedAt: "desc" } }),
    prisma.collectionRun.findFirst({ where: { source: searchTrendConfig.shoppingSource }, orderBy: { startedAt: "desc" } }),
    inferHistoryWeeks()
  ]);
  const updatedAt = rows.reduce<Date | null>((latest, row) => {
    if (!row.updatedAt) return latest;
    return !latest || row.updatedAt > latest ? row.updatedAt : latest;
  }, null);

  return {
    summary: {
      hot: rows.filter((row) => row.signal === "HOT").length,
      rising: rows.filter((row) => row.signal === "RISING" || row.signal === "NEW_SIGNAL").length,
      cooling: rows.filter((row) => row.signal === "COOLING").length,
      updatedAt,
      latestRun: latestSearchRun,
      latestShoppingRun,
      historyWeeks
    },
    rows: [...rows].sort((a, b) => (b.change4w ?? -999) - (a.change4w ?? -999)).slice(0, 10),
    planningSummary: buildPlanningSummary(rows),
    sections: buildPlanningSections(rows)
  };
}

export async function getKeywordTrendDetail(id: string) {
  const keyword = await prisma.trendKeyword.findUnique({
    where: { id },
    include: {
      snapshots: { where: { source: searchTrendConfig.source }, orderBy: { period: "asc" } },
      shoppingAgeSnapshots: { where: { source: searchTrendConfig.shoppingSource }, orderBy: { period: "asc" } }
    }
  });
  if (!keyword) return null;

  const rows = await getSearchTrendRows();
  const row = rows.find((item) => item.id === id);
  if (!row) return null;

  return {
    keyword,
    row,
    historyByAge: Object.fromEntries(
      searchTrendConfig.ageGroups.map((ageGroup) => [
        ageGroup,
        keyword.snapshots
          .filter((snapshot) => snapshot.ageGroup === ageGroup)
          .slice(-104)
          .map((snapshot) => ({ period: snapshot.period, ratio: snapshot.ratio }))
      ])
    ) as Record<SearchTrendAgeGroup, { period: Date; ratio: number }[]>,
    shoppingHistoryByAge: Object.fromEntries(
      searchTrendConfig.shoppingAgeGroups.map((ageGroup) => [
        ageGroup,
        keyword.shoppingAgeSnapshots
          .filter((snapshot) => snapshot.ageGroup === ageGroup)
          .slice(-104)
          .map((snapshot) => ({ period: snapshot.period, ratio: snapshot.ratio }))
      ])
    ) as Record<ShoppingInsightAgeGroup, { period: Date; ratio: number }[]>
  };
}

export async function getKeywordQualityRows() {
  return getSearchTrendRows({ includeInactive: true });
}

function momentumForSeries(snapshots: { period: Date; ratio: number }[]): SearchMomentum {
  const series = [...snapshots].sort((a, b) => a.period.getTime() - b.period.getTime());
  const current = series.at(-1)?.ratio ?? null;
  return {
    current,
    change1w: percentChange(current, series.at(-2)?.ratio ?? null),
    change4w: percentChange(current, series.at(-5)?.ratio ?? null),
    change12w: percentChange(current, series.at(-12)?.ratio ?? null)
  };
}

function shoppingForSeries(snapshots: { period: Date; ratio: number }[]): ShoppingAgeSignal {
  const series = [...snapshots].sort((a, b) => a.period.getTime() - b.period.getTime());
  const current = series.at(-1)?.ratio ?? null;
  return {
    current,
    change1w: percentChange(current, series.at(-2)?.ratio ?? null),
    change4w: percentChange(current, series.at(-5)?.ratio ?? null)
  };
}

function latestCollectedAt(snapshots: { collectedAt: Date }[]) {
  return snapshots.reduce<Date | null>((latest, snapshot) => (!latest || snapshot.collectedAt > latest ? snapshot.collectedAt : latest), null);
}

function strongestAgeByChange4w(momentumByAge: Record<SearchTrendAgeGroup, SearchMomentum>) {
  return searchTrendConfig.ageGroups.reduce<SearchTrendAgeGroup | null>((strongest, ageGroup) => {
    const value = momentumByAge[ageGroup].change4w;
    if (value == null) return strongest;
    if (!strongest || value > (momentumByAge[strongest].change4w ?? -Infinity)) return ageGroup;
    return strongest;
  }, null);
}

function buildPlanningSummary(rows: KeywordTrendRow[]) {
  const sections = buildPlanningSections(rows);
  return [
    "THIS WEEK",
    "",
    "EMERGING NOW",
    ...formatKeywordList(sections.emergingNow),
    "",
    "TEEN HOT",
    ...formatKeywordList(sections.teenHot),
    "",
    "20S HOT",
    ...formatKeywordList(sections.twentiesHot),
    "",
    "CROSS AGE",
    ...formatKeywordList(sections.crossAge),
    "",
    "COOLING",
    ...formatKeywordList(sections.cooling)
  ].join("\n");
}

function buildPlanningSections(rows: KeywordTrendRow[]) {
  const byMomentum = [...rows].sort((a, b) => (b.change4w ?? -999) - (a.change4w ?? -999));
  return {
    emergingNow: byMomentum.filter((row) => row.trendType === "EMERGING" || row.trendType === "WATCH").slice(0, 5),
    teenHot: byMomentum.filter((row) => row.trendType !== "COOLING" && (row.targetAgeSignal === "TEEN" || row.targetAgeSignal === "TEEN + 20S")).slice(0, 5),
    twentiesHot: byMomentum.filter((row) => row.trendType !== "COOLING" && (row.targetAgeSignal === "20S" || row.targetAgeSignal === "TEEN + 20S")).slice(0, 5),
    crossAge: byMomentum.filter((row) => row.targetAgeSignal === "TEEN + 20S").slice(0, 5),
    cooling: [...rows]
      .sort((a, b) => (a.change1w ?? 999) - (b.change1w ?? 999))
      .filter((row) => row.trendType === "COOLING" || row.signal === "COOLING")
      .slice(0, 5)
  };
}

function formatKeywordList(rows: KeywordTrendRow[]) {
  return rows.length > 0 ? rows.map((row) => `- ${row.name}`) : ["- 데이터 부족"];
}

function parseAliases(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function seasonalityFor(series: { period: Date; ratio: number }[]) {
  if (series.length === 0) return { peakMonth: null, currentVsPeak: null, lastYearPeak: null };
  const peak = [...series].sort((a, b) => b.ratio - a.ratio)[0]!;
  const current = series.at(-1)!;
  const lastYear = series.filter((point) => point.period.getUTCFullYear() === current.period.getUTCFullYear() - 1);
  const lastYearPeak = [...lastYear].sort((a, b) => b.ratio - a.ratio)[0];
  return {
    peakMonth: `${peak.period.getUTCMonth() + 1}월`,
    currentVsPeak: peak.ratio === 0 ? null : (current.ratio / peak.ratio) * 100,
    lastYearPeak: lastYearPeak ? lastYearPeak.period.toISOString().slice(0, 7) : null
  };
}

async function inferHistoryWeeks() {
  const grouped = await prisma.keywordTrendSnapshot.groupBy({
    by: ["keywordId"],
    where: {
      source: searchTrendConfig.source,
      ageGroup: "ALL"
    },
    _count: { period: true }
  });
  return Math.max(0, ...grouped.map((row) => row._count.period));
}
