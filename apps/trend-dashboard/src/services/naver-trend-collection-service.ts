import { prisma } from "@/db/client";
import type { NaverShoppingAgeCollectResult, NaverTrendCollectResult } from "@/collectors/naver/types";
import { seedTrendKeywords } from "@/services/keyword-seed-service";

export async function persistNaverTrendCollection(result: NaverTrendCollectResult, startedAt: Date) {
  await seedTrendKeywords();
  const run = await prisma.collectionRun.create({
    data: {
      source: result.source,
      mode: result.mode,
      startedAt,
      status: "RUNNING",
      fetchedCount: result.fetchedCount
    }
  });

  let snapshots = 0;
  for (const point of result.points) {
    const keyword = await prisma.trendKeyword.findUnique({ where: { name: point.keywordName } });
    if (!keyword) continue;
    await prisma.keywordTrendSnapshot.upsert({
      where: {
        keywordId_source_ageGroup_gender_period: {
          keywordId: keyword.id,
          source: point.source,
          ageGroup: point.ageGroup,
          gender: point.gender,
          period: point.period
        }
      },
      update: {
        ratio: point.ratio,
        dataMode: result.mode === "real" ? "real" : "mock",
        collectedAt: point.collectedAt
      },
      create: {
        keywordId: keyword.id,
        source: point.source,
        ageGroup: point.ageGroup,
        gender: point.gender,
        period: point.period,
        ratio: point.ratio,
        dataMode: result.mode === "real" ? "real" : "mock",
        collectedAt: point.collectedAt
      }
    });
    snapshots += 1;
  }

  for (const failure of result.failures) {
    await prisma.collectionError.create({
      data: {
        collectionRunId: run.id,
        source: result.source,
        externalId: failure.keywordName,
        reason: failure.reason,
        timestamp: failure.timestamp
      }
    });
  }

  const completedAt = new Date();
  const status = snapshots > 0 && result.failures.length === 0 ? "SUCCESS" : snapshots > 0 ? "PARTIAL_SUCCESS" : "FAILED";
  await prisma.collectionRun.update({
    where: { id: run.id },
    data: {
      completedAt,
      status,
      productCount: snapshots,
      fetchedCount: result.fetchedCount,
      errorCount: result.failures.length,
      errorMessage: result.failures[0]?.reason
    }
  });

  return {
    runId: run.id,
    status,
    fetched: result.fetchedCount,
    snapshots,
    failed: result.failures.length,
    elapsedMs: completedAt.getTime() - startedAt.getTime()
  };
}

export async function persistNaverShoppingAgeCollection(result: NaverShoppingAgeCollectResult, startedAt: Date) {
  await seedTrendKeywords();
  const run = await prisma.collectionRun.create({
    data: {
      source: result.source,
      mode: result.mode,
      startedAt,
      status: "RUNNING",
      fetchedCount: result.fetchedCount
    }
  });

  let snapshots = 0;
  for (const point of result.points) {
    const keyword = await prisma.trendKeyword.findUnique({ where: { name: point.keywordName } });
    if (!keyword) continue;
    await prisma.keywordShoppingAgeSnapshot.upsert({
      where: {
        keywordId_source_ageGroup_gender_period: {
          keywordId: keyword.id,
          source: point.source,
          ageGroup: point.ageGroup,
          gender: point.gender,
          period: point.period
        }
      },
      update: {
        ratio: point.ratio,
        dataMode: result.mode === "real" ? "real" : "mock",
        collectedAt: point.collectedAt
      },
      create: {
        keywordId: keyword.id,
        source: point.source,
        ageGroup: point.ageGroup,
        gender: point.gender,
        period: point.period,
        ratio: point.ratio,
        dataMode: result.mode === "real" ? "real" : "mock",
        collectedAt: point.collectedAt
      }
    });
    snapshots += 1;
  }

  for (const failure of result.failures) {
    await prisma.collectionError.create({
      data: {
        collectionRunId: run.id,
        source: result.source,
        externalId: failure.keywordName,
        reason: failure.reason,
        timestamp: failure.timestamp
      }
    });
  }

  const completedAt = new Date();
  const status = snapshots > 0 && result.failures.length === 0 ? "SUCCESS" : snapshots > 0 ? "PARTIAL_SUCCESS" : "FAILED";
  await prisma.collectionRun.update({
    where: { id: run.id },
    data: {
      completedAt,
      status,
      productCount: snapshots,
      fetchedCount: result.fetchedCount,
      errorCount: result.failures.length,
      errorMessage: result.failures[0]?.reason
    }
  });

  return {
    runId: run.id,
    status,
    fetched: result.fetchedCount,
    snapshots,
    failed: result.failures.length,
    elapsedMs: completedAt.getTime() - startedAt.getTime()
  };
}
