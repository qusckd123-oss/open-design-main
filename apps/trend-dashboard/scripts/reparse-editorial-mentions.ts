// Safely re-derives EditorialMention rows from already-stored REAL
// EditorialPost title/text using the current extraction rules. Does NOT
// fetch anything from the network and does NOT touch EditorialPost rows
// (source/externalPostId identity, publishedAt, text, dataMode, etc. are
// all preserved) - only EditorialMention rows are deleted and re-created,
// per post, exactly like the daily collector does after a fresh fetch.
import { prisma } from "../src/db/client";
import { extractEditorialMentions } from "../src/collectors/editorial/mentions";

async function main() {
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real" },
    select: { id: true, source: true, title: true, text: true, audienceGender: true }
  });

  const beforePostCount = posts.length;
  const beforeMentionCount = await prisma.editorialMention.count({ where: { post: { dataMode: "real" } } });

  let totalMentions = 0;
  for (const post of posts) {
    const mentions = extractEditorialMentions({ title: post.title, text: post.text ?? "", postGender: post.audienceGender });
    await prisma.editorialMention.deleteMany({ where: { postId: post.id } });
    if (mentions.length > 0) {
      await prisma.editorialMention.createMany({
        data: mentions.map((mention) => ({
          postId: post.id,
          type: mention.type,
          value: mention.value,
          audienceGender: mention.audienceGender,
          confidence: mention.confidence,
          evidence: mention.evidence
        }))
      });
      totalMentions += mentions.length;
    }
  }

  const afterPostCount = await prisma.editorialPost.count({ where: { dataMode: "real" } });
  const afterMentionCount = await prisma.editorialMention.count({ where: { post: { dataMode: "real" } } });

  console.log("EDITORIAL MENTION REPARSE (local, no network fetch)");
  console.log(`EditorialPost count (real): before=${beforePostCount} after=${afterPostCount}`);
  console.log(`EditorialMention count (real): before=${beforeMentionCount} after=${afterMentionCount}`);
  console.log(`Mentions written this run: ${totalMentions}`);

  if (beforePostCount !== afterPostCount) {
    console.error("EditorialPost count changed - this must never happen during a mention-only reparse.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Reparse failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
