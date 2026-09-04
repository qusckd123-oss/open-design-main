import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/client";

export const productInclude = {
  tag: true,
  rankingSnapshots: {
    orderBy: { collectedAt: "desc" as const },
    take: 14
  }
} satisfies Prisma.ProductInclude;

export async function getProductsWithRecentSnapshots() {
  return prisma.product.findMany({
    include: productInclude
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      tag: true,
      rankingSnapshots: {
        orderBy: { collectedAt: "asc" }
      }
    }
  });
}

export async function getLatestCollectedAt() {
  const latest = await prisma.rankingSnapshot.findFirst({
    orderBy: { collectedAt: "desc" },
    select: { collectedAt: true }
  });
  return latest?.collectedAt ?? null;
}

export async function getLatestCollectionRun(source?: string) {
  return prisma.collectionRun.findFirst({
    where: source ? { source } : undefined,
    orderBy: { startedAt: "desc" }
  });
}
