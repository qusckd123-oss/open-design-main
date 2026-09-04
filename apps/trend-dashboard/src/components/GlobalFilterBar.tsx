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
    <div className="flex flex-wrap items-center gap-6">
      <FilterGroup label="성별">
        {(["all", "uni", "women"] as const).map((option) => (
          <Link
            key={option}
            href={buildFilterHref(pathname, currentParams, { gender: option })}
            className={`border-b-2 pb-0.5 text-sm font-semibold ${gender === option ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
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
            className={`border-b-2 pb-0.5 text-sm font-semibold ${scope === option ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
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
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
