import { sourceCategoryConfigs } from "@/config/market-category-map";
import type { MarketSource } from "@/config/market-sources";
import { EndBestsellerCollector } from "@/collectors/market/end";
import { RakutenFashionRankingCollector } from "@/collectors/market/rakuten-fashion";
import { ShopifyMarketCollector } from "@/collectors/market/shopify";
import type { MarketCollectOptions, MarketCollectionResult, MarketCollector } from "@/collectors/market/types";

export function createMarketCollector(source: MarketSource): MarketCollector {
  const config = sourceCategoryConfigs[source];
  if (config?.method === "PUBLIC_BESTSELLER_PAGE") return new EndBestsellerCollector();
  if (config?.method === "PUBLIC_RANKING_PAGE") return new RakutenFashionRankingCollector();
  if (config?.method === "SHOPIFY_PRODUCTS_JSON") return new ShopifyMarketCollector(source);
  return new UnsupportedMarketCollector(source);
}

export function supportedCollectorSources() {
  return Object.entries(sourceCategoryConfigs)
    .filter(([, config]) => config.method === "SHOPIFY_PRODUCTS_JSON" || config.method === "PUBLIC_BESTSELLER_PAGE" || config.method === "PUBLIC_RANKING_PAGE")
    .map(([source]) => source as MarketSource);
}

export function verifiedRankingCollectorSources() {
  return Object.entries(sourceCategoryConfigs)
    .filter(([, config]) => config.rankingVerified && (config.method === "PUBLIC_BESTSELLER_PAGE" || config.method === "PUBLIC_RANKING_PAGE"))
    .map(([source]) => source as MarketSource);
}

export function assortmentCollectorSources() {
  return Object.entries(sourceCategoryConfigs)
    .filter(([, config]) => !config.rankingVerified && config.method === "SHOPIFY_PRODUCTS_JSON")
    .map(([source]) => source as MarketSource);
}

class UnsupportedMarketCollector implements MarketCollector {
  source: MarketSource;

  constructor(source: MarketSource) {
    this.source = source;
  }

  async collect(options: MarketCollectOptions): Promise<MarketCollectionResult> {
    const now = new Date();
    return {
      source: this.source,
      category: options.category,
      audienceSegment: options.audienceSegment ?? "ALL",
      collectedAt: now,
      status: "UNSUPPORTED",
      method: "UNSUPPORTED",
      fetchedCount: 0,
      products: [],
      errors: [
        {
          source: this.source,
          category: options.category,
          reason: "No safe, stable automated market collector is registered for this source.",
          timestamp: now
        }
      ]
    };
  }
}
