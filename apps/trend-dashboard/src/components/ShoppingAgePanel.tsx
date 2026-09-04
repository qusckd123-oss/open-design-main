import { formatPercent } from "@/lib/search-trend-signals";
import type { ShoppingAgeSignal, ShoppingInsightAgeGroup } from "@/types/search-trend";

export function ShoppingAgePanel({ values }: { values: Record<ShoppingInsightAgeGroup, ShoppingAgeSignal> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ShoppingCard label="10대 쇼핑 클릭 지수" value={values["10-19"]} />
      <ShoppingCard label="20대 쇼핑 클릭 지수" value={values["20-29"]} />
    </div>
  );
}

function ShoppingCard({ label, value }: { label: string; value: ShoppingAgeSignal }) {
  return (
    <div className="rounded border border-line bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value.current == null ? "-" : value.current.toFixed(1)}</div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted">1W</div>
          <div className={(value.change1w ?? 0) >= 0 ? "font-semibold text-rise" : "font-semibold text-fall"}>{formatPercent(value.change1w)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">4W</div>
          <div className={(value.change4w ?? 0) >= 0 ? "font-semibold text-rise" : "font-semibold text-fall"}>{formatPercent(value.change4w)}</div>
        </div>
      </div>
    </div>
  );
}
