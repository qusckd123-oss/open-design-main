import { notFound } from "next/navigation";
import { AgeComparisonBars } from "@/components/AgeComparisonBars";
import { KeywordTrendChart } from "@/components/KeywordTrendChart";
import { MetricCard } from "@/components/MetricCard";
import { ShoppingAgePanel } from "@/components/ShoppingAgePanel";
import { formatDateTime } from "@/lib/format";
import { formatPercent } from "@/lib/search-trend-signals";
import { getKeywordTrendDetail } from "@/services/search-trend-service";

type PageProps = {
  params: Promise<{ keyword: string }>;
};

export default async function KeywordDetailPage({ params }: PageProps) {
  const { keyword } = await params;
  const detail = await getKeywordTrendDetail(keyword);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Keyword Detail</p>
        <h1 className="mt-2 text-3xl font-semibold">{detail.keyword.name}</h1>
        <p className="mt-2 text-sm text-muted">
          Search Trend와 Shopping Insight는 서로 다른 상대지수입니다. 두 값을 하나의 점수로 합산하지 않습니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Combined Signal" value={detail.row.signal} />
        <MetricCard label="Trend Type" value={detail.row.trendType} />
        <MetricCard label="Target Age" value={detail.row.targetAgeSignal} />
        <MetricCard label="Max 4W" value={formatPercent(detail.row.change4w)} />
        <MetricCard label="YoY" value={formatPercent(detail.row.yoyChange)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded border border-line bg-white p-5 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Search Momentum</p>
          <h2 className="mt-2 text-lg font-semibold">연령대별 시간 변화</h2>
          <p className="mt-2 text-sm text-muted">Source: NAVER Search Trend · Metric: Relative Search Index</p>
          <div className="mt-5">
            <AgeComparisonBars values={detail.row.searchMomentumByAge} />
          </div>
        </div>
        <KeywordTrendChart data={detail.historyByAge} />
      </section>

      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Shopping Age Signal</p>
          <h2 className="mt-2 text-lg font-semibold">10대·20대 쇼핑 클릭 상대지수</h2>
          <p className="mt-2 text-sm text-muted">
            Source: NAVER Shopping Insight · Metric: Relative Shopping Click Index · Updated {formatDateTime(detail.row.updatedAt)}
          </p>
        </div>
        <ShoppingAgePanel values={detail.row.shoppingByAge} />
      </section>

      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Seasonality</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard label="Peak Month" value={detail.row.peakMonth ?? "-"} />
          <MetricCard label="Current vs Peak" value={detail.row.currentVsPeak == null ? "-" : `${detail.row.currentVsPeak.toFixed(1)}%`} />
          <MetricCard label="Last Year Peak" value={detail.row.lastYearPeak ?? "-"} />
        </div>
      </section>
    </div>
  );
}
