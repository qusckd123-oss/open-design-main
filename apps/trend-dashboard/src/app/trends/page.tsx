import { AgeComparisonBars } from "@/components/AgeComparisonBars";
import { MetricCard } from "@/components/MetricCard";
import { SearchTrendTable } from "@/components/SearchTrendTable";
import { ShoppingAgePanel } from "@/components/ShoppingAgePanel";
import { formatDateTime } from "@/lib/format";
import { getSearchTrendDashboardData, getSearchTrendRows } from "@/services/search-trend-service";

export default async function TrendsPage() {
  const [dashboard, rows] = await Promise.all([getSearchTrendDashboardData(), getSearchTrendRows()]);
  const selected = rows[0];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Search Trends</p>
        <h1 className="mt-2 text-3xl font-semibold">NAVER 패션 키워드 Signal</h1>
        <p className="mt-2 text-sm text-muted">
          SEARCH MOMENTUM은 연령대별 시간 변화만 비교합니다. SHOPPING AGE는 별도 쇼핑 클릭 상대지수입니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="HOT Keywords" value={dashboard.summary.hot.toLocaleString("ko-KR")} />
        <MetricCard label="Rising" value={dashboard.summary.rising.toLocaleString("ko-KR")} />
        <MetricCard label="Cooling" value={dashboard.summary.cooling.toLocaleString("ko-KR")} />
        <MetricCard label="Updated" value={formatDateTime(dashboard.summary.updatedAt)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div className="rounded border border-line bg-white p-4 text-sm text-muted shadow-subtle">
            <div className="font-semibold text-ink">Metric Guide</div>
            <div className="mt-2">Source: NAVER Search Trend · Metric: Relative Search Index · 표시값: 각 연령대 내부 4W 변화율</div>
            <div className="mt-1">Source: NAVER Shopping Insight · Metric: Relative Shopping Click Index · 표시값: 10대/20대 쇼핑 클릭 상대지수</div>
          </div>
          <SearchTrendTable rows={rows} />
        </div>
        <aside className="space-y-4">
          <div className="rounded border border-line bg-white p-5 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">This Week</p>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-ink">{dashboard.planningSummary}</p>
          </div>
          {selected ? (
            <div className="rounded border border-line bg-white p-5 shadow-subtle">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Selected Keyword</p>
              <h2 className="mt-2 text-lg font-semibold">{selected.name}</h2>
              <div className="mt-5">
                <AgeComparisonBars values={selected.searchMomentumByAge} />
              </div>
              <div className="mt-5">
                <ShoppingAgePanel values={selected.shoppingByAge} />
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
