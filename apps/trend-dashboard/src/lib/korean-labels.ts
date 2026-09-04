/**
 * Deterministic Korean display labels for taxonomy values.
 *
 * Bundle names are composed mechanically from these maps - never generated
 * freeform. If a value has no mapping, the raw taxonomy key is shown rather
 * than an invented Korean adjective, so a reader can always tell that the
 * wording came from the data and not from a guess.
 */

const specificItemLabels: Record<string, string> = {
  BODY_BAG: "보디백",
  BACKPACK: "백팩",
  SHOULDER_BAG: "숄더백",
  TOTE_BAG: "토트백",
  TRACK_JACKET: "트랙 재킷",
  COACH_JACKET: "코치 재킷",
  WORK_JACKET: "워크 재킷",
  RINGER_TEE: "링거 티셔츠",
  LONG_SLEEVE_TEE: "긴팔 티셔츠",
  RUGBY_SHIRT: "럭비 셔츠",
  WIDE_DENIM: "와이드 데님",
  WIDE_PANTS: "와이드 팬츠",
  KNIT_BEANIE: "니트 비니",
  CAMP_CAP: "캠프 캡",
  BALL_CAP: "볼캡",
  BUCKET_HAT: "버킷햇"
};

const attributeLabels: Record<string, string> = {
  // MATERIAL
  DENIM: "데님",
  NYLON: "나일론",
  SUEDE: "스웨이드",
  FLEECE: "플리스",
  KNIT: "니트",
  CORDUROY: "코듀로이",
  RECYCLED_FABRIC: "재활용 원단",
  // DETAIL
  PIPING: "파이핑",
  EMBROIDERY: "자수",
  WASHED: "워싱",
  BIG_POCKET: "빅 포켓",
  STRIPE: "스트라이프",
  CHECK: "체크",
  // COLOR
  BLACK: "블랙",
  WHITE: "화이트",
  RED: "레드",
  GREEN: "그린",
  BROWN: "브라운",
  // STYLE
  WORKWEAR: "워크웨어",
  PREPPY: "프레피",
  SPORTY: "스포티",
  GORPCORE: "고프코어",
  OUTDOOR: "아웃도어",
  VINTAGE: "빈티지",
  COLLEGE: "칼리지"
};

const attributeTypeLabels: Record<string, string> = {
  DETAIL: "디테일",
  MATERIAL: "소재",
  COLOR: "컬러",
  STYLE: "스타일",
  SILHOUETTE: "실루엣",
  FINISH: "가공",
  BRAND: "브랜드"
};

export function specificItemKoreanLabel(value: string): string | undefined {
  return specificItemLabels[value];
}

export function attributeKoreanLabel(value: string): string {
  return attributeLabels[value] ?? value.replaceAll("_", " ");
}

export function attributeTypeKoreanLabel(type: string): string {
  return attributeTypeLabels[type] ?? type;
}

/**
 * Composes a planner-readable bundle name: attribute labels in a fixed
 * dimension order, then the item label. "재활용 원단" + TOTE_BAG =>
 * "재활용 원단 토트백". No adjective is added that is not backed by a
 * direct attribute relation.
 */
const DIMENSION_ORDER = ["SILHOUETTE", "FINISH", "MATERIAL", "DETAIL", "COLOR", "STYLE"];

export function composeBundleName(specificItem: string, attributes: Array<{ type: string; value: string }>): string {
  const ordered = [...attributes].sort((a, b) => {
    const rank = (type: string) => {
      const index = DIMENSION_ORDER.indexOf(type);
      return index === -1 ? DIMENSION_ORDER.length : index;
    };
    return rank(a.type) - rank(b.type) || a.value.localeCompare(b.value);
  });
  const itemLabel = specificItemKoreanLabel(specificItem) ?? specificItem.replaceAll("_", " ");
  if (ordered.length === 0) return itemLabel;
  return `${ordered.map((attribute) => attributeKoreanLabel(attribute.value)).join(" ")} ${itemLabel}`;
}
