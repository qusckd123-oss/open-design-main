import { extractOgImage, parseEyesmagRichBody, parseVislaRichBody } from "../src/collectors/editorial/rss";
import { prisma } from "../src/db/client";

/**
 * SAFE ARTICLE BODY REFRESH
 *
 * Re-fetches the PUBLIC ARTICLE PAGE for existing EYESMAG/VISLA EditorialPost
 * rows only (the two sources whose stored `text` was confirmed to be a short
 * meta-description/tagline rather than the real body - HYPEBEAST_KR/NONLABEL
 * already carry full bodies and are intentionally left untouched).
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

const TARGET_SOURCES = ["EYESMAG", "VISLA"] as const;
const REQUEST_DELAY_MS = 350;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchArticleHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "TrendSignalDashboard/0.1 (+editorial source audit)", Accept: "text/html,*/*" }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const beforeCount = await prisma.editorialPost.count({ where: { dataMode: "real" } });
  const candidates = await prisma.editorialPost.findMany({
    where: { dataMode: "real", source: { in: [...TARGET_SOURCES] } },
    select: { id: true, source: true, canonicalUrl: true, text: true, imageUrl: true }
  });

  console.log(`SAFE ARTICLE BODY REFRESH`);
  console.log(`EditorialPost REAL before: ${beforeCount}`);
  console.log(`Refresh candidates (EYESMAG + VISLA only): ${candidates.length}\n`);

  let updated = 0;
  let unchanged = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const post of candidates) {
    if (!post.canonicalUrl) {
      failed += 1;
      failures.push(`${post.source} ${post.id}: no canonicalUrl stored, skipped`);
      continue;
    }
    try {
      const html = await fetchArticleHtml(post.canonicalUrl);
      const richBody = post.source === "EYESMAG" ? parseEyesmagRichBody(html) : parseVislaRichBody(html);
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
      failed += 1;
      failures.push(`${post.source} ${post.canonicalUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(REQUEST_DELAY_MS);
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
