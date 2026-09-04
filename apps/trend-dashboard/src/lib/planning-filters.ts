export type PlanningGenderFilter = "all" | "uni" | "women";
export type MarketScopeFilter = "domestic" | "overseas";

export function parseGenderParam(value: string | string[] | undefined): PlanningGenderFilter {
  const selected = Array.isArray(value) ? value[0] : value;
  if (selected === "uni" || selected === "women") return selected;
  return "all";
}

// Domestic is the default. Overseas market data is reference-only and must be explicitly selected.
export function parseScopeParam(value: string | string[] | undefined): MarketScopeFilter {
  const selected = Array.isArray(value) ? value[0] : value;
  return selected === "overseas" ? "overseas" : "domestic";
}

export function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function marketScopeLabel(value: MarketScopeFilter) {
  return value === "overseas" ? "해외 참고" : "국내";
}

// Gender evidence must be explicit (UNISEX/WOMEN). UNKNOWN is never
// auto-included in a UNI/WOMEN filter, and gender is never inferred from
// images - only from official/source data.
export function matchesGenderFilterValue(value: string | null | undefined, gender: PlanningGenderFilter) {
  if (gender === "all") return true;
  if (gender === "uni") return value === "UNISEX";
  if (gender === "women") return value === "WOMEN";
  return false;
}

// Builds a query string that preserves existing params while overriding the given keys.
export function buildFilterHref(pathname: string, current: Record<string, string | string[] | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    const single = valueOf(value);
    if (single) params.set(key, single);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
