import Link from "next/link";
import { AttributeBundleCard, PrimaryBundleCard, SecondaryBundleCard } from "@/components/AttributeBundle";
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
import { bundleEvidenceStrength, getAttributeBundles, selectPrimaryPlanningBundle, type AttributeBundle } from "@/services/attribute-bundle-service";
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
  // genuinely repeated bundle (>=2 articles) earns a larger primary card. With
  // no repeated bundle, every bundle is an equally single observation, so the
  // uniform card grid below is used instead - never an arbitrary "biggest of
  // equals" promotion.
  const repeatedBundle = bundles.find((bundle) => bundle.bundleArticlePresence >= 2) ?? null;
  const secondaryBundles = repeatedBundle ? bundles.filter((bundle) => bundle.key !== repeatedBundle.key).slice(0, 4) : [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold text-signal">PLANNING DASHBOARD</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">상품기획 트렌드 대시보드</h1>
          <p className="mt-2 text-sm text-muted">국내 매거진 트렌드 검증을 기본으로 하고, 해외 스토어 데이터는 참고로만 사용합니다.</p>
        </div>
        <GlobalFilterBar pathname="/" currentParams={params} gender={gender} scope={scope} />
      </section>

      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-signal">오늘의 상품기획 인사이트</p>
            <div className="mt-3 space-y-2 text-base font-semibold leading-7 text-ink">
              {buildTodaySummary(data, bundles).map((line) => <p key={line}>{line}</p>)}
            </div>
          </div>
          <div className="shrink-0 rounded bg-canvas px-4 py-3 text-sm text-muted">
            <div className="font-semibold text-ink">{confidenceLabel(data.businessSummary.summary.signalConfidence)}</div>
            <div className="mt-1">매거진 {formatNumber(data.summary.editorialPosts)}개 기사{isOverseas ? ` · 해외 참고 스토어 ${formatNumber(data.summary.verifiedStoreProducts)}개 상품` : ""}</div>
            {gender !== "all" ? <div className="mt-1">{planningGenderLabel(gender)} 명시 근거 {formatNumber(data.summary.explicitGenderMentions)}건</div> : null}
          </div>
        </div>
      </section>

      {/*
        Bundles answer "어떤 조합?" rather than "어떤 아이템?", so when direct
        attribute evidence exists it is shown above the item-level insight
        cards. When it does not, this section is absent and the item insights
        below remain the primary surface - never padded with placeholders.
      */}
      {bundles.length > 0 ? (
        <section>
          <SectionHeader
            title="요즘 보이는 상품 조합"
            description="기사에서 아이템을 직접 수식한 속성만 조합했습니다. 같은 기사에 함께 등장한 것만으로는 조합하지 않습니다."
            href="/items"
          />
          {repeatedBundle ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <PrimaryBundleCard bundle={repeatedBundle} />
              <div className="space-y-3">
                {secondaryBundles.map((bundle) => <SecondaryBundleCard key={bundle.key} bundle={bundle} />)}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {bundles.slice(0, 3).map((bundle) => <AttributeBundleCard key={bundle.key} bundle={bundle} />)}
            </div>
          )}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {data.planningInsights.slice(0, 3).map((insight) => <PlanningInsightCard key={insight.key} insight={insight} />)}
        {data.planningInsights.length === 0 ? <EmptyState title="현재 필터에서 표시할 상품기획 인사이트가 없습니다." /> : null}
      </section>

      <section>
        <SectionHeader title="매거진에서 뜨는 유형" description="최근 여러 패션 매체에서 반복적으로 등장하는 상품 유형입니다." href="/editorial" />
        <div className="mt-4 flex flex-wrap gap-2">
          {editorialTypes.map(([type, label]) => (
            <Link
              key={type}
              href={buildFilterHref("/", params, { editorialType: type })}
              className={`rounded border px-3 py-2 text-sm font-semibold ${editorialType === type ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {editorialRows.slice(0, 6).map((row) => <EditorialTrendCard key={`${row.type}:${row.value}`} row={row} sourceTotal={data.summary.editorialSources} />)}
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
        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeader title="스토어에서 반응이 좋은 상품" description="END와 Rakuten 실제 인기 랭킹에서 관측된 해외 참고 상품입니다." href={`/market?${scopeQuery(scope)}`} />
            <div className="mt-4 grid gap-3">
              {data.storeRisers.slice(0, 6).map((row) => <MovementCard key={row.id} row={row} tone="rise" />)}
              {data.storeRisers.length === 0 ? <EmptyState title="현재 계산 가능한 1D 상승 상품이 없습니다." /> : null}
            </div>
          </div>
          <div>
            <SectionHeader title="하락 상품" description="판매 감소가 아니라 관측 랭킹 순위 하락으로만 해석합니다." href={`/market?${scopeQuery(scope)}&signal=DROPPING`} />
            <div className="mt-4 grid gap-3">
              {data.storeFallers.slice(0, 5).map((row) => <MovementCard key={row.id} row={row} tone="fall" />)}
              {data.storeFallers.length === 0 ? <EmptyState title="현재 계산 가능한 1D 하락 상품이 없습니다." /> : null}
            </div>
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-2xl font-semibold text-ink">국내 스토어 반응</h2>
          <DomesticStoreEmptyState currentParams={params} />
        </section>
      )}

      {isOverseas ? (
        <section>
          <SectionHeader title="상품 유형별 트렌드 × 스토어 반응" description="매거진 반복 등장과 스토어 랭킹 노출을 같은 상품 유형 기준으로 비교합니다." href="/items" />
          <div className="mt-4 overflow-hidden rounded border border-line bg-white shadow-subtle">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 border-b border-line bg-canvas px-4 py-3 text-xs font-semibold text-muted">
              <div>상품 유형</div>
              <div>트렌드 검증</div>
              <div>판매성 검증</div>
              <div>해석</div>
            </div>
            {data.matrixRows.slice(0, 8).map((row) => (
              <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 border-b border-line px-4 py-4 text-sm last:border-b-0">
                <div className="font-semibold text-ink">{trendValueLabel(row.label)}</div>
                <div>{row.articlePresence > 0 ? `${row.articlePresence}개 기사 · ${row.sourceSpread}/${row.sourceTotal} 매체` : "데이터 없음"}</div>
                <div>{row.top50Presence > 0 ? `TOP20 ${row.top20Presence} · TOP50 ${row.top50Presence}` : "데이터 없음"}</div>
                <div className="font-semibold text-signal">{row.decision}</div>
              </div>
            ))}
            {data.matrixRows.length === 0 ? <div className="px-4 py-8 text-center text-sm font-semibold text-muted">표시할 데이터가 없습니다.</div> : null}
          </div>
        </section>
      ) : null}

      {isOverseas ? (
        <section>
          <SectionHeader title="브랜드 어소트 변화 (해외 참고)" description="SLAM JAM / STUSSY 상품 구성 변화입니다. 랭킹이나 판매 상승으로 해석하지 않습니다." href="/market?view=assortment" />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.assortment.map((row) => (
              <CompactProduct key={row.id} row={row} note={`${sourceLabel(row.source)} · ${compactCategory(row.observedCategory ?? row.category)}`} />
            ))}
            {data.assortment.length === 0 ? <EmptyState title="신규 어소트 관측 상품이 없습니다." /> : null}
          </div>
        </section>
      ) : null}

      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <p className="text-sm font-semibold text-ink">데이터 상태</p>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
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
    <div className="mt-3 flex flex-col items-center gap-2 rounded border border-dashed border-line bg-white px-4 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="text-sm font-semibold text-ink">현재 연결된 국내 스토어 랭킹 데이터가 없습니다.</p>
        <p className="mt-0.5 text-sm text-muted">국내 데이터 소스를 준비 중입니다.</p>
      </div>
      <Link
        href={buildFilterHref("/", currentParams, { scope: "overseas" })}
        className="shrink-0 rounded bg-ink px-4 py-2 text-sm font-semibold text-white"
      >
        해외 데이터 참고하기
      </Link>
    </div>
  );
}

function PlanningInsightCard({ insight }: { insight: PlanningInsight }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted">{trendTypeLabel(insight.dimension)}</div>
          <div className="text-2xl font-semibold text-ink">{insight.dimension === "SUB_ITEM" ? specificItemKoreanLabel(insight.label) ?? trendValueLabel(insight.label) : trendValueLabel(insight.label)}</div>
          <div className="mt-1 text-sm font-semibold text-signal">{insight.decision}</div>
        </div>
        <Badge>{evidenceStrengthLabel(insight)}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniPanel label="트렌드 검증" value={insight.trendStatus} note={`${insight.articlePresence}개 기사 · ${insight.sourceSpread}/${insight.sourceTotal} 매체`} />
        <MiniPanel label="판매성 검증" value={insight.storeStatus} note={insight.usesOverseasReference ? `TOP20 ${insight.top20Presence} · TOP50 ${insight.top50Presence} (해외 참고)` : "국내 근거 없음"} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          매거진 {insight.editorialSources.map(sourceLabel).join(" / ") || "-"}{insight.usesOverseasReference ? ` · 해외 참고 스토어 ${insight.storeSources.map(sourceLabel).join(" / ") || "-"}` : ""}
        </span>
        {insight.dimension === "SUB_ITEM" ? (
          <Link className="shrink-0 font-semibold text-signal" href={`/items/${encodeURIComponent(insight.label)}`}>
            상세 보기 →
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function EditorialTrendCard({ row, sourceTotal }: { row: EditorialTrendRow; sourceTotal: number }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-muted">{trendTypeLabel(row.type)}</div>
          <div className="mt-1 text-xl font-semibold text-ink">{trendValueLabel(row.value)}</div>
        </div>
        <Badge>{evidenceStrengthLabel(row)}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric label="등장 기사" value={formatNumber(row.articlePresence)} />
        <Metric label="등장 매체" value={`${row.sourceSpread}/${sourceTotal}`} />
        <Metric label="최근 7일" value={formatRankChange(row.change7dArticlePresence)} />
      </div>
      <div className="mt-4 text-xs text-muted">
        {editorialSignalLabel(row.observation)} · UNI {row.genderSplit.UNISEX ?? 0} · WOMEN {row.genderSplit.WOMEN ?? 0}
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer font-semibold text-signal">근거 기사</summary>
        <div className="mt-2 space-y-2">
          {row.evidenceArticles.slice(0, 4).map((article) => (
            <a key={`${article.source}:${article.url}`} className="block rounded bg-canvas px-3 py-2 text-muted hover:text-ink" href={article.url} target="_blank" rel="noreferrer">
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
    <article className="grid grid-cols-[80px_1fr] gap-4 rounded border border-line bg-white p-4 shadow-subtle sm:grid-cols-[96px_1fr_auto]">
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
    <div className="rounded border border-line bg-white p-3 shadow-subtle">
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

function SectionHeader({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <Link className="text-sm font-semibold text-signal" href={href}>자세히 보기</Link>
    </div>
  );
}

function MiniPanel({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded bg-canvas px-3 py-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{note}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-canvas px-3 py-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
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

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap rounded border border-line bg-canvas px-2 py-1 text-xs font-semibold text-muted">{children}</span>;
}

function EmptyState({ title }: { title: string }) {
  return <div className="rounded border border-dashed border-line bg-white px-4 py-8 text-center text-sm font-semibold text-muted">{title}</div>;
}

/**
 * Bundle-first priority (§8): a repeated attribute bundle (>=2 articles) is
 * the most concrete planning signal, a single-observation bundle is still
 * stronger than a bare specific-item mention with no proven attribute, and
 * the older specific-item insight is only used when the REAL corpus has no
 * bundle at all. Reuses bundleEvidenceStrength's existing vocabulary so this
 * line can never overclaim (e.g. never "다수 매체 공통" from one source).
 */
function buildTodaySummary(data: Awaited<ReturnType<typeof getPlanningDashboardData>>, bundles: AttributeBundle[]) {
  const lines = [`현재 ${formatNumber(data.summary.editorialPosts)}개 매거진 기사${data.scope === "overseas" ? `와 ${formatNumber(data.summary.verifiedStoreProducts)}개 해외 참고 스토어 상품을 기준으로 봅니다.` : "를 기준으로 봅니다. 국내 스토어 랭킹 데이터는 아직 없습니다."}`];

  const primaryBundle = selectPrimaryPlanningBundle(bundles);
  if (primaryBundle) {
    const strength = bundleEvidenceStrength({ articlePresence: primaryBundle.bundleArticlePresence, sourceSpread: primaryBundle.bundleSourceSpread });
    const prefix = primaryBundle.bundleArticlePresence >= 2 ? "현재 가장 구체적으로 반복 확인된 상품 조합은" : "현재 확인되는 상품 조합은";
    lines.push(`${prefix} ${primaryBundle.displayName}입니다 (${primaryBundle.bundleArticlePresence}개 기사 · ${primaryBundle.bundleSourceSpread}개 매체, ${strength}).`);
  } else {
    const firstInsight = data.planningInsights[0];
    if (firstInsight) {
      const insightLabel = firstInsight.dimension === "SUB_ITEM" ? specificItemKoreanLabel(firstInsight.label) ?? trendValueLabel(firstInsight.label) : trendValueLabel(firstInsight.label);
      if (firstInsight.usesOverseasReference) {
        lines.push(`${insightLabel}은 매거진 ${firstInsight.sourceSpread}/${firstInsight.sourceTotal}개 매체와 해외 참고 스토어 TOP50 ${firstInsight.top50Presence}개 상품에서 함께 확인됩니다.`);
      } else {
        lines.push(`${insightLabel}은 매거진 ${firstInsight.sourceSpread}/${firstInsight.sourceTotal}개 매체에서 반복 등장하는 ${firstInsight.decision} 신호입니다.`);
      }
    }
  }
  const topRiser = data.storeRisers[0];
  if (topRiser) {
    lines.push(`(해외 참고) ${sourceLabel(topRiser.source)}에서 ${topRiser.brand} ${topRiser.name}이 1D ${formatRankChange(topRiser.change1d)} 움직임을 보였습니다.`);
  }
  if (data.gender !== "all") {
    lines.push(`${planningGenderLabel(data.gender)} 필터는 명시적 성별 근거만 사용하며 UNKNOWN 데이터는 제외합니다.`);
  }
  return lines.slice(0, 3);
}
