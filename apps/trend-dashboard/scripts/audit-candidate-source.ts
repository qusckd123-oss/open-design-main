import { extractDirectAttributeRelations, describeItemContexts } from "../src/collectors/editorial/attribute-relations";
import { extractEditorialMentions } from "../src/collectors/editorial/mentions";
import { classifyFashionRelevance } from "../src/collectors/editorial/rss";

/**
 * CANDIDATE EDITORIAL SOURCE AUDIT (network read-only, NEVER writes to the DB)
 *
 * Samples recent articles from a candidate source and scores it on the only
 * metric that matters for this project: would adding it actually produce more
 * ITEM + DIRECT ATTRIBUTE bundles? Raw article volume is explicitly not the
 * criterion.
 *
 * It runs the production extractors (extractEditorialMentions /
 * extractDirectAttributeRelations) over the sampled bodies, so the numbers are
 * directly comparable to the per-source density table in
 * audit-editorial-quality.ts.
 *
 * Body extraction here is deliberately generic (JSON-LD articleBody -> a
 * configurable content container -> meta description). It measures a source's
 * POTENTIAL; a source that scores well still needs its own tested parser
 * before any real collection.
 *
 * Usage:
 *   npx tsx scripts/audit-candidate-source.ts --name THE_EDIT \
 *     --sitemap https://the-edit.co.kr/post-sitemap1.xml --limit 12 \
 *     --container "entry-content"
 */
function argValue(name: string, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

const UA = "TrendSignalDashboard/0.1 (+editorial source audit)";

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xml,*/*" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractBody(html: string, container: string): string {
  const ld = html.match(/"articleBody"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (ld?.[1]) return stripHtml(ld[1].replace(/\\n/g, " ").replace(/\\"/g, '"'));
  if (container) {
    const opener = new RegExp(`<div[^>]+class="[^"]*\\b${container}\\b[^"]*"[^>]*>`);
    const match = html.match(opener);
    if (match?.index !== undefined) {
      const start = match.index + match[0].length;
      return stripHtml(html.slice(start, Math.min(html.length, start + 60000)));
    }
  }
  const description = html.match(/<meta[^>]+(?:name="description"|property="og:description")[^>]+content="([^"]*)"/i);
  return stripHtml(description?.[1] ?? "");
}

function metaValue(html: string, key: string) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]+content="([^"]*)"`, "i"));
  return stripHtml(match?.[1] ?? "");
}

async function main() {
  const name = argValue("name", "CANDIDATE");
  const sitemap = argValue("sitemap");
  const limit = Number(argValue("limit", "12"));
  const container = argValue("container", "entry-content");
  if (!sitemap) throw new Error("--sitemap is required");

  const xml = await fetchText(sitemap);
  const entries = [...xml.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?(?:<lastmod>(.*?)<\/lastmod>)?[\s\S]*?<\/url>/g)]
    .map((match) => ({ url: match[1] ?? "", lastmod: match[2] ?? "" }))
    .filter((entry) => entry.url)
    .sort((a, b) => (b.lastmod || "").localeCompare(a.lastmod || ""))
    .slice(0, limit);

  console.log(`=== CANDIDATE: ${name} ===`);
  console.log(`sitemap: ${sitemap}`);
  console.log(`sampling ${entries.length} most recent articles (no DB writes)\n`);

  let ok = 0;
  let fashionRelevant = 0;
  let itemBearing = 0;
  let attributeBearing = 0;
  let relations = 0;
  const lengths: number[] = [];
  const foundItems = new Set<string>();
  const foundAttributes = new Set<string>();
  const evidence: string[] = [];

  for (const entry of entries) {
    try {
      const html = await fetchText(entry.url);
      const title = metaValue(html, "og:title") || stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      const text = extractBody(html, container);
      lengths.push(text.length);
      ok += 1;

      const mentions = extractEditorialMentions({ title, text });
      const relevance = classifyFashionRelevance({ title, text, mentionCount: mentions.length });
      if (relevance === "FASHION_RELEVANT") fashionRelevant += 1;

      const contexts = describeItemContexts({ title, excerpt: null, text });
      if (contexts.length > 0) itemBearing += 1;

      const postRelations = extractDirectAttributeRelations({ title, excerpt: null, text });
      if (postRelations.length > 0) attributeBearing += 1;
      relations += postRelations.length;
      for (const relation of postRelations) {
        foundItems.add(relation.specificItem);
        foundAttributes.add(`${relation.attributeType}:${relation.attributeValue}`);
        if (evidence.length < 8) evidence.push(`${relation.specificItem} + ${relation.attributeType}:${relation.attributeValue}  "...${relation.evidenceText}"`);
      }

      console.log(
        `  [${relevance === "FASHION_RELEVANT" ? "F" : relevance === "UNKNOWN" ? "?" : "-"}] body=${String(text.length).padStart(5)} items=${contexts.length} rel=${postRelations.length}  ${title.slice(0, 58)}`
      );
    } catch (error) {
      console.log(`  [X] FAILED ${entry.url} - ${error instanceof Error ? error.message : error}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  const sorted = [...lengths].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] ?? 0 : 0;
  console.log(`\n--- ${name} SUMMARY ---`);
  console.log(`ACCESS:                    ${ok}/${entries.length} fetched`);
  console.log(`BODY MEDIAN:               ${median} chars`);
  console.log(`FASHION RELEVANT:          ${fashionRelevant}/${ok}`);
  console.log(`ITEM-BEARING ARTICLES:     ${itemBearing}/${ok}`);
  console.log(`DIRECT-ATTRIBUTE ARTICLES: ${attributeBearing}/${ok}`);
  console.log(`DIRECT RELATIONS:          ${relations} (${(relations / Math.max(1, ok)).toFixed(2)}/article)`);
  console.log(`UNIQUE ITEMS:              ${[...foundItems].join(", ") || "-"}`);
  console.log(`UNIQUE ATTRIBUTES:         ${[...foundAttributes].join(", ") || "-"}`);
  if (evidence.length) {
    console.log("EVIDENCE:");
    for (const line of evidence) console.log(`  ${line}`);
  }
  console.log(
    `\nCompare to current corpus: HYPEBEAST_KR 0.20 rel/article, EYESMAG 0.05, VISLA 0.00, NONLABEL 0.00`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
