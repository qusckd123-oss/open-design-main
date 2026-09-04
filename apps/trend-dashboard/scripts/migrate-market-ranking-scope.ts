import { prisma } from "../src/db/client";

async function main() {
  const before = await counts();

  await prisma.marketRankingSnapshot.updateMany({
    where: { source: "END", dataMode: "real" },
    data: { rankingScope: "DEPARTMENT", rankingCategory: "CLOTHING" }
  });
  await prisma.marketRankingSnapshot.updateMany({
    where: { source: "RAKUTEN_FASHION", dataMode: "real" },
    data: { rankingScope: "SITEWIDE", rankingCategory: "ALL_FASHION" }
  });
  await prisma.marketRankingSnapshot.updateMany({
    where: { source: { in: ["SLAM_JAM", "STUSSY"] }, dataMode: "real" },
    data: { rankingScope: "CATEGORY" }
  });

  const snapshots = await prisma.marketRankingSnapshot.findMany({
    where: { observedCategory: "ALL" },
    select: { id: true, rankingCategory: true, marketProduct: { select: { category: true } } }
  });

  for (const snapshot of snapshots) {
    await prisma.marketRankingSnapshot.update({
      where: { id: snapshot.id },
      data: { observedCategory: snapshot.marketProduct.category ?? snapshot.rankingCategory }
    });
  }

  const after = await counts();
  if (before.realSnapshots !== after.realSnapshots) {
    throw new Error(`REAL snapshot count changed during ranking scope migration: ${before.realSnapshots} -> ${after.realSnapshots}`);
  }
  console.log(`Market ranking scope migration complete. REAL snapshots preserved: ${after.realSnapshots}.`);
}

async function counts() {
  return {
    realSnapshots: await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } })
  };
}

main()
  .catch((error) => {
    console.error("Market ranking scope migration failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
