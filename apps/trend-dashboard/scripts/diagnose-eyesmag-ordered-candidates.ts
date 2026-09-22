import { extractDirectAttributeRelations } from "../src/collectors/editorial/attribute-relations";
import { editorialRules } from "../src/collectors/editorial/mentions";
import { getAttributeBundles } from "../src/services/attribute-bundle-service";
import { prisma } from "../src/db/client";

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

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
  const posts = await prisma.editorialPost.findMany({
    where: { source: "EYESMAG", dataMode: "real" },
    select: {
      id: true,
      url: true,
      title: true,
      publishedAt: true,
      excerpt: true,
      text: true,
      mentions: { select: { type: true, value: true, evidence: true } },
      contentBlocks: { orderBy: { blockIndex: "asc" } }
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: 25
  });
  const topBundles = (await getAttributeBundles("real", "all")).slice(0, 5);
  const topKeys = new Set(topBundles.map((bundle) => bundle.key));
  const rows = [];
  const allRelations: Array<Record<string, unknown>> = [];
  const postsWithTopRelation = new Set<string>();
  const reasonCounts: Record<string, number> = {
    NO_RELEVANT_MENTION: 0,
    MENTION_NOT_MAPPABLE_TO_BLOCK: 0,
    TEXT_MATCH_NO_NEAR_IMAGE: 0,
    IMAGE_NEAR_TEXT_BUT_RULE_TOO_STRICT: 0,
    VALID_CANDIDATE: 0
  };
  let totalRelations = 0;
  let exactMapped = 0;
  let normalizedMapped = 0;
  let mentionEvidenceExactMapped = 0;
  let mentionEvidenceNormalizedMapped = 0;
  let mentionEvidenceTotal = 0;
  let mappedWithImageDistance1 = 0;
  let mappedWithImageDistance2 = 0;
  let mappedWithImageDistance3 = 0;
  let strictCandidates = 0;
  const distanceCandidates = { distance1: 0, distance2: 0, distance3: 0 };

  for (const post of posts) {
    const blocks = post.contentBlocks;
    const textBlocks = blocks.filter((block) => block.blockType === "TEXT");
    const imageBlocks = blocks.filter((block) => block.blockType === "IMAGE");
    const relations = extractDirectAttributeRelations({ title: post.title, excerpt: post.excerpt, text: post.text ?? "" });
    for (const mention of post.mentions) {
      mentionEvidenceTotal++;
      const raw = mention.evidence ?? "";
      if (raw && textBlocks.some((block) => (block.text ?? "").includes(raw))) {
        mentionEvidenceExactMapped++;
      } else if (normalize(raw).length >= 3 && textBlocks.some((block) => normalize(block.text ?? "").includes(normalize(raw)))) {
        mentionEvidenceNormalizedMapped++;
      }
    }
    const rowRelations = [];

    for (const relation of relations) {
      totalRelations++;
      const evidenceNormalized = normalize(relation.evidenceText);
      const exactBlock = textBlocks.find((block) => (block.text ?? "").includes(relation.evidenceText));
      const normalizedBlock = exactBlock ?? textBlocks.find((block) => {
        const normalizedText = normalize(block.text ?? "");
        return evidenceNormalized.length >= 4 && normalizedText.includes(evidenceNormalized);
      });
      const itemRule = editorialRules.find((rule) => rule.type === "SUB_ITEM" && rule.value === relation.specificItem);
      const attributeRule = editorialRules.find((rule) => rule.type === relation.attributeType && rule.value === relation.attributeValue);
      const itemSurface = itemRule?.patterns.map((pattern) => (post.text ?? "").match(pattern)?.[0]).find(Boolean) ?? "";
      const attributeSurface = attributeRule?.patterns.map((pattern) => (post.text ?? "").match(pattern)?.[0]).find(Boolean) ?? "";
      const termBlock = normalizedBlock ?? textBlocks.find((block) => {
        const text = normalize(block.text ?? "");
        return Boolean(itemSurface && attributeSurface && text.includes(normalize(itemSurface)) && text.includes(normalize(attributeSurface)));
      });
      const mappedBlock = normalizedBlock ?? termBlock;
      const mappingMode = exactBlock ? "RAW_EXACT" : normalizedBlock ? "NORMALIZED_EXACT" : termBlock ? "COLOCATED_SURFACE_TERMS" : "UNMAPPED";
      const isExactMapped = Boolean(exactBlock);
      const isNormalizedMapped = Boolean(mappedBlock);
      if (isExactMapped) exactMapped++;
      if (isNormalizedMapped) normalizedMapped++;

      const nearestImage = mappedBlock
        ? imageBlocks
            .map((image) => ({ block: image, distance: Math.abs(image.blockIndex - mappedBlock.blockIndex) }))
            .sort((a, b) => a.distance - b.distance || a.block.blockIndex - b.block.blockIndex)[0]
        : undefined;
      if (nearestImage?.distance === 1) mappedWithImageDistance1++;
      if (nearestImage && nearestImage.distance <= 2) mappedWithImageDistance2++;
      if (nearestImage && nearestImage.distance <= 3) mappedWithImageDistance3++;

      const topSignal = topBundles.find((bundle) =>
        bundle.specificItem === relation.specificItem &&
        bundle.directAttributes.some((attribute) => attribute.type === relation.attributeType && attribute.value === relation.attributeValue)
      );
      const relevantTopFive = Boolean(topSignal);
      if (relevantTopFive) postsWithTopRelation.add(post.id);
      let failureReason = "TEXT_MATCH_NO_NEAR_IMAGE";
      if (relevantTopFive) {
        if (!isNormalizedMapped) failureReason = "MENTION_NOT_MAPPABLE_TO_BLOCK";
        else if (nearestImage && nearestImage.distance === 1) failureReason = "VALID_CANDIDATE";
        else if (nearestImage && nearestImage.distance <= 3) failureReason = "IMAGE_NEAR_TEXT_BUT_RULE_TOO_STRICT";
        reasonCounts[failureReason] = (reasonCounts[failureReason] ?? 0) + 1;
        if (failureReason === "VALID_CANDIDATE") strictCandidates++;
        if (isNormalizedMapped && nearestImage && nearestImage.distance <= 1) distanceCandidates.distance1++;
        if (isNormalizedMapped && nearestImage && nearestImage.distance <= 2) distanceCandidates.distance2++;
        if (isNormalizedMapped && nearestImage && nearestImage.distance <= 3) distanceCandidates.distance3++;
      }

      const entry = {
        relation: `${relation.specificItem}+${relation.attributeType}:${relation.attributeValue}`,
        evidenceText: relation.evidenceText,
        sourceField: relation.sourceField,
        mappedTextBlockIndex: mappedBlock?.blockIndex ?? null,
        mappingMode,
        exactRawMatch: isExactMapped,
        normalizedMatch: isNormalizedMapped,
        itemSurface,
        attributeSurface,
        nearestImageBlockIndex: nearestImage?.block.blockIndex ?? null,
        nearestImageDistance: nearestImage?.distance ?? null,
        nearestImageIdentity: imageIdentity(nearestImage?.block.imageUrl ?? null),
        nearImageAtDistance1: Boolean(nearestImage && nearestImage.distance <= 1),
        nearImageAtDistance2: Boolean(nearestImage && nearestImage.distance <= 2),
        nearImageAtDistance3: Boolean(nearestImage && nearestImage.distance <= 3),
        topFiveSignal: topSignal?.displayName ?? null,
        failureReason: relevantTopFive ? failureReason : null
      };
      rowRelations.push(entry);
      allRelations.push({ postId: post.id, title: post.title, url: post.url, ...entry });
    }

    rows.push({
      postId: post.id,
      publishedAt: post.publishedAt?.toISOString().slice(0, 10) ?? null,
      orderedBlockCount: blocks.length,
      textBlockCount: textBlocks.length,
      imageBlockCount: imageBlocks.length,
      editorialMentionCount: post.mentions.length,
      storedMentions: post.mentions.map((mention) => `${mention.type}:${mention.value}`),
      relationCount: relations.length,
      relations: rowRelations
    });
  }

  const topRelations = allRelations.filter((relation) => relation.topFiveSignal);
  reasonCounts.NO_RELEVANT_MENTION = posts.length * topBundles.length - new Set(topRelations.map((relation) => `${relation.postId}|${relation.topFiveSignal}`)).size;
  const nonTopCandidates = allRelations.filter((relation) => !relation.topFiveSignal && relation.nearImageAtDistance1);
  const groups = [1, 2, 3].map((distance) => ({
    distance,
    count: allRelations.filter((relation) => relation.normalizedMatch && typeof relation.nearestImageDistance === "number" && relation.nearestImageDistance <= distance).length
  }));
  const examples = allRelations
    .filter((relation) => relation.normalizedMatch && typeof relation.nearestImageDistance === "number" && relation.nearestImageDistance <= 3)
    .slice(0, 10);
  const contextualSequences = examples.map((relation) => {
    const post = posts.find((item) => item.id === relation.postId)!;
    const target = typeof relation.mappedTextBlockIndex === "number" ? relation.mappedTextBlockIndex : -1;
    return {
      relation: relation.relation,
      article: relation.title,
      url: relation.url,
      relationText: relation.evidenceText,
      imageUrlIdentity: relation.nearestImageIdentity,
      derivedTier: relation.nearestImageDistance === 1 ? "ADJACENT_DISTANCE_1_CANDIDATE" : "CONTEXT_OR_UNRESOLVED",
      blocks: post.contentBlocks.filter((block) => Math.abs(block.blockIndex - target) <= 4).map((block) => ({
        index: block.blockIndex,
        type: block.blockType,
        text: block.text?.slice(0, 160) ?? null,
        image: imageIdentity(block.imageUrl),
        caption: block.caption
      }))
    };
  });

  const storedMentionEvidenceMapping = {
    exactTextBlockMatches: mentionEvidenceExactMapped,
    normalizedTextBlockMatches: mentionEvidenceNormalizedMapped,
    unmapped: mentionEvidenceTotal - mentionEvidenceExactMapped - mentionEvidenceNormalizedMapped,
    total: mentionEvidenceTotal
  };

  console.log(JSON.stringify({
    posts: rows,
    summary: {
      backfilledPosts: rows.length,
      totalEditorialMentions: rows.reduce((sum, row) => sum + row.editorialMentionCount, 0),
      allItemAttributeRelations: totalRelations,
      topFiveRelevantRelations: topRelations.length,
      postsContainingTopFiveRelations: postsWithTopRelation.size,
      topFiveFailureReasonCounts: reasonCounts,
      relationTextMapping: { exact: exactMapped, normalized: normalizedMapped, total: totalRelations },
      storedMentionEvidenceMapping,
      mappedRelationsWithNearestImages: { distance1: mappedWithImageDistance1, distance2: mappedWithImageDistance2, distance3: mappedWithImageDistance3 },
      allRelationsCandidateCounts: groups,
      topFiveCandidateCounts: distanceCandidates,
      nonTopFiveRelationsWithAdjacentImage: nonTopCandidates.length,
      nonTopFiveExamples: nonTopCandidates.slice(0, 10),
      representativeNearImageExamples: examples,
      contextualSequences,
      topFiveBundleKeysExist: [...topKeys]
    }
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
