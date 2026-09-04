import type { MarketSource } from "@/config/market-sources";
import type { MarketMetricType, RankingCategory, RankingScope } from "@/config/market-category-map";

export type MarketCollectedProduct = {
  source: MarketSource;
  externalProductId: string;
  brand: string;
  name: string;
  url: string;
  imageUrl?: string | null;
  metricType: MarketMetricType;
  rankingVerified: boolean;
  rankingScope: RankingScope;
  sourcePosition?: number | null;
  rank?: number | null;
  rankingCategory: string;
  observedCategory: RankingCategory;
  audienceSegment: string;
  periodDate: Date;
  category?: string | null;
  price?: number | null;
  salePrice?: number | null;
  discountRate?: number | null;
  reviewCount?: number | null;
  likeCount?: number | null;
  itemType?: string | null;
  subItemType?: string | null;
  fit?: string | null;
  mainColor?: string | null;
  subColor?: string | null;
  material?: string | null;
  graphicType?: string | null;
  detail?: string | null;
  style?: string | null;
  gender?: string | null;
  rawData?: string | null;
};

export type MarketCollectionError = {
  source: MarketSource;
  category?: RankingCategory;
  externalProductId?: string;
  url?: string;
  reason: string;
  timestamp: Date;
};

export type MarketCollectionResult = {
  source: MarketSource;
  category: RankingCategory;
  audienceSegment: string;
  collectedAt: Date;
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED" | "RESTRICTED" | "UNSUPPORTED";
  method: string;
  fetchedCount: number;
  products: MarketCollectedProduct[];
  errors: MarketCollectionError[];
};

export type MarketCollectOptions = {
  category: RankingCategory;
  limit: number;
  audienceSegment?: string;
  periodDate?: Date;
};

export interface MarketCollector {
  source: MarketSource;
  collect(options: MarketCollectOptions): Promise<MarketCollectionResult>;
}
