import Link from "next/link";
import { buildFilterHref, marketScopeLabel, type MarketScopeFilter, type PlanningGenderFilter } from "@/lib/planning-filters";
import { planningGenderLabel } from "@/lib/market-ui";

type GlobalFilterBarProps = {
  pathname: string;
  currentParams: Record<string, string | string[] | undefined>;
  gender: PlanningGenderFilter;
  scope: MarketScopeFilter;
};

// Shared Gender / Market Scope filter used on every primary analysis screen.
// Domestic scope is the default: overseas market data is reference-only and only
// appears once the user explicitly opts in.
export function GlobalFilterBar({ pathname, currentParams, gender, scope }: GlobalFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterGroup label="성별">
        {(["all", "uni", "women"] as const).map((option) => (
          <Link
            key={option}
            href={buildFilterHref(pathname, currentParams, { gender: option })}
            className={`rounded px-3 py-1.5 text-sm font-semibold ${gender === option ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink"}`}
          >
            {planningGenderLabel(option)}
          </Link>
        ))}
      </FilterGroup>
      <FilterGroup label="데이터 범위">
        {(["domestic", "overseas"] as const).map((option) => (
          <Link
            key={option}
            href={buildFilterHref(pathname, currentParams, { scope: option })}
            className={`rounded px-3 py-1.5 text-sm font-semibold ${scope === option ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink"}`}
          >
            {marketScopeLabel(option)}
          </Link>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded border border-line bg-white p-1 shadow-subtle">
      <span className="pl-2 pr-1 text-xs font-semibold text-muted">{label}</span>
      {children}
    </div>
  );
}
