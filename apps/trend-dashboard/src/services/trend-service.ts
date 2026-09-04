import type { Product, ProductTag, RankingSnapshot } from "@prisma/client";
import { getLatestCollectionRun, getProductsWithRecentSnapshots } from "@/db/repositories";
import { classifyTrend, rankChange } from "@/lib/trend-signals";
import type { RankingSort, TrendProduct } from "@/types/trend";

type ProductWithSnapshots = Product & {
  tag: ProductTag | null;
  rankingSnapshots: RankingSnapshot[];
};

function toTrendProduct(product: ProductWithSnapshots): TrendProduct | null {
  const snapshots = [...product.rankingSnapshots].sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime());
  const current = snapshots[0];
  if (!current) return null;

  return {
    id: product.id,
    externalId: product.externalId,
    brand: product.brand,
    name: product.name,
    url: product.url,
    imageUrl: product.imageUrl,
    category: product.category,
    currentRank: current.rank,
    price: current.price,
    salePrice: current.salePrice,
    discountRate: current.discountRate,
    reviewCount: current.reviewCount,
    likeCount: current.likeCount,
    collectedAt: current.collectedAt,
    rankChange1d: rankChange(current.rank, snapshots[1]?.rank),
    rankChange3d: rankChange(current.rank, snapshots[3]?.rank),
    rankChange7d: rankChange(current.rank, snapshots[7]?.rank),
    status: classifyTrend(snapshots.map((snapshot) => ({ rank: snapshot.rank, collectedAt: snapshot.collectedAt }))),
    tag: product.tag
      ? {
          itemType: product.tag.itemType,
          fit: product.tag.fit,
          mainColor: product.tag.mainColor,
          subColor: product.tag.subColor,
          material: product.tag.material,
          graphicType: product.tag.graphicType,
          detail: product.tag.detail,
          style: product.tag.style,
          gender: product.tag.gender
        }
      : null
  };
}

export async function getTrendProducts() {
  const products = await getProductsWithRecentSnapshots();
  return products.map(toTrendProduct).filter((product): product is TrendProduct => product !== null);
}

export async function getDashboardData() {
  const products = await getTrendProducts();
  const latest = products.reduce<Date | null>((current, product) => {
    if (!current || product.collectedAt > current) return product.collectedAt;
    return current;
  }, null);

  const todayProducts = latest
    ? products.filter((product) => product.collectedAt.toDateString() === latest.toDateString())
    : products;
  const latestRun = await getLatestCollectionRun("musinsa");

  return {
    summary: {
      totalProducts: todayProducts.length,
      newEntries: todayProducts.filter((product) => product.status === "NEW_ENTRY").length,
      surgingProducts: todayProducts.filter((product) => product.status === "SURGING").length,
      lastUpdated: latest,
      latestRun
    },
    risingProducts: [...products]
      .sort((a, b) => (b.rankChange3d ?? -999) - (a.rankChange3d ?? -999))
      .slice(0, 10),
    statusCounts: products.reduce<Record<string, number>>((acc, product) => {
      acc[product.status] = (acc[product.status] ?? 0) + 1;
      return acc;
    }, {})
  };
}

export type RankingFilters = {
  query?: string;
  category?: string;
  brand?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: RankingSort;
};

export async function getRankingData(filters: RankingFilters) {
  let products = await getTrendProducts();

  if (filters.query) {
    const q = filters.query.toLowerCase();
    products = products.filter(
      (product) => product.name.toLowerCase().includes(q) || product.brand.toLowerCase().includes(q)
    );
  }
  if (filters.category) products = products.filter((product) => product.category === filters.category);
  if (filters.brand) products = products.filter((product) => product.brand === filters.brand);
  if (filters.status) products = products.filter((product) => product.status === filters.status);
  if (filters.priceMin != null) products = products.filter((product) => (product.salePrice ?? 0) >= filters.priceMin!);
  if (filters.priceMax != null) products = products.filter((product) => (product.salePrice ?? 0) <= filters.priceMax!);

  const sort = filters.sort ?? "rank";
  products.sort((a, b) => {
    if (sort === "change1d") return (b.rankChange1d ?? -999) - (a.rankChange1d ?? -999);
    if (sort === "change3d") return (b.rankChange3d ?? -999) - (a.rankChange3d ?? -999);
    if (sort === "change7d") return (b.rankChange7d ?? -999) - (a.rankChange7d ?? -999);
    if (sort === "reviews") return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    if (sort === "price") return (b.salePrice ?? 0) - (a.salePrice ?? 0);
    return a.currentRank - b.currentRank;
  });

  const allProducts = await getTrendProducts();
  return {
    products,
    facets: {
      categories: [...new Set(allProducts.map((product) => product.category))].sort(),
      brands: [...new Set(allProducts.map((product) => product.brand))].sort()
    }
  };
}

export async function getCategoryAnalysis() {
  const products = await getTrendProducts();
  const groups = new Map<string, TrendProduct[]>();
  for (const product of products) {
    groups.set(product.category, [...(groups.get(product.category) ?? []), product]);
  }

  return [...groups.entries()]
    .map(([category, items]) => ({
      category,
      total: items.length,
      topProduct: [...items].sort((a, b) => a.currentRank - b.currentRank)[0] ?? null,
      risingCount: items.filter((item) => item.status === "SURGING" || item.status === "STEADY_RISING").length,
      avgPrice: Math.round(items.reduce((sum, item) => sum + (item.salePrice ?? 0), 0) / items.length),
      avgDiscount: Math.round(items.reduce((sum, item) => sum + (item.discountRate ?? 0), 0) / items.length)
    }))
    .sort((a, b) => b.risingCount - a.risingCount);
}
