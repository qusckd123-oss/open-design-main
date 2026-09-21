import { parseEyesmagOrderedContent } from "../src/collectors/editorial/ordered-content";
import { prisma } from "../src/db/client";

async function main() {
  const posts = await prisma.editorialPost.findMany({
    where: { source: "EYESMAG", dataMode: "real" },
    select: { id: true, title: true, url: true, canonicalUrl: true, contentBlocks: { orderBy: { blockIndex: "asc" } } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: 3
  });

  const output = [];
  for (const post of posts) {
    const url = post.canonicalUrl || post.url;
    const response = await fetch(url, { headers: { "User-Agent": "TrendSignalDashboard/0.1 (+ordered-content spot-check)" } });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const parsed = parseEyesmagOrderedContent(await response.text()) ?? [];
    const persisted = post.contentBlocks;
    output.push({
      title: post.title,
      url,
      sourceBlockCount: parsed.length,
      persistedBlockCount: persisted.length,
      orderAndTypeMatch: parsed.length === persisted.length && parsed.every((block, index) => block.blockIndex === persisted[index]?.blockIndex && block.blockType === persisted[index]?.blockType),
      firstBlocks: persisted.slice(0, 8).map((block) => ({
        blockIndex: block.blockIndex,
        blockType: block.blockType,
        text: block.text?.slice(0, 90) ?? null,
        imageUrlIdentity: block.imageUrl ? new URL(block.imageUrl).hostname + new URL(block.imageUrl).pathname : null,
        caption: block.caption
      }))
    });
  }
  console.log(JSON.stringify({ posts: output }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
