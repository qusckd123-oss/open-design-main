import { prisma } from "@/db/client";
import type { CollectedProduct, CollectionFailure, CollectionMode, CollectionResult } from "@/collectors/types";

export type PersistCollectionResult = {
  runId: string;
  fetched: number;
  insertedProducts: number;
  updatedProducts: number;
  snapshots: number;
  failed: number;
  elapsedMs: number;
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
};

export async function persistCollectionResult(result: CollectionResult, startedAt: Date): Promise<PersistCollectionResult> {
  const run = await prisma.collectionRun.create({
    data: {
      source: result.source,
      mode: result.mode,
      startedAt,
      status: "RUNNING",
      fetchedCount: result.fetchedCount
    }
  });

  const persisted = await persistCollectedProducts(result.items);
  await persistFailures(run.id, result.failures);

  const completedAt = new Date();
  const status = statusFor(result.items.length, result.failures.length);
  const errorMessage = result.failures.length > 0 ? result.failures.slice(0, 3).map((failure) => failure.reason).join(" | ") : null;

  await prisma.collectionRun.update({
    where: { id: run.id },
    data: {
      completedAt,
      status,
      productCount: result.items.length,
      fetchedCount: result.fetchedCount,
      errorCount: result.failures.length,
      errorMessage
    }
  });

  return {
    runId: run.id,
    fetched: result.fetchedCount,
    insertedProducts: persisted.insertedProducts,
    updatedProducts: persisted.updatedProducts,
    snapshots: persisted.snapshots,
    failed: result.failures.length,
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
    status
  };
}

export async function persistCollectedProducts(items: CollectedProduct[]) {
  let snapshots = 0;
  let insertedProducts = 0;
  let updatedProducts = 0;

  for (const item of items) {
    const existing = await prisma.product.findUnique({
      where: { externalId: item.externalId },
      select: { id: true }
    });

    const product = await prisma.product.upsert({
      where: { externalId: item.externalId },
      update: {
        brand: item.brand,
        name: item.name,
        url: item.url,
        imageUrl: item.imageUrl,
        category: item.category,
        gender: item.gender,
        color: item.color,
        isNew: item.isNew ?? false,
        source: item.source
      },
      create: {
        externalId: item.externalId,
        source: item.source,
        brand: item.brand,
        name: item.name,
        url: item.url,
        imageUrl: item.imageUrl,
        category: item.category,
        gender: item.gender,
        color: item.color,
        isNew: item.isNew ?? false
      }
    });
    if (existing) updatedProducts += 1;
    else insertedProducts += 1;

    await prisma.rankingSnapshot.upsert({
      where: {
        productId_collectedAt: {
          productId: product.id,
          collectedAt: item.collectedAt
        }
      },
      update: {
        rank: item.rank,
        price: item.price,
        salePrice: item.salePrice,
        discountRate: item.discountRate,
        reviewCount: item.reviewCount,
        likeCount: item.likeCount,
        isSoldOut: item.isSoldOut ?? false
      },
      create: {
        productId: product.id,
        rank: item.rank,
        price: item.price,
        salePrice: item.salePrice,
        discountRate: item.discountRate,
        reviewCount: item.reviewCount,
        likeCount: item.likeCount,
        isSoldOut: item.isSoldOut ?? false,
        collectedAt: item.collectedAt
      }
    });
    snapshots += 1;
  }

  return { products: items.length, insertedProducts, updatedProducts, snapshots };
}

export async function startFailedCollectionRun(
  source: string,
  mode: CollectionMode,
  startedAt: Date,
  failures: CollectionFailure[]
) {
  return persistCollectionResult(
    {
      source,
      mode,
      fetchedCount: 0,
      items: [],
      failures
    },
    startedAt
  );
}

async function persistFailures(collectionRunId: string, failures: CollectionFailure[]) {
  for (const failure of failures) {
    await prisma.collectionError.create({
      data: {
        collectionRunId,
        source: failure.source,
        externalId: failure.externalId,
        url: failure.url,
        reason: failure.reason,
        timestamp: failure.timestamp
      }
    });
  }
}

function statusFor(successCount: number, failureCount: number): "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED" {
  if (successCount > 0 && failureCount === 0) return "SUCCESS";
  if (successCount > 0 && failureCount > 0) return "PARTIAL_SUCCESS";
  return "FAILED";
}
