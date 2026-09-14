import type { MarketSource } from "@/config/market-sources";

export const marketMetricTypes = ["RANKING", "BEST_SELLER", "POPULAR", "NEW_ARRIVAL", "COLLECTION_ORDER", "CATALOG", "UNKNOWN"] as const;
export type MarketMetricType = (typeof marketMetricTypes)[number];

export const rankingScopes = ["SITEWIDE", "DEPARTMENT", "CATEGORY", "SUBCATEGORY", "UNKNOWN"] as const;
export type RankingScope = (typeof rankingScopes)[number];

export const rankingCategories = [
  "SHORT_SLEEVE_TSHIRT",
  "LONG_SLEEVE_TSHIRT",
  "SWEATSHIRT",
  "HOODIE",
  "SHIRT",
  "JACKET",
  "PANTS",
  "SHORTS",
  "BAG",
  "HEADWEAR"
] as const;

export type RankingCategory = (typeof rankingCategories)[number];

export const rankingCategoryLabels: Record<RankingCategory, string> = {
  SHORT_SLEEVE_TSHIRT: "Short Sleeve T-Shirt",
  LONG_SLEEVE_TSHIRT: "Long Sleeve T-Shirt",
  SWEATSHIRT: "Sweatshirt",
  HOODIE: "Hoodie",
  SHIRT: "Shirt",
  JACKET: "Jacket",
  PANTS: "Pants",
  SHORTS: "Shorts",
  BAG: "Bag",
  HEADWEAR: "Headwear"
};

export type SourceCategoryConfig = {
  source: MarketSource;
  baseUrl: string;
  /**
   * CAFE24_CATEGORY_HTML (added 2026-09-14 for REDNAPE): a server-rendered
   * Cafe24-platform storefront category listing page (product grid HTML,
   * no JSON API) - narrower/truthful, not a guess at "any HTML site" and
   * not reusing SHOPIFY_PRODUCTS_JSON (Rednape is not Shopify). No
   * collector class exists for this method yet - createMarketCollector
   * (src/collectors/market/index.ts) falls through to
   * UnsupportedMarketCollector for it exactly like any other unhandled
   * method, so registering this config implies zero collection behavior
   * until a real parser is designed and approved separately. See
   * docs/MARKET_SOURCE_AUDIT.md "Rednape" for the platform evidence
   * (robots.txt Cafe24-pattern admin paths, /category//product/ URL
   * shape).
   */
  method: "SHOPIFY_PRODUCTS_JSON" | "PUBLIC_BESTSELLER_PAGE" | "PUBLIC_RANKING_PAGE" | "HTML_RANKING" | "CAFE24_CATEGORY_HTML" | "UNSUPPORTED";
  metricType: MarketMetricType;
  rankingVerified: boolean;
  rankingScope: RankingScope;
  collectionMethod: string;
  description: string;
  categories: Partial<Record<RankingCategory, string>>;
};

export const sourceCategoryConfigs: Partial<Record<MarketSource, SourceCategoryConfig>> = {
  SLAM_JAM: {
    source: "SLAM_JAM",
    baseUrl: "https://www.slamjam.com",
    method: "SHOPIFY_PRODUCTS_JSON",
    metricType: "COLLECTION_ORDER",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    collectionMethod: "Public Shopify products.json collection endpoint",
    description: "Public Shopify product collection. Product order is preserved as sourcePosition and does not represent verified bestseller ranking.",
    categories: {
      SHORT_SLEEVE_TSHIRT: "/collections/t-shirts/products.json",
      JACKET: "/collections/jackets/products.json",
      PANTS: "/collections/pants/products.json",
      BAG: "/collections/accessories/products.json",
      HEADWEAR: "/collections/hats/products.json"
    }
  },
  STUSSY: {
    source: "STUSSY",
    baseUrl: "https://www.stussy.com",
    method: "SHOPIFY_PRODUCTS_JSON",
    metricType: "COLLECTION_ORDER",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    collectionMethod: "Public Shopify products.json collection endpoint",
    description: "Public Shopify product collection. Product order is preserved as sourcePosition and does not represent verified bestseller ranking.",
    categories: {
      SHORT_SLEEVE_TSHIRT: "/collections/tees/products.json",
      JACKET: "/collections/outerwear/products.json",
      PANTS: "/collections/pants/products.json",
      BAG: "/collections/bags/products.json",
      HEADWEAR: "/collections/headwear/products.json"
    }
  },
  COVERCHORD: {
    source: "COVERCHORD",
    baseUrl: "https://coverchord.com",
    method: "SHOPIFY_PRODUCTS_JSON",
    metricType: "COLLECTION_ORDER",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    collectionMethod: "Public Shopify products.json collection endpoint",
    description: "Public Shopify product collection. Product order is preserved as sourcePosition and does not represent verified bestseller ranking.",
    categories: {
      SHORT_SLEEVE_TSHIRT: "/collections/tops/products.json",
      JACKET: "/collections/jackets-coats/products.json",
      PANTS: "/collections/bottoms/products.json",
      BAG: "/collections/bags/products.json",
      HEADWEAR: "/collections/hats-caps/products.json"
    }
  },
  REDNAPE: {
    source: "REDNAPE",
    baseUrl: "https://rednape.kr",
    method: "CAFE24_CATEGORY_HTML",
    metricType: "CATALOG",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    collectionMethod: "Public Cafe24 storefront category HTML page (server-rendered product grid); no products.json/JSON API available - HTML-parsing collector not yet implemented, see docs/MARKET_SOURCE_AUDIT.md",
    description: "Public Cafe24-platform online shop (rednape.kr, self-described 'unisex shop'). Server-rendered category listing pages expose product name, price, color options, and images directly in raw HTML (verified via a single read-only fetch on 2026-09-14). Category/product order reflects catalog listing order, not verified ranking or bestseller status. /category/new-arrivals/23/ is a cross-item-type, recency-sorted section - mapped below only to the specific item types actually observed in the sampled listing (long-sleeve tops, pants), not to every type that section may contain. /category/accessories/45/ is mapped to BAG, mirroring the existing Slam Jam accessories-to-BAG precedent. No collector/parser exists for this source yet - this is a config-only registration with zero rows collected.",
    categories: {
      LONG_SLEEVE_TSHIRT: "/category/new-arrivals/23/",
      PANTS: "/category/new-arrivals/23/",
      BAG: "/category/accessories/45/"
    }
  },
  RAKUTEN_FASHION: {
    source: "RAKUTEN_FASHION",
    baseUrl: "https://brandavenue.rakuten.co.jp",
    method: "PUBLIC_RANKING_PAGE",
    metricType: "RANKING",
    rankingVerified: true,
    rankingScope: "SITEWIDE",
    collectionMethod: "Official public ranking page HTML plus public item page metadata",
    description: "Official Rakuten Fashion popular ranking page. Rank is the sitewide fashion ranking position from the public /ranking/ page; internal categories are inferred from public item metadata.",
    categories: {
      SHORT_SLEEVE_TSHIRT: "/ranking/",
      JACKET: "/ranking/",
      PANTS: "/ranking/",
      BAG: "/ranking/",
      HEADWEAR: "/ranking/"
    }
  },
  END: {
    source: "END",
    baseUrl: "https://www.endclothing.com",
    method: "PUBLIC_BESTSELLER_PAGE",
    metricType: "BEST_SELLER",
    rankingVerified: true,
    rankingScope: "DEPARTMENT",
    collectionMethod: "Official public Clothing Bestsellers page HTML",
    description: "Official END. Clothing Bestsellers product listing. The server-rendered product order is stored as verified bestseller rank.",
    categories: {
      SHORT_SLEEVE_TSHIRT: "/us/clothing/clothing-bestsellers",
      LONG_SLEEVE_TSHIRT: "/us/clothing/clothing-bestsellers",
      SWEATSHIRT: "/us/clothing/clothing-bestsellers",
      HOODIE: "/us/clothing/clothing-bestsellers",
      SHIRT: "/us/clothing/clothing-bestsellers",
      JACKET: "/us/clothing/clothing-bestsellers",
      PANTS: "/us/clothing/clothing-bestsellers",
      SHORTS: "/us/clothing/clothing-bestsellers"
    }
  }
};

export function getSourceCategoryUrl(source: MarketSource, category: RankingCategory, limit: number) {
  const config = sourceCategoryConfigs[source];
  const path = config?.categories[category];
  if (!config || !path) return null;
  const url = new URL(path, config.baseUrl);
  void limit;
  return url.toString();
}
