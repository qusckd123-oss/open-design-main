export const itemTypes = [
  "T_SHIRT",
  "LONG_SLEEVE",
  "SWEATSHIRT",
  "HOODIE",
  "SHIRT",
  "KNIT",
  "JACKET",
  "WINDBREAKER",
  "DENIM",
  "PANTS",
  "SHORTS",
  "SKIRT",
  "BAG",
  "CAP",
  "SHOES",
  "ACCESSORY",
  "OTHER"
] as const;

export type ItemType = (typeof itemTypes)[number];

export const itemTypeLabels: Record<ItemType, string> = {
  T_SHIRT: "T-Shirt",
  LONG_SLEEVE: "Long Sleeve",
  SWEATSHIRT: "Sweatshirt",
  HOODIE: "Hoodie",
  SHIRT: "Shirt",
  KNIT: "Knit",
  JACKET: "Jacket",
  WINDBREAKER: "Windbreaker",
  DENIM: "Denim",
  PANTS: "Pants",
  SHORTS: "Shorts",
  SKIRT: "Skirt",
  BAG: "Bag",
  CAP: "Cap",
  SHOES: "Shoes",
  ACCESSORY: "Accessory",
  OTHER: "Other"
};

const itemTypeAliases: Array<[ItemType, string[]]> = [
  ["T_SHIRT", ["반팔", "티셔츠", "t-shirt", "tee", "링거", "그래픽"]],
  ["LONG_SLEEVE", ["긴팔", "long sleeve"]],
  ["SWEATSHIRT", ["스웨트", "맨투맨", "sweatshirt"]],
  ["HOODIE", ["후드", "hoodie"]],
  ["SHIRT", ["셔츠", "shirt"]],
  ["KNIT", ["니트", "knit"]],
  ["WINDBREAKER", ["바람막이", "windbreaker"]],
  ["JACKET", ["자켓", "재킷", "jacket", "트랙"]],
  ["DENIM", ["데님", "denim", "jean"]],
  ["SHORTS", ["버뮤다", "쇼츠", "short"]],
  ["PANTS", ["팬츠", "pants", "슬랙스", "카고", "와이드"]],
  ["BAG", ["백팩", "가방", "백", "bag", "크로스"]],
  ["CAP", ["볼캡", "캡", "모자", "cap", "비니"]],
  ["SHOES", ["슈즈", "운동화", "shoes", "sneakers"]],
  ["ACCESSORY", ["키링", "백참", "액세서리", "accessory"]]
];

export function normalizeItemType(value: string | null | undefined, fallbackText = ""): ItemType {
  const raw = `${value ?? ""} ${fallbackText}`.toLowerCase();
  const direct = itemTypes.find((itemType) => itemType.toLowerCase() === String(value ?? "").toLowerCase());
  if (direct) return direct;
  return itemTypeAliases.find(([, aliases]) => aliases.some((alias) => raw.includes(alias.toLowerCase())))?.[0] ?? "OTHER";
}

export function itemTypeLabel(value: string | null | undefined) {
  const itemType = normalizeItemType(value);
  return itemTypeLabels[itemType];
}

export const subItemTypeLabels: Record<string, string> = {
  GRAPHIC_TEE: "Graphic Tee",
  RINGER_TEE: "Ringer Tee",
  STRIPED_TEE: "Striped Tee",
  PIGMENT_TEE: "Pigment Tee",
  LOGO_TEE: "Logo Tee",
  BASIC_TEE: "Basic Tee",
  OXFORD_SHIRT: "Oxford Shirt",
  CHECK_SHIRT: "Check Shirt",
  STRIPED_SHIRT: "Striped Shirt",
  WORK_SHIRT: "Work Shirt",
  TRACK_JACKET: "Track Jacket",
  WINDBREAKER: "Windbreaker",
  COACH_JACKET: "Coach Jacket",
  WORK_JACKET: "Work Jacket",
  WIDE_PANTS: "Wide Pants",
  CARGO_PANTS: "Cargo Pants",
  SWEAT_PANTS: "Sweat Pants",
  TRACK_PANTS: "Track Pants",
  BERMUDA_SHORTS: "Bermuda Shorts",
  NYLON_BAG: "Nylon Bag",
  BACKPACK: "Backpack",
  BALL_CAP: "Ball Cap",
  KEYRING: "Keyring",
  OTHER: "Other"
};

const subItemAliases: Array<[string, string[]]> = [
  ["RINGER_TEE", ["링거", "ringer"]],
  ["GRAPHIC_TEE", ["그래픽", "graphic", "캐릭터", "character"]],
  ["STRIPED_TEE", ["스트라이프", "stripe"]],
  ["PIGMENT_TEE", ["피그먼트", "pigment", "washed"]],
  ["LOGO_TEE", ["로고", "logo"]],
  ["OXFORD_SHIRT", ["옥스포드", "oxford"]],
  ["CHECK_SHIRT", ["체크", "check"]],
  ["STRIPED_SHIRT", ["스트라이프 셔츠", "striped shirt"]],
  ["WORK_SHIRT", ["워크 셔츠", "work shirt"]],
  ["TRACK_JACKET", ["트랙", "track jacket"]],
  ["WINDBREAKER", ["바람막이", "windbreaker", "nylon jacket"]],
  ["COACH_JACKET", ["코치", "coach"]],
  ["WORK_JACKET", ["워크 자켓", "work jacket"]],
  ["WIDE_PANTS", ["와이드", "wide"]],
  ["CARGO_PANTS", ["카고", "cargo"]],
  ["SWEAT_PANTS", ["스웻팬츠", "sweat pants"]],
  ["TRACK_PANTS", ["트랙팬츠", "track pants"]],
  ["BERMUDA_SHORTS", ["버뮤다", "bermuda"]],
  ["NYLON_BAG", ["나일론백", "nylon bag"]],
  ["BACKPACK", ["백팩", "backpack"]],
  ["BALL_CAP", ["볼캡", "ball cap"]],
  ["KEYRING", ["키링", "keyring", "백참", "bag charm"]]
];

export function normalizeSubItemType(value: string | null | undefined, fallbackText = "") {
  const direct = String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (direct && subItemTypeLabels[direct]) return direct;
  const text = `${value ?? ""} ${fallbackText}`.toLowerCase();
  return subItemAliases.find(([, aliases]) => aliases.some((alias) => text.includes(alias.toLowerCase())))?.[0] ?? "OTHER";
}

export function subItemTypeLabel(value: string | null | undefined) {
  const normalized = normalizeSubItemType(value);
  return subItemTypeLabels[normalized] ?? normalized;
}
