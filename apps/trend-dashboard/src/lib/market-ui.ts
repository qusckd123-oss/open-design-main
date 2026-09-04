import type { ItemSignal, MarketSignal, RankingScope, SignalConfidence } from "@/types/business";

export function marketSignalLabel(signal: MarketSignal | ItemSignal | string) {
  const labels: Record<string, string> = {
    HOT: "강한 랭킹 반응",
    FAST_RISING: "급상승",
    RISING: "상승",
    NEW_ENTRY: "랭킹 신규 관측",
    STABLE: "유지",
    COOLING: "상승세 둔화",
    DROPPING: "하락",
    BASELINE_COLLECTED: "수집 시작",
    NEWLY_ADDED: "신규 관측",
    STILL_PRESENT: "계속 관측",
    REMOVED: "관측 이탈",
    INSUFFICIENT_DATA: "데이터 부족",
    NO_VERIFIED_RANKING: "검증 랭킹 없음",
    HIGH_OPPORTUNITY: "기획 우선 검토",
    TREND_CONFIRMED: "복수 소스 확인",
    EARLY_SIGNAL: "초기 신호",
    SATURATED: "노출 과다",
    ASSORTMENT_RISING: "어소트 증가",
    CROSS_SOURCE_PRESENCE: "복수 브랜드 관측",
    NEW_ASSORTMENT_SIGNAL: "신규 어소트"
  };
  return labels[signal] ?? signal;
}

export function confidenceLabel(confidence: SignalConfidence | string) {
  const labels: Record<string, string> = {
    BASELINE: "데이터 수집 시작",
    EARLY_DATA: "초기 데이터",
    ACTIVE_SIGNAL: "신뢰도 확보"
  };
  return labels[confidence] ?? confidence;
}

export function editorialSignalLabel(signal: string) {
  const labels: Record<string, string> = {
    BASELINE: "초기 데이터",
    EARLY_DATA: "초기 데이터",
    EMERGING: "부상 중",
    RISING: "상승",
    WIDESPREAD: "여러 매체 동시 등장",
    STABLE: "유지",
    COOLING: "둔화",
    NEWLY_OBSERVED: "최근 신규 관측"
  };
  return labels[signal] ?? signal;
}

export function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    RAKUTEN_FASHION: "Rakuten",
    HYPEBEAST_KR: "HYPEBEAST KR",
    SLAM_JAM: "SLAM JAM"
  };
  return labels[source] ?? source;
}

export function scopeLabel(source: string, scope: RankingScope | string) {
  if (source === "RAKUTEN_FASHION" && scope === "SITEWIDE") return "전체 패션 랭킹";
  if (source === "END" && scope === "DEPARTMENT") return "의류 베스트셀러";
  if (scope === "CATEGORY") return "카테고리 랭킹";
  if (scope === "SUBCATEGORY") return "세부 카테고리 랭킹";
  return "랭킹";
}

export function scopeHelpText(source: string, scope: RankingScope | string) {
  if (source === "RAKUTEN_FASHION" && scope === "SITEWIDE") return "Rakuten은 전체 Fashion Ranking 기준입니다.";
  if (source === "END" && scope === "DEPARTMENT") return "END는 Clothing Bestseller 기준입니다.";
  return scopeLabel(source, scope);
}

export function formatRankChange(value: number | null | undefined) {
  if (value == null) return "N/A";
  if (value > 0) return `+${value}`;
  if (value < 0) return `-${Math.abs(value)}`;
  return "0";
}

export function formatRank(rank: number | null | undefined) {
  return rank == null ? "-" : `${rank}위`;
}

export function formatDateKo(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function compactCategory(value: string | null | undefined) {
  if (!value) return "-";
  const labels: Record<string, string> = {
    SHORT_SLEEVE_TSHIRT: "T-SHIRT",
    LONG_SLEEVE_TSHIRT: "LONG T",
    SWEATSHIRT: "SWEATSHIRT",
    HOODIE: "HOODIE",
    SHIRT: "SHIRT",
    JACKET: "JACKET",
    PANTS: "PANTS",
    SHORTS: "SHORTS",
    BAG: "BAG",
    HEADWEAR: "CAP",
    ALL_FASHION: "전체 패션",
    CLOTHING: "의류"
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function trendTypeLabel(type: string) {
  const labels: Record<string, string> = {
    ITEM: "카테고리",
    CATEGORY: "카테고리",
    SUB_ITEM: "상품 유형",
    SPECIFIC_ITEM: "상품 유형",
    DETAIL: "디테일",
    MATERIAL: "소재",
    COLOR: "컬러",
    STYLE: "스타일",
    BRAND: "브랜드",
    COLLAB: "협업",
    IP: "IP"
  };
  return labels[type] ?? type;
}

// STORE gender evidence must come from official/source data, never inferred from images.
export function storeGenderLabel(value: string | null | undefined) {
  if (!value || value === "UNKNOWN") return "성별 데이터 부족";
  return planningGenderLabel(value);
}

// Evidence-strength wording for editorial trend cards/insights. Source Spread
// (distinct outlets) is weighted far above raw article count so that one
// magazine repeating a phrase never reads as "요즘 뜨는 트렌드".
export function evidenceStrengthLabel(row: {
  articlePresence: number;
  sourceSpread: number;
  change7dArticlePresence?: number | null;
  current7dArticlePresence?: number | null;
  previous7dArticlePresence?: number | null;
}) {
  const risingRecently =
    (row.change7dArticlePresence ?? 0) > 0 ||
    (row.current7dArticlePresence != null && row.previous7dArticlePresence != null && row.current7dArticlePresence > row.previous7dArticlePresence);
  if (row.sourceSpread >= 3 && risingRecently) return "트렌드 상승";
  if (row.sourceSpread >= 3) return "다수 매체 공통";
  if (row.sourceSpread >= 2) return "여러 매체 동시 관찰";
  if (row.articlePresence >= 2) return "특정 매체 집중";
  return "관찰 시작";
}

// No domestic verified STORE source exists yet, so a specific-item detail
// page must never show the legacy market ranking/assortment block as if it
// were domestic evidence. It may only render when at least one row actually
// carries real overseas verified-ranking evidence (END/RAKUTEN_FASHION); an
// empty or assortment-only product list must hide the block entirely rather
// than showing placeholder values like STABLE/INSUFFICIENT_DATA/0.
export function hasVerifiedMarketEvidence(rows: Array<{ rankingVerified: boolean }>): boolean {
  return rows.some((row) => row.rankingVerified);
}

// Editorial mention-level gender evidence copy for user-facing UI. This is
// deliberately separate from planningGenderLabel (used for the UNI/WOMEN
// filter tabs and demand rows) so that changing this wording never touches
// the filter bar or /demand page copy.
export function mentionGenderKoreanLabel(value: string) {
  const labels: Record<string, string> = {
    UNKNOWN: "미상",
    WOMEN: "우먼",
    MEN: "맨",
    MIXED: "혼합",
    UNISEX: "유니섹스"
  };
  return labels[value] ?? value;
}

// Plain-language "왜 이 아이템" evidence lines for a specific-item detail page.
// Every line must be traceable to real EditorialTrendRow fields - no inferred
// or aspirational trend language (see evidenceStrengthLabel above).
export function editorialWhyThisItemLines(row: {
  articlePresence: number;
  sourceSpread: number;
  sources: string[];
  current7dArticlePresence?: number | null;
  current14dArticlePresence?: number | null;
  observation: string;
}): string[] {
  const lines: string[] = [];
  if (row.current14dArticlePresence != null && row.current14dArticlePresence > 0) {
    lines.push(`최근 14일 ${row.current14dArticlePresence}개 기사 등장`);
  }
  if (row.sourceSpread === 1 && row.sources[0]) {
    lines.push(`${sourceLabel(row.sources[0])} 집중 관측`);
  } else if (row.sourceSpread >= 2) {
    lines.push(`${row.sourceSpread}개 매체에서 함께 관측`);
  }
  if (row.observation === "NEWLY_OBSERVED" && (row.current7dArticlePresence ?? 0) > 0) {
    lines.push("최근 7일 신규 등장");
  }
  if (lines.length === 0) lines.push(`누적 ${row.articlePresence}개 기사에서 등장`);
  return lines;
}

export function trendValueLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function planningGenderLabel(value: string) {
  const labels: Record<string, string> = {
    all: "전체",
    uni: "UNI",
    women: "WOMEN",
    UNISEX: "UNI",
    WOMEN: "WOMEN",
    MEN: "MEN",
    MIXED: "MIXED",
    UNKNOWN: "UNKNOWN"
  };
  return labels[value] ?? value;
}
