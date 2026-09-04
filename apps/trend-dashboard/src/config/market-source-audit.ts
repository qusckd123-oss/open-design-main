import type { MarketSource } from "@/config/market-sources";
import type { MarketMetricType, RankingScope } from "@/config/market-category-map";

export type SourceCollectionStatus = "SUPPORTED" | "PARTIAL" | "RESTRICTED" | "NOT_USEFUL";

export type MarketSourceAuditEntry = {
  source: MarketSource;
  targetUrl: string;
  rankingAvailable: boolean;
  categoryRanking: boolean;
  publicAccess: boolean;
  robots: "ALLOW" | "PARTIAL" | "DISALLOW" | "UNKNOWN";
  officialApi: boolean;
  structuredData: boolean;
  collectionMethod: string;
  metricType: MarketMetricType;
  rankingVerified: boolean;
  rankingScope: RankingScope;
  usefulFor: string;
  status: SourceCollectionStatus;
  reason: string;
  relevanceScore: number;
};

export const marketSourceAudit: MarketSourceAuditEntry[] = [
  {
    source: "MUSINSA",
    targetUrl: "https://www.musinsa.com/main/musinsa/ranking",
    rankingAvailable: true,
    categoryRanking: true,
    publicAccess: true,
    robots: "DISALLOW",
    officialApi: false,
    structuredData: false,
    collectionMethod: "Not collected",
    metricType: "RANKING",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    usefulFor: "Not collected because automated access is restricted.",
    status: "RESTRICTED",
    reason: "robots.txt has User-agent * Disallow: /, so the app does not run an automated collector.",
    relevanceScore: 5
  },
  {
    source: "29CM",
    targetUrl: "https://www.29cm.co.kr/",
    rankingAvailable: false,
    categoryRanking: false,
    publicAccess: false,
    robots: "PARTIAL",
    officialApi: false,
    structuredData: false,
    collectionMethod: "Not collected",
    metricType: "UNKNOWN",
    rankingVerified: false,
    rankingScope: "UNKNOWN",
    usefulFor: "Manual reference only until a stable public route is verified.",
    status: "RESTRICTED",
    reason: "Public pages are SPA/API dependent and the stable ranking feed was not available through a documented public route.",
    relevanceScore: 4
  },
  {
    source: "ZOZOTOWN",
    targetUrl: "https://zozo.jp/ranking/",
    rankingAvailable: true,
    categoryRanking: true,
    publicAccess: false,
    robots: "UNKNOWN",
    officialApi: false,
    structuredData: false,
    collectionMethod: "Not collected",
    metricType: "RANKING",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    usefulFor: "Not collected in this app.",
    status: "RESTRICTED",
    reason: "Robots and ranking pages were not reliably retrievable from the local environment without errors.",
    relevanceScore: 5
  },
  {
    source: "KREAM",
    targetUrl: "https://kream.co.kr/",
    rankingAvailable: true,
    categoryRanking: false,
    publicAccess: false,
    robots: "UNKNOWN",
    officialApi: false,
    structuredData: false,
    collectionMethod: "Not collected",
    metricType: "POPULAR",
    rankingVerified: false,
    rankingScope: "UNKNOWN",
    usefulFor: "Not collected because public access failed.",
    status: "RESTRICTED",
    reason: "Public web access failed in the audit environment and collection would depend on app/private APIs.",
    relevanceScore: 4
  },
  {
    source: "WEAR",
    targetUrl: "https://wear.jp/ranking/",
    rankingAvailable: true,
    categoryRanking: false,
    publicAccess: true,
    robots: "PARTIAL",
    officialApi: false,
    structuredData: false,
    collectionMethod: "Manual review only",
    metricType: "UNKNOWN",
    rankingVerified: false,
    rankingScope: "UNKNOWN",
    usefulFor: "Manual style/context review only.",
    status: "PARTIAL",
    reason: "General ranking page is public, but stable item-category ranking URLs were not identified.",
    relevanceScore: 4
  },
  {
    source: "RAKUTEN_FASHION",
    targetUrl: "https://brandavenue.rakuten.co.jp/ranking/",
    rankingAvailable: true,
    categoryRanking: false,
    publicAccess: true,
    robots: "ALLOW",
    officialApi: false,
    structuredData: true,
    collectionMethod: "Official public ranking page HTML plus public item page metadata",
    metricType: "RANKING",
    rankingVerified: true,
    rankingScope: "SITEWIDE",
    usefulFor: "Verified sitewide fashion ranking signal, top products, rank baseline, internal category mapping from product metadata.",
    status: "SUPPORTED",
    reason: "The official page title and H1 identify a fashion item popularity ranking, robots.txt allows /ranking/ and /item/ paths, and public HTML exposes ordered product links with rank badges.",
    relevanceScore: 4
  },
  {
    source: "END",
    targetUrl: "https://www.endclothing.com/us/clothing/clothing-bestsellers",
    rankingAvailable: true,
    categoryRanking: false,
    publicAccess: true,
    robots: "ALLOW",
    officialApi: false,
    structuredData: true,
    collectionMethod: "Official public Clothing Bestsellers page HTML",
    metricType: "BEST_SELLER",
    rankingVerified: true,
    rankingScope: "DEPARTMENT",
    usefulFor: "Verified bestseller ranking signal, top products, rank baseline, internal category mapping from product metadata.",
    status: "SUPPORTED",
    reason: "The page title and embedded state identify Clothing Bestsellers, robots.txt allows the path, and server-rendered __NEXT_DATA__ exposes ordered product hits.",
    relevanceScore: 5
  },
  {
    source: "SSENSE",
    targetUrl: "https://www.ssense.com/",
    rankingAvailable: true,
    categoryRanking: false,
    publicAccess: true,
    robots: "DISALLOW",
    officialApi: false,
    structuredData: false,
    collectionMethod: "Not collected",
    metricType: "POPULAR",
    rankingVerified: false,
    rankingScope: "UNKNOWN",
    usefulFor: "Manual review only.",
    status: "RESTRICTED",
    reason: "Trending appears to depend on sort query parameters or APIs; robots.txt disallows /*?sort=* and /api/.",
    relevanceScore: 5
  },
  {
    source: "SLAM_JAM",
    targetUrl: "https://www.slamjam.com/collections/t-shirts/products.json",
    rankingAvailable: false,
    categoryRanking: true,
    publicAccess: true,
    robots: "ALLOW",
    officialApi: false,
    structuredData: true,
    collectionMethod: "Shopify products.json collection order",
    metricType: "COLLECTION_ORDER",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    usefulFor: "Assortment, new product, category presence, item presence, brand presence, price range.",
    status: "SUPPORTED",
    reason: "Public Shopify collection JSON is accessible and robots.txt allows collection paths.",
    relevanceScore: 4
  },
  {
    source: "STUSSY",
    targetUrl: "https://www.stussy.com/collections/tees/products.json",
    rankingAvailable: false,
    categoryRanking: true,
    publicAccess: true,
    robots: "PARTIAL",
    officialApi: false,
    structuredData: true,
    collectionMethod: "Shopify products.json collection order",
    metricType: "COLLECTION_ORDER",
    rankingVerified: false,
    rankingScope: "CATEGORY",
    usefulFor: "Assortment, new product, category presence, item presence, brand presence, price range.",
    status: "SUPPORTED",
    reason: "Public Shopify collection JSON is accessible. No sort_by parameter is used because robots disallows collection sort URLs.",
    relevanceScore: 5
  }
];
