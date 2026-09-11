export const PRODUCT_GROUP_BY_CATEGORY = Object.freeze({
  CD: "APP", CR: "APP", DP: "APP", HD: "APP", HZ: "APP", JK: "APP", KT: "APP", LT: "APP",
  OP: "APP", PT: "APP", SH: "APP", SO: "APP", SR: "APP", SS: "APP", ST: "APP",
  BG: "ACC", BP: "ACC", CA: "ACC", CB: "ACC", EC: "ACC", JW: "ACC", MU: "ACC", SE: "ACC",
  SK: "ACC", SN: "ACC", TC: "ACC",
});

export function styleCategory(styleCode: unknown) {
  const match = /^WA\d{4}([A-Z]{2})/i.exec(String(styleCode || "").toUpperCase());
  return match?.[1] || "";
}

export function styleSeason(styleCode: unknown) {
  const match = /^WA(\d{2})(\d{2})/i.exec(String(styleCode || "").toUpperCase());
  if (!match) return "UNKNOWN";
  return `${match[1]}${Number(match[2]) >= 3 ? "FW" : "SS"}`;
}

export function productGroupForCategory(category: unknown) {
  return PRODUCT_GROUP_BY_CATEGORY[String(category || "").toUpperCase() as keyof typeof PRODUCT_GROUP_BY_CATEGORY] || "UNMAPPED";
}

export function genderGroupFor({ gender, name }: { gender?: unknown; name?: unknown }) {
  const normalized = String(gender || "").toUpperCase();
  if (normalized === "UNISEX") return "UNISEX";
  if (["WOMEN", "WOMENS", "WOMAN"].includes(normalized)) return "WOMENS";
  const productName = String(name || "").toUpperCase();
  if (productName.includes("\uC6B0\uBA3C\uC2A4") || productName.includes("\uC6B0\uBA3C") || productName.includes("WOMENS") || productName.includes("WOMEN")) return "WOMENS";
  return "UNMAPPED";
}

export function styleGender(name: unknown) {
  return genderGroupFor({ name }) === "WOMENS" ? "WOMEN" : "UNISEX";
}
