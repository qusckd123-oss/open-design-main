export type EditorialRecentDirection = "INCREASING" | "STABLE" | "DECREASING" | "UNAVAILABLE";

export type EditorialRecentDirectionPresentation = {
  state: EditorialRecentDirection;
  label: "증가" | "유지" | "감소" | "판단 불가";
  symbol: "↑" | "→" | "↓" | "—";
  deltaLabel: string | null;
  comparisonLabel: string;
};

type ComparableEditorialWindows = {
  current7dArticlePresence?: number | null;
  previous7dArticlePresence?: number | null;
  change7dArticlePresence?: number | null;
};

/**
 * Presentation-only classification for the existing EditorialTrendRow
 * comparable-window metric. Both seven-day article-presence windows and
 * their stored absolute delta must be present and internally consistent;
 * otherwise the honest state is unavailable.
 */
export function editorialRecentDirection(input: ComparableEditorialWindows): EditorialRecentDirectionPresentation {
  const current = input.current7dArticlePresence;
  const previous = input.previous7dArticlePresence;
  const delta = input.change7dArticlePresence;

  if (current == null || previous == null || delta == null || delta !== current - previous) {
    return {
      state: "UNAVAILABLE",
      label: "판단 불가",
      symbol: "—",
      deltaLabel: null,
      comparisonLabel: "비교 가능한 7일 데이터 없음"
    };
  }

  const comparisonLabel = `최근 7일 ${current}건 · 직전 7일 ${previous}건`;
  if (delta > 0) return { state: "INCREASING", label: "증가", symbol: "↑", deltaLabel: `+${delta}`, comparisonLabel };
  if (delta < 0) return { state: "DECREASING", label: "감소", symbol: "↓", deltaLabel: `${delta}`, comparisonLabel };
  return { state: "STABLE", label: "유지", symbol: "→", deltaLabel: "0", comparisonLabel };
}

/** Cumulative observation breadth only. Recent direction never enters. */
export function editorialCoverageLabel(input: { articlePresence: number; sourceSpread: number }): string {
  if (input.sourceSpread >= 3) return "다수 매체 공통";
  if (input.sourceSpread >= 2) return "여러 매체 동시 관찰";
  if (input.articlePresence >= 2) return "특정 매체 집중";
  return "관찰 시작";
}
