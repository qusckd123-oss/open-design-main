import { PrismaClient } from "@prisma/client";
import { NaverSearchTrendMockAdapter } from "../src/collectors/naver/mock";
import { NaverShoppingInsightMockAdapter } from "../src/collectors/naver/shopping-mock";
import { makeMockProductBase, rankForDay } from "../src/collectors/mock-products";
import { persistNaverShoppingAgeCollection, persistNaverTrendCollection } from "../src/services/naver-trend-collection-service";
import { resetSampleBusinessData } from "../src/services/sample-business-data-service";

const prisma = new PrismaClient();

async function main() {
  await prisma.rankingSnapshot.deleteMany();
  await prisma.keywordShoppingAgeSnapshot.deleteMany();
  await prisma.keywordTrendSnapshot.deleteMany();
  await prisma.collectionError.deleteMany();
  await prisma.collectionRun.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.product.deleteMany();
  await prisma.trendKeyword.deleteMany();
  await prisma.importError.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.salesSnapshot.deleteMany();
  await prisma.marketRankingSnapshot.deleteMany();
  await prisma.internalProduct.deleteMany();
  await prisma.marketProduct.deleteMany();

  const today = new Date();
  today.setHours(9, 0, 0, 0);

  for (let index = 0; index < 80; index += 1) {
    const base = makeMockProductBase(index);
    const product = await prisma.product.create({
      data: {
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
        tag: {
          create: base.tag
        }
      }
    });

    for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
      const collectedAt = new Date(today);
      collectedAt.setDate(today.getDate() - dayOffset);
      const rank = rankForDay(index, dayOffset);

      await prisma.rankingSnapshot.create({
        data: {
          productId: product.id,
          rank,
          price: base.price,
          salePrice: base.salePrice,
          discountRate: base.discountRate,
          reviewCount: base.reviewCount + (13 - dayOffset) * 3,
          likeCount: base.likeCount + (13 - dayOffset) * 8,
          isSoldOut: base.isSoldOut,
          collectedAt
        }
      });
    }
  }

  const naverAdapter = new NaverSearchTrendMockAdapter();
  const naverResult = await naverAdapter.collect();
  await persistNaverTrendCollection(naverResult, new Date());
  const shoppingAdapter = new NaverShoppingInsightMockAdapter();
  const shoppingResult = await shoppingAdapter.collect();
  await persistNaverShoppingAgeCollection(shoppingResult, new Date());
  const businessSamples = await resetSampleBusinessData();

  console.log("Seeded 80 products with 14 ranking snapshots each.");
  console.log("Seeded 25 fashion keywords with 12 weeks of mock NAVER search trend snapshots.");
  console.log("Seeded 25 fashion keywords with 12 weeks of mock NAVER shopping age snapshots.");
  console.log(`Seeded sample SALES rows: ${businessSamples.sales.successRows}.`);
  console.log(`Seeded sample MARKET rows: ${businessSamples.market.successRows}.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
