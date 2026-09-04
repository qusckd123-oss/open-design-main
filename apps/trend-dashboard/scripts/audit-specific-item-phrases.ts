// Read-only audit: scans REAL EditorialPost title/text already stored in the
// DB for specific-item phrases that current EditorialMention extraction does
// NOT capture. Does not fetch anything from the network and does not write
// to the database.
import { prisma } from "../src/db/client";
import { extractEditorialMentions } from "../src/collectors/editorial/mentions";

type Candidate = {
  phrase: string;
  pattern: RegExp;
  suggestedType: "SUB_ITEM" | "DETAIL" | "MATERIAL" | "COLOR" | "STYLE";
  suggestedNormalizedValue: string;
};

function rx(...parts: string[]) {
  return new RegExp(parts.join("|"), "gim");
}

// Broad candidate list drawn from the request's own examples plus common
// English/Korean synonyms. This script is exploratory: it only reports what
// is ACTUALLY found in stored article text - nothing here is auto-applied.
const candidates: Candidate[] = [
  { phrase: "knit beanie / beanie", pattern: rx("knit beanie", "\\bbeanie\\b", "니트 비니", "비니"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "KNIT_BEANIE" },
  { phrase: "ball cap / baseball cap / baseball hat", pattern: rx("\\bball cap\\b", "baseball cap", "baseball hat", "볼캡"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "BALL_CAP" },
  { phrase: "camp cap", pattern: rx("camp cap", "캄프캐프", "캐프 캡"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "CAMP_CAP" },
  { phrase: "bucket hat", pattern: rx("bucket hat", "버킷해트", "버킷통"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "BUCKET_HAT" },
  { phrase: "graphic tee/t-shirt", pattern: rx("graphic tee", "graphic t-shirt", "그래픽 티"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "GRAPHIC_TEE" },
  { phrase: "striped tee/t-shirt", pattern: rx("striped tee", "stripe tee", "스트라이프 티"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "STRIPED_TEE" },
  { phrase: "ringer tee/t-shirt", pattern: rx("ringer tee", "ringer t-shirt", "링거 티"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "RINGER_TEE" },
  { phrase: "long sleeve / long-sleeve", pattern: rx("롱슬리브", "로옷슬리브"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "LONG_SLEEVE_TEE" },
  { phrase: "football jersey", pattern: rx("football jersey", "푸트볼 저지"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "FOOTBALL_JERSEY" },
  { phrase: "rugby shirt", pattern: rx("rugby shirt", "럭비 셔츠"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "RUGBY_SHIRT" },
  { phrase: "track jacket", pattern: rx("track jacket", "트랙 재킷", "트랙 자켓"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "TRACK_JACKET" },
  { phrase: "varsity jacket", pattern: rx("varsity jacket", "바시티 재킷", "바시티 자켓"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "VARSITY_JACKET" },
  { phrase: "blouson", pattern: rx("\\bblouson\\b", "블루종"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "BLOUSON" },
  { phrase: "windbreaker", pattern: rx("windbreaker", "윈드브레이커"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "WINDBREAKER" },
  { phrase: "work jacket", pattern: rx("work jacket", "워크 재킷", "워크 자켓"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "WORK_JACKET" },
  { phrase: "hunting jacket", pattern: rx("hunting jacket", "헌팅 재킷", "헌팅 자켓"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "HUNTING_JACKET" },
  { phrase: "coach jacket", pattern: rx("coach jacket", "코치 재킷", "코치 자켓"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "COACH_JACKET" },
  { phrase: "wide pants", pattern: rx("wide pants", "와이드 팬츠"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "WIDE_PANTS" },
  { phrase: "wide denim", pattern: rx("wide denim", "와이드 데님"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "WIDE_DENIM" },
  { phrase: "cargo pants", pattern: rx("cargo pants", "카고 팬츠"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "CARGO_PANTS" },
  { phrase: "curved pants", pattern: rx("curved pants", "커브 팬츠", "커브드 팬츠"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "CURVED_PANTS" },
  { phrase: "double knee pants", pattern: rx("double knee", "더블니 팬츠"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "DOUBLE_KNEE_PANTS" },
  { phrase: "body bag", pattern: rx("body bag", "보디백"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "BODY_BAG" },
  { phrase: "waist bag", pattern: rx("waist bag", "웨이스트백", "허리백"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "WAIST_BAG" },
  { phrase: "messenger bag", pattern: rx("messenger bag", "메신저백", "메신저 백"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "MESSENGER_BAG" },
  { phrase: "tote bag", pattern: rx("tote bag", "토트백", "토트 백"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "TOTE_BAG" },
  { phrase: "shoulder bag", pattern: rx("shoulder bag", "숄더백"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "SHOULDER_BAG" },
  { phrase: "backpack", pattern: rx("backpack", "백팩"), suggestedType: "SUB_ITEM", suggestedNormalizedValue: "BACKPACK" },
  { phrase: "layered", pattern: rx("\\blayered\\b", "레이어드"), suggestedType: "STYLE", suggestedNormalizedValue: "LAYERED" },
  { phrase: "stripe/striped", pattern: rx("\\bstripe\\b", "\\bstriped\\b", "스트라이프"), suggestedType: "DETAIL", suggestedNormalizedValue: "STRIPE" },
  { phrase: "check/plaid", pattern: rx("\\bcheck\\b", "\\bplaid\\b", "체크"), suggestedType: "DETAIL", suggestedNormalizedValue: "CHECK" }
];

async function main() {
  const posts = await prisma.editorialPost.findMany({
    where: { dataMode: "real", fashionRelevance: "FASHION_RELEVANT" },
    select: { id: true, source: true, title: true, text: true, url: true, publishedAt: true }
  });
  console.log(`FASHION_RELEVANT real posts scanned: ${posts.length}`);

  const alreadyExtracted = posts.map((post) => ({
    post,
    mentions: extractEditorialMentions({ title: post.title, text: post.text ?? "" })
  }));

  const rows: Array<{
    phrase: string;
    suggestedType: string;
    suggestedNormalizedValue: string;
    articleCount: number;
    sourceCount: number;
    examples: string[];
  }> = [];

  for (const candidate of candidates) {
    const already = new Set(alreadyExtracted.flatMap(({ mentions }) => mentions.filter((mention) => mention.value === candidate.suggestedNormalizedValue).map(() => candidate.suggestedNormalizedValue)));
    if (already.size > 0) continue; // already captured by current extraction rules - not "unmatched"

    const articleKeys = new Set<string>();
    const sources = new Set<string>();
    const examples: string[] = [];
    for (const { post } of alreadyExtracted) {
      const body = `${post.title} ${post.text ?? ""}`;
      candidate.pattern.lastIndex = 0;
      const matches = body.match(candidate.pattern);
      if (!matches || matches.length === 0) continue;
      articleKeys.add(post.id);
      sources.add(post.source);
      if (examples.length < 3) examples.push(`${post.source}: ${post.title}`);
    }
    if (articleKeys.size === 0) continue;
    rows.push({
      phrase: candidate.phrase,
      suggestedType: candidate.suggestedType,
      suggestedNormalizedValue: candidate.suggestedNormalizedValue,
      articleCount: articleKeys.size,
      sourceCount: sources.size,
      examples
    });
  }

  rows.sort((a, b) => b.sourceCount - a.sourceCount || b.articleCount - a.articleCount || a.phrase.localeCompare(b.phrase));

  console.log("\n=== UNMATCHED PHRASE REPORT (currently NOT captured by extraction rules) ===");
  for (const row of rows) {
    console.log(`- ${row.phrase} -> ${row.suggestedType}:${row.suggestedNormalizedValue} | articles=${row.articleCount} sources=${row.sourceCount}`);
    for (const example of row.examples) console.log(`    e.g. ${example}`);
  }
  console.log(`\nCandidates with >=2 articles OR >=2 sources: ${rows.filter((row) => row.articleCount >= 2 || row.sourceCount >= 2).length}`);
  console.log(`Candidates with only 1 article/1 source: ${rows.filter((row) => row.articleCount < 2 && row.sourceCount < 2).length}`);

  const currentSubItemMentions = alreadyExtracted.flatMap(({ mentions }) => mentions.filter((mention) => mention.type === "SUB_ITEM"));
  const bySpecificItem = new Map<string, Set<string>>();
  for (const mention of currentSubItemMentions) {
    const key = mention.value;
    const set = bySpecificItem.get(key) ?? new Set<string>();
    bySpecificItem.set(key, set);
  }
  console.log(`\n=== CURRENT SPECIFIC ITEM (SUB_ITEM) COVERAGE ===`);
  console.log(`Distinct specific items currently extracted: ${bySpecificItem.size}`);
  console.log(`Total SUB_ITEM mentions currently extracted: ${currentSubItemMentions.length}`);
}

main()
  .catch((error) => {
    console.error("Audit failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
