import { normalizeItemType, normalizeSubItemType } from "@/config/item-types";
import type { MarketMetricType, RankingCategory, RankingScope } from "@/config/market-category-map";
import type { MarketSource } from "@/config/market-sources";
import type { MarketCollectedProduct } from "@/collectors/market/types";

export type RawShopifyProduct = {
  id: number | string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  images?: Array<{ src?: string }>;
  variants?: Array<{ price?: string; compare_at_price?: string | null }>;
};

export function normalizeShopifyProduct(input: {
  raw: RawShopifyProduct;
  source: MarketSource;
  baseUrl: string;
  metricType: MarketMetricType;
  rankingVerified: boolean;
  rankingScope: RankingScope;
  sourcePosition: number;
  rank?: number | null;
  rankingCategory: RankingCategory;
  periodDate: Date;
  audienceSegment: string;
}): MarketCollectedProduct {
  const { raw, source, baseUrl, metricType, rankingVerified, rankingScope, sourcePosition, rank, rankingCategory, periodDate, audienceSegment } = input;
  if (!raw.id && !raw.handle) throw new Error("Missing Shopify product id.");
  if (!raw.title) throw new Error("Missing product title.");
  const vendor = raw.vendor?.trim() || source;
  const url = new URL(`/products/${raw.handle}`, baseUrl).toString();
  const text = [raw.title, raw.product_type, ...(raw.tags ?? [])].join(" ");
  const price = parsePrice(raw.variants?.[0]?.compare_at_price);
  const salePrice = parsePrice(raw.variants?.[0]?.price);

  return {
    source,
    externalProductId: String(raw.id || raw.handle),
    brand: vendor,
    name: raw.title.trim(),
    url,
    imageUrl: raw.images?.[0]?.src ?? null,
    metricType,
    rankingVerified,
    rankingScope,
    sourcePosition,
    rank: rankingVerified ? rank ?? sourcePosition : null,
    rankingCategory,
    observedCategory: rankingCategory,
    audienceSegment,
    periodDate,
    category: rankingCategory,
    price,
    salePrice,
    discountRate: price && salePrice && price > salePrice ? Math.round(((price - salePrice) / price) * 100) : null,
    itemType: normalizeItemType(null, textForCategory(rankingCategory, text)),
    subItemType: normalizeSubItemType(null, text),
    mainColor: extractColor(text),
    graphicType: extractGraphicType(text),
    detail: extractDetail(text),
    style: extractStyle(text),
    gender: extractGender(text),
    rawData: JSON.stringify({
      id: raw.id,
      handle: raw.handle,
      vendor: raw.vendor,
      title: raw.title,
      product_type: raw.product_type,
      tags: raw.tags?.slice(0, 30)
    })
  };
}

export function canonicalizeMarketUrl(url: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/g, "");
    return parsed.toString();
  } catch {
    return url.trim().replace(/[?#].*$/g, "").replace(/\/+$/g, "");
  }
}

function textForCategory(category: RankingCategory, text: string) {
  const hints: Record<RankingCategory, string> = {
    SHORT_SLEEVE_TSHIRT: "t-shirt tee",
    LONG_SLEEVE_TSHIRT: "long sleeve",
    SWEATSHIRT: "sweatshirt",
    HOODIE: "hoodie",
    SHIRT: "shirt",
    JACKET: "jacket outerwear",
    PANTS: "pants trousers denim",
    SHORTS: "shorts",
    BAG: "bag backpack pouch",
    HEADWEAR: "cap hat beanie"
  };
  return `${text} ${hints[category]}`;
}

function parsePrice(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function extractColor(text: string) {
  const value = text.toLowerCase();
  const colors: Array<[string, string[]]> = [
    ["Black", ["black", "nero"]],
    ["White", ["white", "natural", "ivory"]],
    ["Grey", ["grey", "gray", "ash", "silver"]],
    ["Navy", ["navy"]],
    ["Blue", ["blue", "indigo"]],
    ["Green", ["green", "olive", "sage"]],
    ["Brown", ["brown", "tan", "khaki"]],
    ["Red", ["red", "burgundy"]],
    ["Pink", ["pink"]],
    ["Yellow", ["yellow"]]
  ];
  return colors.find(([, aliases]) => aliases.some((alias) => value.includes(alias)))?.[0] ?? null;
}

function extractGraphicType(text: string) {
  const value = text.toLowerCase();
  if (value.includes("graphic") || value.includes("print")) return "Print";
  if (value.includes("logo")) return "Logo";
  if (value.includes("stripe")) return "Stripe";
  if (value.includes("embroid")) return "Embroidery";
  return null;
}

function extractDetail(text: string) {
  const value = text.toLowerCase();
  if (value.includes("ringer")) return "Ringer";
  if (value.includes("zip")) return "Zip";
  if (value.includes("pocket")) return "Pocket";
  if (value.includes("washed")) return "Washed";
  if (value.includes("cargo")) return "Cargo Pocket";
  return null;
}

function extractStyle(text: string) {
  const value = text.toLowerCase();
  if (value.includes("skate") || value.includes("street")) return "Street";
  if (value.includes("sport") || value.includes("track")) return "Sport";
  if (value.includes("work")) return "Workwear";
  return null;
}

function extractGender(text: string) {
  const value = text.toLowerCase();
  if (value.includes("women")) return "WOMEN";
  if (value.includes("men")) return "MEN";
  return "UNISEX";
}
