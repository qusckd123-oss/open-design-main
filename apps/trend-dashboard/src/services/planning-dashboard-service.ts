import { prisma } from "@/db/client";
import { evidenceStrengthLabel } from "@/lib/market-ui";
import { getBusinessDashboardData, getItemTrendRows, getMarketRows } from "@/services/business-analytics-service";
import { getDemandSignalRows, type DemandItemRow } from "@/services/demand-signal-service";
import { getEditorialTrendRows, type EditorialTrendRow } from "@/services/editorial-analytics-service";
import type { ItemTrendRow, MarketRow } from "@/types/business";
import { matchesGenderFilterValue, type MarketScopeFilter, type PlanningGenderFilter } from "@/lib/planning-filters";

export type { PlanningGenderFilter, MarketScopeFilter };
// DEMAND != STORE != EDITORIAL. "기획 검토 강화"/"수요형 아이템"/"관찰 우선순위 낮음"
// only ever come from EDITORIAL x NAVER DEMAND (domestic). "기획 우선 검토"/
// "상업형 아이템" only ever come from EDITORIAL x overseas-reference STORE.
export type PlanningDecision =
  | "기획 우선 검토"
  | "기획 검토 강화"
  | "선행 트렌드"
  | "상업형 아이템"
  | "수요형 아이템"
  | "트렌드 관찰"
  | "관찰 우선순위 낮음"
  | "데이터 수집 중";

export type PlanningInsight = {
  key: string;
  label: string;
  dimension: string;
  decision: PlanningDecision;
  usesOverseasReference: boolean;
  usesDemandSignal: boolean;
  trendStatus: string;
  demandStatus: string;
  storeStatus: string;
  articlePresence: number;
  sourceSpread: number;
  sourceTotal: number;
  top20Presence: number;
  top50Presence: number;
  storeSources: string[];
  editorialSources: string[];
};

export type PlanningDashboardData = {
  gender: PlanningGenderFilter;
  scope: MarketScopeFilter;
  summary: {
    editorialPosts: number;
    fashionPosts: number;
    editorialMentions: number;
    editorialSources: number;
    explicitGenderMentions: number;
    marketSnapshots: number;
    verifiedStoreProducts: number;
    verifiedStoreSources: number;
    assortmentProducts: number;
    latestEditorialDate: Date | null;
    latestMarketDate: Date | null;
  };
  planningInsights: PlanningInsight[];
  editorialByType: Record<string, EditorialTrendRow[]>;
  editorialTop: EditorialTrendRow[];
  demandRows: DemandItemRow[];
  storeRisers: MarketRow[];
  storeFallers: MarketRow[];
  storeNewEntries: MarketRow[];
  storeItemTrends: ItemTrendRow[];
  matrixRows: PlanningInsight[];
  trendDemandRows: PlanningInsight[];
  assortment: MarketRow[];
  storeGenderDataAvailable: boolean;
  hasDomesticStoreSource: boolean;
  businessSummary: Awaited<ReturnType<typeof getBusinessDashboardData>>;
};

const EDITORIAL_TYPES = ["ITEM", "SUB_ITEM", "DETAIL", "MATERIAL", "COLOR", "STYLE"];
// Planning insight priority: a specific item outranks a detail, which outranks
// material, style, and finally color - so a generic color like BLACK never
// becomes the headline insight while specific-item evidence exists.
const PLANNING_TIERS = ["SUB_ITEM", "DETAIL", "MATERIAL", "STYLE", "COLOR"] as const;

export async function getPlanningDashboardData(gender: PlanningGenderFilter = "all", scope: MarketScopeFilter = "domestic"): Promise<PlanningDashboardData> {
  const [businessSummary, market, itemRows, editorialRows, editorialSummary, marketSnapshotCount, demandRows] = await Promise.all([
    getBusinessDashboardData(),
    getMarketRows({ dataMode: "real" }),
    getItemTrendRows("real"),
    getEditorialTrendRows("real"),
    getEditorialSummary(),
    prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } }),
    getDemandSignalRows(gender)
  ]);

  // There is currently no verified domestic STORE ranking source. Overseas
  // ranking (END / Rakuten) only enters the picture when the user explicitly
  // opts into the overseas reference scope - it must never be silently used
  // as domestic store evidence.
  const isOverseas = scope === "overseas";
  const hasDomesticStoreSource = false;

  const filteredEditorial = editorialRows
    .map((row) => filterEditorialRowByGender(row, gender))
    .filter((row): row is EditorialTrendRow => Boolean(row));
  const verifiedRows = market.rows.filter((row) => row.rankingVerified);
  const filteredStoreRows = isOverseas ? verifiedRows.filter((row) => marketRowMatchesGender(row, gender)) : [];
  const storeRowsForDisplay = filteredStoreRows;
  const storeItems = itemRows.filter((row) => row.rankingSourceCount > 0);
  const filteredStoreItems = isOverseas ? filterStoreItemsByRows(storeItems, storeRowsForDisplay) : [];
  const editorialByType = Object.fromEntries(
    EDITORIAL_TYPES.map((type) => [type, filteredEditorial.filter((row) => row.type === type).slice(0, 12)])
  ) as Record<string, EditorialTrendRow[]>;
  const planningInsights = buildPlanningInsights(filteredEditorial, filteredStoreItems, demandRows, businessSummary.summary.verifiedRankingSources, isOverseas).slice(0, 5);
  // TREND x DEMAND is scope-independent (NAVER demand is inherently a
  // domestic signal, not an overseas-reference concept) - STORE stays
  // intentionally absent here regardless of scope; see section 22: NAVER
  // demand never substitutes for STORE.
  const trendDemandRows = buildTrendDemandInsights(filteredEditorial.filter((row) => row.type === "SUB_ITEM"), demandRows, businessSummary.summary.verifiedRankingSources);

  return {
    gender,
    scope,
    summary: {
      ...editorialSummary,
      explicitGenderMentions: explicitGenderMentionCount(gender, editorialRows),
      marketSnapshots: marketSnapshotCount,
      verifiedStoreProducts: verifiedRows.length,
      verifiedStoreSources: businessSummary.summary.verifiedRankingSources,
      assortmentProducts: market.rows.filter((row) => !row.rankingVerified).length,
      latestMarketDate: latestMarketDate(verifiedRows)
    },
    planningInsights,
    editorialByType,
    editorialTop: filteredEditorial.slice(0, 12),
    demandRows,
    storeRisers: storeRowsForDisplay.filter((row) => (row.change1d ?? 0) > 0).sort((a, b) => (b.change1d ?? 0) - (a.change1d ?? 0)).slice(0, 10),
    storeFallers: storeRowsForDisplay.filter((row) => (row.change1d ?? 0) < 0).sort((a, b) => (a.change1d ?? 0) - (b.change1d ?? 0)).slice(0, 8),
    storeNewEntries: storeRowsForDisplay.filter((row) => row.isNewEntry).slice(0, 10),
    storeItemTrends: filteredStoreItems.slice(0, 10),
    matrixRows: planningInsights,
    trendDemandRows,
    assortment: isOverseas ? market.rows.filter((row) => !row.rankingVerified && row.presenceStatus === "NEWLY_ADDED").slice(0, 8) : [],
    storeGenderDataAvailable: !isOverseas ? false : gender === "all" || filteredStoreRows.length > 0,
    hasDomesticStoreSource,
    businessSummary
  };
}

export function matchesPlanningGender(value: string | null | undefined, gender: PlanningGenderFilter) {
  return matchesGenderFilterValue(value, gender);
}

export function classifyPlanningInsight(input: { trendStrong: boolean; storeStrong: boolean; hasTrend: boolean; hasStore: boolean }): PlanningDecision {
  if (input.trendStrong && input.storeStrong) return "기획 우선 검토";
  if (input.trendStrong && (!input.storeStrong || !input.hasStore)) return "선행 트렌드";
  if (input.hasTrend && !input.hasStore) return "트렌드 관찰";
  if ((!input.trendStrong || !input.hasTrend) && input.storeStrong) return "상업형 아이템";
  return "데이터 수집 중";
}

export function planningItemKey(value: string | null | undefined) {
  if (!value) return "OTHER";
  const normalized = value.toUpperCase();
  const aliases: Record<string, string> = {
    HEADWEAR: "CAP",
    BALL_CAP: "CAP",
    LONG_SLEEVE_TSHIRT: "LONG_SLEEVE",
    LONG_SLEEVE_TEE: "LONG_SLEEVE",
    SHORT_SLEEVE_TSHIRT: "T_SHIRT",
    TEE: "T_SHIRT",
    DENIM_PANTS: "DENIM",
    WIDE_DENIM: "DENIM",
    BODY_BAG: "BAG",
    SHOULDER_BAG: "BAG",
    MESSENGER_BAG: "BAG",
    TOTE_BAG: "BAG",
    BACKPACK: "BAG"
  };
  return aliases[normalized] ?? normalized;
}

function filterEditorialRowByGender(row: EditorialTrendRow, gender: PlanningGenderFilter) {
  if (gender === "all") return row;
  const target = gender === "uni" ? "UNISEX" : "WOMEN";
  if ((row.genderSplit[target] ?? 0) <= 0) return null;
  return {
    ...row,
    mentionCount: row.genderSplit[target] ?? 0
  };
}

function marketRowMatchesGender(row: MarketRow, gender: PlanningGenderFilter) {
  if (gender === "all") return true;
  return matchesPlanningGender(row.gender, gender);
}

function filterStoreItemsByRows(items: ItemTrendRow[], rows: MarketRow[]) {
  if (rows.length === 0) return [];
  const keys = new Set(rows.map((row) => planningItemKey(row.subItemType && row.subItemType !== "OTHER" ? row.subItemType : row.itemType)));
  return items.filter((row) => keys.has(planningItemKey(row.subItemType && row.subItemType !== "OTHER" ? row.subItemType : row.itemType)));
}

// Builds the ranked Planning Insight list. Specific-item evidence is tried
// first; only when there is no specific-item evidence at all does the
// function fall back to detail, then material, then style, then color -
// each tier is evaluated in priority order and the first non-empty tier wins,
// so a broad category or a generic color never outranks a real specific item.
function buildPlanningInsights(editorialRows: EditorialTrendRow[], storeRows: ItemTrendRow[], demandRows: DemandItemRow[], sourceTotal: number, allowStoreMatch: boolean) {
  for (const tier of PLANNING_TIERS) {
    const rowsForTier = editorialRows.filter((row) => row.type === tier);
    if (rowsForTier.length === 0) continue;
    const insights =
      tier === "SUB_ITEM" && allowStoreMatch
        ? buildItemInsights(rowsForTier, storeRows, sourceTotal)
        : tier === "SUB_ITEM"
          ? buildTrendDemandInsights(rowsForTier, demandRows, sourceTotal)
          : buildEditorialOnlyInsights(rowsForTier, sourceTotal, tier);
    if (insights.length > 0) return insights;
  }
  return [];
}

function buildItemInsights(editorialRows: EditorialTrendRow[], storeRows: ItemTrendRow[], sourceTotal: number) {
  const byKey = new Map<string, { editorial?: EditorialTrendRow; store?: ItemTrendRow }>();
  for (const row of editorialRows) {
    const key = planningItemKey(row.value);
    const current = byKey.get(key) ?? {};
    if (!current.editorial || row.articlePresence > current.editorial.articlePresence) current.editorial = row;
    byKey.set(key, current);
  }
  for (const row of storeRows) {
    const key = planningItemKey(row.subItemType && row.subItemType !== "OTHER" ? row.subItemType : row.itemType);
    const current = byKey.get(key) ?? {};
    if (!current.store || row.top20Presence > current.store.top20Presence || row.top50Presence > current.store.top50Presence) current.store = row;
    byKey.set(key, current);
  }
  return [...byKey.entries()]
    .map(([key, row]) => {
      // Source Spread is the decisive signal - one outlet repeating a phrase
      // several times must never count as a "strong" trend on its own.
      const trendStrong = Boolean(row.editorial && row.editorial.sourceSpread >= 2);
      const storeStrong = Boolean(row.store && (row.store.top20Presence > 0 || row.store.top50Presence >= 2 || (row.store.marketChange1w ?? 0) > 0));
      return {
        key,
        label: row.editorial?.value ?? row.store?.label ?? key,
        dimension: "SUB_ITEM",
        decision: classifyPlanningInsight({ trendStrong, storeStrong, hasTrend: Boolean(row.editorial), hasStore: Boolean(row.store) }),
        usesOverseasReference: Boolean(row.store),
        usesDemandSignal: false,
        trendStatus: row.editorial ? trendStatus(row.editorial) : "데이터 없음",
        demandStatus: "네이버 수요 데이터 없음",
        storeStatus: row.store ? storeStatus(row.store) : "데이터 없음",
        articlePresence: row.editorial?.articlePresence ?? 0,
        sourceSpread: row.editorial?.sourceSpread ?? 0,
        sourceTotal,
        top20Presence: row.store?.top20Presence ?? 0,
        top50Presence: row.store?.top50Presence ?? 0,
        storeSources: row.store?.sources ?? [],
        editorialSources: row.editorial?.sources ?? []
      };
    })
    .filter((row) => row.articlePresence > 0 || row.top50Presence > 0 || row.top20Presence > 0)
    .sort((a, b) => decisionPriority(b.decision) - decisionPriority(a.decision) || b.sourceSpread - a.sourceSpread || b.articlePresence - a.articlePresence || b.top20Presence - a.top20Presence);
}

// Domestic SUB_ITEM tier: combines EDITORIAL (trend) with NAVER DEMAND -
// STORE is intentionally never referenced here (section 22: NAVER demand
// never substitutes for STORE; STORE stays a separate, honestly-empty axis).
// When no demand rows exist yet (e.g. NAVER credentials missing), this
// degrades to the same "선행 트렌드"/"트렌드 관찰" output as the old
// editorial-only path, so today's dashboard output does not change until
// real demand data exists.
function buildTrendDemandInsights(editorialRows: EditorialTrendRow[], demandRows: DemandItemRow[], sourceTotal: number) {
  const byKey = new Map<string, { editorial?: EditorialTrendRow; demand?: DemandItemRow }>();
  for (const row of editorialRows) {
    const key = row.value.toUpperCase();
    const current = byKey.get(key) ?? {};
    current.editorial = row;
    byKey.set(key, current);
  }
  for (const row of demandRows) {
    const key = row.specificItem.toUpperCase();
    const current = byKey.get(key) ?? {};
    if (!current.demand) current.demand = row;
    byKey.set(key, current);
  }

  return [...byKey.entries()]
    .map(([key, row]) => {
      const trendStrong = Boolean(row.editorial && row.editorial.sourceSpread >= 2);
      const trendDeclining = (row.editorial?.change7dArticlePresence ?? 0) < 0;
      const demandStrong = row.demand?.observation === "관심 증가";
      const demandDeclining = row.demand?.observation === "관심 감소";
      return {
        key,
        label: row.editorial?.value ?? row.demand?.specificItem ?? key,
        dimension: "SUB_ITEM",
        decision: classifyDomesticTrendDemandInsight({
          trendStrong,
          hasTrend: Boolean(row.editorial),
          trendDeclining,
          demandStrong,
          hasDemand: Boolean(row.demand),
          demandDeclining
        }),
        usesOverseasReference: false,
        usesDemandSignal: Boolean(row.demand),
        trendStatus: row.editorial ? trendStatus(row.editorial) : "데이터 없음",
        demandStatus: row.demand ? row.demand.observation : "네이버 수요 데이터 없음",
        storeStatus: "국내 스토어 데이터 없음",
        articlePresence: row.editorial?.articlePresence ?? 0,
        sourceSpread: row.editorial?.sourceSpread ?? 0,
        sourceTotal,
        top20Presence: 0,
        top50Presence: 0,
        storeSources: [],
        editorialSources: row.editorial?.sources ?? []
      };
    })
    .filter((row) => row.articlePresence > 0 || row.usesDemandSignal)
    .sort((a, b) => decisionPriority(b.decision) - decisionPriority(a.decision) || b.sourceSpread - a.sourceSpread || b.articlePresence - a.articlePresence);
}

export function classifyDomesticTrendDemandInsight(input: {
  trendStrong: boolean;
  hasTrend: boolean;
  trendDeclining: boolean;
  demandStrong: boolean;
  hasDemand: boolean;
  demandDeclining: boolean;
}): PlanningDecision {
  if (input.trendStrong && input.demandStrong) return "기획 검토 강화";
  if (input.trendStrong) return "선행 트렌드";
  if (input.demandStrong) return "수요형 아이템";
  if (input.trendDeclining && input.demandDeclining) return "관찰 우선순위 낮음";
  if (input.hasTrend) return "트렌드 관찰";
  if (input.hasDemand) return "트렌드 관찰";
  return "데이터 수집 중";
}

// Editorial-only tiers (detail/material/style/color): decision can never
// exceed "선행 트렌드" because neither STORE nor DEMAND evidence applies
// to these dimensions in this pass.
function buildEditorialOnlyInsights(rows: EditorialTrendRow[], sourceTotal: number, dimension: string) {
  return rows
    .filter((row) => row.articlePresence > 0)
    .map((row) => {
      // Same rule as buildItemInsights: Source Spread decides "strong", not article count.
      const trendStrong = row.sourceSpread >= 2;
      return {
        key: `${dimension}:${row.value}`,
        label: row.value,
        dimension,
        decision: classifyPlanningInsight({ trendStrong, storeStrong: false, hasTrend: true, hasStore: false }),
        usesOverseasReference: false,
        usesDemandSignal: false,
        trendStatus: trendStatus(row),
        demandStatus: "네이버 수요 데이터 없음",
        storeStatus: "국내 스토어 데이터 없음",
        articlePresence: row.articlePresence,
        sourceSpread: row.sourceSpread,
        sourceTotal,
        top20Presence: 0,
        top50Presence: 0,
        storeSources: [],
        editorialSources: row.sources
      };
    })
    .sort((a, b) => decisionPriority(b.decision) - decisionPriority(a.decision) || b.sourceSpread - a.sourceSpread || b.articlePresence - a.articlePresence);
}

function trendStatus(row: EditorialTrendRow) {
  return evidenceStrengthLabel(row);
}

function storeStatus(row: ItemTrendRow) {
  if (row.top20Presence > 0) return "TOP20 반응";
  if (row.top50Presence > 0) return "TOP50 반응";
  return "초기 관측";
}

function decisionPriority(value: PlanningDecision) {
  return {
    "기획 우선 검토": 8,
    "기획 검토 강화": 7,
    "선행 트렌드": 6,
    "상업형 아이템": 5,
    "수요형 아이템": 4,
    "트렌드 관찰": 3,
    "관찰 우선순위 낮음": 2,
    "데이터 수집 중": 1
  }[value];
}

function explicitGenderMentionCount(gender: PlanningGenderFilter, rows: EditorialTrendRow[]) {
  if (gender === "all") return rows.reduce((sum, row) => sum + (row.genderSplit.UNISEX ?? 0) + (row.genderSplit.WOMEN ?? 0), 0);
  const target = gender === "uni" ? "UNISEX" : "WOMEN";
  return rows.reduce((sum, row) => sum + (row.genderSplit[target] ?? 0), 0);
}

async function getEditorialSummary() {
  const [editorialPosts, fashionPosts, editorialMentions, sources, latest] = await Promise.all([
    prisma.editorialPost.count({ where: { dataMode: "real" } }),
    prisma.editorialPost.count({ where: { dataMode: "real", fashionRelevance: "FASHION_RELEVANT" } }),
    prisma.editorialMention.count({ where: { post: { dataMode: "real", fashionRelevance: "FASHION_RELEVANT" } } }),
    prisma.editorialPost.groupBy({ by: ["source"], where: { dataMode: "real" } }),
    prisma.editorialPost.aggregate({ where: { dataMode: "real" }, _max: { publishedAt: true } })
  ]);
  return {
    editorialPosts,
    fashionPosts,
    editorialMentions,
    editorialSources: sources.length,
    latestEditorialDate: latest._max.publishedAt
  };
}

function latestMarketDate(rows: MarketRow[]) {
  return rows.reduce<Date | null>((latest, row) => (!latest || (row.latestSeen && row.latestSeen > latest) ? row.latestSeen : latest), null);
}
