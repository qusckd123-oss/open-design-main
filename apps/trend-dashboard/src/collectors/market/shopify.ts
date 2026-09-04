import { getSourceCategoryUrl, sourceCategoryConfigs } from "@/config/market-category-map";
import type { MarketSource } from "@/config/market-sources";
import { normalizeShopifyProduct, type RawShopifyProduct } from "@/collectors/market/normalize";
import { marketCollectorUserAgent, verifyRobotsAllowed } from "@/collectors/market/robots";
import type { MarketCollectOptions, MarketCollectionError, MarketCollectionResult, MarketCollector } from "@/collectors/market/types";

type ShopifyResponse = {
  products?: RawShopifyProduct[];
};

export class ShopifyMarketCollector implements MarketCollector {
  source: MarketSource;

  constructor(source: MarketSource) {
    this.source = source;
  }

  async collect(options: MarketCollectOptions): Promise<MarketCollectionResult> {
    const config = sourceCategoryConfigs[this.source];
    const collectedAt = new Date();
    const audienceSegment = options.audienceSegment ?? "ALL";
    const periodDate = options.periodDate ?? startOfDay(collectedAt);
    const baseResult = {
      source: this.source,
      category: options.category,
      audienceSegment,
      collectedAt,
      method: "SHOPIFY_PRODUCTS_JSON",
      fetchedCount: 0,
      products: [],
      errors: [] as MarketCollectionError[]
    };

    if (!config || config.method !== "SHOPIFY_PRODUCTS_JSON") {
      return {
        ...baseResult,
        status: "UNSUPPORTED",
        errors: [{ source: this.source, category: options.category, reason: "Source is not configured for Shopify products.json collection.", timestamp: collectedAt }]
      };
    }

    const targetUrl = getSourceCategoryUrl(this.source, options.category, options.limit);
    if (!targetUrl) {
      return {
        ...baseResult,
        status: "UNSUPPORTED",
        errors: [{ source: this.source, category: options.category, reason: `No category mapping for ${options.category}.`, timestamp: collectedAt }]
      };
    }

    const robots = await verifyRobotsAllowed(targetUrl);
    if (!robots.allowed) {
      return {
        ...baseResult,
        status: "RESTRICTED",
        errors: [{ source: this.source, category: options.category, url: targetUrl, reason: robots.reason, timestamp: collectedAt }]
      };
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": marketCollectorUserAgent(),
          Accept: "application/json"
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${targetUrl}`);
      const json = (await response.json()) as ShopifyResponse;
      const rawProducts = (json.products ?? []).slice(0, options.limit);
      const products = [];
      const errors: MarketCollectionError[] = [];

      for (const [index, raw] of rawProducts.entries()) {
        try {
          products.push(
            normalizeShopifyProduct({
              raw,
              source: this.source,
              baseUrl: config.baseUrl,
              metricType: config.metricType,
              rankingVerified: config.rankingVerified,
              rankingScope: config.rankingScope,
              sourcePosition: index + 1,
              rank: null,
              rankingCategory: options.category,
              periodDate,
              audienceSegment
            })
          );
        } catch (error) {
          errors.push({
            source: this.source,
            category: options.category,
            externalProductId: raw.id ? String(raw.id) : undefined,
            reason: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
        }
      }

      return {
        ...baseResult,
        fetchedCount: rawProducts.length,
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

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
