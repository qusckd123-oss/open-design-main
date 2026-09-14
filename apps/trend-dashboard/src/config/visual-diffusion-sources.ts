/**
 * VISUAL DIFFUSION SOURCE REGISTRY (2026-09-14)
 *
 * Human-curated registry of accounts (currently all Instagram) a planner
 * watches for repeated visual/styling context - NEVER a collector, NEVER
 * automated. Design origin: docs/TREND_RESEARCH_SOURCE_REGISTRY.md Section
 * 6 (`VisualDiffusionSourceConfig`) and Section 11, which previously tracked
 * the same 6 accounts only in a Markdown table. This file is now the single
 * source of truth for the account list itself; Section 11 keeps the
 * original approval history/reasoning and should not be re-duplicated here.
 *
 * Structurally isolated, same precedent as editorialSourceConfigs/
 * marketSources:
 * - Never imported by attribute-bundle-service.ts, extractDirectAttributeRelations,
 *   or any ranking/DB-write code path - grep this file's name before adding
 *   an import from either of those.
 * - No image is ever fetched, cached, or persisted from any of these
 *   accounts by any code in this repo. An entry here is a pointer a human
 *   reviewer manually visits in their own browser, nothing more.
 * - `relatedEditorialSource` stays optional/nullable, human-set metadata
 *   only - see the NONLABEL web/Instagram boundary in
 *   TREND_RESEARCH_SOURCE_REGISTRY.md Section 5. It must never cause an
 *   Instagram reference to be treated as text-verified direct evidence.
 */

export const visualDiffusionPlatforms = ["INSTAGRAM", "WEB_MAGAZINE", "OTHER"] as const;
export type VisualDiffusionPlatform = (typeof visualDiffusionPlatforms)[number];

export const visualDiffusionCollectionMethods = ["MANUAL_CURATION", "OFFICIAL_API_AUTHORIZED", "OFFICIAL_EMBED_ONLY"] as const;
export type VisualDiffusionCollectionMethod = (typeof visualDiffusionCollectionMethods)[number];

export type VisualDiffusionSourceConfig = {
  id: string;
  platform: VisualDiffusionPlatform;
  handle: string;
  profileUrl: string;
  role: string[];
  collectionMethod: VisualDiffusionCollectionMethod;
  relatedEditorialSource: string | null;
  note: string;
};

export const visualDiffusionSourceConfigs: VisualDiffusionSourceConfig[] = [
  {
    id: "IG_FASHION_PLATFORM_SEOUL",
    platform: "INSTAGRAM",
    handle: "@fashion_platform_seoul",
    profileUrl: "https://www.instagram.com/fashion_platform_seoul/",
    role: ["STYLING_REFERENCE", "CURATION"],
    collectionMethod: "MANUAL_CURATION",
    relatedEditorialSource: null,
    note: "사용자 직접 확인. \"패플서\", 234K 팔로워 - 패션 큐레이션 플랫폼, 아웃핏/제품 픽 콘텐츠. 자매 계정 @fashion_curator_seoul을 자체 bio에서 직접 언급."
  },
  {
    id: "IG_JENTESTORE",
    platform: "INSTAGRAM",
    handle: "@jentestore",
    profileUrl: "https://www.instagram.com/jentestore/",
    role: ["STYLING_REFERENCE", "CURATION"],
    collectionMethod: "MANUAL_CURATION",
    relatedEditorialSource: null,
    note: "사용자 직접 확인. \"젠테스토어\", 71K 팔로워 - 패션 큐레이션 플랫폼, 연계 쇼핑몰 있음."
  },
  {
    id: "IG_XXPICK",
    platform: "INSTAGRAM",
    handle: "@_xxpick",
    profileUrl: "https://www.instagram.com/_xxpick/",
    role: ["STYLING_REFERENCE", "CURATION"],
    collectionMethod: "MANUAL_CURATION",
    relatedEditorialSource: null,
    note: "사용자 직접 확인. \"엑세스픽\", 88K 팔로워 - 에디터 계정, 아웃핏/제품 픽 콘텐츠."
  },
  {
    id: "IG_HUMANRETROGIRL",
    platform: "INSTAGRAM",
    handle: "@humanretrogirl",
    profileUrl: "https://www.instagram.com/humanretrogirl/",
    role: ["STYLING_REFERENCE", "CURATION"],
    collectionMethod: "MANUAL_CURATION",
    relatedEditorialSource: null,
    note: "사용자 직접 확인. \"휴레걸의 패션매거진\", 64K 팔로워 - 스타일링 라운드업/위시리스트 콘텐츠."
  },
  {
    id: "IG_FASHION_CURATOR_SEOUL",
    platform: "INSTAGRAM",
    handle: "@fashion_curator_seoul",
    profileUrl: "https://www.instagram.com/fashion_curator_seoul/",
    role: ["STYLING_REFERENCE", "CURATION"],
    collectionMethod: "MANUAL_CURATION",
    relatedEditorialSource: null,
    note: "2026-09-14 조사 후 사용자 승인. \"패큐서\", 61K 팔로워 - @fashion_platform_seoul의 자매 계정(그쪽 bio에 직접 언급됨). 큐레이션 아웃핏/제품 픽, 무신사 링크 연계."
  },
  {
    id: "IG_CELEB_FASHION_MAGAZINE",
    platform: "INSTAGRAM",
    handle: "@celeb_fashion_magazine",
    profileUrl: "https://www.instagram.com/celeb_fashion_magazine/",
    role: ["STYLING_REFERENCE", "CURATION"],
    collectionMethod: "MANUAL_CURATION",
    relatedEditorialSource: null,
    note: "2026-09-14 조사 후 사용자 승인. \"셀패진\", 864K 팔로워 - 셀럽 패션/뷰티/트렌드 디지털 매거진."
  }
];

export function visualDiffusionSourceById(id: string): VisualDiffusionSourceConfig | undefined {
  return visualDiffusionSourceConfigs.find((source) => source.id === id);
}
