import type { NaverKeywordSeed } from "@/collectors/naver/types";

// Keyword aliases are only added once real Korean search-intent phrasing is
// confirmed for the mapping - see docs/KOREA_SOURCE_AUDIT.md and the
// specific-item extraction coverage audit for the taxonomy this links to.
// specificItem/planningGender are intentionally left unset for keywords that
// don't map cleanly to one SPECIFIC_ITEM yet (kept as "TOP"/"BOTTOM"/"ACCESSORY"
// legacy category only) - see src/config/taxonomy.ts for the taxonomy this
// links to, and section 10's warning list (too-broad or dual-meaning terms
// like "트랙", "코치", "캡" are never used as bare standalone keywords).
export const fashionKeywordSeeds: NaverKeywordSeed[] = [
  { name: "그래픽 반팔", category: "TOP", aliases: ["그래픽 티셔츠", "그래픽 반팔티", "graphic tee"], specificItem: "GRAPHIC_TEE", planningGender: "UNISEX" },
  { name: "링거티", category: "TOP", aliases: ["링거 티", "링거티셔츠", "ringer tee"], specificItem: "RINGER_TEE", planningGender: "UNISEX" },
  { name: "풋볼져지", category: "TOP", aliases: ["풋볼 저지", "football jersey"], specificItem: "FOOTBALL_JERSEY", planningGender: "UNISEX" },
  { name: "럭비티", category: "TOP", aliases: ["럭비 티", "rugby shirt"], specificItem: "RUGBY_SHIRT", planningGender: "UNISEX" },
  { name: "스트라이프티", category: "TOP", aliases: ["스트라이프 티셔츠", "stripe tee"], specificItem: "STRIPED_TEE", planningGender: "UNISEX" },
  { name: "피그먼트티", category: "TOP", aliases: ["피그먼트 티셔츠", "pigment tee"] },
  { name: "긴팔 티셔츠", category: "TOP", aliases: ["롱슬리브 티셔츠", "롱슬리브", "long sleeve tee"], specificItem: "LONG_SLEEVE_TEE", planningGender: "UNISEX" },
  { name: "후드집업", category: "TOP", aliases: ["후드 집업", "zip hoodie"] },
  { name: "트랙자켓", category: "TOP", aliases: ["트랙 자켓", "track jacket"], specificItem: "TRACK_JACKET", planningGender: "UNISEX" },
  { name: "바람막이", category: "TOP", aliases: ["윈드브레이커", "windbreaker"], specificItem: "WINDBREAKER", planningGender: "UNISEX" },
  { name: "체크셔츠", category: "TOP", aliases: ["체크 셔츠", "check shirt"] },
  { name: "오버핏셔츠", category: "TOP", aliases: ["오버핏 셔츠", "oversized shirt"] },
  { name: "버뮤다팬츠", category: "BOTTOM", aliases: ["버뮤다 팬츠", "bermuda pants"], specificItem: "BERMUDA_SHORTS", planningGender: "UNISEX" },
  { name: "카고팬츠", category: "BOTTOM", aliases: ["카고 팬츠", "cargo pants"], specificItem: "CARGO_PANTS", planningGender: "UNISEX" },
  { name: "와이드팬츠", category: "BOTTOM", aliases: ["와이드 팬츠", "wide pants"], specificItem: "WIDE_PANTS", planningGender: "UNISEX" },
  { name: "스웻팬츠", category: "BOTTOM", aliases: ["스웨트팬츠", "sweat pants"] },
  { name: "트랙팬츠", category: "BOTTOM", aliases: ["트랙 팬츠", "track pants"] },
  { name: "워싱데님", category: "BOTTOM", aliases: ["워싱 데님", "washed denim"] },
  { name: "벌룬팬츠", category: "BOTTOM", aliases: ["벌룬 팬츠", "balloon pants"] },
  { name: "백팩", category: "ACCESSORY", aliases: ["backpack", "학생 백팩"], specificItem: "BACKPACK", planningGender: "UNISEX" },
  { name: "숄더백", category: "ACCESSORY", aliases: ["숄더 백", "shoulder bag"], specificItem: "SHOULDER_BAG", planningGender: "UNISEX" },
  { name: "토트백", category: "ACCESSORY", aliases: ["토트 백", "tote bag"], specificItem: "TOTE_BAG", planningGender: "UNISEX" },
  { name: "크로스백", category: "ACCESSORY", aliases: ["크로스 백", "cross bag"] },
  { name: "나일론백", category: "ACCESSORY", aliases: ["나일론 백", "nylon bag"] },
  { name: "볼캡", category: "ACCESSORY", aliases: ["볼 캡", "ball cap", "baseball cap"], specificItem: "BALL_CAP", planningGender: "UNISEX" },
  { name: "비니", category: "ACCESSORY", aliases: ["beanie", "니트 비니"], specificItem: "KNIT_BEANIE", planningGender: "UNISEX" },
  { name: "키링", category: "ACCESSORY", aliases: ["keyring", "키 링"] },
  { name: "백참", category: "ACCESSORY", aliases: ["백 참", "bag charm"] }
];
