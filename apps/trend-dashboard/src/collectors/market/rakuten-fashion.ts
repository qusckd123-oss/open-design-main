import { getSourceCategoryUrl, type RankingCategory } from "@/config/market-category-map";
import type { MarketSource } from "@/config/market-sources";
import { classifyMarketAttributes } from "@/collectors/market/classification";
import { marketCollectorUserAgent, verifyRobotsAllowed } from "@/collectors/market/robots";
import type { MarketCollectedProduct, MarketCollectOptions, MarketCollectionError, MarketCollectionResult, MarketCollector } from "@/collectors/market/types";

type RakutenRankingListItem = {
  externalProductId: string;
  url: string;
  rank: number;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  salePrice: number | null;
};

type RakutenItemDetails = {
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  salePrice: number | null;
  breadcrumb: string[];
  gender: string | null;
};

const robotsCache = new Map<string, Promise<{ allowed: boolean; reason: string }>>();

export class RakutenFashionRankingCollector implements MarketCollector {
  source: MarketSource = "RAKUTEN_FASHION";

  async collect(options: MarketCollectOptions): Promise<MarketCollectionResult> {
    const collectedAt = new Date();
    const audienceSegment = options.audienceSegment ?? "ALL";
    const periodDate = options.periodDate ?? startOfDay(collectedAt);
    const targetUrl = getSourceCategoryUrl(this.source, options.category, options.limit);
    const baseResult = {
      source: this.source,
      category: options.category,
      audienceSegment,
      collectedAt,
      method: "PUBLIC_RANKING_PAGE",
      fetchedCount: 0,
      products: [] as MarketCollectedProduct[],
      errors: [] as MarketCollectionError[]
    };

    if (!targetUrl) {
      return { ...baseResult, status: "UNSUPPORTED", errors: [{ source: this.source, category: options.category, reason: `No verified Rakuten Fashion ranking route for ${options.category}.`, timestamp: collectedAt }] };
    }

    const robots = await cachedRobotsAllowed(targetUrl);
    if (!robots.allowed) {
      return { ...baseResult, status: "RESTRICTED", errors: [{ source: this.source, category: options.category, url: targetUrl, reason: robots.reason, timestamp: collectedAt }] };
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": marketCollectorUserAgent(),
          Accept: "text/html"
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${targetUrl}`);
      const html = await response.text();
      verifyRakutenRankingSemantic(html);
      const listItems = extractRakutenRankingItems(html);
      const products: MarketCollectedProduct[] = [];
      const errors: MarketCollectionError[] = [];
      const candidateLimit = Math.min(Math.max(options.limit * 4, 80), listItems.length);

      for (const item of listItems.slice(0, candidateLimit)) {
        try {
          const details = await fetchRakutenItemDetails(item.url);
          const category = inferRakutenRankingCategory(details, item);
          if (category !== options.category) continue;
          products.push(normalizeRakutenRankingItem({ item, details, category, periodDate, audienceSegment }));
          if (products.length >= options.limit) break;
        } catch (error) {
          errors.push({
            source: this.source,
            category: options.category,
            externalProductId: item.externalProductId,
            url: item.url,
            reason: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
        }
      }

      return {
        ...baseResult,
        fetchedCount: listItems.length,
        products,
        errors,
        status: errors.length > 0 ? "PARTIAL_SUCCESS" : "SUCCESS"
      };
    } catch (error) {
      return {
        ...baseResult,
        status: "FAILED",
        errors: [{ source: this.source, category: options.category, url: targetUrl, reason: error instanceof Error ? error.message : String(error), timestamp: new Date() }]
      };
    }
  }
}

export function verifyRakutenRankingSemantic(html: string) {
  const title = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const h1 = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const pageText = `${title} ${h1}`;
  if (!/人気ランキング|ranking/i.test(pageText)) {
    throw new Error("Rakuten Fashion page title does not verify ranking semantic.");
  }
  if (!/brn_ranking_list/.test(html)) {
    throw new Error("Rakuten Fashion ranking page did not expose ordered ranking product links.");
  }
}

export function extractRakutenRankingItems(html: string): RakutenRankingListItem[] {
  const items: RakutenRankingListItem[] = [];
  const seen = new Set<string>();
  const blocks = html.match(/<li class="container--24Ng3"[\s\S]*?<\/li>/g) ?? [];

  for (const block of blocks) {
    if (!/brn_ranking_list/.test(block)) continue;
    const href = decodeHtml(block.match(/<a[^>]+href="([^"]*\/item\/[^"]*?)"/i)?.[1] ?? "");
    const id = href.match(/\/item\/([^/?#]+)\/?/i)?.[1];
    const rank = Number(stripTags(block.match(/<span[^>]*bicolor-circle[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""));
    if (!id || !Number.isInteger(rank) || rank < 1) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const imageUrl = decodeHtml(block.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? "");
    const brand = stripTags(block.match(/<span[^>]*brand-text-inline[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "");
    const price = parseYen(stripTags(block.match(/<span[^>]*price-text--[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""));
    items.push({
      externalProductId: id,
      url: canonicalRakutenItemUrl(href),
      rank,
      brand: brand || null,
      imageUrl: imageUrl || null,
      price,
      salePrice: price
    });
  }

  if (items.length === 0) throw new Error("Rakuten Fashion ranking page did not expose parseable product ranks.");
  return items.sort((a, b) => a.rank - b.rank);
}

export function normalizeRakutenRankingItem(input: { item: RakutenRankingListItem; details: RakutenItemDetails; category: RankingCategory; periodDate: Date; audienceSegment: string }): MarketCollectedProduct {
  const { item, details, category, periodDate, audienceSegment } = input;
  const name = details.name?.trim();
  const brand = details.brand?.trim() || item.brand?.trim();
  if (!name) throw new Error("Missing Rakuten Fashion product name.");
  if (!brand) throw new Error("Missing Rakuten Fashion product brand.");
  const text = [name, brand, ...details.breadcrumb, category].join(" ");
  const price = details.price ?? item.price;
  const salePrice = details.salePrice ?? item.salePrice ?? price;
  const classification = classifyMarketAttributes({ observedCategory: category, text, sourceCategoryText: details.breadcrumb.join(" ") });

  return {
    source: "RAKUTEN_FASHION",
    externalProductId: item.externalProductId,
    brand,
    name,
    url: item.url,
    imageUrl: details.imageUrl ?? item.imageUrl,
    metricType: "RANKING",
    rankingVerified: true,
    rankingScope: "SITEWIDE",
    sourcePosition: item.rank,
    rank: item.rank,
    rankingCategory: "ALL_FASHION",
    observedCategory: classification.observedCategory,
    audienceSegment,
    periodDate,
    category: classification.observedCategory,
    price,
    salePrice,
    discountRate: price && salePrice && price > salePrice ? Math.round(((price - salePrice) / price) * 100) : null,
    itemType: classification.itemType,
    subItemType: classification.subItemType,
    gender: details.gender ?? inferGender(text),
    rawData: JSON.stringify({
      rank: item.rank,
      breadcrumb: details.breadcrumb,
      rankingScope: "Rakuten Fashion sitewide fashion item ranking"
    })
  };
}

export function inferRakutenRankingCategory(details: RakutenItemDetails, item?: Pick<RakutenRankingListItem, "brand">): RankingCategory | null {
  const text = [details.name, details.brand, item?.brand, ...details.breadcrumb].filter(Boolean).join(" ").toLowerCase();
  if (/shorts?|ショートパンツ|ハーフパンツ/.test(text)) return "SHORTS";
  if (/bag|バッグ|バックパック|リュック|トート|ショルダー/.test(text)) return "BAG";
  if (/帽子|キャップ|ハット|cap|hat|beanie/.test(text)) return "HEADWEAR";
  if (/hoodie|hoody|フーディ|パーカー/.test(text)) return "HOODIE";
  if (/sweatshirt|スウェット/.test(text)) return "SWEATSHIRT";
  if (/jacket|outer|coat|blouson|ジャケット|アウター|コート|ブルゾン/.test(text)) return "JACKET";
  if (/trouser|pants|jeans|denim|パンツ|ズボン|ジーンズ|デニム/.test(text)) return "PANTS";
  if (/long sleeve|long-sleeve|\bl\/s\b|long tee|長袖|ロングスリーブ|ロンt/.test(text)) return "LONG_SLEEVE_TSHIRT";
  if (/short sleeve|short-sleeve|\bs\/s\b|半袖|tee|t-shirt|tee shirt|tシャツ/.test(text)) return "SHORT_SLEEVE_TSHIRT";
  if (/shirt|シャツ/.test(text)) return "SHIRT";
  if (/ショートパンツ|ハーフパンツ|shorts?/.test(text)) return "SHORTS";
  if (/バッグ|bag|リュック|バックパック|トート|ショルダー|ポーチ|ウォレット/.test(text)) return "BAG";
  if (/帽子|キャップ|ハット|ニット帽|cap|hat|beanie/.test(text)) return "HEADWEAR";
  if (/パーカー|フーディ|hoodie|hoody/.test(text)) return "HOODIE";
  if (/スウェット|トレーナー|sweatshirt/.test(text)) return "SWEATSHIRT";
  if (/ジャケット|アウター|ブルゾン|ジャンパー|コート|jacket|outer|coat|blouson/.test(text)) return "JACKET";
  if (/パンツ|ズボン|デニム|ジーンズ|スラックス|トラウザー|trouser|pants|jeans|denim/.test(text)) return "PANTS";
  if (/長袖|ロングスリーブ|ロンt|long sleeve|long-sleeve|\bl\/s\b|long tee/.test(text)) return "LONG_SLEEVE_TSHIRT";
  if (/半袖|tシャツ|ｔシャツ|カットソー|tee|t-shirt|tee shirt/.test(text)) return "SHORT_SLEEVE_TSHIRT";
  if (/シャツ|shirt/.test(text)) return "SHIRT";
  if (/ショートパンツ|ハーフパンツ|shorts?/.test(text)) return "SHORTS";
  if (/バッグ|bag|リュック|バックパック|トート|ショルダー|ポーチ/.test(text)) return "BAG";
  if (/帽子|キャップ|ハット|ニット帽|cap|hat|beanie/.test(text)) return "HEADWEAR";
  if (/パーカー|フーディ|hoodie|hoody/.test(text)) return "HOODIE";
  if (/スウェット|トレーナー|sweatshirt/.test(text)) return "SWEATSHIRT";
  if (/ジャケット|アウター|ブルゾン|ジャンパー|コート|jacket|outer|coat|blouson/.test(text)) return "JACKET";
  if (/パンツ|ズボン|デニム|ジーンズ|スラックス|トラウザー|trouser|pants|jeans|denim/.test(text)) return "PANTS";
  if (/長袖|ロングスリーブ|ロンt|long sleeve|long-sleeve|\bl\/s\b|long tee/.test(text)) return "LONG_SLEEVE_TSHIRT";
  if (/tシャツ|ｔシャツ|カットソー|tee|t-shirt|tee shirt/.test(text)) return "SHORT_SLEEVE_TSHIRT";
  if (/シャツ|shirt/.test(text)) return "SHIRT";
  return null;
}

async function fetchRakutenItemDetails(url: string): Promise<RakutenItemDetails> {
  const robots = await cachedRobotsAllowed(url);
  if (!robots.allowed) throw new Error(robots.reason);
  const response = await fetch(url, {
    headers: {
      "User-Agent": marketCollectorUserAgent(),
      Accept: "text/html"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return parseRakutenItemDetails(await response.text());
}

function cachedRobotsAllowed(url: string) {
  const parsed = new URL(url);
  const key = `${parsed.origin}${parsed.pathname}${parsed.search}`;
  let check = robotsCache.get(key);
  if (!check) {
    check = verifyRobotsAllowed(url);
    robotsCache.set(key, check);
  }
  return check;
}

export function parseRakutenItemDetails(html: string): RakutenItemDetails {
  const jsonLd = extractJsonLd(html);
  const product = jsonLd.find((entry) => entry["@type"] === "Product") ?? {};
  const breadcrumb = jsonLd.find((entry) => entry["@type"] === "BreadcrumbList")?.itemListElement?.map((item: { item?: { name?: string } }) => item.item?.name).filter(Boolean) ?? [];
  const titleName = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").split("|")[1]?.trim() ?? null;
  const metaDescription = decodeHtml(html.match(/<meta property="og:description" content="([^"]*)"/i)?.[1] ?? "");
  const brand = typeof product.brand === "object" ? product.brand?.name : null;
  const image = typeof product.image === "string" ? product.image : Array.isArray(product.image) ? product.image[0] : null;
  const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const name = typeof product.name === "string" ? product.name : titleName;
  return {
    name: decodeHtml(name ?? null),
    brand: decodeHtml(brand ?? metaDescription.split("の")[0] ?? null),
    imageUrl: image ? decodeHtml(image) : decodeHtml(html.match(/<meta property="og:image" content="([^"]*)"/i)?.[1] ?? "") || null,
    price: parseYen(offers?.price),
    salePrice: parseYen(offers?.price),
    breadcrumb: breadcrumb.map((value: string) => decodeHtml(value)),
    gender: inferGender([name, metaDescription, ...breadcrumb].join(" "))
  };
}

function extractJsonLd(html: string): Array<Record<string, any>> {
  const entries: Array<Record<string, any>> = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1] ?? "").trim());
      if (Array.isArray(parsed)) entries.push(...parsed);
      else if (parsed && typeof parsed === "object") entries.push(parsed);
    } catch {
      // Ignore malformed metadata; item pages also provide title/meta fallbacks.
    }
  }
  return entries;
}

function canonicalRakutenItemUrl(url: string) {
  const parsed = new URL(url, "https://brandavenue.rakuten.co.jp");
  parsed.search = "";
  parsed.hash = "";
  if (!parsed.pathname.endsWith("/")) parsed.pathname += "/";
  return parsed.toString();
}

function inferGender(text: string) {
  const value = text.toLowerCase();
  if (/ユニセックス|unisex|メンズ・レディース/.test(value)) return "UNISEX";
  if (/メンズ|men\b|mens|男性/.test(value)) return "MEN";
  if (/レディース|women|woman|女性/.test(value)) return "WOMEN";
  return "UNISEX";
}

function parseYen(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, "").trim());
}

function decodeHtml(value: string | null) {
  if (!value) return "";
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
