import { prisma } from "@/db/client";
import type { MarketCollectionResult } from "@/collectors/market/types";

export type PersistMarketCollectionResult = {
  importRunId: string;
  source: string;
  category: string;
  status: string;
  fetched: number;
  saved: number;
  failed: number;
};

export async function persistMarketCollectionResult(result: MarketCollectionResult): Promise<PersistMarketCollectionResult> {
  const run = await prisma.importRun.create({
    data: {
      type: "MARKET",
      source: result.source,
      fileName: `collector:${result.method}`,
      rankingCategory: result.category,
      audienceSegment: result.audienceSegment,
      dataMode: "real",
      startedAt: result.collectedAt,
      status: "RUNNING",
      totalRows: result.fetchedCount,
      fetchedRows: result.fetchedCount
    }
  });

  let saved = 0;
  const errors = [...result.errors];

  for (const product of result.products) {
    try {
      const savedProduct = await prisma.marketProduct.upsert({
        where: {
          source_externalProductId: {
            source: product.source,
            externalProductId: product.externalProductId
          }
        },
        update: {
          brand: product.brand,
          name: product.name,
          category: product.category,
          url: product.url,
          imageUrl: product.imageUrl,
          itemType: product.itemType,
          subItemType: product.subItemType,
          fit: product.fit,
          mainColor: product.mainColor,
          subColor: product.subColor,
          material: product.material,
          graphicType: product.graphicType,
          detail: product.detail,
          style: product.style,
          gender: product.gender,
          dataMode: "real"
        },
        create: {
          source: product.source,
          externalProductId: product.externalProductId,
          brand: product.brand,
          name: product.name,
          category: product.category,
          url: product.url,
          imageUrl: product.imageUrl,
          itemType: product.itemType,
          subItemType: product.subItemType,
          fit: product.fit,
          mainColor: product.mainColor,
          subColor: product.subColor,
          material: product.material,
          graphicType: product.graphicType,
          detail: product.detail,
          style: product.style,
          gender: product.gender,
          dataMode: "real"
        }
      });

      await prisma.marketRankingSnapshot.upsert({
        where: {
          marketProductId_source_periodDate_rankingScope_rankingCategory_observedCategory_audienceSegment: {
            marketProductId: savedProduct.id,
            source: product.source,
            periodDate: product.periodDate,
            rankingScope: product.rankingScope,
            rankingCategory: product.rankingCategory,
            observedCategory: product.observedCategory,
            audienceSegment: product.audienceSegment
          }
        },
        update: {
          metricType: product.metricType,
          rankingVerified: product.rankingVerified,
          rankingScope: product.rankingScope,
          observedCategory: product.observedCategory,
          sourcePosition: product.sourcePosition,
          rank: product.rankingVerified ? product.rank ?? product.sourcePosition ?? null : null,
          price: product.price,
          salePrice: product.salePrice,
          discountRate: product.discountRate,
          reviewCount: product.reviewCount,
          likeCount: product.likeCount,
          dataMode: "real",
          importRunId: run.id,
          rawData: product.rawData
        },
        create: {
          marketProductId: savedProduct.id,
          source: product.source,
          periodDate: product.periodDate,
          rankingScope: product.rankingScope,
          rankingCategory: product.rankingCategory,
          observedCategory: product.observedCategory,
          audienceSegment: product.audienceSegment,
          metricType: product.metricType,
          rankingVerified: product.rankingVerified,
          sourcePosition: product.sourcePosition,
          rank: product.rankingVerified ? product.rank ?? product.sourcePosition ?? null : null,
          price: product.price,
          salePrice: product.salePrice,
          discountRate: product.discountRate,
          reviewCount: product.reviewCount,
          likeCount: product.likeCount,
          dataMode: "real",
          importRunId: run.id,
          rawData: product.rawData
        }
      });
      saved += 1;
    } catch (error) {
      errors.push({
        source: product.source,
        category: product.observedCategory,
        externalProductId: product.externalProductId,
        url: product.url,
        reason: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
    }
  }

  for (const [index, error] of errors.entries()) {
    await prisma.importError.create({
      data: {
        importRunId: run.id,
        rowNumber: index + 1,
        field: error.externalProductId ?? error.url ?? error.category,
        reason: error.reason,
        rawRow: JSON.stringify(error)
      }
    });
  }

  const status = result.status === "RESTRICTED" || result.status === "UNSUPPORTED" ? result.status : errors.length > 0 && saved === 0 ? "FAILED" : errors.length > 0 ? "PARTIAL_SUCCESS" : "SUCCESS";
  await prisma.importRun.update({
    where: { id: run.id },
    data: {
      completedAt: new Date(),
      status,
      successRows: saved,
      failedRows: errors.length,
      errorMessage: errors.length > 0 ? errors.slice(0, 3).map((error) => error.reason).join(" | ") : null
    }
  });

  return {
    importRunId: run.id,
    source: result.source,
    category: result.category,
    status,
    fetched: result.fetchedCount,
    saved,
    failed: errors.length
  };
}
