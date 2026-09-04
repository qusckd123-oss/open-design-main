import Link from "next/link";
import { AttributeBundleCard, CurrentSignalHero, SecondaryBundleCard } from "@/components/AttributeBundle";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import { ProductImage } from "@/components/ProductImage";
import { ProductLinkButton } from "@/components/ProductLinkButton";
import { formatNumber } from "@/lib/format";
import {
  compactCategory,
  confidenceLabel,
  editorialSignalLabel,
  evidenceStrengthLabel,
  formatDateKo,
  formatRank,
  formatRankChange,
  planningGenderLabel,
  scopeLabel,
  sourceLabel,
  trendTypeLabel,
  trendValueLabel
} from "@/lib/market-ui";
import { specificItemKoreanLabel } from "@/lib/korean-labels";
import { buildFilterHref, parseGenderParam, parseScopeParam } from "@/lib/planning-filters";
import { getAttributeBundles } from "@/services/attribute-bundle-service";
import { getPlanningDashboardData, type PlanningInsight } from "@/services/planning-dashboard-service";
import type { EditorialTrendRow } from "@/services/editorial-analytics-service";
import type { MarketRow } from "@/types/business";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const editorialTypes = [
  ["SUB_ITEM", "상품 유형"],
  ["DETAIL", "디테일"],
  ["MATERIAL", "소재"],
  ["COLOR", "컬러"],
  ["STYLE", "스타일"]
] as const;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const gender = parseGenderParam(params.gender);
  const scope = parseScopeParam(params.scope);
  const editorialType = valueOf(params.editorialType) ?? "SUB_ITEM";
  const [data, bundles] = await Promise.all([getPlanningDashboardData(gender, scope), getAttributeBundles("real")]);
  const editorialRows = data.editorialByType[editorialType] ?? data.editorialByType.SUB_ITEM ?? [];
  const isOverseas = scope === "overseas";
  // Same threshold bundleEvidenceStrength already uses for "반복 관측": only a
  // genuinely repeated bundle (>=2 articles) becomes the CURRENT SIGNAL hero.
  // With no repeated bundle, every bundle is an equally single observation,
  // so the uniform tile grid below is used instead - never an arbitrary
  // "biggest of equals" promotion.
  const repeatedBundle = bundles.find((bundle) => bundle.bundleArticlePresence >= 2) ?? null;
  const secondaryBundles = repeatedBundle ? bundles.filter((bundle) => bundle.key !== repeatedBundle.key).slice(0, 4) : [];

  return (
    <div>
      <section className="flex flex-col gap-6 border-b border-line pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Planning Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-ink md:text-5xl">상품기획 트렌드 대시보드</h1>
          <p className="mt-4 max-w-xl text-sm text-muted">{buildIntroLine(data)}</p>
        </div>
        <GlobalFilterBar pathname="/" currentParams={params} gender={gender} scope={scope} />
      </section>

      {/*
        Bundles answer "어떤 조합?" rather than "어떤 아이템?", so when a
        genuinely repeated bundle exists it becomes the page's lead story
        (CurrentSignalHero) rather than one card among several - the old
        top insight box is gone; the hero itself carries that role now.
      */}
      {bundles.length > 0 ? (
        <section className="mt-14 border-t border-line pt-14">
          {repeatedBundle ? (
            <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
              <CurrentSignalHero bundle={repeatedBundle} />
              {secondaryBundles.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">New Observations</p>
                  <div className="mt-4">
                    {secondaryBundles.map((bundle) => <SecondaryBundleCard key={bundle.key} bundle={bundle} />)}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <SectionHeader kicker="Current Signal" title="요즘 보이는 상품 조합" description="기사에서 아이템을 직접 수식한 속성만 조합했습니다. 같은 기사에 함께 등장한 것만으로는 조합하지 않습니다." href="/items" />
              <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {bundles.slice(0, 3).map((bundle) => <AttributeBundleCard key={bundle.key} bundle={bundle} />)}
              </div>
            </div>
          )}
        </section>
      ) : null}

      <section className="mt-14 border-t border-line pt-14">
        <SectionHeader kicker="Item Signals" title="매거진에서 뜨는 유형" description="최근 여러 패션 매체에서 반복적으로 등장하는 상품 유형입니다." href="/editorial" />
        <div className="mt-6 flex flex-wrap gap-5 border-b border-line pb-4">
          {editorialTypes.map(([type, label]) => (
            <Link
              key={type}
              href={buildFilterHref("/", params, { editorialType: type })}
              className={`border-b-2 pb-1 text-sm font-semibold ${editorialType === type ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {editorialRows.slice(0, 6).map((row) => <EditorialTrendCard key={`${row.type}:${row.value}`} row={row} sourceTotal={data.summary.editorialSources} />)}
          {editorialRows.length === 0 ? <EmptyState title="현재 필터에서 매거진 트렌드 근거가 부족합니다." /> : null}
        </div>
      </section>

      <section className="mt-14 border-t border-line pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Specific Items</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">세부 아이템 신호</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {data.planningInsights.slice(0, 3).map((insight) => <PlanningInsightCard key={insight.key} insight={insight} />)}
          {data.planningInsights.length === 0 ? <EmptyState title="현재 필터에서 표시할 상품기획 인사이트가 없습니다." /> : null}
        </div>
      </section>

      {/*
        NAVER Shopping Insight DEMAND UI (네이버에서 관심이 커지는 상품 유형 /
        트렌드 × 수요) is intentionally hidden - NAVER Shopping Insight is not
        in use for now. The underlying service (demand-signal-service.ts),
        schema (dataMode-separated KeywordShoppingAgeSnapshot), planning
        decisions (기획 검토 강화/수요형 아이템/관찰 우선순위 낮음), and tests
        are preserved unchanged for future reactivation - only this
        presentation is removed. Main planning judgment runs on Editorial
        trend alone again (buildTrendDemandInsights already degrades to that
        exact output when demandRows is empty, which it always is without
        NAVER credentials).
      */}

      {isOverseas ? (
        <section className="mt-14 border-t border-line pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Store Signal</p>
          <div className="mt-6 grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeader kicker="Rising" title="스토어에서 반응이 좋은 상품" description="END와 Rakuten 실제 인기 랭킹에서 관측된 해외 참고 상품입니다." href={`/market?${scopeQuery(scope)}`} />
              <div className="mt-6 grid gap-3">
                {data.storeRisers.slice(0, 6).map((row) => <MovementCard key={row.id} row={row} tone="rise" />)}
                {data.storeRisers.length === 0 ? <EmptyState title="현재 계산 가능한 1D 상승 상품이 없습니다." /> : null}
              </div>
            </div>
            <div>
              <SectionHeader kicker="Falling" title="하락 상품" description="판매 감소가 아니라 관측 랭킹 순위 하락으로만 해석합니다." href={`/market?${scopeQuery(scope)}&signal=DROPPING`} />
              <div className="mt-6 grid gap-3">
                {data.storeFallers.slice(0, 5).map((row) => <MovementCard key={row.id} row={row} tone="fall" />)}
                {data.storeFallers.length === 0 ? <EmptyState title="현재 계산 가능한 1D 하락 상품이 없습니다." /> : null}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-14 border-t border-line pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Store Signal</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">국내 스토어 반응</h2>
          <DomesticStoreEmptyState currentParams={params} />
        </section>
      )}

      {isOverseas ? (
        <section className="mt-14 border-t border-line pt-14">
          <SectionHeader kicker="Trend × Store" title="상품 유형별 트렌드 × 스토어 반응" description="매거진 반복 등장과 스토어 랭킹 노출을 같은 상품 유형 기준으로 비교합니다." href="/items" />
          <div className="mt-6 overflow-x-auto">
            <div className="grid min-w-[720px] grid-cols-[1fr_1fr_1fr_1fr] gap-3 border-b border-line pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              <div>상품 유형</div>
              <div>트렌드 검증</div>
              <div>판매성 검증</div>
              <div>해석</div>
            </div>
            {data.matrixRows.slice(0, 8).map((row) => (
              <div key={row.key} className="grid min-w-[720px] grid-cols-[1fr_1fr_1fr_1fr] gap-3 border-b border-line py-4 text-sm last:border-b-0">
                <div className="font-semibold text-ink">{trendValueLabel(row.label)}</div>
                <div>{row.articlePresence > 0 ? `${row.articlePresence}개 기사 · ${row.sourceSpread}/${row.sourceTotal} 매체` : "데이터 없음"}</div>
                <div>{row.top50Presence > 0 ? `TOP20 ${row.top20Presence} · TOP50 ${row.top50Presence}` : "데이터 없음"}</div>
                <div className="font-semibold text-signal">{row.decision}</div>
              </div>
            ))}
            {data.matrixRows.length === 0 ? <div className="py-8 text-center text-sm font-semibold text-muted">표시할 데이터가 없습니다.</div> : null}
          </div>
        </section>
      ) : null}

      {isOverseas ? (
        <section className="mt-14 border-t border-line pt-14">
          <SectionHeader kicker="Assortment Reference" title="브랜드 어소트 변화 (해외 참고)" description="SLAM JAM / STUSSY 상품 구성 변화입니다. 랭킹이나 판매 상승으로 해석하지 않습니다." href="/market?view=assortment" />
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {data.assortment.map((row) => (
              <CompactProduct key={row.id} row={row} note={`${sourceLabel(row.source)} · ${compactCategory(row.observedCategory ?? row.category)}`} />
            ))}
            {data.assortment.length === 0 ? <EmptyState title="신규 어소트 관측 상품이 없습니다." /> : null}
          </div>
        </section>
      ) : null}

      <section className="mt-14 border-t border-line pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Data Status</p>
        <div className="mt-4 grid gap-6 text-sm md:grid-cols-4">
          <Meta label="매거진 (국내)" value={`${formatNumber(data.summary.editorialPosts)}개 기사 · ${formatNumber(data.summary.editorialSources)}개 매체`} />
          <Meta label="스토어 (해외 참고)" value={`END / Rakuten · ${formatNumber(data.summary.marketSnapshots)}개 관측`} />
          <Meta label="어소트 (해외 참고)" value={`SLAM JAM / STUSSY · ${formatNumber(data.summary.assortmentProducts)}개 상품`} />
          <Meta label="최근 업데이트" value={`매거진 ${formatDateKo(data.summary.latestEditorialDate)} · 스토어 ${formatDateKo(data.summary.latestMarketDate)}`} />
        </div>
      </section>
    </div>
  );
}

function scopeQuery(scope: string) {
  return `scope=${scope}`;
}

function DomesticStoreEmptyState({ currentParams }: { currentParams: Record<string, string | string[] | undefined> }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 border-t border-line pt-4 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="text-sm font-semibold text-ink">현재 연결된 국내 스토어 랭킹 데이터가 없습니다.</p>
        <p className="mt-0.5 text-sm text-muted">국내 데이터 소스를 준비 중입니다.</p>
      </div>
      <Link href={buildFilterHref("/", currentParams, { scope: "overseas" })} className="shrink-0 text-sm font-semibold text-signal">
        해외 데이터 참고하기 →
      </Link>
    </div>
  );
}

function PlanningInsightCard({ insight }: { insight: PlanningInsight }) {
  const label = insight.dimension === "SUB_ITEM" ? specificItemKoreanLabel(insight.label) ?? trendValueLabel(insight.label) : trendValueLabel(insight.label);
  const body = (
    <>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{trendTypeLabel(insight.dimension)}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{label}</div>
      <div className="mt-2 text-sm text-muted">
        {insight.articlePresence}기사 · {insight.sourceSpread}/{insight.sourceTotal}매체
        {insight.usesOverseasReference ? ` · 해외 참고 TOP50 ${insight.top50Presence}` : ""}
      </div>
      <div className="mt-1 text-xs font-semibold text-signal">{evidenceStrengthLabel(insight)} · {insight.decision}</div>
    </>
  );
  return (
    <article className="border-t-2 border-ink pt-3">
      {insight.dimension === "SUB_ITEM" ? (
        <Link href={`/items/${encodeURIComponent(insight.label)}`} className="block hover:opacity-70">
          {body}
        </Link>
      ) : (
        body
      )}
    </article>
  );
}

function EditorialTrendCard({ row, sourceTotal }: { row: EditorialTrendRow; sourceTotal: number }) {
  return (
    <article className="border-t-2 border-ink pt-3">
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{trendTypeLabel(row.type)}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{trendValueLabel(row.value)}</div>
      <div className="mt-2 text-sm text-muted">
        {formatNumber(row.articlePresence)}기사 · {row.sourceSpread}/{sourceTotal}매체 · 최근 7일 {formatRankChange(row.change7dArticlePresence)}
      </div>
      <div className="mt-1 text-xs font-semibold text-signal">{evidenceStrengthLabel(row)}</div>
      <div className="mt-1 text-xs text-muted">
        {editorialSignalLabel(row.observation)} · UNI {row.genderSplit.UNISEX ?? 0} · WOMEN {row.genderSplit.WOMEN ?? 0}
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer font-semibold text-ink">근거 기사</summary>
        <div className="mt-2 space-y-2">
          {row.evidenceArticles.slice(0, 4).map((article) => (
            <a key={`${article.source}:${article.url}`} className="block border-t border-line pt-2 text-muted hover:text-ink" href={article.url} target="_blank" rel="noreferrer">
              <span className="font-semibold text-ink">{sourceLabel(article.source)}</span> · {article.title || "제목 없음"} · {formatDateKo(article.publishedAt)}
            </a>
          ))}
        </div>
      </details>
    </article>
  );
}

function MovementCard({ row, tone }: { row: MarketRow; tone: "rise" | "fall" }) {
  const changeColor = tone === "rise" ? "text-rise" : "text-fall";
  const previousRank = row.rank != null && row.change1d != null ? row.rank + row.change1d : null;
  return (
    <article className="grid grid-cols-[80px_1fr] gap-4 border-t border-line pt-4 sm:grid-cols-[96px_1fr_auto]">
      <ProductImage src={row.imageUrl} alt={row.name} size="md" />
      <div className="min-w-0">
        <div className={`text-2xl font-semibold ${changeColor}`}>{formatRankChange(row.change1d)}</div>
        <div className="mt-1 text-xs font-semibold text-muted">{row.brand}</div>
        <div className="line-clamp-2 font-semibold text-ink">{row.name}</div>
        <div className="mt-2 text-sm text-muted">{formatRank(previousRank)} → {formatRank(row.rank)}</div>
        <div className="mt-2"><ProductLinkButton url={row.url} /></div>
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 text-xs text-muted sm:col-span-1 sm:block sm:text-right">
        <div className="font-semibold text-ink">{sourceLabel(row.source)}</div>
        <div>{scopeLabel(row.source, row.rankingScope)}</div>
        <div>{compactCategory(row.observedCategory ?? row.category)}</div>
      </div>
    </article>
  );
}

function CompactProduct({ row, note }: { row: MarketRow; note: string }) {
  return (
    <div className="border-t border-line pt-3">
      <div className="flex gap-3">
        <ProductImage src={row.imageUrl} alt={row.name} size="sm" />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-muted">{row.brand}</div>
          <div className="line-clamp-2 text-sm font-semibold">{row.name}</div>
          <div className="mt-1 text-xs text-muted">{note}</div>
          <div className="mt-2"><ProductLinkButton url={row.url} /></div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ kicker, title, description, href }: { kicker: string; title: string; description: string; href: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{kicker}</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <Link className="text-sm font-semibold text-signal" href={href}>자세히 보기 →</Link>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return <p className="border-t border-line pt-4 text-sm font-semibold text-muted">{title}</p>;
}

/**
 * A single small editorial intro line under the H1 - article count, scope
 * note, and confidence, replacing the old large bordered "오늘의 상품기획
 * 인사이트" box. The Primary Bundle (CurrentSignalHero, right below) now
 * carries the actual insight; this line only orients the reader in the data.
 */
function buildIntroLine(data: Awaited<ReturnType<typeof getPlanningDashboardData>>) {
  const scopeText = data.scope === "overseas"
    ? `와 해외 참고 스토어 ${formatNumber(data.summary.verifiedStoreProducts)}개 상품을 기준으로 봅니다.`
    : "를 기준으로 봅니다. 국내 스토어 랭킹 데이터는 아직 없습니다.";
  const genderText = data.gender !== "all" ? ` ${planningGenderLabel(data.gender)} 필터는 명시적 성별 근거만 사용합니다.` : "";
  return `현재 ${formatNumber(data.summary.editorialPosts)}개 매거진 기사${scopeText}${genderText} ${confidenceLabel(data.businessSummary.summary.signalConfidence)}.`;
}
