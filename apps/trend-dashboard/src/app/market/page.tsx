import Link from "next/link";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import { ProductImage } from "@/components/ProductImage";
import { ProductLinkButton } from "@/components/ProductLinkButton";
import { compactCategory, confidenceLabel, formatRank, formatRankChange, marketSignalLabel, scopeHelpText, scopeLabel, sourceLabel, storeGenderLabel } from "@/lib/market-ui";
import { buildFilterHref, matchesGenderFilterValue, parseGenderParam, parseScopeParam, valueOf } from "@/lib/planning-filters";
import { getMarketRows } from "@/services/business-analytics-service";
import type { MarketRow } from "@/types/business";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MarketPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const gender = parseGenderParam(params.gender);
  const scope = parseScopeParam(params.scope);
  const view = valueOf(params.view) === "assortment" ? "assortment" : "ranking";
  const isOverseas = scope === "overseas";

  const data = await getMarketRows({
    q: valueOf(params.q),
    source: valueOf(params.source),
    category: valueOf(params.category),
    signal: valueOf(params.signal),
    sort: valueOf(params.sort),
    dataMode: "real"
  });

  // STORE ranking semantics: only rankingVerified=true rows are "store
  // response" evidence. SLAM_JAM/STUSSY assortment rows are a separate
  // concept (catalog composition, not ranking/sales) and never mixed in here.
  const rankingRows = data.rows.filter((row) => row.rankingVerified);
  const assortmentRows = data.rows.filter((row) => !row.rankingVerified);
  const genderFilteredRankingRows = rankingRows.filter((row) => matchesGenderFilterValue(row.gender, gender));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold text-signal">STORE SIGNAL</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">스토어 반응</h1>
          <p className="mt-2 text-sm text-muted">
            {isOverseas
              ? "해외 참고 데이터입니다. END는 의류 베스트셀러, Rakuten은 전체 패션 랭킹 기준이며 카테고리는 관측 상품 분류입니다."
              : "국내 스토어 랭킹 데이터를 기본으로 표시합니다."}
          </p>
        </div>
        <GlobalFilterBar pathname="/market" currentParams={params} gender={gender} scope={scope} />
      </div>

      {!isOverseas ? (
        <DomesticEmptyState currentParams={params} />
      ) : view === "assortment" ? (
        <AssortmentView rows={assortmentRows} currentParams={params} />
      ) : (
        <RankingView rows={genderFilteredRankingRows} totalRankingCount={rankingRows.length} params={params} facets={data.facets} currentParams={params} />
      )}
    </div>
  );
}

function DomesticEmptyState({ currentParams }: { currentParams: Record<string, string | string[] | undefined> }) {
  return (
    <div className="rounded border border-dashed border-line bg-white px-6 py-16 text-center">
      <p className="text-base font-semibold text-ink">현재 연결된 국내 스토어 랭킹 데이터가 없습니다.</p>
      <p className="mt-2 text-sm text-muted">국내 스토어 데이터 소스를 준비 중입니다.</p>
      <Link
        href={buildFilterHref("/market", currentParams, { scope: "overseas" })}
        className="mt-6 inline-block rounded bg-ink px-5 py-2.5 text-sm font-semibold text-white"
      >
        해외 데이터 참고하기
      </Link>
    </div>
  );
}

function RankingView({
  rows,
  totalRankingCount,
  params,
  facets,
  currentParams
}: {
  rows: MarketRow[];
  totalRankingCount: number;
  params: Record<string, string | string[] | undefined>;
  facets: { sources: readonly string[]; categories: string[]; signals: string[] };
  currentParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <div className="space-y-6">
      <form className="grid gap-3 rounded border border-line bg-white p-4 shadow-subtle lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_110px]">
        <input type="hidden" name="scope" value="overseas" />
        <input className="rounded border border-line px-3 py-2 text-sm" name="q" placeholder="브랜드 또는 상품명" defaultValue={valueOf(params.q)} />
        <select className="rounded border border-line px-3 py-2 text-sm" name="source" defaultValue={valueOf(params.source) ?? ""}>
          <option value="">전체 소스 (END/Rakuten)</option>
          {facets.sources.filter((source) => source === "END" || source === "RAKUTEN_FASHION").map((source) => <option key={source} value={source}>{sourceLabel(source)}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="category" defaultValue={valueOf(params.category) ?? ""}>
          <option value="">전체 카테고리</option>
          {facets.categories.map((category) => <option key={category} value={category}>{compactCategory(category)}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="signal" defaultValue={valueOf(params.signal) ?? ""}>
          <option value="">전체 신호</option>
          {facets.signals.map((signal) => <option key={signal} value={signal}>{marketSignalLabel(signal)}</option>)}
        </select>
        <select className="rounded border border-line px-3 py-2 text-sm" name="sort" defaultValue={valueOf(params.sort) ?? "rank"}>
          <option value="rank">현재 순위</option>
          <option value="change1w">1D 변화</option>
          <option value="change2w">3D 변화</option>
          <option value="change4w">7D 변화</option>
          <option value="price">가격</option>
        </select>
        <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">적용</button>
      </form>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <Summary label="검증 랭킹 상품 (해외 참고)" value={`${totalRankingCount}개`} />
        <Summary label="현재 필터 결과" value={`${rows.length}개`} />
        <Summary label="현재 데이터" value="REAL" />
      </div>

      <section className="grid gap-3">
        {rows.map((row) => <MarketProductCard key={row.id} row={row} />)}
        {rows.length === 0 ? <div className="rounded border border-dashed border-line bg-white px-4 py-10 text-center text-sm font-semibold text-muted">현재 필터에서 표시할 상품이 없습니다.</div> : null}
      </section>

      <div className="text-xs text-muted">
        <Link href={buildFilterHref("/market", currentParams, { view: "assortment" })} className="underline hover:text-ink">
          브랜드 어소트 (SLAM JAM / STUSSY) 참고 데이터 보기
        </Link>
      </div>
    </div>
  );
}

function AssortmentView({ rows, currentParams }: { rows: MarketRow[]; currentParams: Record<string, string | string[] | undefined> }) {
  return (
    <div className="space-y-6">
      <div className="rounded border border-line bg-canvas px-4 py-3 text-sm text-muted">
        브랜드 어소트는 SLAM JAM / STUSSY의 상품 구성 관측입니다. 랭킹 또는 판매 상승으로 해석하지 않습니다. 국내 소스가 준비되면 &quot;브랜드 출시 동향&quot;으로 재구성될 예정입니다.
      </div>
      <section className="grid gap-3">
        {rows.map((row) => <MarketProductCard key={row.id} row={row} />)}
        {rows.length === 0 ? <div className="rounded border border-dashed border-line bg-white px-4 py-10 text-center text-sm font-semibold text-muted">표시할 어소트 데이터가 없습니다.</div> : null}
      </section>
      <div className="text-xs text-muted">
        <Link href={buildFilterHref("/market", currentParams, { view: "ranking" })} className="underline hover:text-ink">
          스토어 랭킹으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function MarketProductCard({ row }: { row: MarketRow }) {
  const previousRank = row.rank != null && row.change1d != null ? row.rank + row.change1d : null;
  return (
    <article className="rounded border border-line bg-white p-4 shadow-subtle">
      <div className="grid gap-4 md:grid-cols-[96px_1fr_auto] md:items-center">
        <ProductImage src={row.imageUrl} alt={row.name} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">{sourceLabel(row.source)}</span>
            <span>{row.rankingVerified ? scopeLabel(row.source, row.rankingScope) : "브랜드 어소트"}</span>
            <span>Category: {compactCategory(row.observedCategory ?? row.category)}</span>
            <span>{storeGenderLabel(row.gender)}</span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-ink">{row.name}</h2>
          <div className="mt-1 text-sm font-semibold text-muted">{row.brand}</div>
          <div className="mt-2 text-xs text-muted">{row.rankingVerified ? scopeHelpText(row.source, row.rankingScope) : "상품 구성 관측 데이터입니다. 랭킹 또는 판매 상승으로 해석하지 않습니다."}</div>
          <div className="mt-3"><ProductLinkButton url={row.url} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm md:min-w-[330px]">
          <Metric label="현재 순위" value={row.rankingVerified ? formatRank(row.rank) : "-"} />
          <Metric label="전일 순위" value={row.rankingVerified ? formatRank(previousRank) : "-"} />
          <Metric label="변화량" value={formatRankChange(row.change1d)} tone={(row.change1d ?? 0) > 0 ? "rise" : (row.change1d ?? 0) < 0 ? "fall" : undefined} />
        </div>
      </div>
      {row.rankingVerified ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded bg-canvas px-2 py-1">이전→현재 {formatRank(previousRank)} → {formatRank(row.rank)}</span>
          <span className="rounded bg-canvas px-2 py-1">3D {formatRankChange(row.change3d)}</span>
          <span className="rounded bg-canvas px-2 py-1">7D {formatRankChange(row.change7d)}</span>
          <span className="rounded bg-canvas px-2 py-1">{marketSignalLabel(row.signal)}</span>
          <span className="rounded bg-canvas px-2 py-1">{confidenceLabel(row.signalConfidence)}</span>
        </div>
      ) : null}
    </article>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-white px-4 py-3 shadow-subtle">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "rise" | "fall" }) {
  const color = tone === "rise" ? "text-rise" : tone === "fall" ? "text-fall" : "text-ink";
  return (
    <div className="rounded bg-canvas px-3 py-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className={`mt-1 font-semibold ${color}`}>{value}</div>
    </div>
  );
}
