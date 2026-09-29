export type PublicLookGender = "MEN" | "WOMEN";

export function requireHttpUrl(value: string, label: string): URL {
  if (value.length > 2048) throw new Error(`${label}: URL이 너무 깁니다.`);
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${label}: 올바른 URL을 입력하세요.`); }
  if (!(["https:", "http:"].includes(url.protocol)) || !url.hostname || url.username || url.password) {
    throw new Error(`${label}: 공개 HTTP(S) URL만 허용됩니다.`);
  }
  return url;
}

export function postIdentity(postUrl: string, platform: "INSTAGRAM" | "WEB"): string {
  const url = requireHttpUrl(postUrl, "게시물");
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (platform === "INSTAGRAM") {
    if (host !== "instagram.com" || !/^\/(p|reel|tv)\/[^/]+\/?$/.test(url.pathname)) {
      throw new Error("Instagram 게시물의 정확한 permalink가 필요합니다.");
    }
    return `instagram.com${url.pathname.replace(/\/$/, "")}`;
  }
  return `${host}${url.pathname.replace(/\/$/, "") || "/"}${url.search}`;
}

export function imageIndexOf(value: string): number {
  const index = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(index) || index > 100) throw new Error("이미지 순서는 0~100 사이 정수여야 합니다.");
  return index;
}

export function optionalPublishedDate(value: string): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("발행일 형식이 올바르지 않습니다.");
  const date = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime()) || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date) !== value) {
    throw new Error("발행일이 올바르지 않습니다.");
  }
  return date;
}

export type LookObservationCandidate = {
  id: string;
  sourceAccountId: string;
  imageUrl: string;
  postUrl: string;
  observedAt: Date;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  genderCandidate: "MEN" | "WOMEN" | "UNKNOWN";
};

export type LookClusterCandidate = {
  id: string;
  gender: "MEN" | "WOMEN" | "UNKNOWN";
  title: string;
  summary: string;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  observations: Array<{ observation: LookObservationCandidate }>;
  tags: Array<{ dimension: string; value: string }>;
};

export function publicLookClusters(candidates: LookClusterCandidate[]) {
  return candidates.flatMap((cluster) => {
    if (cluster.status !== "APPROVED" || cluster.gender === "UNKNOWN") return [];
    const observations = cluster.observations.map(({ observation }) => observation)
      .filter((row) => row.reviewStatus === "APPROVED" && row.genderCandidate === cluster.gender)
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime() || a.id.localeCompare(b.id));
    const accountCount = new Set(observations.map((row) => row.sourceAccountId)).size;
    if (accountCount < 2) return [];
    return [{ id: cluster.id, gender: cluster.gender as PublicLookGender, title: cluster.title, summary: cluster.summary,
      accountCount, observationCount: observations.length, latestObservedAt: observations[0]!.observedAt,
      images: observations.slice(0, 4).map((row) => ({ id: row.id, imageUrl: row.imageUrl, postUrl: row.postUrl })),
      tags: cluster.tags.map((tag) => ({ dimension: tag.dimension, value: tag.value })) }];
  }).sort((a, b) => b.latestObservedAt.getTime() - a.latestObservedAt.getTime() || b.accountCount - a.accountCount || a.id.localeCompare(b.id));
}
