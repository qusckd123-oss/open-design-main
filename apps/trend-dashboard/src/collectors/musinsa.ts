import { makeMockProductBase, rankForDay } from "@/collectors/mock-products";
import type { CollectedProduct, CollectorAdapter, CollectOptions, CollectionResult } from "@/collectors/types";

export class MusinsaMockAdapter implements CollectorAdapter {
  source = "musinsa";
  mode = "mock" as const;

  async collect(options: CollectOptions = {}): Promise<CollectionResult> {
    const collectedAt = new Date();
    const limit = options.limit ?? 100;
    const items = Array.from({ length: limit }, (_, index) => {
      const base = makeMockProductBase(index);
      return {
        externalId: base.externalId,
        source: base.source,
        brand: base.brand,
        name: base.name,
        url: base.url,
        imageUrl: base.imageUrl,
        category: base.category,
        gender: base.gender,
        color: base.color,
        isNew: base.isNew,
        rank: rankForDay(index, 0),
        price: base.price,
        salePrice: base.salePrice,
        discountRate: base.discountRate,
        reviewCount: base.reviewCount,
        likeCount: base.likeCount,
        isSoldOut: base.isSoldOut,
        collectedAt
      };
    });

    return {
      source: this.source,
      mode: this.mode,
      fetchedCount: items.length,
      items,
      failures: []
    };
  }
}
