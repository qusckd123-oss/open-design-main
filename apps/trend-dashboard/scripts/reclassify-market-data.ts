import { classifyMarketAttributes } from "../src/collectors/market/classification";
import { rankingCategories, type RankingCategory } from "../src/config/market-category-map";
import { prisma } from "../src/db/client";

const rankingCategorySet = new Set<string>(rankingCategories);
const verifiedSources = ["END", "RAKUTEN_FASHION"];

type Conflict = {
  source: string;
  externalProductId: string;
  brand: string;
  name: string;
  observedCategory: string;
  subItemType: string | null;
  reason: string;
};

async function main() {
  const before = await auditConflicts();
  const beforeSnapshotCount = await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } });

  const snapshots = await prisma.marketRankingSnapshot.findMany({
    where: { dataMode: "real", source: { in: verifiedSources } },
    include: { marketProduct: true },
    orderBy: [{ source: "asc" }, { periodDate: "asc" }, { rank: "asc" }]
  });

  let snapshotUpdates = 0;
  let productUpdates = 0;
  const productClassification = new Map<string, { category: RankingCategory; itemType: string; subItemType: string }>();

  for (const snapshot of snapshots) {
    const baseCategory = asRankingCategory(snapshot.observedCategory) ?? asRankingCategory(snapshot.marketProduct.category) ?? null;
    if (!baseCategory) continue;

    const raw = parseRawData(snapshot.rawData);
    const sourceCategoryText = sourceCategoryTextFromRaw(raw);
    const text = [snapshot.marketProduct.name, snapshot.marketProduct.brand, snapshot.marketProduct.category, sourceCategoryText].filter(Boolean).join(" ");
    const classification = classifyMarketAttributes({ observedCategory: baseCategory, text, sourceCategoryText });

    if (snapshot.observedCategory !== classification.observedCategory) {
      await prisma.marketRankingSnapshot.update({
        where: { id: snapshot.id },
        data: { observedCategory: classification.observedCategory }
      });
      snapshotUpdates += 1;
    }

    productClassification.set(snapshot.marketProductId, { category: classification.observedCategory, itemType: classification.itemType, subItemType: classification.subItemType });
  }

  for (const [productId, classification] of productClassification) {
    const product = await prisma.marketProduct.findUnique({ where: { id: productId }, select: { category: true, itemType: true, subItemType: true } });
    if (!product) continue;
    if (product.category === classification.category && product.itemType === classification.itemType && product.subItemType === classification.subItemType) continue;

    await prisma.marketProduct.update({
      where: { id: productId },
      data: { category: classification.category, itemType: classification.itemType, subItemType: classification.subItemType }
    });
    productUpdates += 1;
  }

  const afterSnapshotCount = await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } });
  if (beforeSnapshotCount !== afterSnapshotCount) {
    throw new Error(`REAL snapshot count changed during reclassification: ${beforeSnapshotCount} -> ${afterSnapshotCount}`);
  }

  const after = await auditConflicts();
  console.log(JSON.stringify({
    realSnapshotsPreserved: afterSnapshotCount,
    snapshotUpdates,
    productUpdates,
    conflictsBefore: before.length,
    conflictsAfter: after.length,
    before,
    after
  }, null, 2));
}

function asRankingCategory(value: string | null | undefined): RankingCategory | null {
  return value && rankingCategorySet.has(value) ? (value as RankingCategory) : null;
}

function parseRawData(rawData: string | null) {
  if (!rawData) return null;
  try {
    return JSON.parse(rawData) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sourceCategoryTextFromRaw(raw: Record<string, unknown> | null) {
  if (!raw) return "";
  const breadcrumb = Array.isArray(raw.breadcrumb) ? raw.breadcrumb.filter((value): value is string => typeof value === "string") : [];
  const hierarchy = Array.isArray(raw.department_hierarchy) ? raw.department_hierarchy.filter((value): value is string => typeof value === "string") : [];
  return [...breadcrumb, ...hierarchy].join(" ");
}

async function auditConflicts(): Promise<Conflict[]> {
  const snapshots = await prisma.marketRankingSnapshot.findMany({
    where: { dataMode: "real", source: { in: verifiedSources } },
    include: { marketProduct: true },
    orderBy: [{ source: "asc" }, { periodDate: "asc" }, { rank: "asc" }]
  });

  const conflicts: Conflict[] = [];
  for (const snapshot of snapshots) {
    const product = snapshot.marketProduct;
    const text = `${product.name} ${product.brand}`.toLowerCase();
    const category = snapshot.observedCategory;
    const subItemType = product.subItemType;
    let reason: string | null = null;

    if (category === "BAG" && subItemType && !["OTHER", "BACKPACK", "NYLON_BAG", "KEYRING"].includes(subItemType)) reason = `BAG cannot use ${subItemType}`;
    if (category === "HEADWEAR" && subItemType && !["OTHER", "BALL_CAP"].includes(subItemType)) reason = `HEADWEAR cannot use ${subItemType}`;
    if (category === "PANTS" && subItemType && ["BACKPACK", "NYLON_BAG", "KEYRING"].includes(subItemType)) reason = `PANTS cannot use ${subItemType}`;
    if (category === "SHORT_SLEEVE_TSHIRT" && /long sleeve|long-sleeve|\bl\/s\b|長袖|ロングスリーブ|ロンt|long tee/i.test(text) && !/short sleeve|short-sleeve|\bs\/s\b|半袖/i.test(text)) {
      reason = "SHORT_SLEEVE_TSHIRT conflicts with long sleeve keyword";
    }

    if (reason) {
      conflicts.push({
        source: snapshot.source,
        externalProductId: product.externalProductId,
        brand: product.brand,
        name: product.name,
        observedCategory: category,
        subItemType,
        reason
      });
    }
  }
  return conflicts;
}

main()
  .catch((error) => {
    console.error("Market data reclassification failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
