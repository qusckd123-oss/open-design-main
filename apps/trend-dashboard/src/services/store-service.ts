import { Prisma, prisma } from "@/db/client";
import type { RankingScope, SignalConfidence } from "@/types/business";

export type StoreRankingRow = {
  id: string;
  source: string;
  brand: string;
  name: string;
  category: string | null;
  url: string | null;
  imageUrl: string | null;
  rank: number;
  rankingScope: RankingScope;
  observedCategory: string | null;
  change1d: number | null;
  latestSeen: Date;
  weeksInRanking: number;
  signalConfidence: SignalConfidence;
};

type StoreFilters = {
  category?: string;
  source?: string;
};

type StoreRowDb = {
  productId: string;
  source: string;
  brand: string;
  name: string;
  category: string | null;
  url: string | null;
  imageUrl: string | null;
  rankingScope: string;
  rankingCategory: string;
  observedCategory: string;
  audienceSegment: string;
  rank: number;
  latestSeen: Date | string;
  weeksInRanking: number;
  snapshotDays: number;
  change1d: number | null;
  totalCount: number;
};

type FacetDb = {
  categories: string[] | null;
  sources: string[] | null;
};

const snapshotBase = Prisma.sql`
  SELECT
    s."marketProductId",
    s."periodDate",
    s."rankingScope",
    s."rankingCategory",
    s."observedCategory",
    s."audienceSegment",
    s."rankingVerified",
    s.rank,
    (s."periodDate" AT TIME ZONE 'Asia/Seoul')::date AS business_date
  FROM "MarketRankingSnapshot" s
  WHERE s."dataMode" = 'real'
`;

function filterSql(filters: StoreFilters) {
  const category = filters.category
    ? Prisma.sql`AND COALESCE(l."observedCategory", p.category) = ${filters.category}`
    : Prisma.sql``;
  const source = filters.source
    ? Prisma.sql`AND p.source = ${filters.source}`
    : Prisma.sql``;
  return Prisma.sql`${category} ${source}`;
}

function normalizeScope(value: string): RankingScope {
  if (value === "SITEWIDE" || value === "DEPARTMENT" || value === "CATEGORY" || value === "SUBCATEGORY") return value;
  return "UNKNOWN";
}

function confidence(snapshotDays: number): SignalConfidence {
  if (snapshotDays < 2) return "BASELINE";
  if (snapshotDays < 4) return "EARLY_DATA";
  return "ACTIVE_SIGNAL";
}

/**
 * Store-only read path.
 *
 * The general market analytics service intentionally loads every real product
 * and every historical ranking snapshot because its downstream analytics need
 * the full history. /store only renders the current verified ranking plus a
 * one-day delta and simple observation counts, so pulling that full graph into
 * a Worker wastes CPU and produces a large Prisma result.
 *
 * Keep the exact ranking-group identity used by getMarketRows, but let
 * PostgreSQL aggregate history and return at most the 100 rows the page can
 * render. This is a read-only optimization; it does not change collectors,
 * schema, or stored data.
 */
export async function getStoreRankingData(filters: StoreFilters = {}) {
  const filtersSql = filterSql(filters);

  const [rows, facets] = await Promise.all([
    prisma.$queryRaw<StoreRowDb[]>(Prisma.sql`
      WITH s AS (${snapshotBase}),
      latest AS (
        SELECT DISTINCT ON ("marketProductId","rankingScope","rankingCategory","observedCategory","audienceSegment")
          *
        FROM s
        ORDER BY "marketProductId","rankingScope","rankingCategory","observedCategory","audienceSegment","periodDate" DESC
      ),
      stats AS (
        SELECT
          "marketProductId","rankingScope","rankingCategory","observedCategory","audienceSegment",
          COUNT(*)::int AS weeks_in_ranking,
          COUNT(DISTINCT business_date)::int AS snapshot_days
        FROM s
        GROUP BY "marketProductId","rankingScope","rankingCategory","observedCategory","audienceSegment"
      ),
      candidates AS (
        SELECT
          p.id AS "productId",
          p.source,
          p.brand,
          p.name,
          p.category,
          p.url,
          p."imageUrl",
          l."rankingScope",
          l."rankingCategory",
          l."observedCategory",
          l."audienceSegment",
          l.rank,
          l."periodDate" AS "latestSeen",
          st.weeks_in_ranking AS "weeksInRanking",
          st.snapshot_days AS "snapshotDays",
          CASE WHEN prev.rank IS NULL THEN NULL ELSE prev.rank - l.rank END AS "change1d"
        FROM latest l
        JOIN stats st
          USING ("marketProductId","rankingScope","rankingCategory","observedCategory","audienceSegment")
        JOIN "MarketProduct" p ON p.id = l."marketProductId"
        LEFT JOIN s prev
          ON prev."marketProductId" = l."marketProductId"
         AND prev."rankingScope" = l."rankingScope"
         AND prev."rankingCategory" = l."rankingCategory"
         AND prev."observedCategory" = l."observedCategory"
         AND prev."audienceSegment" = l."audienceSegment"
         AND prev.business_date = l.business_date - 1
         AND prev."rankingVerified" = true
         AND prev.rank IS NOT NULL
        WHERE p."dataMode" = 'real'
          AND l."rankingVerified" = true
          AND l.rank IS NOT NULL
          ${filtersSql}
      )
      SELECT
        *,
        COUNT(*) OVER()::int AS "totalCount"
      FROM candidates
      ORDER BY rank ASC, source ASC, name ASC
      LIMIT 100
    `),
    prisma.$queryRaw<FacetDb[]>(Prisma.sql`
      WITH s AS (${snapshotBase}),
      latest AS (
        SELECT DISTINCT ON ("marketProductId","rankingScope","rankingCategory","observedCategory","audienceSegment")
          *
        FROM s
        ORDER BY "marketProductId","rankingScope","rankingCategory","observedCategory","audienceSegment","periodDate" DESC
      )
      SELECT
        ARRAY_AGG(DISTINCT COALESCE(l."observedCategory", p.category) ORDER BY COALESCE(l."observedCategory", p.category))
          FILTER (WHERE COALESCE(l."observedCategory", p.category) IS NOT NULL) AS categories,
        ARRAY_AGG(DISTINCT p.source ORDER BY p.source) AS sources
      FROM latest l
      JOIN "MarketProduct" p ON p.id = l."marketProductId"
      WHERE p."dataMode" = 'real'
        AND l."rankingVerified" = true
        AND l.rank IS NOT NULL
    `)
  ]);

  return {
    rows: rows.map((row) => ({
      id: `${row.productId}:${row.rankingScope ?? "UNKNOWN"}:${row.rankingCategory ?? "ALL"}:${row.observedCategory ?? "ALL"}:${row.audienceSegment ?? "ALL"}`,
      source: row.source,
      brand: row.brand,
      name: row.name,
      category: row.category,
      url: row.url,
      imageUrl: row.imageUrl,
      rank: row.rank,
      rankingScope: normalizeScope(row.rankingScope),
      observedCategory: row.observedCategory ?? row.category,
      change1d: row.change1d,
      latestSeen: row.latestSeen instanceof Date ? row.latestSeen : new Date(row.latestSeen),
      weeksInRanking: row.weeksInRanking,
      signalConfidence: confidence(row.snapshotDays)
    })) satisfies StoreRankingRow[],
    categories: facets[0]?.categories ?? [],
    sources: facets[0]?.sources ?? [],
    totalCount: rows[0]?.totalCount ?? 0
  };
}
