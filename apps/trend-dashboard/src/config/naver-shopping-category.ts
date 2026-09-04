export const naverShoppingCategories = {
  fashionApparel: {
    code: "50000000",
    label: "패션의류"
  },
  fashionAccessory: {
    code: "50000001",
    label: "패션잡화"
  }
} as const;

const accessoryKeywords = new Set(["백팩", "크로스백", "나일론백", "볼캡", "비니", "키링", "백참"]);

export function defaultNaverShoppingCategory(keywordName: string) {
  return accessoryKeywords.has(keywordName) ? naverShoppingCategories.fashionAccessory.code : naverShoppingCategories.fashionApparel.code;
}
