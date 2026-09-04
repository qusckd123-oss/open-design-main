import Link from "next/link";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import { formatNumber } from "@/lib/format";
import { editorialSignalLabel, evidenceStrengthLabel, formatDateKo, formatRankChange, sourceLabel, trendTypeLabel, trendValueLabel } from "@/lib/market-ui";
import { buildFilterHref, parseGenderParam, parseScopeParam } from "@/lib/planning-filters";
import { getPlanningDashboardData } from "@/services/planning-dashboard-service";
import type { EditorialTrendRow } from "@/services/editorial-analytics-service";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// The broad "아이템"(카테고리) tab is intentionally excluded: this screen's
// planning unit is the specific product type, not the broad category.
const typeOptions = [
  ["SUB_ITEM", "상품 유형"],
  ["DETAIL", "디테일"],
  ["MATERIAL", "소재"],
  ["COLOR", "컬러"],
  ["STYLE", "스타일"]
] as const;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditorialPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const gender = parseGenderParam(params.gender);
  const scope = parseScopeParam(params.scope);
  const type = valueOf(params.type) ?? "SUB_ITEM";
  const data = await getPlanningDashboardData(gender, scope);
  const rows = data.editorialByType[type] ?? data.editorialByType.SUB_ITEM ?? [];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold text-signal">EDITORIAL SIGNAL</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">트렌드 검증</h1>
          <p className="mt-2 text-sm text-muted">HYPEBEAST KR / EYESMAG / NONLABEL / VISLA 등 국내 매거진에서 반복적으로 등장하는 상품 유형과 근거 기사를 확인합니다.</p>
        </div>
        <GlobalFilterBar pathname="/editorial" currentParams={params} gender={gender} scope={scope} />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Summary label="매거진 기사" value={formatNumber(data.summary.editorialPosts)} />
        <Summary label="패션 관련 기사" value={formatNumber(data.summary.fashionPosts)} />
        <Summary label="트렌드 근거" value={formatNumber(data.summary.editorialMentions)} />
        <Summary label="명시 성별 근거" value={formatNumber(data.summary.explicitGenderMentions)} />
      </section>

      <div className="flex flex-wrap gap-2">
        {typeOptions.map(([option, label]) => (
          <Link key={option} href={buildFilterHref("/editorial", params, { type: option })} className={`rounded border px-3 py-2 text-sm font-semibold ${type === option ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"}`}>
            {label}
          </Link>
        ))}
      </div>

      <section className="grid gap-4">
        {rows.map((row) => <EditorialRow key={`${row.type}:${row.value}`} row={row} sourceTotal={data.summary.editorialSources} />)}
        {rows.length === 0 ? <div className="rounded border border-dashed border-line bg-white px-4 py-10 text-center text-sm font-semibold text-muted">현재 필터에서 표시할 트렌드 근거가 부족합니다.</div> : null}
      </section>
    </div>
  );
}

function EditorialRow({ row, sourceTotal }: { row: EditorialTrendRow; sourceTotal: number }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-subtle">
      <div className="grid gap-4 lg:grid-cols-[1fr_520px]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{trendTypeLabel(row.type)}</span>
            <span>{editorialSignalLabel(row.observation)}</span>
            <span className="font-semibold text-signal">{evidenceStrengthLabel(row)}</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{trendValueLabel(row.value)}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="등장 기사" value={`${formatNumber(row.articlePresence)}개`} />
            <Metric label="등장 매체" value={`${row.sourceSpread}/${sourceTotal}`} />
            <Metric label="최근 7일" value={formatRankChange(row.change7dArticlePresence)} />
            <Metric label="최근 14일" value={formatRankChange(row.change14dArticlePresence)} />
          </div>
          <div className="mt-4 text-sm text-muted">
            UNI {row.genderSplit.UNISEX ?? 0} · WOMEN {row.genderSplit.WOMEN ?? 0} · 성별 미상 {row.genderSplit.UNKNOWN ?? 0}
          </div>
        </div>
        <div className="rounded bg-canvas p-4">
          <div className="text-sm font-semibold text-ink">근거 기사</div>
          <div className="mt-3 space-y-2">
            {row.evidenceArticles.slice(0, 6).map((article) => (
              <a key={`${article.source}:${article.url}`} href={article.url} target="_blank" rel="noreferrer" className="block rounded border border-line bg-white px-3 py-2 text-sm hover:border-signal">
                <div className="text-xs font-semibold text-signal">{sourceLabel(article.source)} · {formatDateKo(article.publishedAt)}</div>
                <div className="mt-1 line-clamp-2 text-ink">{article.title || "제목 없음"}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-white px-3 py-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="mt-1 font-semibold text-ink">{value}</div>
    </div>
  );
}
