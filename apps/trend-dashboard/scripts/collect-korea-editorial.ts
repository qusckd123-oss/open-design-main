import { editorialSources, type EditorialSource } from "../src/config/editorial-sources";
import { collectEditorialFeed } from "../src/collectors/editorial/rss";
import { extractEditorialMentions } from "../src/collectors/editorial/mentions";
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
      // Skip re-fetching articles we already store: discovery still lists them,
      // but spending a request on a known URL only adds load to a host that has
      // previously answered heavy traffic with bot mitigation.
      const known = await prisma.editorialPost.findMany({ where: { dataMode: "real", source }, select: { canonicalUrl: true, url: true } });
      const skipUrls = new Set(known.flatMap((row) => [row.canonicalUrl, row.url].filter((value): value is string => Boolean(value))));
      const posts = await collectEditorialFeed(source, limitPerSource, { days, skipUrls });
      let mentions = 0;
      for (const post of posts) {
        // Never shrink a stored body. The same article can legitimately be seen
        // through two discovery paths with different richness - a Hypebeast
        // multi-product roundup, for example, carries every product in the RSS
        // content:encoded but not in the article page's post-body-content. The
        // longer body is always the better evidence, so a re-collection may add
        // text but must never delete it. Mirrors the rule refresh-editorial-body
        // already applies. imageUrl is likewise only filled in, never cleared.
        const existing = await prisma.editorialPost.findUnique({
          where: { source_externalPostId: { source: post.source, externalPostId: post.externalPostId } },
          select: { text: true, excerpt: true, imageUrl: true }
        });
        const keepExistingBody = (existing?.text?.length ?? 0) > (post.text?.length ?? 0);
        const finalText = keepExistingBody ? existing?.text ?? post.text : post.text;
        const finalExcerpt = keepExistingBody ? existing?.excerpt ?? post.excerpt : post.excerpt;
        // Mentions must describe the body that is actually stored.
        const finalMentions = keepExistingBody
          ? extractEditorialMentions({ title: post.title, text: finalText ?? "", postGender: post.audienceGender })
          : post.mentions;

        const saved = await prisma.editorialPost.upsert({
          where: { source_externalPostId: { source: post.source, externalPostId: post.externalPostId } },
          update: {
            url: post.url,
            canonicalUrl: post.canonicalUrl,
            title: post.title,
            publishedAt: post.publishedAt,
            imageUrl: post.imageUrl ?? existing?.imageUrl ?? null,
            excerpt: finalExcerpt,
            text: finalText,
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
        if (finalMentions.length > 0) {
          await prisma.editorialMention.createMany({
            data: finalMentions.map((mention) => ({
              postId: saved.id,
              type: mention.type,
              value: mention.value,
              audienceGender: mention.audienceGender,
              confidence: mention.confidence,
              evidence: mention.evidence
            }))
          });
          mentions += finalMentions.length;
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
