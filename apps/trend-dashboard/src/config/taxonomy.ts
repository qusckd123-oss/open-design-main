// Presentation-layer taxonomy separation.
// CATEGORY (broad, filter-only) vs SPECIFIC_ITEM (the real trend/planning unit).
// This intentionally does not change any stored DB values (itemType/subItemType/detail/material)
// or collector logic - it only reclassifies existing values for display.

export const broadCategories = ["TOP", "OUTER", "PANTS", "BAG", "HEADWEAR", "OTHER"] as const;
export type BroadCategory = (typeof broadCategories)[number];

export const broadCategoryLabels: Record<BroadCategory, string> = {
  TOP: "상의",
  OUTER: "아우터",
  PANTS: "하의",
  BAG: "가방",
  HEADWEAR: "헤드웨어",
  OTHER: "기타"
};

// Filter chips shown to the user (전체 + the five planning-relevant categories).
export const categoryFilterOptions: Array<{ value: "ALL" | BroadCategory; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "TOP", label: "상의" },
  { value: "OUTER", label: "아우터" },
  { value: "PANTS", label: "하의" },
  { value: "BAG", label: "가방" },
  { value: "HEADWEAR", label: "헤드웨어" }
];

// MarketProduct.itemType (or EditorialMention type=ITEM value) -> broad category.
const itemTypeCategoryMap: Record<string, BroadCategory> = {
  T_SHIRT: "TOP",
  LONG_SLEEVE: "TOP",
  SWEATSHIRT: "TOP",
  HOODIE: "TOP",
  SHIRT: "TOP",
  KNIT: "TOP",
  JACKET: "OUTER",
  WINDBREAKER: "OUTER",
  DENIM: "PANTS",
  PANTS: "PANTS",
  SHORTS: "PANTS",
  SKIRT: "PANTS",
  BAG: "BAG",
  CAP: "HEADWEAR",
  HEADWEAR: "HEADWEAR",
  SHOES: "OTHER",
  ACCESSORY: "OTHER",
  OTHER: "OTHER"
};

// MarketProduct.subItemType (or EditorialMention type=SUB_ITEM value) -> broad category.
const specificItemCategoryMap: Record<string, BroadCategory> = {
  RINGER_TEE: "TOP",
  GRAPHIC_TEE: "TOP",
  STRIPED_TEE: "TOP",
  PIGMENT_TEE: "TOP",
  LOGO_TEE: "TOP",
  BASIC_TEE: "TOP",
  LONG_SLEEVE_TEE: "TOP",
  RUGBY_SHIRT: "TOP",
  OXFORD_SHIRT: "TOP",
  CHECK_SHIRT: "TOP",
  STRIPED_SHIRT: "TOP",
  WORK_SHIRT: "TOP",
  TRACK_JACKET: "OUTER",
  WINDBREAKER: "OUTER",
  COACH_JACKET: "OUTER",
  WORK_JACKET: "OUTER",
  VARSITY_JACKET: "OUTER",
  BARN_JACKET: "OUTER",
  BLOUSON: "OUTER",
  WIDE_PANTS: "PANTS",
  CARGO_PANTS: "PANTS",
  SWEAT_PANTS: "PANTS",
  TRACK_PANTS: "PANTS",
  BERMUDA_SHORTS: "PANTS",
  WIDE_DENIM: "PANTS",
  CURVED_PANTS: "PANTS",
  DOUBLE_KNEE_PANTS: "PANTS",
  NYLON_BAG: "BAG",
  BACKPACK: "BAG",
  BODY_BAG: "BAG",
  SHOULDER_BAG: "BAG",
  MESSENGER_BAG: "BAG",
  TOTE_BAG: "BAG",
  BALL_CAP: "HEADWEAR",
  KNIT_BEANIE: "HEADWEAR",
  CAMP_CAP: "HEADWEAR",
  BUCKET_HAT: "HEADWEAR",
  KEYRING: "OTHER",
  OTHER: "OTHER"
};

export function categoryOfItemType(itemType: string | null | undefined): BroadCategory {
  if (!itemType) return "OTHER";
  return itemTypeCategoryMap[itemType.toUpperCase()] ?? "OTHER";
}

export function categoryOfSpecificItem(specificItem: string | null | undefined, fallbackItemType?: string | null): BroadCategory {
  if (specificItem) {
    const normalized = specificItem.toUpperCase();
    if (specificItemCategoryMap[normalized]) return specificItemCategoryMap[normalized];
  }
  return categoryOfItemType(fallbackItemType);
}

export function isKnownSpecificItem(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toUpperCase();
  return normalized !== "OTHER" && (Boolean(specificItemCategoryMap[normalized]) || normalized in specificItemCategoryMap);
}

export function matchesCategoryFilter(category: BroadCategory, filter: string | null | undefined) {
  if (!filter || filter === "ALL") return true;
  return category === filter;
}
