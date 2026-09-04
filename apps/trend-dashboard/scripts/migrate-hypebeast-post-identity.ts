import { prisma } from "../src/db/client";

/**
 * ONE-TIME, IDEMPOTENT identity repair for HYPEBEAST_KR posts.
 *
 * Cause: the RSS feed's <guid> is a permalink on a different host
 * (kr.hypebeast.com/?post=NNN) than the canonical article URL
 * (hypebeast.kr/2026/9/slug). Historical sitemap collection keys identity on
 * the canonical URL, so any article seen by BOTH paths was stored twice.
 *
 * Repair, per duplicated canonicalUrl:
 *   - keep the row whose externalPostId already equals the canonical URL (the
 *     identity both discovery paths now agree on, and in every observed case
 *     also the richer body);
 *   - if no such row exists, keep the longest body and rewrite its identity;
 *   - delete the other rows AND their mentions.
 * Non-duplicated rows still carrying a guid identity are rewritten in place.
 *
 * Touches only source=HYPEBEAST_KR, dataMode=real. Never deletes a post that
 * is the sole holder of its canonical URL. Safe to re-run: a second run finds
 * nothing to do.
 *
 * Usage: npx tsx scripts/migrate-hypebeast-post-identity.ts [--apply]
 * Without --apply it is a dry run.
 */
async function main() {
  const apply = process.argv.includes("--apply");
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real", source: "HYPEBEAST_KR" },
    select: { id: true, externalPostId: true, canonicalUrl: true, url: true, text: true, createdAt: true }
  });

  const beforeTotal = await prisma.editorialPost.count({ where: { dataMode: "real" } });
  const beforeMentions = await prisma.editorialMention.count({ where: { post: { dataMode: "real" } } });
  console.log(`${apply ? "APPLY" : "DRY RUN"} - HYPEBEAST_KR posts: ${posts.length}`);
  console.log(`REAL EditorialPost before:    ${beforeTotal}`);
  console.log(`REAL EditorialMention before: ${beforeMentions}`);

  const groups = new Map<string, typeof posts>();
  for (const post of posts) {
    const key = (post.canonicalUrl || post.url || "").trim();
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), post]);
  }

  const toDelete: string[] = [];
  const toRewrite: Array<{ id: string; from: string; to: string }> = [];

  for (const [canonical, rows] of groups.entries()) {
    const keeper =
      rows.find((row) => row.externalPostId === canonical) ??
      [...rows].sort((a, b) => (b.text ?? "").length - (a.text ?? "").length)[0]!;
    for (const row of rows) {
      if (row.id === keeper.id) continue;
      toDelete.push(row.id);
    }
    if (keeper.externalPostId !== canonical) {
      toRewrite.push({ id: keeper.id, from: keeper.externalPostId, to: canonical });
    }
  }

  console.log(`\nDuplicate groups:        ${[...groups.values()].filter((rows) => rows.length > 1).length}`);
  console.log(`Posts to delete:         ${toDelete.length}`);
  console.log(`Identities to rewrite:   ${toRewrite.length}`);
  for (const row of toRewrite.slice(0, 5)) console.log(`   "${row.from}" -> "${row.to}"`);

  if (!apply) {
    console.log("\n(dry run - re-run with --apply to perform)");
    await prisma.$disconnect();
    return;
  }

  if (toDelete.length > 0) {
    const deletedMentions = await prisma.editorialMention.deleteMany({ where: { postId: { in: toDelete } } });
    const deletedPosts = await prisma.editorialPost.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`\nDeleted mentions: ${deletedMentions.count}`);
    console.log(`Deleted posts:    ${deletedPosts.count}`);
  }
  for (const row of toRewrite) {
    await prisma.editorialPost.update({ where: { id: row.id }, data: { externalPostId: row.to } });
  }
  if (toRewrite.length > 0) console.log(`Rewrote identities: ${toRewrite.length}`);

  const afterPosts = await prisma.editorialPost.findMany({
    where: { dataMode: "real", source: "HYPEBEAST_KR" },
    select: { externalPostId: true, canonicalUrl: true, url: true }
  });
  const canonicalKeys = afterPosts.map((post) => (post.canonicalUrl || post.url || "").trim());
  const remainingDuplicates = canonicalKeys.length - new Set(canonicalKeys).size;
  const nonCanonicalIdentities = afterPosts.filter((post) => post.externalPostId !== (post.canonicalUrl || post.url || "").trim()).length;

  console.log(`\nREAL EditorialPost after:    ${await prisma.editorialPost.count({ where: { dataMode: "real" } })}`);
  console.log(`REAL EditorialMention after: ${await prisma.editorialMention.count({ where: { post: { dataMode: "real" } } })}`);
  console.log(`HYPEBEAST_KR posts after:    ${afterPosts.length}`);
  console.log(`Remaining canonical dupes:   ${remainingDuplicates}`);
  console.log(`Non-canonical identities:    ${nonCanonicalIdentities}`);
  if (remainingDuplicates !== 0 || nonCanonicalIdentities !== 0) process.exitCode = 1;

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
