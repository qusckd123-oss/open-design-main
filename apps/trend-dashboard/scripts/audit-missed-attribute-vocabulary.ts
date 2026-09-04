import { describeItemContexts, type ItemContext } from "../src/collectors/editorial/attribute-relations";
import { prisma } from "../src/db/client";

/**
 * MISSED VOCABULARY AUDIT (read-only, no network, no writes)
 *
 * Answers the one question that decides whether direct-attribute coverage is
 * limited by our taxonomy or by the corpus itself:
 *
 *   For every specific-item mention in the REAL corpus, what does the sentence
 *   actually say right before the item noun, and why did the extractor not
 *   turn it into a relation?
 *
 * Outcomes come straight from the extractor's own code path
 * (describeItemContexts), so this can never drift from real behaviour:
 *
 *   RELATION               - a direct attribute was found (already counted)
 *   NO_ATTRIBUTE_IN_WINDOW - a modifier zone exists but holds no known attribute
 *                            => candidate missed vocabulary, print it
 *   ENUMERATION            - another item noun sits in the window (guard fired)
 *   NO_WINDOW              - the item starts the segment; nothing precedes it
 *
 * Usage:
 *   npx tsx scripts/audit-missed-attribute-vocabulary.ts
 *   npx tsx scripts/audit-missed-attribute-vocabulary.ts --item TOTE_BAG
 *   npx tsx scripts/audit-missed-attribute-vocabulary.ts --all-relevance
 */

// Function words, particles, and generic verbs that carry no product meaning.
// Used only to rank candidate tokens for human review - never to auto-add
// anything to the taxonomy.
const STOPWORDS = new Set([
  "그", "이", "저", "및", "등", "수", "것", "더", "가장", "함께", "위한", "위해", "통해", "새로운", "새",
  "선보인다", "선보였다", "출시", "공개", "공개했다", "발매", "제품", "아이템", "브랜드", "컬렉션",
  "라인", "모델", "시리즈", "출시한다", "만나볼", "만나", "담은", "적용한", "활용한", "구성된",
  "the", "a", "an", "and", "with", "for", "of", "in", "on", "new", "is", "are", "to", "by", "its"
]);

type ItemStat = {
  specificItem: string;
  total: number;
  byOutcome: Map<string, number>;
  missedSamples: Array<{ source: string; title: string; window: string; wideContext: string }>;
  enumerationSamples: Array<{ source: string; title: string; window: string }>;
  articles: Set<string>;
};

async function main() {
  const allRelevance = process.argv.includes("--all-relevance");
  const itemFilterIndex = process.argv.indexOf("--item");
  const itemFilter = itemFilterIndex >= 0 ? process.argv[itemFilterIndex + 1] : null;
  const gate = allRelevance ? {} : { fashionRelevance: "FASHION_RELEVANT" };

  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real", ...gate },
    select: { id: true, source: true, title: true, excerpt: true, text: true }
  });

  console.log(`REAL posts scanned: ${posts.length}${allRelevance ? " (all relevance)" : " (FASHION_RELEVANT only)"}`);
  if (itemFilter) console.log(`Item filter: ${itemFilter}`);

  const stats = new Map<string, ItemStat>();
  const candidateTokens = new Map<string, { count: number; articles: Set<string>; items: Set<string>; examples: string[] }>();
  const overall = new Map<string, number>();

  for (const post of posts) {
    let contexts: ItemContext[] = describeItemContexts(post);
    if (itemFilter) contexts = contexts.filter((context) => context.specificItem === itemFilter);

    for (const context of contexts) {
      overall.set(context.outcome, (overall.get(context.outcome) ?? 0) + 1);

      const stat = stats.get(context.specificItem) ?? {
        specificItem: context.specificItem,
        total: 0,
        byOutcome: new Map<string, number>(),
        missedSamples: [],
        enumerationSamples: [],
        articles: new Set<string>()
      };
      stat.total += 1;
      stat.articles.add(post.id);
      stat.byOutcome.set(context.outcome, (stat.byOutcome.get(context.outcome) ?? 0) + 1);

      if (context.outcome === "NO_ATTRIBUTE_IN_WINDOW") {
        if (stat.missedSamples.length < 12) {
          stat.missedSamples.push({ source: post.source, title: post.title, window: context.window, wideContext: context.wideContext });
        }
        for (const token of tokenize(context.window)) {
          const entry = candidateTokens.get(token) ?? { count: 0, articles: new Set<string>(), items: new Set<string>(), examples: [] };
          entry.count += 1;
          entry.articles.add(post.id);
          entry.items.add(context.specificItem);
          if (entry.examples.length < 3) entry.examples.push(context.wideContext.trim());
          candidateTokens.set(token, entry);
        }
      }
      if (context.outcome === "ENUMERATION" && stat.enumerationSamples.length < 6) {
        stat.enumerationSamples.push({ source: post.source, title: post.title, window: context.window });
      }
      stats.set(context.specificItem, stat);
    }
  }

  console.log("\n=== OVERALL ITEM-CONTEXT OUTCOMES ===");
  const totalContexts = [...overall.values()].reduce((sum, value) => sum + value, 0);
  console.log(`Total specific-item occurrences examined: ${totalContexts}`);
  for (const [outcome, count] of [...overall.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${outcome.padEnd(24)} ${String(count).padStart(4)}  (${((count / Math.max(1, totalContexts)) * 100).toFixed(1)}%)`);
  }

  console.log("\n=== PER SPECIFIC ITEM ===");
  console.log("Item | occurrences | articles | RELATION | NO_ATTR | ENUMERATION | NO_WINDOW");
  for (const stat of [...stats.values()].sort((a, b) => b.total - a.total)) {
    console.log(
      `${stat.specificItem.padEnd(18)} | ${String(stat.total).padStart(4)} | ${String(stat.articles.size).padStart(4)} | ` +
        `${String(stat.byOutcome.get("RELATION") ?? 0).padStart(4)} | ${String(stat.byOutcome.get("NO_ATTRIBUTE_IN_WINDOW") ?? 0).padStart(4)} | ` +
        `${String(stat.byOutcome.get("ENUMERATION") ?? 0).padStart(4)} | ${String(stat.byOutcome.get("NO_WINDOW") ?? 0).padStart(4)}`
    );
  }

  console.log("\n=== CANDIDATE MISSED VOCABULARY (tokens inside a real modifier zone, unknown to taxonomy) ===");
  console.log("token | occurrences | distinct articles | items");
  const ranked = [...candidateTokens.entries()]
    .filter(([token]) => !STOPWORDS.has(token))
    .sort((a, b) => b[1].articles.size - a[1].articles.size || b[1].count - a[1].count);
  for (const [token, entry] of ranked.slice(0, 40)) {
    console.log(`${token.padEnd(16)} | ${String(entry.count).padStart(3)} | ${String(entry.articles.size).padStart(3)} | ${[...entry.items].join(", ")}`);
    for (const example of entry.examples.slice(0, 2)) console.log(`      "...${example}"`);
  }
  if (ranked.length === 0) console.log("(none)");

  console.log("\n=== MISSED MODIFIER ZONES BY ITEM (what the sentence actually says) ===");
  for (const stat of [...stats.values()].sort((a, b) => (b.byOutcome.get("NO_ATTRIBUTE_IN_WINDOW") ?? 0) - (a.byOutcome.get("NO_ATTRIBUTE_IN_WINDOW") ?? 0))) {
    if (stat.missedSamples.length === 0) continue;
    console.log(`\n--- ${stat.specificItem} (${stat.byOutcome.get("NO_ATTRIBUTE_IN_WINDOW") ?? 0} missed) ---`);
    for (const sample of stat.missedSamples) {
      console.log(`  [${sample.source}] window="${sample.window.trim()}"`);
      console.log(`      wide: "...${sample.wideContext.trim()}"`);
    }
  }

  console.log("\n=== ENUMERATION REJECTIONS (guard fired - modifier belongs to another item) ===");
  for (const stat of [...stats.values()]) {
    if (stat.enumerationSamples.length === 0) continue;
    console.log(`\n--- ${stat.specificItem} (${stat.byOutcome.get("ENUMERATION") ?? 0} rejected) ---`);
    for (const sample of stat.enumerationSamples) console.log(`  [${sample.source}] window="${sample.window.trim()}"`);
  }

  await prisma.$disconnect();
}

/** Splits a Korean/English modifier zone into reviewable tokens. Heuristic, audit-only. */
function tokenize(window: string): string[] {
  return window
    .split(/[\s,·.()[\]"'“”‘’/|]+/)
    .map((token) => token.replace(/[을를이가은는의에서와과로으로한된는]$/u, "").trim())
    .filter((token) => token.length >= 2 && token.length <= 12)
    .filter((token) => !/^\d+$/.test(token));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
