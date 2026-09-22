import { prisma } from "@/db/client";
import { currentMagazineWeek } from "@/lib/magazine-week";

const magazineTopicTypes = ["SUB_ITEM", "STYLE", "BRAND"];

export async function getCurrentMagazineIssue(now = new Date(), limit = 36) {
  const { start, end } = currentMagazineWeek(now);
  const where = {
    dataMode: "real",
    fashionRelevance: "FASHION_RELEVANT",
    publishedAt: { gte: start, lt: end }
  } as const;
  const [total, sourceGroups, articles] = await Promise.all([
    prisma.editorialPost.count({ where }),
    prisma.editorialPost.groupBy({ by: ["source"], where }),
    prisma.editorialPost.findMany({
      where,
      select: {
        id: true,
        source: true,
        title: true,
        url: true,
        publishedAt: true,
        imageUrl: true,
        mentions: {
          where: { type: { in: magazineTopicTypes } },
          select: { type: true, value: true },
          orderBy: [{ type: "asc" }, { value: "asc" }],
          take: 6
        }
      },
      orderBy: [{ publishedAt: "desc" }, { source: "asc" }, { id: "asc" }],
      take: Math.max(1, Math.min(limit, 60))
    })
  ]);
  return {
    start,
    end,
    total,
    sourceCount: sourceGroups.length,
    articles: articles.map((article) => ({
      ...article,
      topics: article.mentions.filter((mention) => magazineTopicTypes.includes(mention.type)).slice(0, 3)
    }))
  };
}
