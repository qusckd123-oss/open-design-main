export type TrendStatus = "SURGING" | "NEW_ENTRY" | "STEADY_RISING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA";

export type ProductTagShape = {
  itemType: string | null;
  fit: string | null;
  mainColor: string | null;
  subColor: string | null;
  material: string | null;
  graphicType: string | null;
  detail: string | null;
  style: string | null;
  gender: string | null;
};

export type TrendProduct = {
  id: string;
  externalId: string;
  brand: string;
  name: string;
  url: string;
  imageUrl: string | null;
  category: string;
  currentRank: number;
  price: number | null;
  salePrice: number | null;
  discountRate: number | null;
  reviewCount: number | null;
  likeCount: number | null;
  collectedAt: Date;
  rankChange1d: number | null;
  rankChange3d: number | null;
  rankChange7d: number | null;
  status: TrendStatus;
  tag: ProductTagShape | null;
};

export type RankingSort = "rank" | "change1d" | "change3d" | "change7d" | "reviews" | "price";
