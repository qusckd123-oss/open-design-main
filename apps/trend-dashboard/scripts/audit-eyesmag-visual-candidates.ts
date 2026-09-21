import { resolveOrderedEvidenceImage, type OrderedEvidenceBlock } from "../src/collectors/editorial/image-relation";
import { extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { getAttributeBundles } from "../src/services/attribute-bundle-service";
import { prisma } from "../src/db/client";

function imageIdentity(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname}`;
  } catch {
    return url.split(/[?#]/, 1)[0] ?? url;
  }
}

async function main() {
  const bundles = (await getAttributeBundles("real", "all")).slice(0, 5);
  const posts = await prisma.editorialPost.findMany({
    where: { source: "EYESMAG", dataMode: "real" },
    select: {
      id: true,
      title: true,
      url: true,
      publishedAt: true,
      text: true,
      contentBlocks: { orderBy: { blockIndex: "asc" } }
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: 25
  });

  const signals = bundles.map((bundle, rank) => {
    const bundleAttributes = new Set(bundle.directAttributes.map((attribute) => `${attribute.type}|${attribute.value}`));
    const candidates: Array<Record<string, unknown>> = [];

    for (const post of posts) {
      const blocks: OrderedEvidenceBlock[] = post.contentBlocks.map((block) => ({
        blockIndex: block.blockIndex,
        blockType: block.blockType as "TEXT" | "IMAGE",
        text: block.text,
        imageUrl: block.imageUrl,
        caption: block.caption
      }));
      if (blocks.length === 0) continue;
      for (const relation of extractDirectAttributeRelations({ title: post.title, text: post.text ?? "" })) {
        if (relation.specificItem !== bundle.specificItem || !bundleAttributes.has(`${relation.attributeType}|${relation.attributeValue}`)) continue;
        const resolved = resolveOrderedEvidenceImage(blocks, relation.evidenceText);
        if (resolved.kind === "NONE" || !resolved.imageUrl) continue;
        const textBlock = blocks.find((block) => block.blockType === "TEXT" && Boolean(block.text?.includes(relation.evidenceText)));
        const imageBlock = blocks.find((block) => block.imageUrl === resolved.imageUrl && (block.blockType === "IMAGE"));
        candidates.push({
          tier: resolved.kind,
          source: "EYESMAG",
          article: post.title,
          articleUrl: post.url,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          relationText: relation.evidenceText,
          relation: `${relation.specificItem} + ${relation.attributeType}:${relation.attributeValue}`,
          textBlockIndex: textBlock?.blockIndex ?? null,
          imageBlockIndex: imageBlock?.blockIndex ?? null,
          imageUrlIdentity: imageIdentity(resolved.imageUrl)
        });
      }
    }

    const uniqueCandidates = [...new Map(candidates.map((candidate) => [
      `${candidate.articleUrl}|${candidate.relationText}|${candidate.imageUrlIdentity}`,
      candidate
    ])).values()];
    return {
      rank: rank + 1,
      signal: bundle.displayName,
      specificItem: bundle.specificItem,
      directCandidates: uniqueCandidates.filter((candidate) => candidate.tier === "DIRECT_BLOCK").length,
      adjacentCandidates: uniqueCandidates.filter((candidate) => candidate.tier === "ADJACENT_BLOCK").length,
      samples: uniqueCandidates.slice(0, 5)
    };
  });

  console.log(JSON.stringify({
    source: "EYESMAG",
    auditedPosts: posts.length,
    auditedSignals: signals.length,
    directCandidates: signals.reduce((sum, signal) => sum + signal.directCandidates, 0),
    adjacentCandidates: signals.reduce((sum, signal) => sum + signal.adjacentCandidates, 0),
    signalsWithCandidates: signals.filter((signal) => signal.directCandidates + signal.adjacentCandidates > 0).length,
    signals
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
