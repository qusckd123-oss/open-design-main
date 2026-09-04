import { extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { prisma } from "../src/db/client";
import { composeBundleName } from "../src/lib/korean-labels";
import { bundleEvidenceStrength, getAttributeBundles } from "../src/services/attribute-bundle-service";

/**
 * Read-only audit of DIRECT attribute relations across the REAL editorial
 * corpus. No network access, no writes - it re-derives relations from stored
 * post text so you can see exactly which (item, attribute) pairs are backed
 * by direct modification, and which article/source each came from.
 *
 * Pass --all-relevance to also scan posts whose fashionRelevance is not
 * FASHION_RELEVANT. Those are excluded from the app surfaces (the editorial
 * trend service uses the same gate) but are useful for spotting evidence
 * that is being missed because of relevance classification.
 */
async function main() {
  const allRelevance = process.argv.includes("--all-relevance");
  const gate = allRelevance ? {} : { fashionRelevance: "FASHION_RELEVANT" };
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real", ...gate },
    select: { id: true, source: true, title: true, excerpt: true, text: true }
  });

  console.log(`REAL posts scanned: ${posts.length}${allRelevance ? " (all relevance)" : " (FASHION_RELEVANT only)"}`);

  type Row = {
    specificItem: string;
    attributeType: string;
    attributeValue: string;
    relationKind: string;
    articles: Set<string>;
    sources: Set<string>;
    examples: Array<{ evidence: string; title: string; source: string }>;
  };
  const rows = new Map<string, Row>();
  let emitted = 0;

  for (const post of posts) {
    for (const relation of extractDirectAttributeRelations(post)) {
      emitted += 1;
      const key = `${relation.specificItem}|${relation.attributeType}|${relation.attributeValue}`;
      const row = rows.get(key) ?? {
        specificItem: relation.specificItem,
        attributeType: relation.attributeType,
        attributeValue: relation.attributeValue,
        relationKind: relation.relationKind,
        articles: new Set<string>(),
        sources: new Set<string>(),
        examples: []
      };
      row.articles.add(post.id);
      row.sources.add(post.source);
      if (row.examples.length < 3) row.examples.push({ evidence: relation.evidenceText, title: post.title, source: post.source });
      rows.set(key, row);
    }
  }

  console.log(`Direct relations emitted (post-level): ${emitted}`);
  console.log(`Distinct (item, attributeType, attributeValue): ${rows.size}\n`);

  console.log("=== DIRECT ATTRIBUTE RELATIONS ===");
  console.log("Specific Item | Attribute Type | Attribute Value | Relation Kind | Articles | Sources");
  for (const row of [...rows.values()].sort((a, b) => b.articles.size - a.articles.size || b.sources.size - a.sources.size)) {
    console.log(
      `${row.specificItem} | ${row.attributeType} | ${row.attributeValue} | ${row.relationKind} | ${row.articles.size} | ${row.sources.size} [${[...row.sources].join(", ")}]`
    );
    for (const example of row.examples) {
      console.log(`    e.g. [${example.source}] "...${example.evidence}"  <- ${example.title}`);
    }
  }
  if (rows.size === 0) console.log("(none)");

  if (!allRelevance) {
    const bundles = await getAttributeBundles("real");
    console.log(`\n=== ATTRIBUTE BUNDLES (${bundles.length}) ===`);
    for (const bundle of bundles) {
      const strength = bundleEvidenceStrength({ articlePresence: bundle.bundleArticlePresence, sourceSpread: bundle.bundleSourceSpread });
      console.log(
        `"${composeBundleName(bundle.specificItem, bundle.directAttributes)}" | ${bundle.bundleArticlePresence} articles | ${bundle.bundleSourceSpread} sources | ${strength}`
      );
    }
    if (bundles.length === 0) console.log("(none - direct attribute evidence is insufficient)");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
