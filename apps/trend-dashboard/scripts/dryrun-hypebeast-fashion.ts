import { getHypebeastFashionEntries } from "../src/collectors/editorial/rss";
import { prisma } from "../src/db/client";

/**
 * DRY RUN for fashion-scoped HYPEBEAST_KR discovery.
 *
 * Reads only the public /fashion listing pages (never an article body, never
 * the DB in write mode) and reports exactly what a real collection would do.
 * Listing pages already carry the article URL, an explicit category class and
 * an ISO datetime, so the window and category filters are both applied before
 * a single article body would be requested.
 *
 * Usage: npx tsx scripts/dryrun-hypebeast-fashion.ts [--days=90]
 */
function argValue(name: string) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  return arg?.split("=").slice(1).join("=");
}

async function main() {
  const days = Number(argValue("days") ?? 90);
  console.log(`DRY RUN - fashion-scoped discovery, window = ${days} days\n`);

  const entries = await getHypebeastFashionEntries(days);
  const known = await prisma.editorialPost.findMany({
    where: { dataMode: "real", source: "HYPEBEAST_KR" },
    select: { canonicalUrl: true, url: true }
  });
  const knownUrls = new Set(known.flatMap((row) => [row.canonicalUrl, row.url].filter((value): value is string => Boolean(value))));

  const existing = entries.filter((entry) => knownUrls.has(entry.url));
  const fresh = entries.filter((entry) => !knownUrls.has(entry.url));
  const dates = entries.map((entry) => entry.publishedAt).sort();

  console.log(`Would discover (fashion-labelled, in window): ${entries.length}`);
  console.log(`Already existing in DB:                      ${existing.length}`);
  console.log(`New canonical URLs to fetch:                 ${fresh.length}`);
  console.log(`Oldest in discovery:                         ${dates[0] ?? "-"}`);
  console.log(`Newest in discovery:                         ${dates[dates.length - 1] ?? "-"}`);
  console.log(`Existing HYPEBEAST_KR rows:                  ${known.length}`);

  const categories = new Map<string, number>();
  for (const entry of entries) categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1);
  console.log(`Category labels seen:                        ${[...categories.entries()].map(([key, value]) => `${key}=${value}`).join(", ") || "-"}`);

  console.log("\nSample of new articles that would be fetched:");
  for (const entry of fresh.slice(0, 10)) console.log(`  ${entry.publishedAt.slice(0, 10)}  ${entry.url}`);
  if (fresh.length === 0) console.log("  (none - discovery found nothing new in the window)");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
