import Link from "next/link";
import { AttributeBundleCard, SelectedSignalDetail, WatchlistRow } from "@/components/AttributeBundle";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import { ProductImage } from "@/components/ProductImage";
import { ProductLinkButton } from "@/components/ProductLinkButton";
import { Watchlist, type WatchlistItem } from "@/components/Watchlist";
import { formatNumber } from "@/lib/format";
import {
  compactCategory,
  confidenceLabel,
  formatDateKo,
  formatRank,
  formatRankChange,
  planningGenderLabel,
  scopeLabel,
  sourceLabel,
  trendTypeLabel,
  trendValueLabel
} from "@/lib/market-ui";
import { editorialCoverageLabel, editorialRecentDirection } from "@/lib/editorial-momentum";
import { specificItemKoreanLabel } from "@/lib/korean-labels";
import { buildSignalInterpretation } from "@/lib/signal-interpretation";
import { buildFilterHref, parseGenderParam, parseScopeParam } from "@/lib/planning-filters";
import { bundleEvidenceStrength, getAttributeBundles, type AttributeBundle } from "@/services/attribute-bundle-service";
import { getPlanningDashboardData } from "@/services/planning-dashboard-service";
import { selectWatchlistBundles } from "@/services/watchlist-selection";
import { getWatchlistVisualEvidence } from "@/services/watchlist-visual-evidence-service";
import type { WatchlistVisualEvidence } from "@/lib/watchlist-visual-evidence";
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
  const [data, bundles] = await Promise.all([getPlanningDashboardData(gender, scope), getAttributeBundles("real", gender)]);
  const editorialRows = data.editorialByType[editorialType] ?? data.editorialByType.SUB_ITEM ?? [];
  const isOverseas = scope === "overseas";
  const hasComparableEditorialMomentum = gender === "all";
  // Watchlist model (2026-09-14, approved P1 UX pass; selection rule
  // extracted 2026-09-21 to src/services/watchlist-selection.ts so the
  // snapshot writer can share the exact same pick - see that module's doc
  // comment for the full "genuinely, INDEPENDENTLY repeated" gate
  // explanation, unchanged from before this extraction). No ranking/service
  // call changed - still `bundles.slice(0, 5)` reordered only enough to put
  // the repeated-bundle pick first, never a new selection rule.
  const watchlistBundles = selectWatchlistBundles(bundles);
  const visualEvidenceByBundle = await getWatchlistVisualEvidence(watchlistBundles);
  // Each row/detail pair is rendered server-side once (WatchlistRow /
  // SelectedSignalDetail) and handed to the client-only Watchlist shell as
  // plain ReactNode content - see src/components/Watchlist.tsx for why that
  // boundary exists (keeps ranking/service/Prisma code out of the client
  // bundle entirely).
  const watchlistItems: WatchlistItem[] = watchlistBundles.map((bundle, index) => ({
    key: bundle.key,
    // Same Korean-first name WatchlistRow/SelectedSignalDetail render (see
    // AttributeBundle.tsx), not raw bundle.displayName, so a screen reader
    // announces the identical name a sighted planner sees on the row.
    ariaLabel: `${index + 1}번째 신호: ${buildSignalInterpretation(bundle).signalName}`,
    row: <WatchlistRow bundle={bundle} position={index + 1} visuals={visualEvidenceByBundle.get(bundle.key) ?? []} />,
    detail: <SelectedSignalDetail bundle={bundle} visuals={visualEvidenceByBundle.get(bundle.key) ?? []} />
  }));
  // Only ever read when watchlistItems.length > 0 (see the ternary below);
  // the "" fallback exists purely so TypeScript's indexed-access narrowing
  // doesn't force an unnecessary runtime branch here.
  const defaultWatchlistKey = watchlistItems[0]?.key ?? "";

  return (
    <div>
      <section className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-signal">Planning Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-ink md:text-5xl">상품기획 트렌드 대시보드</h1>
          <p className="mt-4 max-w-xl text-sm text-muted">{buildIntroLine(data)}</p>
        </div>
        <GlobalFilterBar pathname="/" currentParams={params} gender={gender} scope={scope} />
      </section>

      {/*
        Bundles answer "어떤 조합?" rather than "어떤 아이템?". When a
        genuinely repeated bundle exists, the page shows one coherent
        "상품기획 워치리스트" - the top five bundles from the SAME frozen sort,
        one selected at a time (default: the existing repeatedBundle pick) -
        instead of a separate always-open hero plus a visually distinct
        six-card block for the same underlying list (2026-09-14 approved P1
        UX pass; see docs/CURRENT_STATE.md "P1 Watchlist").
      */}
      {/*
        Phase 8A "THIS WEEK" summary (2026-09-21, explicit user request): a
        concise visual-first orientation strip above the Watchlist so a
        planner sees "what to notice right now" before the denser row list.
        Reuses the SAME watchlistBundles selection/order and the SAME
        buildSignalInterpretation Korean naming the Watchlist rows use below
        - no new ranking, no speculative mood/prose.
      */}
      {watchlistBundles.length > 0 ? (
        <section className="mt-10 border-t border-line pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">This Week</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">이번 주 핵심 신호</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {watchlistBundles.slice(0, 3).map((bundle, index) => (
              <ThisWeekCard key={bundle.key} bundle={bundle} position={index + 1} visuals={visualEvidenceByBundle.get(bundle.key) ?? []} />
            ))}
          </div>
        </section>
      ) : null}

      {bundles.length > 0 ? (
        <section className="mt-10 border-t border-line pt-10">
          {watchlistItems.length > 0 ? (
            <div>
              <SectionHeader
                kicker="Watchlist"
                title="상품기획 워치리스트"
                description="관측 강도(기사 수·매체 수·서로 다른 사례) 기준으로 정렬한 상위 5개 조합입니다. 최근 방향은 조합 단위 비교값이 없어 판단하지 않습니다."
                href="/items"
              />
              <p className="mt-2 text-xs font-semibold text-muted">관측 근거 기준 정렬 · 성장·판매 순위 아님</p>
              <div className="mt-6">
                <Watchlist items={watchlistItems} defaultSelectedKey={defaultWatchlistKey} />
              </div>
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

      <section className="mt-10 border-t border-line pt-8">
        <SectionHeader
          kicker="Item Signals"
          title="관련 아이템·속성 흐름"
          description={hasComparableEditorialMomentum
            ? "누적 기사 관측 수 순입니다. 관측 강도와 최근 7일 대비 직전 7일의 방향을 서로 분리해 표시합니다."
            : "선택한 성별 근거가 있는 신호입니다. 관측 강도는 전체 기사 기준이며, 성별별 비교창이 없어 최근 방향은 판단하지 않습니다."}
          href="/editorial"
        />
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
        <div className="mt-4 grid gap-x-6 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
          {editorialRows.slice(0, 6).map((row) => (
            <EditorialTrendCard
              key={`${row.type}:${row.value}`}
              row={row}
              sourceTotal={data.summary.editorialSources}
              hasComparableMomentum={hasComparableEditorialMomentum}
            />
          ))}
          {editorialRows.length === 0 ? <EmptyState title="현재 필터에서 매거진 트렌드 근거가 부족합니다." /> : null}
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
                {/* row.label is a raw SUB_ITEM taxonomy value when sourced
                    from editorial (e.g. TRACK_JACKET) but an already-formatted
                    Market label otherwise (row.store?.label) - dimension tells
                    us which, and specificItemKoreanLabel is a no-op fallback
                    for the latter since Market's own vocabulary never matches
                    this dictionary's keys. */}
                <div className="font-semibold text-ink">
                  {row.dimension === "SUB_ITEM" ? specificItemKoreanLabel(row.label) ?? trendValueLabel(row.label) : trendValueLabel(row.label)}
                </div>
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
          <Meta label="매거진 (국내)" value={`수집 ${formatNumber(data.summary.editorialPosts)}개 · 분석 ${formatNumber(data.summary.fashionPosts)}개 · ${formatNumber(data.summary.editorialSources)}개 매체`} />
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

/**
 * THIS WEEK card - reuses the exact same Korean-first name (`signalName`)
 * and count/strength fields the Watchlist row/detail already compute; no new
 * data, no speculative summary prose. `observedFact` is the SAME sentence
 * `SignalInterpretationBlock` shows, not a shortened rewrite, so this strip
 * never introduces a second interpretation of the same bundle.
 */
function ThisWeekCard({ bundle, position, visuals }: { bundle: AttributeBundle; position: number; visuals: WatchlistVisualEvidence[] }) {
  const { signalName } = buildSignalInterpretation(bundle);
  const visual = visuals[0];
  const strength = bundleEvidenceStrength({
    articlePresence: bundle.bundleArticlePresence,
    sourceSpread: bundle.bundleSourceSpread,
    independentEvidenceClusterCount: bundle.independentEvidenceClusterCount
  });
  const imageAlt = visual?.tier === "ADJACENT_BLOCK"
    ? `본문 관계 텍스트와 인접한 이미지: ${visual.title}. 이미지 속 품목 자체를 시각 판독한 것은 아닙니다.`
    : visual ? `기사 대표 이미지 맥락: ${visual.title}. 신호 자체를 증명하지 않습니다.` : "연결된 기사 이미지 없음";
  return (
    <article className="min-w-0 border-t-2 border-ink pt-3">
      <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-sm bg-slate-200 sm:aspect-[16/10]">
        {visual ? (
          <a href={visual.articleUrl} target="_blank" rel="noopener noreferrer" aria-label={`${visual.title} 원문 기사 열기`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visual.imageUrl} alt={imageAlt} className="h-full w-full object-cover" loading={position === 1 ? "eager" : "lazy"} />
            <span className={`absolute bottom-2 left-2 rounded-sm px-2 py-1 text-[9px] font-semibold ${visual.tier === "ADJACENT_BLOCK" ? "bg-ink/90 text-white" : "bg-white/90 text-muted"}`}>
              {visual.tier === "ADJACENT_BLOCK" ? "본문 인접 이미지" : "기사 대표 이미지 · 맥락"}
            </span>
          </a>
        ) : <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-muted">기사 이미지 없음</div>}
        <span className="absolute right-2 top-2 rounded-sm bg-white/90 px-2 py-1 text-[10px] font-semibold tabular-nums text-ink">{String(position).padStart(2, "0")}</span>
      </div>
      <div className="min-w-0 pt-2 sm:pt-3">
        <h3 className="text-sm font-semibold leading-snug text-ink sm:text-xl">{signalName}</h3>
        <p className="mt-1 text-[11px] font-semibold text-signal">{strength}</p>
        {visual ? <p className="mt-1 line-clamp-1 text-[10px] text-muted">{sourceLabel(visual.source)} · {formatDateKo(visual.publishedAt)}</p> : null}
        {visual ? <p className="mt-1 text-[10px] leading-snug text-muted">{visual.tier === "ADJACENT_BLOCK" ? "본문 문구와 인접 · 이미지 속 품목 판독 아님" : "기사 대표 이미지 · 맥락 참고"}</p> : null}
        <p className="mt-1 text-[10px] leading-snug text-muted">기사 {bundle.bundleArticlePresence} · 매체 {bundle.bundleSourceSpread} · 최신 {bundle.latestObservedAt?.toISOString().slice(0, 10) ?? "확인 불가"}</p>
        <p className="mt-1 hidden text-xs leading-relaxed text-muted sm:block">{buildSignalInterpretation(bundle).observedFact}</p>
      </div>
    </article>
  );
}

function EditorialTrendCard({ row, sourceTotal, hasComparableMomentum }: { row: EditorialTrendRow; sourceTotal: number; hasComparableMomentum: boolean }) {
  // Korean-first title when this row IS a specific item (SUB_ITEM dimension)
  // - the same established mapping used everywhere else (TOTE_BAG -> 토트백).
  // Other dimensions (DETAIL/MATERIAL/COLOR/STYLE) are left as-is; this is not
  // a general localization pass.
  const label = row.type === "SUB_ITEM" ? specificItemKoreanLabel(row.value) ?? trendValueLabel(row.value) : trendValueLabel(row.value);
  const coverage = editorialCoverageLabel(row);
  const direction = editorialRecentDirection(hasComparableMomentum ? row : {});
  const comparisonLabel = hasComparableMomentum ? direction.comparisonLabel : "성별 필터 단위 비교값 없음";
  return (
    <details data-testid="editorial-flow-card" data-direction={direction.state} className="border-t border-line py-2">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 py-1 marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{trendTypeLabel(row.type)}</span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{label}</span>
        <span className="text-[11px] tabular-nums text-muted">{formatNumber(row.articlePresence)}기사 · {row.sourceSpread}/{sourceTotal}매체</span>
        <span className="text-[11px] font-semibold text-signal">{direction.symbol} {direction.label}</span>
      </summary>
      <div className="grid grid-cols-2 gap-3 border-t border-line pb-1 pt-3 text-xs sm:gap-5">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.06em] text-muted">관측 강도</div>
          <div className="mt-1 font-semibold text-ink">{coverage}</div>
          <div className="mt-0.5 text-muted">{hasComparableMomentum ? "" : "전체 기준 · "}{formatNumber(row.articlePresence)}개 기사 · {row.sourceSpread}/{sourceTotal}개 매체</div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.06em] text-muted">최근 방향</div>
          <div className="mt-1 font-semibold text-ink"><span aria-hidden>{direction.symbol}</span> {direction.label}{direction.deltaLabel ? ` ${direction.deltaLabel}` : ""}</div>
          <div className="mt-0.5 leading-snug text-muted">{comparisonLabel}</div>
        </div>
        <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-muted">
          <span>UNI {row.genderSplit.UNISEX ?? 0} · WOMEN {row.genderSplit.WOMEN ?? 0}</span>
        </div>
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer font-semibold text-muted">근거 기사 보기</summary>
        <div className="mt-2 space-y-2">
          {row.evidenceArticles.slice(0, 4).map((article) => (
            <a key={`${article.source}:${article.url}`} className="block border-t border-line pt-2 text-muted hover:text-ink" href={article.url} target="_blank" rel="noreferrer">
              <span className="font-semibold text-ink">{sourceLabel(article.source)}</span> · {article.title || "제목 없음"} · {formatDateKo(article.publishedAt)}
            </a>
          ))}
        </div>
      </details>
    </details>
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
 * 인사이트" box. The Watchlist section right below now carries the actual
 * insight; this line only orients the reader in the data.
 */
function buildIntroLine(data: Awaited<ReturnType<typeof getPlanningDashboardData>>) {
  // Two different numbers that must never be presented as one: everything
  // collected, versus the fashion-relevant subset the analysis actually runs
  // on. Saying "223개 기사를 기준으로" while analysing 214 overstates the basis.
  const scopeText = data.scope === "overseas"
    ? ` 해외 참고 스토어 ${formatNumber(data.summary.verifiedStoreProducts)}개 상품도 함께 봅니다.`
    : " 국내 스토어 랭킹 데이터는 아직 없습니다.";
  const genderText = data.gender !== "all" ? ` ${planningGenderLabel(data.gender)} 필터는 명시적 성별 근거만 사용합니다.` : "";
  return `현재 패션 관련 기사 ${formatNumber(data.summary.fashionPosts)}개를 기준으로 분석합니다 (전체 수집 ${formatNumber(data.summary.editorialPosts)}개).${scopeText}${genderText} ${confidenceLabel(data.businessSummary.summary.signalConfidence)}.`;
}
