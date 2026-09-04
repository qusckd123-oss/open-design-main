import { getSourceCategoryUrl, sourceCategoryConfigs, type RankingCategory } from "@/config/market-category-map";
import type { MarketSource } from "@/config/market-sources";
import { classifyMarketAttributes } from "@/collectors/market/classification";
import { marketCollectorUserAgent, verifyRobotsAllowed } from "@/collectors/market/robots";
import type { MarketCollectedProduct, MarketCollectOptions, MarketCollectionError, MarketCollectionResult, MarketCollector } from "@/collectors/market/types";

type EndHit = {
  actual_colour?: string;
  brand?: string;
  colour?: string[];
  department_hierarchy?: string[];
  final_price_1?: number;
  full_price_1?: number;
  model_full_image?: string;
  name?: string;
  objectID?: string;
  sku?: string;
  small_image?: string;
  url_key?: string;
};

type NextData = {
  props?: {
    initialProps?: {
      pageProps?: {
        initialAlgoliaState?: {
          query?: { facetFilters?: Record<string, string[]> };
          results?: { hits?: EndHit[] };
        };
      };
    };
  };
};

export class EndBestsellerCollector implements MarketCollector {
  source: MarketSource = "END";

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
      method: "PUBLIC_BESTSELLER_PAGE",
      fetchedCount: 0,
      products: [] as MarketCollectedProduct[],
      errors: [] as MarketCollectionError[]
    };

    if (!targetUrl) {
      return { ...baseResult, status: "UNSUPPORTED", errors: [{ source: this.source, category: options.category, reason: `No verified END bestseller route for ${options.category}.`, timestamp: collectedAt }] };
    }

    const robots = await verifyRobotsAllowed(targetUrl);
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
      verifyBestsellerSemantic(html);
      const hits = extractEndHits(html);
      const products: MarketCollectedProduct[] = [];
      const errors: MarketCollectionError[] = [];

      for (const [index, hit] of hits.entries()) {
        try {
          const category = inferRankingCategory(hit);
          if (category !== options.category) continue;
          products.push(normalizeEndHit({ hit, rank: index + 1, category, periodDate, audienceSegment }));
          if (products.length >= options.limit) break;
        } catch (error) {
          errors.push({
            source: this.source,
            category: options.category,
            externalProductId: hit.objectID ?? hit.sku,
            reason: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
        }
      }

      return {
        ...baseResult,
        fetchedCount: hits.length,
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

export function verifyBestsellerSemantic(html: string) {
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ?? "";
  if (!/bestsellers/i.test(title)) throw new Error("END page title does not verify bestseller semantic.");
  const nextData = parseNextData(html);
  const categoryFilters = nextData.props?.initialProps?.pageProps?.initialAlgoliaState?.query?.facetFilters?.categories ?? [];
  if (!categoryFilters.some((category) => /Clothing\s*\/\s*Clothing Bestsellers/i.test(category))) {
    throw new Error("END page state does not verify Clothing Bestsellers facet.");
  }
}

export function extractEndHits(html: string): EndHit[] {
  const nextData = parseNextData(html);
  const hits = nextData.props?.initialProps?.pageProps?.initialAlgoliaState?.results?.hits;
  if (!Array.isArray(hits) || hits.length === 0) throw new Error("END bestseller page did not expose product hits.");
  return hits;
}

export function normalizeEndHit(input: { hit: EndHit; rank: number; category: RankingCategory; periodDate: Date; audienceSegment: string }): MarketCollectedProduct {
  const { hit, rank, category, periodDate, audienceSegment } = input;
  if (!hit.objectID && !hit.sku && !hit.url_key) throw new Error("Missing END product identifier.");
  if (!hit.name) throw new Error("Missing END product name.");
  if (!hit.brand) throw new Error("Missing END product brand.");
  if (!hit.url_key) throw new Error("Missing END product URL key.");
  const text = [hit.name, hit.actual_colour, ...(hit.department_hierarchy ?? [])].join(" ");
  const price = numberOrNull(hit.full_price_1);
  const salePrice = numberOrNull(hit.final_price_1);
  const classification = classifyMarketAttributes({ observedCategory: category, text, sourceCategoryText: hit.department_hierarchy?.join(" ") });
  return {
    source: "END",
    externalProductId: String(hit.objectID ?? hit.sku ?? hit.url_key),
    brand: hit.brand,
    name: hit.name,
    url: `https://www.endclothing.com/us/${hit.url_key}.html`,
    imageUrl: imageUrl(hit.small_image ?? hit.model_full_image),
    metricType: "BEST_SELLER",
    rankingVerified: true,
    rankingScope: "DEPARTMENT",
    sourcePosition: rank,
    rank,
    rankingCategory: "CLOTHING",
    observedCategory: classification.observedCategory,
    audienceSegment,
    periodDate,
    category: classification.observedCategory,
    price,
    salePrice,
    discountRate: price && salePrice && price > salePrice ? Math.round(((price - salePrice) / price) * 100) : null,
    itemType: classification.itemType,
    subItemType: classification.subItemType,
    mainColor: hit.actual_colour ?? hit.colour?.[0] ?? null,
    rawData: JSON.stringify({
      objectID: hit.objectID,
      sku: hit.sku,
      url_key: hit.url_key,
      department_hierarchy: hit.department_hierarchy,
      rank
    })
  };
}

export function inferRankingCategory(hit: EndHit): RankingCategory | null {
  const text = [hit.name, ...(hit.department_hierarchy ?? [])].join(" ").toLowerCase();
  if (/shorts?/.test(text)) return "SHORTS";
  if (/hoodie|hoody|hooded sweat/.test(text)) return "HOODIE";
  if (/sweatshirt|sweat pant|sweats/.test(text)) return "SWEATSHIRT";
  if (/jacket|coat|anorak|overshirt/.test(text)) return "JACKET";
  if (/jeans|trouser|pant\b|pants\b|cargo/.test(text)) return "PANTS";
  if (/shirt/.test(text) && !/t-shirt|tee|longsleeve|long sleeve/.test(text)) return "SHIRT";
  if (/longsleeve|long sleeve/.test(text)) return "LONG_SLEEVE_TSHIRT";
  if (/t-shirt|tee\b/.test(text)) return "SHORT_SLEEVE_TSHIRT";
  return null;
}

function parseNextData(html: string): NextData {
  const jsonText = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (!jsonText) throw new Error("Missing END __NEXT_DATA__ payload.");
  return JSON.parse(jsonText) as NextData;
}

function imageUrl(path: string | undefined) {
  if (!path || path === "no_selection") return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `https://media.endclothing.com/media/catalog/product${path}`;
}

function numberOrNull(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
