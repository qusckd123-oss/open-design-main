import { describeItemContexts, extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { prisma } from "../src/db/client";

/**
 * RAW vs ANALYSIS-ELIGIBLE AUDIT (read-only, no network, no writes)
 *
 * The dashboard analyses only FASHION_RELEVANT posts, but the corpus also
 * holds posts that were collected and then excluded. Those are two different
 * numbers and must never be presented as one. This reports both, per source,
 * plus what the excluded posts actually are - which is how all-section sitemap
 * contamination becomes visible.
 *
 * Usage: npx tsx scripts/audit-fashion-eligibility.ts
 */
async function main() {
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real" },
    select: { id: true, source: true, title: true, text: true, fashionRelevance: true, publishedAt: true }
  });

  const total = posts.length;
  const eligible = posts.filter((post) => post.fashionRelevance === "FASHION_RELEVANT");
  console.log("========== RAW vs ANALYSIS-ELIGIBLE ==========");
  console.log(`Collected posts (raw):            ${total}`);
  console.log(`Analysis-eligible (FASHION_RELEVANT): ${eligible.length}`);
  console.log(`Excluded from analysis:           ${total - eligible.length}`);

  console.log("\nSource       | Raw | Eligible | Unknown | NonFashion | ItemPosts | RelPosts | Relations | Rel/Eligible");
  const sources = [...new Set(posts.map((post) => post.source))].sort();
  for (const source of sources) {
    const rows = posts.filter((post) => post.source === source);
    const rowsEligible = rows.filter((post) => post.fashionRelevance === "FASHION_RELEVANT");
    const unknown = rows.filter((post) => post.fashionRelevance === "UNKNOWN").length;
    const nonFashion = rows.filter((post) => post.fashionRelevance === "NON_FASHION").length;
    let itemPosts = 0;
    let relPosts = 0;
    let relations = 0;
    for (const post of rowsEligible) {
      if (describeItemContexts(post).length > 0) itemPosts += 1;
      const postRelations = extractDirectAttributeRelations(post);
      if (postRelations.length > 0) relPosts += 1;
      relations += postRelations.length;
    }
    console.log(
      `${source.padEnd(12)} | ${String(rows.length).padStart(3)} | ${String(rowsEligible.length).padStart(8)} | ${String(unknown).padStart(7)} | ` +
        `${String(nonFashion).padStart(10)} | ${String(itemPosts).padStart(9)} | ${String(relPosts).padStart(8)} | ${String(relations).padStart(9)} | ` +
        `${(relations / Math.max(1, rowsEligible.length)).toFixed(3).padStart(12)}`
    );
  }

  // Contamination detail: what did the all-section sitemap bring in?
  console.log("\n========== EXCLUDED POSTS (not analysed) ==========");
  for (const source of sources) {
    const excluded = posts.filter((post) => post.source === source && post.fashionRelevance !== "FASHION_RELEVANT");
    if (excluded.length === 0) continue;
    console.log(`\n--- ${source}: ${excluded.length} excluded ---`);
    for (const post of excluded.slice(0, 12)) {
      console.log(`  [${post.fashionRelevance}] ${post.title.slice(0, 72)}`);
    }
  }

  // Eligible posts that carry no fashion item signal at all - the shape of
  // "collected but analytically inert" content.
  console.log("\n========== ELIGIBLE BUT ITEM-FREE (top sources) ==========");
  for (const source of sources) {
    const rowsEligible = posts.filter((post) => post.source === source && post.fashionRelevance === "FASHION_RELEVANT");
    const itemFree = rowsEligible.filter((post) => describeItemContexts(post).length === 0);
    console.log(`${source.padEnd(12)} ${itemFree.length}/${rowsEligible.length} eligible posts contain no specific-item mention`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
