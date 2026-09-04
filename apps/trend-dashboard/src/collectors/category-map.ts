export type MusinsaCategoryTarget = {
  internalCategory: string;
  label: string;
  keywords: string[];
};

export const musinsaCategoryTargets: MusinsaCategoryTarget[] = [
  { internalCategory: "반팔 티셔츠", label: "Short Sleeve T-Shirt", keywords: ["반팔", "티셔츠", "tee", "t-shirt"] },
  { internalCategory: "긴팔 티셔츠", label: "Long Sleeve T-Shirt", keywords: ["긴팔", "롱슬리브", "long sleeve"] },
  { internalCategory: "스웨트셔츠", label: "Sweatshirt", keywords: ["스웨트", "맨투맨", "sweatshirt"] },
  { internalCategory: "후드", label: "Hoodie", keywords: ["후드", "hood"] },
  { internalCategory: "셔츠", label: "Shirt", keywords: ["셔츠", "shirt"] },
  { internalCategory: "니트", label: "Knit", keywords: ["니트", "knit"] },
  { internalCategory: "아우터", label: "Outer", keywords: ["자켓", "재킷", "점퍼", "outer", "jacket"] },
  { internalCategory: "데님", label: "Denim", keywords: ["데님", "denim"] },
  { internalCategory: "팬츠", label: "Pants", keywords: ["팬츠", "바지", "pants"] },
  { internalCategory: "가방", label: "Bag", keywords: ["가방", "백", "bag"] },
  { internalCategory: "모자", label: "Hat", keywords: ["모자", "캡", "비니", "hat", "cap"] }
];

export function mapMusinsaCategory(rawCategory: string | null | undefined, productName: string) {
  const text = `${rawCategory ?? ""} ${productName}`.toLowerCase();
  const matched = musinsaCategoryTargets.find((target) => target.keywords.some((keyword) => text.includes(keyword.toLowerCase())));
  return matched?.internalCategory ?? rawCategory ?? "기타";
}
