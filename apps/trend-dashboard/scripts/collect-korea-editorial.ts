import { editorialSources, type EditorialSource } from "../src/config/editorial-sources";
import { collectEditorialFeed, EditorialRateLimitedError } from "../src/collectors/editorial/rss";
import { extractEditorialMentions } from "../src/collectors/editorial/mentions";
import { prisma } from "../src/db/client";
import type { SourceCollectionOutcome } from "../src/services/editorial-refresh-policy";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

export type { SourceCollectionOutcome };

function argValue(name: string) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  return arg?.split("=").slice(1).join("=");
}

export type SourceCollectionOptions = {
  days?: number;
  limitPerSource?: number;
  /** When true, performs real discovery/fetch/parse but writes nothing. */
  dryRun?: boolean;
};

/**
 * Collects and upserts one source's real articles. Exported so
 * `scripts/refresh-editorial.ts` (the orchestration runner) can call the
 * exact same collection+upsert logic per source instead of reimplementing
 * it - "orchestrate existing logic, not duplicate collector/parser code"
 * (docs/EDITORIAL_REFRESH_OPERATIONS.md). This function's own behavior is
 * unchanged from before the 2026-09-09 refresh-operationalization pass -
 * `main()` below still calls it in the same per-source loop it always did.
 *
 * Never throws on a source-level failure - always returns an outcome object,
 * classifying rate-limiting (EditorialRateLimitedError, already raised by
 * every collector in rss.ts on HTTP 202/429/empty-body) separately from a
 * genuine unexpected failure, so a caller can apply different policy to each
 * (see classifySourceOutcome in refresh-editorial.ts).
 */
export async function collectAndUpsertSource(source: EditorialSource, options: SourceCollectionOptions = {}): Promise<SourceCollectionOutcome> {
  const { days, limitPerSource = 30, dryRun = false } = options;
  const collectedAt = new Date();
  try {
    if (!editorialSources.includes(source)) throw new Error(`Unsupported editorial source: ${source}`);
    // Skip re-fetching articles we already store: discovery still lists them,
    // but spending a request on a known URL only adds load to a host that has
    // previously answered heavy traffic with bot mitigation.
    const known = await prisma.editorialPost.findMany({ where: { dataMode: "real", source }, select: { canonicalUrl: true, url: true } });
    const skipUrls = new Set(known.flatMap((row) => [row.canonicalUrl, row.url].filter((value): value is string => Boolean(value))));
    const posts = await collectEditorialFeed(source, limitPerSource, { days, skipUrls });
    let mentions = 0;
    let newPosts = 0;
    let updatedPosts = 0;
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
      if (existing) updatedPosts += 1;
      else newPosts += 1;
      // DRY RUN: `findUnique` above is a read, already safe - only the writes
      // below (upsert/deleteMany/createMany) are skipped. This still exercises
      // the real network discovery/fetch/parse path and the real new-vs-
      // updated classification, so a dry run genuinely validates source
      // health and reports an accurate expected-change count; it just never
      // mutates the database. Per docs/EDITORIAL_REFRESH_OPERATIONS.md
      // "Dry Run": no separate transaction-simulation machinery.
      if (dryRun) continue;
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
    return { source, status: "SUCCESS", posts: posts.length, newPosts, updatedPosts, mentions };
  } catch (error) {
    if (error instanceof EditorialRateLimitedError) {
      return { source, status: "RATE_LIMITED", posts: 0, newPosts: 0, updatedPosts: 0, mentions: 0, error: error.message };
    }
    return { source, status: "FAILED", posts: 0, newPosts: 0, updatedPosts: 0, mentions: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  const sourceArg = argValue("source");
  const limit = Number(argValue("limit") ?? 30);
  const days = argValue("days") ? Number(argValue("days")) : undefined;
  const limitPerSource = Number(argValue("limit-per-source") ?? limit);
  const sources = sourceArg ? [sourceArg as EditorialSource] : [...editorialSources];
  const summary: SourceCollectionOutcome[] = [];

  for (const source of sources) {
    summary.push(await collectAndUpsertSource(source, { days, limitPerSource }));
  }

  console.log("KOREA EDITORIAL COLLECTION");
  for (const row of summary) {
    console.log(`${row.source}: ${row.status} posts=${row.posts} mentions=${row.mentions}${row.error ? ` error=${row.error}` : ""}`);
  }
  const failed = summary.filter((row) => row.status === "FAILED" || row.status === "RATE_LIMITED");
  if (failed.length === summary.length) process.exitCode = 1;
}

// CRITICAL: only auto-run when this file is the actual CLI entrypoint, never
// when imported. `collectAndUpsertSource` above is imported by
// scripts/refresh-editorial.ts (the orchestration runner) and by
// scripts/test-refresh-editorial.ts's type-only imports - an earlier version
// of this file called `main()` unconditionally at module scope, so simply
// IMPORTING this file also re-ran this file's OWN CLI main() using whatever
// --source/--days/--limit happened to be in the process's shared argv. Found
// during the 2026-09-09 refresh-operationalization pass's own dry-run
// validation: `refresh-editorial.ts --dry-run --source=NONLABEL` silently
// triggered a second, real, uncontrolled `collect-korea-editorial.ts` run
// for the same source via this exact bug, writing 3 real posts despite
// --dry-run. Fixed here; see docs/EDITORIAL_REFRESH_OPERATIONS.md "Current
// Limitations" for the full incident writeup.
const isCliEntrypoint = process.argv[1] ? import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href : false;
if (isCliEntrypoint) {
  main()
    .catch((error) => {
      console.error("Korea editorial collection failed:", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
