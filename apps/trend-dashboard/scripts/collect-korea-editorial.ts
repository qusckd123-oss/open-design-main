import { editorialSources, type EditorialSource } from "../src/config/editorial-sources";
import { collectEditorialFeed } from "../src/collectors/editorial/rss";
import { prisma } from "../src/db/client";

function argValue(name: string) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  return arg?.split("=").slice(1).join("=");
}

async function main() {
  const sourceArg = argValue("source");
  const limit = Number(argValue("limit") ?? 30);
  const days = argValue("days") ? Number(argValue("days")) : undefined;
  const limitPerSource = Number(argValue("limit-per-source") ?? limit);
  const sources = sourceArg ? [sourceArg as EditorialSource] : [...editorialSources];
  const collectedAt = new Date();
  const summary: Array<{ source: string; status: "SUCCESS" | "FAILED"; posts: number; mentions: number; error?: string }> = [];

  for (const source of sources) {
    try {
      if (!editorialSources.includes(source)) throw new Error(`Unsupported editorial source: ${source}`);
      const posts = await collectEditorialFeed(source, limitPerSource, { days });
      let mentions = 0;
      for (const post of posts) {
        const saved = await prisma.editorialPost.upsert({
          where: { source_externalPostId: { source: post.source, externalPostId: post.externalPostId } },
          update: {
            url: post.url,
            canonicalUrl: post.canonicalUrl,
            title: post.title,
            publishedAt: post.publishedAt,
            imageUrl: post.imageUrl,
            excerpt: post.excerpt,
            text: post.text,
            audienceGender: post.audienceGender,
            fashionRelevance: post.fashionRelevance,
            dataMode: "real",
            collectedAt
          },
          create: {
            source: post.source,
            externalPostId: post.externalPostId,
            url: post.url,
            canonicalUrl: post.canonicalUrl,
            title: post.title,
            publishedAt: post.publishedAt,
            imageUrl: post.imageUrl,
            excerpt: post.excerpt,
            text: post.text,
            audienceGender: post.audienceGender,
            fashionRelevance: post.fashionRelevance,
            dataMode: "real",
            collectedAt
          }
        });
        await prisma.editorialMention.deleteMany({ where: { postId: saved.id } });
        if (post.mentions.length > 0) {
          await prisma.editorialMention.createMany({
            data: post.mentions.map((mention) => ({
              postId: saved.id,
              type: mention.type,
              value: mention.value,
              audienceGender: mention.audienceGender,
              confidence: mention.confidence,
              evidence: mention.evidence
            }))
          });
          mentions += post.mentions.length;
        }
      }
      summary.push({ source, status: "SUCCESS", posts: posts.length, mentions });
    } catch (error) {
      summary.push({ source, status: "FAILED", posts: 0, mentions: 0, error: error instanceof Error ? error.message : String(error) });
    }
  }

  console.log("KOREA EDITORIAL COLLECTION");
  for (const row of summary) {
    console.log(`${row.source}: ${row.status} posts=${row.posts} mentions=${row.mentions}${row.error ? ` error=${row.error}` : ""}`);
  }
  const failed = summary.filter((row) => row.status === "FAILED");
  if (failed.length === summary.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Korea editorial collection failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
