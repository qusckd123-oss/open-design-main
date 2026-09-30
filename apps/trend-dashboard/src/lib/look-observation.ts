export type PublicLookGender = "MEN" | "WOMEN";
export type LookPlatformCode = "INSTAGRAM" | "WEB" | "MUSINSA_STYLE" | "OTHER_WEB";
export type LookObservationTypeCode = "REAL_WEAR" | "CURATED_LOOK" | "STYLE_MEDIA";

export function normalizeInstagramHandle(value: string): string {
  const handle = value.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_](?:[a-z0-9._]{0,28}[a-z0-9_])?$/.test(handle) || handle.includes("..")) {
    throw new Error("Instagram 계정명은 @ 없이 영문·숫자·점·밑줄 1~30자로 입력하세요.");
  }
  return handle;
}

export function instagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${normalizeInstagramHandle(handle)}/`;
}

export function validateInstagramProfile(profileUrl: string, handle: string): string {
  const url = requireHttpUrl(profileUrl, "프로필");
  if (url.hostname.toLowerCase().replace(/^www\./, "") !== "instagram.com" ||
      url.pathname.replace(/^\//, "").replace(/\/$/, "").toLowerCase() !== normalizeInstagramHandle(handle) ||
      url.search || url.hash) throw new Error("프로필 URL의 Instagram 계정명이 입력한 계정명과 일치해야 합니다.");
  return profileUrl;
}

export function requireHttpUrl(value: string, label: string): URL {
  if (value.length > 2048) throw new Error(`${label}: URL이 너무 깁니다.`);
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${label}: 올바른 URL을 입력하세요.`); }
  if (!(["https:", "http:"].includes(url.protocol)) || !url.hostname || url.username || url.password) {
    throw new Error(`${label}: 공개 HTTP(S) URL만 허용됩니다.`);
  }
  return url;
}

export function postIdentity(postUrl: string, platform: LookPlatformCode): string {
  const url = requireHttpUrl(postUrl, "게시물");
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (platform === "INSTAGRAM") {
    if (host !== "instagram.com" || !/^\/(p|reel|tv)\/[^/]+\/?$/.test(url.pathname)) {
      throw new Error("Instagram 게시물의 정확한 permalink가 필요합니다.");
    }
    return `instagram.com${url.pathname.replace(/\/$/, "")}`;
  }
  if (platform === "MUSINSA_STYLE" && (host !== "musinsa.com" || !/^\/content\/\d+\/?$/.test(url.pathname))) {
    throw new Error("무신사 STYLE의 정확한 /content/<번호> URL이 필요합니다.");
  }
  if (platform === "MUSINSA_STYLE") return `${host}${url.pathname.replace(/\/$/, "")}`;
  if (platform === "OTHER_WEB" && (host === "musinsa.com" || host === "instagram.com")) {
    throw new Error("무신사·Instagram URL은 해당 플랫폼 소스로 등록하세요.");
  }
  return `${host}${url.pathname.replace(/\/$/, "") || "/"}${url.search}`;
}

export function manualLookImageRows(values: string[]): Array<{ imageUrl: string; imageIndex: number }> {
  if (values.length < 1 || values.length > 10) throw new Error("한 게시물에는 이미지 URL 1~10개를 입력하세요.");
  const seen = new Set<string>();
  return values.map((value, imageIndex) => {
    const imageUrl = value.trim();
    const url = requireHttpUrl(imageUrl, "이미지");
    const identity = `${url.hostname.toLowerCase()}${url.pathname}${url.search}`;
    if (seen.has(identity)) throw new Error("한 게시물에서 같은 이미지 URL을 중복 등록할 수 없습니다.");
    seen.add(identity);
    return { imageUrl, imageIndex };
  });
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
  platform: LookPlatformCode;
  postIdentity: string;
  observationType: LookObservationTypeCode | null;
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
    const countType = (type: LookObservationTypeCode) => observations.filter((row) => row.observationType === type);
    const realWear = countType("REAL_WEAR");
    const curatedLook = countType("CURATED_LOOK");
    const styleMedia = countType("STYLE_MEDIA");
    const postCount = (rows: LookObservationCandidate[]) => new Set(rows.map((row) => `${row.platform}:${row.postIdentity}`)).size;
    return [{ id: cluster.id, gender: cluster.gender as PublicLookGender, title: cluster.title, summary: cluster.summary,
      accountCount, observationCount: observations.length, latestObservedAt: observations[0]!.observedAt,
      realWear: { observations: realWear.length, instagramAccounts: new Set(realWear.filter((row) => row.platform === "INSTAGRAM").map((row) => row.sourceAccountId)).size, posts: postCount(realWear) },
      curatedLook: { observations: curatedLook.length, posts: postCount(curatedLook) },
      styleMedia: { observations: styleMedia.length, posts: postCount(styleMedia) },
      unclassified: observations.filter((row) => row.observationType === null).length,
      images: observations.slice(0, 4).map((row) => ({ id: row.id, imageUrl: row.imageUrl, postUrl: row.postUrl, observationType: row.observationType })),
      tags: cluster.tags.map((tag) => ({ dimension: tag.dimension, value: tag.value })) }];
  }).sort((a, b) => b.latestObservedAt.getTime() - a.latestObservedAt.getTime() || b.realWear.instagramAccounts - a.realWear.instagramAccounts || b.accountCount - a.accountCount || a.id.localeCompare(b.id));
}
