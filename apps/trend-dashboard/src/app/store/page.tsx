import type { Metadata } from "next";
import Link from "next/link";
import { compactCategory, confidenceLabel, formatDateKo, formatRank, formatRankChange, scopeLabel, sourceLabel } from "@/lib/market-ui";
import { getMarketRows } from "@/services/business-analytics-service";
import type { MarketRow } from "@/types/business";

export const metadata: Metadata = {
  title: "스토어 | 상품기획 트렌드",
  description: "실제 검증된 스토어 랭킹과 상품 이미지를 확인합니다."
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedCategory = valueOf(params.category) ?? "";
  const selectedSource = valueOf(params.source) ?? "";
  const market = await getMarketRows({ dataMode: "real", sort: "rank" });
  const allRanked = market.rows.filter((row) => row.dataMode === "real" && row.rankingVerified && row.rank != null);
  const categories = [...new Set(allRanked.map((row) => row.observedCategory ?? row.category).filter((value): value is string => Boolean(value)))].sort();
  const sources = [...new Set(allRanked.map((row) => row.source))].sort();
  const rows = allRanked
    .filter((row) => !selectedCategory || (row.observedCategory ?? row.category) === selectedCategory)
    .filter((row) => !selectedSource || row.source === selectedSource)
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) || a.source.localeCompare(b.source) || a.name.localeCompare(b.name));

  return (
    <div>
      <header className="border-b border-line pb-7 md:pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Verified Store Ranking</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">스토어</h1>
            <p className="mt-3 text-sm text-muted">실제 검증 랭킹과 상품 이미지로 보는 시장 반응. 순위는 판매량을 뜻하지 않습니다.</p>
          </div>
          <Link href="/market?scope=overseas" className="text-sm font-semibold text-signal">상세 데이터·변화 보기 →</Link>
        </div>
        <p className="mt-3 text-[11px] text-muted">해외 참고 데이터 · END / Rakuten · REAL · 검증 랭킹만</p>
      </header>

      <section className="mt-6 flex flex-col gap-4 border-b border-line pb-5" aria-label="랭킹 필터">
        <div className="flex flex-wrap gap-2">
          <CategoryLink label="TOP RANKED" href={storeHref(params, { category: "" })} active={!selectedCategory} />
          {categories.map((category) => <CategoryLink key={category} label={compactCategory(category)} href={storeHref(params, { category })} active={selectedCategory === category} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          <CategoryLink label="전체 스토어" href={storeHref(params, { source: "" })} active={!selectedSource} />
          {sources.map((source) => <CategoryLink key={source} label={sourceLabel(source)} href={storeHref(params, { source })} active={selectedSource === source} />)}
        </div>
        <p className="text-xs text-muted">{rows.length > 100 ? `상위 100 / ${rows.length}개 상품` : `${rows.length}개 상품`} · {new Set(rows.map((row) => row.source)).size}개 스토어 · 순위순</p>
      </section>

      {rows.length > 0 ? (
        <section className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5" aria-label="검증된 스토어 순위 상품">
          {rows.slice(0, 100).map((row) => <RankedProductCard key={row.id} row={row} />)}
        </section>
      ) : (
        <div className="mt-6 border border-dashed border-line bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-ink">현재 필터에 해당하는 검증 랭킹 상품이 없습니다.</p>
          <p className="mt-2 text-sm text-muted">미검증 어소트와 샘플 데이터는 이 화면에 섞지 않습니다.</p>
        </div>
      )}
    </div>
  );
}

function storeHref(current: Record<string, string | string[] | undefined>, override: { category?: string; source?: string }) {
  const query = new URLSearchParams();
  const category = override.category ?? valueOf(current.category) ?? "";
  const source = override.source ?? valueOf(current.source) ?? "";
  if (category) query.set("category", category);
  if (source) query.set("source", source);
  const encoded = query.toString();
  return encoded ? `/store?${encoded}` : "/store";
}

function CategoryLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return <Link href={href} className={`px-3 py-2 text-[11px] font-semibold ${active ? "bg-ink text-white" : "border border-line bg-white text-muted hover:text-ink"}`}>{label}</Link>;
}

function RankedProductCard({ row }: { row: MarketRow }) {
  return (
    <article className="min-w-0">
      <a href={row.url ?? "/store"} target={row.url ? "_blank" : undefined} rel={row.url ? "noreferrer" : undefined} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#efeee9]">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.imageUrl} alt={`${row.brand} ${row.name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
          ) : <div className="grid h-full place-items-center text-xs text-muted">상품 이미지 없음</div>}
          <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-xs font-semibold text-white">{formatRank(row.rank)}</span>
          {row.change1d != null ? <span className="absolute right-2 top-2 bg-white/95 px-2 py-1 text-[10px] font-semibold text-ink">1D {formatRankChange(row.change1d)}</span> : null}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-semibold text-muted">
          <span className="truncate">{sourceLabel(row.source)}</span><span className="shrink-0">{scopeLabel(row.source, row.rankingScope)}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-[10px] text-muted">{row.brand}</p>
        <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-ink group-hover:text-signal">{row.name}</h2>
      </a>
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted">
        <span>{compactCategory(row.observedCategory ?? row.category)}</span>
        <span>최근 {formatDateKo(row.latestSeen)}</span>
        {row.weeksInRanking > 1 ? <span>{row.weeksInRanking}주 랭킹 관측</span> : null}
      </div>
      <p className="mt-1 text-[10px] text-muted">관측 신뢰도 · {confidenceLabel(row.signalConfidence)}</p>
    </article>
  );
}
