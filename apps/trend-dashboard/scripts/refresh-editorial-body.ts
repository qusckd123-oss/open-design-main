import { extractOgImage, parseEyesmagRichBody, parseHypebeastRichBody, parseVislaRichBody } from "../src/collectors/editorial/rss";
import { prisma } from "../src/db/client";

/**
 * SAFE ARTICLE BODY REFRESH
 *
 * Re-fetches the PUBLIC ARTICLE PAGE for existing EditorialPost rows. Defaults
 * to EYESMAG+VISLA (the sources whose stored `text` was originally a short
 * meta-description rather than the real body); pass `--source=HYPEBEAST_KR`
 * to repair bodies truncated by the old fixed-offset cap in
 * parseHypebeastRichBody. `--limit=N` bounds a run.
 *
 * Rate-limit safety: hypebeast.kr answers heavy automated traffic with
 * HTTP 202 + an empty body. That, 429, and an empty 200 body all stop the run
 * immediately on first occurrence - no retry, no alternate identity, no bypass.
 * HYPEBEAST_KR requests additionally use a slower 2.5s cadence.
 *
 * Safety properties, by construction:
 * - Iterates EXISTING rows by their own stored `canonicalUrl`. It never
 *   crawls a sitemap/listing, so it structurally cannot discover or create a
 *   new post - `prisma.editorialPost.update` is used, never `upsert`/`create`.
 * - `id` (and therefore `source`+`externalPostId` identity) is never
 *   touched, only `text`/`excerpt`/`imageUrl`.
 * - Only replaces `text` when the newly parsed body is LONGER than what is
 *   already stored, so a network hiccup or a parser miss can only leave a
 *   row unchanged, never regress a good body to a worse one.
 * - Does not touch EditorialMention. Mention reparse is a deliberately
 *   separate step (`npm run reparse:editorial-mentions`), run only after
 *   this refresh is confirmed - see docs/ATTRIBUTE_BUNDLE_AUDIT.md.
 */

const DEFAULT_SOURCES = ["EYESMAG", "VISLA"] as const;
const REQUEST_DELAY_MS = 350;
// hypebeast.kr answered a large crawl with HTTP 202 + empty body (bot
// mitigation), so it gets a deliberately slower cadence of its own.
const SLOW_HOST_DELAY_MS = 2500;

/**
 * Signals that the host has started refusing automated traffic. Raised on the
 * first occurrence so the run stops immediately instead of retrying into a
 * block - never bypassed, never retried with a different identity.
 */
class RateLimitedError extends Error {}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchArticleHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "TrendSignalDashboard/0.1 (+editorial source audit)", Accept: "text/html,*/*" }
  });
  // 202-with-empty-body and 429 both mean "stop asking", not "try again".
  if (response.status === 429 || response.status === 202) {
    throw new RateLimitedError(`HTTP ${response.status} - host is refusing automated requests`);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (html.trim().length === 0) throw new RateLimitedError("empty body - host is refusing automated requests");
  return html;
}

function parseRichBody(source: string, html: string): string | null {
  if (source === "EYESMAG") return parseEyesmagRichBody(html);
  if (source === "VISLA") return parseVislaRichBody(html);
  if (source === "HYPEBEAST_KR") return parseHypebeastRichBody(html);
  return null;
}

function argValue(name: string) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  return arg?.split("=").slice(1).join("=");
}

async function main() {
  const sourceArg = argValue("source");
  const limitArg = Number(argValue("limit") ?? Number.POSITIVE_INFINITY);
  const targetSources = sourceArg ? [sourceArg] : [...DEFAULT_SOURCES];
  const beforeCount = await prisma.editorialPost.count({ where: { dataMode: "real" } });
  const candidates = (await prisma.editorialPost.findMany({
    where: { dataMode: "real", source: { in: targetSources } },
    select: { id: true, source: true, canonicalUrl: true, text: true, imageUrl: true },
    orderBy: { publishedAt: "desc" }
  })).slice(0, limitArg);

  console.log(`SAFE ARTICLE BODY REFRESH`);
  console.log(`EditorialPost REAL before: ${beforeCount}`);
  console.log(`Refresh candidates (${targetSources.join(" + ")}): ${candidates.length}\n`);

  let updated = 0;
  let unchanged = 0;
  let failed = 0;
  let rateLimited = false;
  const failures: string[] = [];

  for (const post of candidates) {
    if (!post.canonicalUrl) {
      failed += 1;
      failures.push(`${post.source} ${post.id}: no canonicalUrl stored, skipped`);
      continue;
    }
    try {
      const html = await fetchArticleHtml(post.canonicalUrl);
      const richBody = parseRichBody(post.source, html);
      const currentLength = (post.text ?? "").trim().length;
      const data: { text?: string; excerpt?: string; imageUrl?: string } = {};
      if (richBody && richBody.length > currentLength) {
        data.text = richBody;
        data.excerpt = richBody.slice(0, 280);
      }
      if (post.source === "VISLA" && !post.imageUrl) {
        const image = extractOgImage(html);
        if (image) data.imageUrl = image;
      }
      if (Object.keys(data).length > 0) {
        await prisma.editorialPost.update({ where: { id: post.id }, data });
        updated += 1;
      } else {
        unchanged += 1;
      }
    } catch (error) {
      if (error instanceof RateLimitedError) {
        // Stop the whole run on the first refusal. Everything already written
        // stays valid because each row is updated independently and only ever
        // upward.
        console.log(`\nSTOPPED: ${post.source} ${post.canonicalUrl} -> ${error.message}`);
        console.log("Host is refusing automated requests; no retry is attempted.");
        rateLimited = true;
        break;
      }
      failed += 1;
      failures.push(`${post.source} ${post.canonicalUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(post.source === "HYPEBEAST_KR" ? SLOW_HOST_DELAY_MS : REQUEST_DELAY_MS);
  }

  const afterCount = await prisma.editorialPost.count({ where: { dataMode: "real" } });
  const duplicateCheck = await prisma.editorialPost.groupBy({
    by: ["canonicalUrl"],
    where: { dataMode: "real" },
    _count: { _all: true },
    having: { canonicalUrl: { _count: { gt: 1 } } }
  });

  console.log(`Updated (body grew): ${updated}`);
  console.log(`Unchanged (no improvement found): ${unchanged}`);
  console.log(`Failed (network/parse error, row untouched): ${failed}`);
  console.log(`Stopped early by host rate limiting: ${rateLimited ? "YES" : "no"}`);
  if (failures.length > 0) {
    console.log("Failures:");
    for (const line of failures) console.log(`  ${line}`);
  }
  console.log(`\nEditorialPost REAL after: ${afterCount}`);
  console.log(`Post identity preserved: ${afterCount === beforeCount ? "YES" : "NO - INVESTIGATE"}`);
  console.log(`Duplicate canonicalUrl groups: ${duplicateCheck.length}`);

  if (afterCount !== beforeCount) {
    console.error("ABORT CONDITION: EditorialPost count changed. This script must never create or delete posts.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Editorial body refresh failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
