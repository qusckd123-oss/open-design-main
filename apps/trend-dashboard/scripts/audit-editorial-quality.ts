import { describeItemContexts, extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { prisma } from "../src/db/client";
import { bundleEvidenceStrength, getAttributeBundles } from "../src/services/attribute-bundle-service";

/**
 * EDITORIAL CORPUS QUALITY AUDIT (read-only: no network, no writes)
 *
 * One command that answers "what is actually in the REAL editorial corpus,
 * and how much product-attribute signal does each source carry?" - designed to
 * be run BEFORE and AFTER any collection/reparse so the two outputs can be
 * diffed directly.
 *
 * Sections:
 *   1. TOTALS + integrity (canonical duplicates, mention duplicates)
 *   2. PER SOURCE corpus quality (body coverage, median length, images, dates)
 *   3. PER SOURCE attribute density (which outlets describe products, not just
 *      name them) - the number that decides whether a new source is worth adding
 *   4. GENDER evidence distribution
 *   5. SPECIFIC ITEMS (article presence / source spread)
 *   6. DIRECT ATTRIBUTE totals + dimension coverage
 *   7. TOP BUNDLES
 *   8. DATA QUALITY GATES (future dates, empty titles, short bodies)
 *   9. MARKET snapshot count (must stay untouched by editorial work)
 *
 * Usage: npx tsx scripts/audit-editorial-quality.ts
 */
async function main() {
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real" },
    select: {
      id: true, source: true, title: true, url: true, canonicalUrl: true,
      publishedAt: true, imageUrl: true, excerpt: true, text: true,
      fashionRelevance: true, audienceGender: true
    }
  });
  const mentions = await prisma.editorialMention.findMany({
    where: { post: { dataMode: "real" } },
    select: { postId: true, type: true, value: true, audienceGender: true }
  });
  const marketSnapshots = await prisma.marketRankingSnapshot.count({ where: { dataMode: "real" } });

  console.log("========== EDITORIAL CORPUS QUALITY ==========");
  console.log(`TOTAL POSTS (real):    ${posts.length}`);
  console.log(`TOTAL MENTIONS (real): ${mentions.length}`);

  // --- integrity ---
  const canonicalCounts = new Map<string, number>();
  for (const post of posts) {
    const key = (post.canonicalUrl || post.url || "").trim().toLowerCase();
    if (!key) continue;
    canonicalCounts.set(key, (canonicalCounts.get(key) ?? 0) + 1);
  }
  const canonicalDuplicates = [...canonicalCounts.entries()].filter(([, count]) => count > 1);
  const mentionKeys = mentions.map((mention) => `${mention.postId}:${mention.type}:${mention.value}`);
  const mentionDuplicates = mentionKeys.length - new Set(mentionKeys).size;
  console.log(`CANONICAL DUPLICATES:  ${canonicalDuplicates.length}${canonicalDuplicates.length ? ` -> ${canonicalDuplicates.slice(0, 5).map(([url]) => url).join(", ")}` : ""}`);
  console.log(`MENTION DUPLICATES:    ${mentionDuplicates}`);

  // --- per source corpus quality ---
  const sources = [...new Set(posts.map((post) => post.source))].sort();
  console.log("\n========== PER SOURCE CORPUS QUALITY ==========");
  console.log("Source        | Posts | FashionRel | BodyCov | MedianBody | ImageCov | Oldest     | Latest");
  for (const source of sources) {
    const rows = posts.filter((post) => post.source === source);
    const withBody = rows.filter((post) => (post.text ?? "").trim().length >= 200);
    const lengths = rows.map((post) => (post.text ?? "").trim().length).sort((a, b) => a - b);
    const median = lengths.length ? lengths[Math.floor(lengths.length / 2)] ?? 0 : 0;
    const withImage = rows.filter((post) => Boolean(post.imageUrl));
    const relevant = rows.filter((post) => post.fashionRelevance === "FASHION_RELEVANT");
    const dates = rows.map((post) => post.publishedAt).filter((date): date is Date => Boolean(date)).sort((a, b) => a.getTime() - b.getTime());
    console.log(
      `${source.padEnd(13)} | ${String(rows.length).padStart(5)} | ${String(relevant.length).padStart(10)} | ` +
        `${pct(withBody.length, rows.length).padStart(7)} | ${String(median).padStart(10)} | ${pct(withImage.length, rows.length).padStart(8)} | ` +
        `${iso(dates[0])} | ${iso(dates[dates.length - 1])}`
    );
  }

  // --- per source attribute density (PHASE 2) ---
  console.log("\n========== PER SOURCE ATTRIBUTE DENSITY ==========");
  console.log("Which outlets DESCRIBE products vs merely NAME them.");
  console.log("Source        | Posts | ItemPosts | %  | AttrPosts | %  | Relations | Rel/Post | UniqItems | UniqAttrs");
  const relevantPosts = posts.filter((post) => post.fashionRelevance === "FASHION_RELEVANT");
  const bundleSourceContribution = new Map<string, Set<string>>();
  for (const source of sources) {
    const rows = relevantPosts.filter((post) => post.source === source);
    let itemPosts = 0;
    let attrPosts = 0;
    let relations = 0;
    const uniqueItems = new Set<string>();
    const uniqueAttributes = new Set<string>();
    for (const post of rows) {
      const contexts = describeItemContexts(post);
      if (contexts.length > 0) itemPosts += 1;
      const postRelations = extractDirectAttributeRelations(post);
      if (postRelations.length > 0) attrPosts += 1;
      relations += postRelations.length;
      for (const relation of postRelations) {
        uniqueItems.add(relation.specificItem);
        uniqueAttributes.add(`${relation.attributeType}:${relation.attributeValue}`);
      }
    }
    console.log(
      `${source.padEnd(13)} | ${String(rows.length).padStart(5)} | ${String(itemPosts).padStart(9)} | ${pct(itemPosts, rows.length).padStart(3)} | ` +
        `${String(attrPosts).padStart(9)} | ${pct(attrPosts, rows.length).padStart(3)} | ${String(relations).padStart(9)} | ` +
        `${(relations / Math.max(1, rows.length)).toFixed(2).padStart(8)} | ${String(uniqueItems.size).padStart(9)} | ${String(uniqueAttributes.size).padStart(9)}`
    );
  }

  // --- gender ---
  console.log("\n========== GENDER EVIDENCE (mention level) ==========");
  const genderCounts = new Map<string, number>();
  for (const mention of mentions) genderCounts.set(mention.audienceGender, (genderCounts.get(mention.audienceGender) ?? 0) + 1);
  for (const gender of ["MEN", "WOMEN", "UNISEX", "MIXED", "UNKNOWN"]) {
    console.log(`  ${gender.padEnd(8)} ${String(genderCounts.get(gender) ?? 0).padStart(5)}`);
  }

  // --- specific items ---
  console.log("\n========== SPECIFIC ITEMS (SUB_ITEM mentions) ==========");
  console.log("Item                | Articles | Sources");
  const subItems = new Map<string, { articles: Set<string>; sources: Set<string> }>();
  const postSource = new Map(posts.map((post) => [post.id, post.source]));
  for (const mention of mentions) {
    if (mention.type !== "SUB_ITEM") continue;
    const entry = subItems.get(mention.value) ?? { articles: new Set<string>(), sources: new Set<string>() };
    entry.articles.add(mention.postId);
    const source = postSource.get(mention.postId);
    if (source) entry.sources.add(source);
    subItems.set(mention.value, entry);
  }
  for (const [value, entry] of [...subItems.entries()].sort((a, b) => b[1].articles.size - a[1].articles.size)) {
    console.log(`${value.padEnd(19)} | ${String(entry.articles.size).padStart(8)} | ${entry.sources.size} [${[...entry.sources].join(", ")}]`);
  }

  // --- direct attributes ---
  const relationRows = new Map<string, { item: string; type: string; value: string; articles: Set<string>; sources: Set<string> }>();
  let emitted = 0;
  for (const post of relevantPosts) {
    for (const relation of extractDirectAttributeRelations(post)) {
      emitted += 1;
      const key = `${relation.specificItem}|${relation.attributeType}|${relation.attributeValue}`;
      const row = relationRows.get(key) ?? { item: relation.specificItem, type: relation.attributeType, value: relation.attributeValue, articles: new Set<string>(), sources: new Set<string>() };
      row.articles.add(post.id);
      row.sources.add(post.source);
      relationRows.set(key, row);
      const contribution = bundleSourceContribution.get(post.source) ?? new Set<string>();
      contribution.add(relation.specificItem);
      bundleSourceContribution.set(post.source, contribution);
    }
  }
  const bundles = await getAttributeBundles("real");
  const repeated = bundles.filter((bundle) => bundle.bundleArticlePresence >= 2);
  console.log("\n========== DIRECT ATTRIBUTE COVERAGE ==========");
  console.log(`Direct relations (post-level): ${emitted}`);
  console.log(`Distinct (item, attr) pairs:   ${relationRows.size}`);
  console.log(`Items with direct attributes:  ${new Set([...relationRows.values()].map((row) => row.item)).size}`);
  console.log(`Attribute bundles:             ${bundles.length}`);
  console.log(`Repeated bundles (>=2 art.):   ${repeated.length}`);

  console.log("\nDimension coverage:");
  console.log("Dimension   | DistinctAttrs | Relations | ArticlePresence | SourceSpread");
  const dimensions = new Map<string, { attrs: Set<string>; relations: number; articles: Set<string>; sources: Set<string> }>();
  for (const row of relationRows.values()) {
    const entry = dimensions.get(row.type) ?? { attrs: new Set<string>(), relations: 0, articles: new Set<string>(), sources: new Set<string>() };
    entry.attrs.add(row.value);
    entry.relations += 1;
    for (const article of row.articles) entry.articles.add(article);
    for (const source of row.sources) entry.sources.add(source);
    dimensions.set(row.type, entry);
  }
  for (const dimension of ["SILHOUETTE", "DETAIL", "MATERIAL", "FINISH", "COLOR", "STYLE"]) {
    const entry = dimensions.get(dimension);
    console.log(
      `${dimension.padEnd(11)} | ${String(entry?.attrs.size ?? 0).padStart(13)} | ${String(entry?.relations ?? 0).padStart(9)} | ` +
        `${String(entry?.articles.size ?? 0).padStart(15)} | ${String(entry?.sources.size ?? 0).padStart(12)}`
    );
  }

  console.log("\n========== TOP BUNDLES ==========");
  console.log("Bundle | Articles | Sources | Strength | Latest");
  for (const bundle of bundles) {
    const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
    console.log(`"${bundle.displayName}" | ${bundle.bundleArticlePresence} | ${bundle.bundleSourceSpread} | ${strength} | ${iso(bundle.latestObservedAt)}`);
  }
  if (bundles.length === 0) console.log("(none)");

  // --- quality gates ---
  console.log("\n========== DATA QUALITY GATES ==========");
  const now = Date.now();
  const futureDated = posts.filter((post) => post.publishedAt && post.publishedAt.getTime() > now + 24 * 60 * 60 * 1000);
  const missingDate = posts.filter((post) => !post.publishedAt);
  const emptyTitles = posts.filter((post) => !post.title.trim());
  const missingCanonical = posts.filter((post) => !post.canonicalUrl);
  const shortBodies = posts.filter((post) => (post.text ?? "").trim().length < 200);
  console.log(`Future-dated posts:   ${futureDated.length}`);
  console.log(`Missing publishedAt:  ${missingDate.length}`);
  console.log(`Empty titles:         ${emptyTitles.length}`);
  console.log(`Missing canonicalUrl: ${missingCanonical.length}`);
  console.log(`Bodies < 200 chars:   ${shortBodies.length} (${pct(shortBodies.length, posts.length)})`);
  console.log(`Fashion relevance:    ${["FASHION_RELEVANT", "UNKNOWN", "NON_FASHION"].map((value) => `${value}=${posts.filter((post) => post.fashionRelevance === value).length}`).join(" ")}`);

  console.log("\n========== MARKET (must be untouched by editorial work) ==========");
  console.log(`MarketRankingSnapshot (real): ${marketSnapshots}`);

  await prisma.$disconnect();
}

function pct(part: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function iso(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
