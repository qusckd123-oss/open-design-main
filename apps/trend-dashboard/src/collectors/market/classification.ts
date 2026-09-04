import { normalizeItemType, normalizeSubItemType } from "@/config/item-types";
import type { RankingCategory } from "@/config/market-category-map";

const categoryItemType: Record<RankingCategory, string> = {
  SHORT_SLEEVE_TSHIRT: "T_SHIRT",
  LONG_SLEEVE_TSHIRT: "LONG_SLEEVE",
  SWEATSHIRT: "SWEATSHIRT",
  HOODIE: "HOODIE",
  SHIRT: "SHIRT",
  JACKET: "JACKET",
  PANTS: "PANTS",
  SHORTS: "SHORTS",
  BAG: "BAG",
  HEADWEAR: "CAP"
};

const allowedSubItems: Partial<Record<RankingCategory, Set<string>>> = {
  BAG: new Set(["OTHER", "BACKPACK", "NYLON_BAG", "KEYRING"]),
  HEADWEAR: new Set(["OTHER", "BALL_CAP"]),
  PANTS: new Set(["OTHER", "WIDE_PANTS", "CARGO_PANTS", "SWEAT_PANTS", "TRACK_PANTS"]),
  SHORT_SLEEVE_TSHIRT: new Set(["OTHER", "RINGER_TEE", "GRAPHIC_TEE", "STRIPED_TEE", "PIGMENT_TEE", "LOGO_TEE", "BASIC_TEE"]),
  LONG_SLEEVE_TSHIRT: new Set(["OTHER", "RINGER_TEE", "GRAPHIC_TEE", "STRIPED_TEE", "PIGMENT_TEE", "LOGO_TEE", "BASIC_TEE"]),
  JACKET: new Set(["OTHER", "TRACK_JACKET", "WINDBREAKER", "COACH_JACKET", "WORK_JACKET"])
};

export function refineObservedCategory(input: { observedCategory: RankingCategory; text: string; sourceCategoryText?: string | null }): RankingCategory {
  const sourceText = normalizeText(input.sourceCategoryText ?? "");
  const text = normalizeText(input.text);
  const base = input.observedCategory;

  if (sourceText) {
    if (hasShortSleeve(sourceText)) return "SHORT_SLEEVE_TSHIRT";
    if (hasLongSleeve(sourceText)) return "LONG_SLEEVE_TSHIRT";
  }

  if (base === "SHORT_SLEEVE_TSHIRT" && hasLongSleeve(text) && !hasShortSleeve(text)) return "LONG_SLEEVE_TSHIRT";
  if (base === "LONG_SLEEVE_TSHIRT" && hasShortSleeve(text) && !hasLongSleeve(text)) return "SHORT_SLEEVE_TSHIRT";
  return base;
}

export function classifyMarketAttributes(input: { observedCategory: RankingCategory; text: string; sourceCategoryText?: string | null; explicitSubItemType?: string | null }) {
  const observedCategory = refineObservedCategory(input);
  const text = normalizeText(input.text);
  const itemType = categoryItemType[observedCategory] ?? normalizeItemType(null, text);
  const rawSubItem = input.explicitSubItemType && input.explicitSubItemType !== "OTHER" ? input.explicitSubItemType : normalizeSubItemType(null, text);
  const subItemType = validateSubItemForCategory(observedCategory, rawSubItem, text);
  return { observedCategory, itemType, subItemType };
}

export function validateSubItemForCategory(category: RankingCategory, subItemType: string | null | undefined, text = "") {
  const normalized = subItemType ?? "OTHER";
  if (category === "BAG") return bagSubItem(text);
  if (category === "HEADWEAR") return headwearSubItem(text);
  const allowed = allowedSubItems[category];
  if (allowed && !allowed.has(normalized)) return "OTHER";
  return normalized;
}

function bagSubItem(text: string) {
  const value = normalizeText(text);
  if (/backpack|バックパック|リュック/.test(value)) return "BACKPACK";
  if (/nylon|ナイロン/.test(value)) return "NYLON_BAG";
  if (/keyring|キーリング/.test(value)) return "KEYRING";
  if (/backpack|バックパック|リュック/.test(value)) return "BACKPACK";
  if (/nylon|ナイロン/.test(value)) return "NYLON_BAG";
  if (/keyring|キーリング|チャーム/.test(value)) return "KEYRING";
  return "OTHER";
}

function headwearSubItem(text: string) {
  const value = normalizeText(text);
  if (/cap|キャップ|帽子|ハット|beanie|ビーニー/.test(value)) return "BALL_CAP";
  if (/cap|キャップ|帽子|ハット|beanie|ビーニー/.test(value)) return "BALL_CAP";
  return "OTHER";
}

function hasLongSleeve(text: string) {
  if (/long sleeve|long-sleeve|\bl\/s\b|長袖|ロングスリーブ|ロンt|long tee/.test(text)) return true;
  return /long sleeve|long-sleeve|\bl\/s\b|長袖|ロングスリーブ|ロンt|long tee/.test(text);
}

function hasShortSleeve(text: string) {
  if (/short sleeve|short-sleeve|\bs\/s\b|半袖/.test(text)) return true;
  return /short sleeve|short-sleeve|\bs\/s\b|半袖/.test(text);
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[Ｔｔ]/g, "t");
}
