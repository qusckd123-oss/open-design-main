import { formatPercent } from "@/lib/search-trend-signals";
import { searchTrendConfig } from "@/lib/search-trend-config";
import type { SearchMomentum, SearchTrendAgeGroup } from "@/types/search-trend";

export function AgeComparisonBars({ values }: { values: Record<SearchTrendAgeGroup, SearchMomentum> }) {
  return (
    <div className="grid gap-3">
      {searchTrendConfig.ageGroups.map((ageGroup) => {
        const momentum = values[ageGroup];
        return (
          <div key={ageGroup} className="rounded border border-line bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-ink">{ageGroup}</div>
              <div className="text-xs text-muted">Search Momentum</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <Metric label="1W" value={formatPercent(momentum.change1w)} positive={(momentum.change1w ?? 0) >= 0} />
              <Metric label="4W" value={formatPercent(momentum.change4w)} positive={(momentum.change4w ?? 0) >= 0} />
              <Metric label="12W" value={formatPercent(momentum.change12w)} positive={(momentum.change12w ?? 0) >= 0} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 font-semibold ${positive ? "text-rise" : "text-fall"}`}>{value}</div>
    </div>
  );
}
