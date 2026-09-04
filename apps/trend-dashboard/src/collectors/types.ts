export type CollectedProduct = {
  externalId: string;
  source: string;
  brand: string;
  name: string;
  url: string;
  imageUrl: string | null;
  category: string;
  gender?: string | null;
  color?: string | null;
  isNew?: boolean;
  rank: number;
  price?: number | null;
  salePrice?: number | null;
  discountRate?: number | null;
  reviewCount?: number | null;
  likeCount?: number | null;
  isSoldOut?: boolean;
  collectedAt: Date;
};

export type CollectionFailure = {
  source: string;
  externalId?: string;
  url?: string;
  reason: string;
  timestamp: Date;
};

export type CollectionMode = "mock" | "real";

export type CollectOptions = {
  limit?: number;
};

export type CollectionResult = {
  source: string;
  mode: CollectionMode;
  fetchedCount: number;
  items: CollectedProduct[];
  failures: CollectionFailure[];
};

export type CollectorAdapter = {
  source: string;
  mode: CollectionMode;
  collect: (options?: CollectOptions) => Promise<CollectionResult>;
};
