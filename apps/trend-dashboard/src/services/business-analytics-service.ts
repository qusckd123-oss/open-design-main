import { businessSignalConfig } from "@/config/business-signal";
import { featureFlags } from "@/config/feature-flags";
import { itemTypeLabel, subItemTypeLabel } from "@/config/item-types";
import { marketSourceAudit } from "@/config/market-source-audit";
import { marketSources } from "@/config/market-sources";
import { categoryOfSpecificItem } from "@/config/taxonomy";
import { prisma } from "@/db/client";
import type { ItemSignal, ItemTrendRow, MarketMetricType, MarketRow, MarketSignal, RankingScope, SalesRow, SalesSignal, SignalConfidence } from "@/types/business";

type SalesFilters = { q?: string; category?: string; season?: string; signal?: string; sort?: string };
type MarketFilters = { q?: string; source?: string; category?: string; signal?: string; sort?: string; dataMode?: "real" | "sample" | "import" | "auto" };

export async function getSalesRows(filters: SalesFilters = {}) {
  const products = await prisma.internalProduct.findMany({
    include: { salesSnapshots: { orderBy: { periodDate: "asc" } } },
    orderBy: [{ category: "asc" }, { productCode: "asc" }]
  });
  let rows = products.map(toSalesRow).filter((row) => row.salesQty != null || row.change1w != null);
  if (filters.q) {
    const query = filters.q.toLowerCase();
    rows = rows.filter((row) => `${row.productCode} ${row.productName} ${row.brand ?? ""}`.toLowerCase().includes(query));
  }
  if (filters.category) rows = rows.filter((row) => row.category === filters.category);
  if (filters.season) rows = rows.filter((row) => row.season === filters.season);
  if (filters.signal) rows = rows.filter((row) => row.signal === filters.signal);
  rows = sortSalesRows(rows, filters.sort);
  return {
    rows,
    facets: {
      categories: unique(rows.map((row) => row.category).filter(Boolean)),
      seasons: unique(rows.map((row) => row.season).filter(Boolean)),
      signals: unique(rows.map((row) => row.signal))
    }
  };
}

export async function getMarketRows(filters: MarketFilters = {}) {
  const dataMode = filters.dataMode === "auto" || !filters.dataMode ? await getPreferredMarketDataMode() : filters.dataMode;
  const products = await prisma.marketProduct.findMany({
    where: { dataMode },
    include: { rankingSnapshots: { orderBy: { periodDate: "asc" } } },
    orderBy: [{ source: "asc" }, { brand: "asc" }]
  });
  let rows = applyMarketPresenceStatuses(products.flatMap((product) => {
    const snapshotGroups = groupSnapshots(product.rankingSnapshots);
    return snapshotGroups.map((snapshots) =>
      toMarketRow({
        ...product,
        id: `${product.id}:${snapshots[0]?.rankingScope ?? "UNKNOWN"}:${snapshots[0]?.rankingCategory ?? "ALL"}:${snapshots[0]?.observedCategory ?? "ALL"}:${snapshots[0]?.audienceSegment ?? "ALL"}`,
        rankingSnapshots: snapshots
      })
    );
  }).filter((row) => row.rank != null || row.sourcePosition != null || row.change1w != null));
  if (filters.q) {
    const query = filters.q.toLowerCase();
    rows = rows.filter((row) => `${row.brand} ${row.name} ${row.externalProductId} ${row.subItemType ?? ""}`.toLowerCase().includes(query));
  }
  if (filters.source) rows = rows.filter((row) => row.source === filters.source);
  if (filters.category) rows = rows.filter((row) => row.category === filters.category);
  if (filters.signal) rows = rows.filter((row) => row.signal === filters.signal);
  rows = sortMarketRows(rows, filters.sort);
  return {
    rows,
    facets: {
      sources: marketSources,
      categories: unique(rows.map((row) => row.category).filter(Boolean)),
      signals: unique(rows.map((row) => row.signal))
    },
    dataMode
  };
}

export async function getPreferredMarketDataMode() {
  const realCount = await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } });
  return realCount > 0 ? "real" : "sample";
}

export async function getItemTrendRows(dataMode?: "real" | "sample" | "import" | "auto") {
  const market = await getMarketRows({ dataMode: dataMode ?? "auto" });
  const keys = unique(market.rows.map((row) => itemKey(row)));
  return keys
    .map((key) => {
      const marketRows = market.rows.filter((row) => itemKey(row) === key);
      const currentCount = marketRows.length;
      const sources = unique(marketRows.map((row) => row.source));
      const itemType = marketRows[0]?.itemType ?? "OTHER";
      const subItemType = marketRows[0]?.subItemType ?? null;
      const isSpecific = Boolean(subItemType && subItemType !== "OTHER");
      const category = categoryOfSpecificItem(subItemType, itemType);
      const rankingRows = marketRows.filter((row) => row.rankingVerified);
      const assortmentRows = marketRows.filter((row) => !row.rankingVerified);
      const rankingScopeKeys = unique(rankingRows.map((row) => `${row.source}:${row.rankingScope}:${row.rankingCategory ?? "ALL"}`));
      const countChange1w = productCountChange(marketRows, 1);
      const countChange4w = productCountChange(marketRows, 4);
      const item: ItemTrendRow = {
        itemType,
        subItemType,
        category,
        isSpecific,
        label: subItemType && subItemType !== "OTHER" ? subItemTypeLabel(subItemType) : itemTypeLabel(itemType),
        marketStyleCount: currentCount,
        marketTopCount: rankingRows.filter((row) => (row.rank ?? 999) <= 100).length,
        top10Presence: rankingRows.filter((row) => (row.rank ?? 999) <= 10).length,
        top20Presence: rankingRows.filter((row) => (row.rank ?? 999) <= 20).length,
        top50Presence: rankingRows.filter((row) => (row.rank ?? 999) <= 50).length,
        sourceCount: sources.length,
        sources,
        rankingSourceCount: unique(rankingRows.map((row) => row.source)).length,
        assortmentSourceCount: unique(assortmentRows.map((row) => row.source)).length,
        currentCount,
        newlyAddedCount: marketRows.filter((row) => row.presenceStatus === "NEWLY_ADDED").length,
        removedCount: marketRows.filter((row) => row.presenceStatus === "REMOVED").length,
        countChange1w,
        countChange4w,
        marketChange1w: maxNullable(rankingRows.map((row) => row.change1w)),
        marketChange2w: maxNullable(rankingRows.map((row) => row.change2w)),
        marketChange4w: maxNullable(rankingRows.map((row) => row.change4w)),
        averageRank: rankingScopeKeys.length === 1 ? averageNullable(rankingRows.map((row) => row.rank)) : null,
        bestRank: rankingScopeKeys.length === 1 ? minNullable(rankingRows.map((row) => row.bestRank)) : null,
        avgMarketPrice: averageNullable(marketRows.map((row) => row.salePrice)),
        signalConfidence: signalConfidence(maxNullable(marketRows.map((row) => row.weeksInRanking)) ?? 0),
        rankingSignal: rankingRows.length > 0 ? "INSUFFICIENT_DATA" : "NO_VERIFIED_RANKING",
        assortmentSignal: "INSUFFICIENT_DATA",
        signal: "INSUFFICIENT_DATA"
      };
      item.rankingSignal = classifyRankingItemSignal(item);
      item.assortmentSignal = classifyAssortmentItemSignal(item);
      item.signal = item.rankingSignal !== "NO_VERIFIED_RANKING" && item.rankingSignal !== "INSUFFICIENT_DATA" ? item.rankingSignal : item.assortmentSignal;
      return item;
    })
    .sort((a, b) => signalPriority(b.signal) - signalPriority(a.signal) || (b.marketChange4w ?? -999) - (a.marketChange4w ?? -999));
}

export async function getItemTrendDetail(itemKeyValue: string) {
  const dataMode = await getPreferredMarketDataMode();
  const [items, market] = await Promise.all([getItemTrendRows(dataMode), getMarketRows({ dataMode })]);
  const decoded = decodeURIComponent(itemKeyValue);
  const item = items.find((row) => row.subItemType === decoded || row.itemType === decoded);
  if (!item) return null;
  const selectedKey = item.subItemType ?? item.itemType;
  const rows = market.rows.filter((row) => itemKey(row) === selectedKey);
  return {
    item,
    products: rows.sort((a, b) => (b.change4w ?? -999) - (a.change4w ?? -999)).slice(0, 30),
    sourceSummary: aggregateRows(rows, "source"),
    brandSummary: aggregateRows(rows, "brand"),
    colorSummary: aggregateRows(rows, "mainColor"),
    fitSummary: aggregateRows(rows, "fit"),
    graphicSummary: aggregateRows(rows, "graphicType"),
    detailSummary: aggregateRows(rows, "detail")
  };
}

export async function getBusinessDashboardData() {
  const dataMode = await getPreferredMarketDataMode();
  const [market, items, latestMarketImport, sourceFreshness, verifiedSourceFreshness] = await Promise.all([
    getMarketRows({ dataMode }),
    getItemTrendRows(dataMode),
    prisma.importRun.findFirst({ where: { type: "MARKET", dataMode }, orderBy: { startedAt: "desc" } }),
    getSourceFreshness(dataMode),
    getSourceFreshness(dataMode, true)
  ]);
  const rankingRows = market.rows.filter((row) => row.rankingVerified);
  const assortmentRows = market.rows.filter((row) => !row.rankingVerified);
  const fastRising = rankingRows.filter((row) => row.signal === "FAST_RISING" || row.signal === "HOT").slice(0, 10);
  const newEntries = rankingRows.filter((row) => row.signal === "NEW_ENTRY").slice(0, 10);
  const hotProducts = rankingRows.filter((row) => row.signal === "HOT" || (row.rank ?? 999) <= businessSignalConfig.marketHotRank).slice(0, 10);
  const coolingProducts = rankingRows.filter((row) => row.signal === "COOLING" || row.signal === "DROPPING").slice(0, 10);
  const assortmentNew = assortmentRows.filter((row) => row.presenceStatus === "NEWLY_ADDED").slice(0, 10);
  const assortmentPresence = assortmentRows.sort((a, b) => (a.sourcePosition ?? 9999) - (b.sourcePosition ?? 9999)).slice(0, 10);

  return {
    summary: {
      marketProducts: market.rows.length,
      sources: unique(market.rows.map((row) => row.source)).length,
      fastRising: fastRising.length,
      newEntries: newEntries.length,
      verifiedRankingSources: unique(rankingRows.map((row) => row.source)).length,
      verifiedRankingHistoryDays: unique(rankingRows.flatMap((row) => row.latestSeen ? [row.latestSeen.toISOString().slice(0, 10)] : [])).length,
      signalConfidence: signalConfidence(maxNullable(rankingRows.map((row) => row.weeksInRanking)) ?? 0),
      assortmentSources: unique(assortmentRows.map((row) => row.source)).length,
      assortmentProducts: assortmentRows.length,
      latestMarketImport,
      dataMode,
      realAvailable: dataMode === "real",
      naverEnabled: featureFlags.enableNaverTrends,
      salesEnabled: featureFlags.enableInternalSales
    },
    fastRising,
    newEntries,
    hotProducts,
    coolingProducts,
    assortmentNew,
    assortmentPresence,
    crossMarket: items.filter((row) => row.rankingSignal === "TREND_CONFIRMED" || row.assortmentSignal === "CROSS_SOURCE_PRESENCE").slice(0, 8),
    earlyOpportunity: items.filter((row) => row.rankingSignal === "HIGH_OPPORTUNITY" || row.rankingSignal === "EARLY_SIGNAL").slice(0, 8),
    trendConfirmed: items.filter((row) => row.rankingSignal === "TREND_CONFIRMED" || row.rankingSignal === "SATURATED").slice(0, 8),
    itemTrends: items.slice(0, 16),
    attributeTrends: await getMarketAttributeTrends(),
    sourceFreshness,
    verifiedSourceFreshness,
    sourceAudit: marketSourceAudit
  };
}

export async function getImportRuns() {
  return prisma.importRun.findMany({
    include: { errors: { take: 20, orderBy: { rowNumber: "asc" } } },
    orderBy: { startedAt: "desc" },
    take: 20
  });
}

export async function getSourceFreshness(dataMode?: string, verifiedOnly = false) {
  const grouped = await prisma.marketRankingSnapshot.groupBy({
    by: ["source"],
    where: { ...(dataMode ? { dataMode } : {}), ...(verifiedOnly ? { rankingVerified: true } : {}) },
    _max: { periodDate: true },
    _count: { id: true }
  });
  const now = new Date();
  return grouped.map((row) => {
    const updatedAt = row._max.periodDate;
    const ageDays = updatedAt ? Math.floor((now.getTime() - updatedAt.getTime()) / 86400000) : null;
    return {
      source: row.source,
      updatedAt,
      ageDays,
      productCount: row._count.id,
      stale: ageDays != null && ageDays > businessSignalConfig.staleDays
    };
  });
}

export function toSalesRow(product: {
  id: string;
  productCode: string;
  productName: string;
  brand: string | null;
  category: string | null;
  season: string | null;
  imageUrl: string | null;
  itemType: string | null;
  subItemType: string | null;
  dataMode: string;
  salesSnapshots: Array<{ periodDate: Date; salesQty: number | null; salesAmount: number | null; stockQty: number | null; sellThroughRate: number | null; normalSalesRate: number | null; discountRate: number | null; onlineSalesQty: number | null; storeSalesQty: number | null }>;
}): SalesRow {
  const snapshots = [...product.salesSnapshots].sort((a, b) => a.periodDate.getTime() - b.periodDate.getTime());
  const current = snapshots.at(-1);
  const change1w = percentChange(current?.salesQty ?? null, snapshots.at(-2)?.salesQty ?? null);
  const change4w = percentChange(current?.salesQty ?? null, snapshots.at(-5)?.salesQty ?? null);
  return {
    id: product.id,
    productCode: product.productCode,
    productName: product.productName,
    brand: product.brand,
    category: product.category,
    season: product.season,
    imageUrl: product.imageUrl,
    itemType: product.itemType,
    subItemType: product.subItemType,
    salesQty: current?.salesQty ?? null,
    salesAmount: current?.salesAmount ?? null,
    stockQty: current?.stockQty ?? null,
    sellThroughRate: current?.sellThroughRate ?? null,
    normalSalesRate: current?.normalSalesRate ?? null,
    discountRate: current?.discountRate ?? null,
    onlineSalesQty: current?.onlineSalesQty ?? null,
    storeSalesQty: current?.storeSalesQty ?? null,
    change1w,
    change4w,
    signal: classifySalesSignal({ salesQty: current?.salesQty ?? null, stockQty: current?.stockQty ?? null, sellThroughRate: current?.sellThroughRate ?? null, change1w }),
    dataMode: product.dataMode
  };
}

export function toMarketRow(product: {
  id: string;
  source: string;
  externalProductId: string;
  brand: string;
  name: string;
  category: string | null;
  url: string | null;
  imageUrl: string | null;
  itemType: string | null;
  subItemType: string | null;
  fit: string | null;
  mainColor: string | null;
  subColor: string | null;
  material: string | null;
  graphicType: string | null;
  detail: string | null;
  style: string | null;
  gender: string | null;
  dataMode: string;
  createdAt: Date;
  rankingSnapshots: Array<{ periodDate: Date; rankingScope?: string | null; rankingCategory?: string | null; observedCategory?: string | null; audienceSegment?: string | null; metricType?: string | null; rankingVerified?: boolean | null; sourcePosition?: number | null; rank: number | null; price: number | null; salePrice: number | null; discountRate: number | null; reviewCount: number | null; likeCount: number | null }>;
}): MarketRow {
  const snapshots = [...product.rankingSnapshots].sort((a, b) => a.periodDate.getTime() - b.periodDate.getTime());
  const current = snapshots.at(-1);
  const rankingVerified = Boolean(current?.rankingVerified);
  const metricType = normalizeMetricType(current?.metricType);
  const rankingScope = normalizeRankingScope(current?.rankingScope);
  const rankSnapshots = rankingVerified ? snapshots.filter((snapshot) => snapshot.rankingVerified && snapshot.rank != null) : [];
  const change1d = rankingVerified ? rankChangeByDays(current ?? null, rankSnapshots, 1) : null;
  const change3d = rankingVerified ? rankChangeByDays(current ?? null, rankSnapshots, 3) : null;
  const change7d = rankingVerified ? rankChangeByDays(current ?? null, rankSnapshots, 7) : null;
  const ranks = rankSnapshots.map((snapshot) => snapshot.rank).filter((rank): rank is number => rank != null);
  const bestRank = rankingVerified ? minNullable(ranks) : null;
  const firstSeen = snapshots[0]?.periodDate ?? product.createdAt;
  const latestSeen = current?.periodDate ?? null;
  const isNewEntry = false;
  const presenceStatus = classifyPresenceStatus(snapshots.length);
  const confidence = signalConfidence(unique(snapshots.map((snapshot) => snapshot.periodDate.toISOString().slice(0, 10))).length);
  return {
    id: product.id,
    source: product.source,
    externalProductId: product.externalProductId,
    brand: product.brand,
    name: product.name,
    category: product.category,
    url: product.url,
    imageUrl: product.imageUrl,
    itemType: product.itemType,
    subItemType: product.subItemType,
    fit: product.fit,
    mainColor: product.mainColor,
    subColor: product.subColor,
    material: product.material,
    graphicType: product.graphicType,
    detail: product.detail,
    style: product.style,
    gender: product.gender,
    metricType,
    rankingVerified,
    rankingScope,
    sourcePosition: current?.sourcePosition ?? null,
    rank: rankingVerified ? current?.rank ?? null : null,
    rankingCategory: current?.rankingCategory ?? null,
    observedCategory: current?.observedCategory ?? current?.rankingCategory ?? null,
    audienceSegment: current?.audienceSegment ?? null,
    price: current?.price ?? null,
    salePrice: current?.salePrice ?? null,
    discountRate: current?.discountRate ?? null,
    reviewCount: current?.reviewCount ?? null,
    likeCount: current?.likeCount ?? null,
    change1w: change1d,
    change2w: change3d,
    change4w: change7d,
    change1d,
    change3d,
    change7d,
    consecutiveRise: rankingVerified ? consecutiveDirection(rankSnapshots, "rise") : 0,
    consecutiveFall: rankingVerified ? consecutiveDirection(rankSnapshots, "fall") : 0,
    firstSeen,
    latestSeen,
    peakRank: bestRank,
    bestRank,
    averageRank: rankingVerified ? averageNullable(ranks) : null,
    weeksInRanking: snapshots.length,
    weeksInTop100: rankingVerified ? rankSnapshots.filter((snapshot) => (snapshot.rank ?? 999) <= 100).length : 0,
    top20Weeks: rankingVerified ? rankSnapshots.filter((snapshot) => (snapshot.rank ?? 999) <= 20).length : 0,
    rankVolatility: rankingVerified ? standardDeviation(ranks) : null,
    isNewEntry,
    presenceStatus,
    signal: rankingVerified ? classifyMarketSignal({ rank: current?.rank ?? null, change1w: change1d, change2w: change3d, change4w: change7d, isNewEntry, consecutiveFall: consecutiveDirection(rankSnapshots, "fall") }) : presenceStatus,
    dataMode: product.dataMode,
    signalConfidence: confidence
  };
}

export function applyMarketPresenceStatuses(rows: MarketRow[]) {
  const latestByGroup = new Map<string, Date>();
  const periodsByGroup = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.latestSeen) continue;
    const key = presenceGroupKey(row);
    const currentLatest = latestByGroup.get(key);
    if (!currentLatest || row.latestSeen > currentLatest) latestByGroup.set(key, row.latestSeen);
    const periods = periodsByGroup.get(key) ?? new Set<string>();
    periods.add(row.latestSeen.toISOString().slice(0, 10));
    periodsByGroup.set(key, periods);
  }

  return rows.map((row) => {
    const groupKey = presenceGroupKey(row);
    const latest = latestByGroup.get(groupKey);
    const hasHistory = (periodsByGroup.get(groupKey)?.size ?? 0) > 1;
    if (row.rankingVerified) {
      const isNewEntry = Boolean(hasHistory && row.weeksInRanking <= 1 && row.firstSeen && latest && sameDay(row.firstSeen, latest));
      return {
        ...row,
        isNewEntry,
        signal: isNewEntry ? "NEW_ENTRY" : row.signal
      };
    }
    if (!row.latestSeen) return row;
    let presenceStatus = row.presenceStatus;
    if (latest && !sameDay(row.latestSeen, latest)) presenceStatus = "REMOVED";
    else if (hasHistory && row.weeksInRanking <= 1 && row.firstSeen && latest && sameDay(row.firstSeen, latest)) presenceStatus = "NEWLY_ADDED";
    else if (hasHistory) presenceStatus = "STILL_PRESENT";
    else presenceStatus = "BASELINE_COLLECTED";
    return {
      ...row,
      presenceStatus,
      signal: presenceStatus
    };
  });
}

export function percentChange(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function rankChange(current: number | null, previous: number | null) {
  if (current == null || previous == null) return null;
  return previous - current;
}

export function classifySalesSignal(input: { salesQty: number | null; stockQty: number | null; sellThroughRate: number | null; change1w: number | null }): SalesSignal {
  if (input.salesQty == null && input.change1w == null) return "INSUFFICIENT_DATA";
  if ((input.salesQty ?? 0) >= businessSignalConfig.bestSellerSalesQty && (input.stockQty ?? Infinity) <= businessSignalConfig.stockRiskStockQty) return "STOCK_RISK";
  if ((input.stockQty ?? 0) >= businessSignalConfig.overstockStockQty && (input.sellThroughRate ?? 100) <= businessSignalConfig.overstockSellThrough) return "OVERSTOCK";
  if ((input.salesQty ?? 0) >= businessSignalConfig.bestSellerSalesQty && (input.sellThroughRate ?? 0) >= businessSignalConfig.strongSellThrough) return "BEST_SELLER";
  if ((input.change1w ?? 0) >= businessSignalConfig.risingSalesChange1w) return "RISING_SALES";
  if ((input.salesQty ?? 0) <= businessSignalConfig.slowSalesQty) return "SLOW";
  return "STEADY";
}

export function classifyMarketSignal(input: { rank: number | null; change1w: number | null; change2w?: number | null; change4w: number | null; isNewEntry: boolean; consecutiveFall?: number }): MarketSignal {
  if (input.rank == null) return "INSUFFICIENT_DATA";
  if (input.change1w == null && input.change2w == null && input.change4w == null) return "INSUFFICIENT_DATA";
  if (input.isNewEntry) return "NEW_ENTRY";
  if ((input.change2w ?? 0) >= businessSignalConfig.marketFastRisingChange2w || (input.change4w ?? 0) >= businessSignalConfig.marketRisingChange4w * 1.5) return "FAST_RISING";
  if (input.rank <= businessSignalConfig.marketHotRank && (input.change1w ?? 0) >= businessSignalConfig.marketRisingChange1w) return "HOT";
  if ((input.change1w ?? 0) >= businessSignalConfig.marketRisingChange1w || (input.change4w ?? 0) >= businessSignalConfig.marketRisingChange4w) return "RISING";
  if ((input.consecutiveFall ?? 0) >= 2) return "COOLING";
  if ((input.change4w ?? 0) <= businessSignalConfig.marketDroppingChange4w) return "DROPPING";
  return "STABLE";
}

export function classifyItemSignal(row: Pick<ItemTrendRow, "rankingSourceCount" | "currentCount" | "marketChange1w" | "marketChange2w" | "marketChange4w"> & Partial<ItemTrendRow>): ItemSignal {
  return classifyRankingItemSignal(row);
}

export function classifyRankingItemSignal(row: Pick<ItemTrendRow, "rankingSourceCount" | "currentCount" | "marketChange1w" | "marketChange2w" | "marketChange4w">): ItemSignal {
  if (row.rankingSourceCount === 0) return "NO_VERIFIED_RANKING";
  if (row.currentCount === 0) return "INSUFFICIENT_DATA";
  if (row.marketChange1w == null && row.marketChange2w == null && row.marketChange4w == null) return "INSUFFICIENT_DATA";
  if ((row.marketChange4w ?? 0) <= businessSignalConfig.coolingMarketChange) return "COOLING";
  if (row.rankingSourceCount >= businessSignalConfig.trendConfirmedSourceCount && row.currentCount >= businessSignalConfig.saturatedStyleCount && (row.marketChange4w ?? 0) <= businessSignalConfig.opportunityMarketChange4w) return "SATURATED";
  if (row.rankingSourceCount >= businessSignalConfig.trendConfirmedSourceCount && (row.marketChange4w ?? 0) >= businessSignalConfig.opportunityMarketChange4w && row.currentCount < businessSignalConfig.saturatedStyleCount) return "HIGH_OPPORTUNITY";
  if (row.rankingSourceCount >= businessSignalConfig.trendConfirmedSourceCount && (row.marketChange4w ?? 0) > 0) return "TREND_CONFIRMED";
  if (row.rankingSourceCount === 1 && ((row.marketChange2w ?? 0) >= businessSignalConfig.marketFastRisingChange2w || (row.marketChange4w ?? 0) >= businessSignalConfig.opportunityMarketChange4w)) return "EARLY_SIGNAL";
  return "STABLE";
}

export function classifyAssortmentItemSignal(row: Pick<ItemTrendRow, "assortmentSourceCount" | "sourceCount" | "currentCount" | "newlyAddedCount" | "countChange1w" | "countChange4w">): ItemSignal {
  if (row.assortmentSourceCount === 0 || row.currentCount === 0) return "INSUFFICIENT_DATA";
  if (row.newlyAddedCount > 0) return "NEW_ASSORTMENT_SIGNAL";
  if ((row.countChange1w ?? 0) > 0 || (row.countChange4w ?? 0) > 0) return "ASSORTMENT_RISING";
  if (row.sourceCount >= 2) return "CROSS_SOURCE_PRESENCE";
  return "STABLE";
}

async function getMarketAttributeTrends() {
  const dataMode = await getPreferredMarketDataMode();
  const products = await prisma.marketProduct.findMany({ where: { dataMode }, include: { rankingSnapshots: { orderBy: { periodDate: "asc" } } } });
  return {
    colors: aggregateMarketAttribute("mainColor", products),
    graphics: aggregateMarketAttribute("graphicType", products),
    fits: aggregateMarketAttribute("fit", products),
    details: aggregateMarketAttribute("detail", products),
    priceRanges: aggregatePriceRanges(products),
    brands: aggregateMarketAttribute("brand", products)
  };
}

function aggregateMarketAttribute(field: "mainColor" | "graphicType" | "fit" | "detail" | "brand", products: Array<Record<string, unknown> & { rankingSnapshots?: Array<{ periodDate: Date; rank: number | null }> }>) {
  const counts = new Map<string, { current: number; previous: number }>();
  const latest = latestPeriod(products.flatMap((product) => product.rankingSnapshots ?? []));
  const previous = latest ? addDays(latest, -7) : null;
  for (const product of products) {
    const key = String(product[field] ?? "").trim();
    if (!key) continue;
    const entry = counts.get(key) ?? { current: 0, previous: 0 };
    const periods = product.rankingSnapshots ?? [];
    if (periods.some((snapshot) => latest && sameDay(snapshot.periodDate, latest))) entry.current += 1;
    if (periods.some((snapshot) => previous && sameDay(snapshot.periodDate, previous))) entry.previous += 1;
    counts.set(key, entry);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, current: value.current, previous: value.previous, change: value.current - value.previous }))
    .sort((a, b) => b.current - a.current)
    .slice(0, 8);
}

function aggregateRows(rows: MarketRow[], field: "source" | "brand" | "mainColor" | "fit" | "graphicType" | "detail") {
  const counts = new Map<string, { count: number; avgRankValues: number[] }>();
  for (const row of rows) {
    const key = String(row[field] ?? "").trim();
    if (!key) continue;
    const entry = counts.get(key) ?? { count: 0, avgRankValues: [] };
    entry.count += 1;
    if (row.rank != null) entry.avgRankValues.push(row.rank);
    counts.set(key, entry);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, count: value.count, averageRank: averageNullable(value.avgRankValues) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function aggregatePriceRanges(products: Array<{ rankingSnapshots: Array<{ periodDate: Date; salePrice: number | null }> }>) {
  const ranges = [
    { name: "Under 39K", min: 0, max: 39000 },
    { name: "39K-59K", min: 39000, max: 59000 },
    { name: "59K-89K", min: 59000, max: 89000 },
    { name: "89K+", min: 89000, max: Infinity }
  ];
  return ranges.map((range) => {
    const current = products.filter((product) => {
      const price = product.rankingSnapshots.at(-1)?.salePrice ?? null;
      return price != null && price >= range.min && price < range.max;
    }).length;
    return { name: range.name, current, previous: 0, change: current };
  });
}

function groupSnapshots<T extends { rankingScope?: string | null; rankingCategory?: string | null; observedCategory?: string | null; audienceSegment?: string | null }>(snapshots: T[]) {
  const groups = new Map<string, T[]>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.rankingScope ?? "UNKNOWN"}:${snapshot.rankingCategory ?? "ALL"}:${snapshot.observedCategory ?? snapshot.rankingCategory ?? "ALL"}:${snapshot.audienceSegment ?? "ALL"}`;
    groups.set(key, [...(groups.get(key) ?? []), snapshot]);
  }
  return [...groups.values()];
}

function normalizeMetricType(value: string | null | undefined): MarketMetricType {
  if (value === "RANKING" || value === "BEST_SELLER" || value === "POPULAR" || value === "NEW_ARRIVAL" || value === "COLLECTION_ORDER" || value === "CATALOG" || value === "UNKNOWN") return value;
  return "UNKNOWN";
}

function normalizeRankingScope(value: string | null | undefined): RankingScope {
  if (value === "SITEWIDE" || value === "DEPARTMENT" || value === "CATEGORY" || value === "SUBCATEGORY" || value === "UNKNOWN") return value;
  return "UNKNOWN";
}

export function signalConfidence(snapshotDays: number): SignalConfidence {
  if (snapshotDays < businessSignalConfig.earlyDataSnapshotDays) return "BASELINE";
  if (snapshotDays < businessSignalConfig.activeSignalSnapshotDays) return "EARLY_DATA";
  return "ACTIVE_SIGNAL";
}

export function rankChangeByDays(current: { periodDate: Date; rank: number | null } | null, snapshots: Array<{ periodDate: Date; rank: number | null }>, daysBack: number) {
  if (!current || current.rank == null) return null;
  const target = addDays(current.periodDate, -daysBack);
  const previous = snapshots.find((snapshot) => snapshot.rank != null && sameDay(snapshot.periodDate, target));
  return rankChange(current.rank, previous?.rank ?? null);
}

function classifyPresenceStatus(snapshotCount: number): MarketRow["presenceStatus"] {
  if (snapshotCount <= 1) return "BASELINE_COLLECTED";
  return "STILL_PRESENT";
}

function productCountChange(rows: MarketRow[], weeksBack: number) {
  if (rows.every((row) => row.weeksInRanking < 2)) return null;
  const latest = latestPeriodFromRows(rows);
  if (!latest) return null;
  const previous = addDays(latest, -7 * weeksBack);
  const currentCount = rows.filter((row) => row.weeksInRanking > 0).length;
  const previousCount = rows.filter((row) => row.firstSeen && row.firstSeen <= previous).length;
  return currentCount - previousCount;
}

function itemKey(row: MarketRow) {
  return row.subItemType && row.subItemType !== "OTHER" ? row.subItemType : row.itemType ?? "OTHER";
}

function presenceGroupKey(row: MarketRow) {
  return `${row.source}:${row.rankingScope}:${row.rankingCategory ?? "ALL"}:${row.observedCategory ?? "ALL"}:${row.audienceSegment ?? "ALL"}:${row.metricType}`;
}

function sortSalesRows(rows: SalesRow[], sort = "salesQty") {
  return [...rows].sort((a, b) => {
    if (sort === "change1w") return (b.change1w ?? -999) - (a.change1w ?? -999);
    if (sort === "change4w") return (b.change4w ?? -999) - (a.change4w ?? -999);
    if (sort === "sellThrough") return (b.sellThroughRate ?? -1) - (a.sellThroughRate ?? -1);
    if (sort === "stock") return (b.stockQty ?? -1) - (a.stockQty ?? -1);
    return (b.salesQty ?? -1) - (a.salesQty ?? -1);
  });
}

function sortMarketRows(rows: MarketRow[], sort = "rank") {
  return [...rows].sort((a, b) => {
    if (sort === "change1w") return (b.change1w ?? -999) - (a.change1w ?? -999);
    if (sort === "change2w") return (b.change2w ?? -999) - (a.change2w ?? -999);
    if (sort === "change4w") return (b.change4w ?? -999) - (a.change4w ?? -999);
    if (sort === "reviews") return (b.reviewCount ?? -1) - (a.reviewCount ?? -1);
    if (sort === "price") return (b.salePrice ?? -1) - (a.salePrice ?? -1);
    return (a.rank ?? a.sourcePosition ?? 999999) - (b.rank ?? b.sourcePosition ?? 999999);
  });
}

function consecutiveDirection(snapshots: Array<{ rank: number | null }>, direction: "rise" | "fall") {
  let count = 0;
  for (let index = snapshots.length - 1; index > 0; index -= 1) {
    const current = snapshots[index]?.rank;
    const previous = snapshots[index - 1]?.rank;
    if (current == null || previous == null) break;
    const rising = current < previous;
    if ((direction === "rise" && rising) || (direction === "fall" && !rising && current > previous)) count += 1;
    else break;
  }
  return count;
}

function latestPeriod(snapshots: Array<{ periodDate: Date }>) {
  return snapshots.reduce<Date | null>((latest, snapshot) => (!latest || snapshot.periodDate > latest ? snapshot.periodDate : latest), null);
}

function latestPeriodFromRows(rows: MarketRow[]) {
  return rows.reduce<Date | null>((latest, row) => (!latest || (row.latestSeen && row.latestSeen > latest) ? row.latestSeen : latest), null);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function sameDay(a: Date, b: Date) {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function unique<T>(values: Array<T | null | undefined>) {
  return [...new Set(values.filter((value): value is T => value != null))];
}

function averageNullable(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value));
  return valid.length === 0 ? null : valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function maxNullable(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value));
  return valid.length > 0 ? Math.max(...valid) : null;
}

function minNullable(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value));
  return valid.length > 0 ? Math.min(...valid) : null;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) return null;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length);
}

function signalPriority(signal: ItemSignal) {
  return { HIGH_OPPORTUNITY: 8, TREND_CONFIRMED: 7, EARLY_SIGNAL: 6, NEW_ASSORTMENT_SIGNAL: 5, ASSORTMENT_RISING: 4, CROSS_SOURCE_PRESENCE: 3, SATURATED: 2, COOLING: 2, STABLE: 1, INSUFFICIENT_DATA: 0, NO_VERIFIED_RANKING: 0 }[signal];
}
