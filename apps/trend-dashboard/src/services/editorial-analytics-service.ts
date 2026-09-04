import { prisma } from "@/db/client";

export type EditorialTrendRow = {
  type: string;
  value: string;
  mentionCount: number;
  articlePresence: number;
  sourceSpread: number;
  sources: string[];
  sourceBreakdown: Record<string, number>;
  mentionRateBySource: Record<string, number>;
  sourceArticleBreakdown: Record<string, number>;
  sourceArticleRate: Record<string, number>;
  genderSplit: Record<string, number>;
  confidenceAverage: number;
  current7d: number | null;
  previous7d: number | null;
  change7d: number | null;
  current7dArticlePresence: number | null;
  previous7dArticlePresence: number | null;
  change7dArticlePresence: number | null;
  current14d: number | null;
  previous14d: number | null;
  change14d: number | null;
  current14dArticlePresence: number | null;
  previous14dArticlePresence: number | null;
  change14dArticlePresence: number | null;
  evidenceArticles: Array<{ source: string; title: string; url: string; publishedAt: Date | null }>;
  observation: "NEWLY_OBSERVED" | "OBSERVED";
  sourceContext: "SINGLE_SOURCE" | "MULTI_SOURCE";
  signal: "BASELINE" | "EARLY_DATA";
};

export type EditorialCoOccurrence = { value: string; articlePresence: number; sourceSpread: number };

export type SpecificItemEditorialDetail = {
  specificItem: string;
  trend: EditorialTrendRow | null;
  cooccurrence: {
    details: EditorialCoOccurrence[];
    materials: EditorialCoOccurrence[];
    colors: EditorialCoOccurrence[];
    styles: EditorialCoOccurrence[];
    brands: EditorialCoOccurrence[];
  };
};

export type UnmatchedFashionPhrase = {
  phrase: string;
  occurrences: number;
  articles: number;
  sources: string[];
  suggestedType: string;
  suggestedNormalizedValue: string;
};

export async function getEditorialTrendRows(dataMode = "real"): Promise<EditorialTrendRow[]> {
  const mentions = await prisma.editorialMention.findMany({
    where: { post: { dataMode, fashionRelevance: "FASHION_RELEVANT" } },
    include: { post: { select: { source: true, title: true, url: true, publishedAt: true } } }
  });
  const sourcePostCounts = await prisma.editorialPost.groupBy({
    by: ["source"],
    where: { dataMode, fashionRelevance: "FASHION_RELEVANT" },
    _count: { _all: true }
  });
  return aggregateEditorialMentions(mentions, Object.fromEntries(sourcePostCounts.map((row) => [row.source, row._count._all])));
}

/**
 * "Why this item was flagged" evidence: for a SUB_ITEM (specific item), what
 * DETAIL/MATERIAL/COLOR/STYLE/BRAND mentions co-occur in the SAME editorial
 * posts. Co-occurrence is counted by distinct article (postId), never by raw
 * mention count - the DB's (postId, type, value) unique constraint already
 * guarantees one mention per post per (type, value), so a plain group-by-count
 * over the joined posts is article-presence-safe without extra dedupe logic.
 * Reuses getEditorialTrendRows/aggregateEditorialMentions for the trend
 * summary instead of recomputing article presence / source spread in parallel.
 */
export async function getSpecificItemEditorialDetail(specificItem: string, dataMode = "real"): Promise<SpecificItemEditorialDetail> {
  const trendRows = await getEditorialTrendRows(dataMode);
  const trend = trendRows.find((row) => row.type === "SUB_ITEM" && row.value === specificItem) ?? null;

  const itemMentions = await prisma.editorialMention.findMany({
    where: { type: "SUB_ITEM", value: specificItem, post: { dataMode, fashionRelevance: "FASHION_RELEVANT" } },
    select: { postId: true }
  });
  const postIds = [...new Set(itemMentions.map((mention) => mention.postId))];
  const empty = { details: [], materials: [], colors: [], styles: [], brands: [] };
  if (postIds.length === 0) return { specificItem, trend, cooccurrence: empty };

  const coMentions = await prisma.editorialMention.findMany({
    where: { postId: { in: postIds }, type: { in: ["DETAIL", "MATERIAL", "COLOR", "STYLE", "BRAND"] } },
    select: { type: true, value: true, post: { select: { source: true } } }
  });

  const buckets: Record<string, Map<string, { articlePresence: number; sources: Set<string> }>> = {
    DETAIL: new Map(),
    MATERIAL: new Map(),
    COLOR: new Map(),
    STYLE: new Map(),
    BRAND: new Map()
  };
  for (const mention of coMentions) {
    const bucket = buckets[mention.type];
    if (!bucket) continue;
    const entry = bucket.get(mention.value) ?? { articlePresence: 0, sources: new Set<string>() };
    entry.articlePresence += 1;
    entry.sources.add(mention.post.source);
    bucket.set(mention.value, entry);
  }

  return {
    specificItem,
    trend,
    cooccurrence: {
      details: sortCoOccurrence(buckets.DETAIL!),
      materials: sortCoOccurrence(buckets.MATERIAL!),
      colors: sortCoOccurrence(buckets.COLOR!),
      styles: sortCoOccurrence(buckets.STYLE!),
      brands: sortCoOccurrence(buckets.BRAND!)
    }
  };
}

function sortCoOccurrence(counts: Map<string, { articlePresence: number; sources: Set<string> }>): EditorialCoOccurrence[] {
  return [...counts.entries()]
    .map(([value, entry]) => ({ value, articlePresence: entry.articlePresence, sourceSpread: entry.sources.size }))
    .sort((a, b) => b.articlePresence - a.articlePresence || a.value.localeCompare(b.value));
}

/**
 * Splits co-occurrence rows into "repeated" (>= threshold distinct articles -
 * a real recurring pattern) vs "one-off" (a single-article sighting). One-off
 * rows must never be presented with the same visual weight as repeated ones,
 * since a single co-mention does not establish that the attribute belongs to
 * the specific item itself - only that it appeared in the same article.
 */
export function partitionCoOccurrence(rows: EditorialCoOccurrence[], threshold = 2): { repeated: EditorialCoOccurrence[]; oneOff: EditorialCoOccurrence[] } {
  return {
    repeated: rows.filter((row) => row.articlePresence >= threshold),
    oneOff: rows.filter((row) => row.articlePresence < threshold)
  };
}

export function aggregateEditorialMentions(
  mentions: Array<{ type: string; value: string; audienceGender: string; confidence: number; post: { source: string; title?: string; url?: string; publishedAt?: Date | null } }>,
  sourcePostCounts: Record<string, number> = {}
): EditorialTrendRow[] {
  const anchorDate = maxDate(mentions.map((mention) => mention.post.publishedAt ?? null));
  const groups = new Map<string, {
    type: string;
    value: string;
    mentionCount: number;
    sources: Set<string>;
    sourceBreakdown: Map<string, number>;
    sourceArticleBreakdown: Map<string, Set<string>>;
    genderSplit: Map<string, number>;
    confidence: number[];
    mentions: typeof mentions;
  }>();
  for (const mention of mentions) {
    const key = `${mention.type}:${mention.value}`;
    const entry = groups.get(key) ?? {
      type: mention.type,
      value: mention.value,
      mentionCount: 0,
      sources: new Set<string>(),
      sourceBreakdown: new Map<string, number>(),
      sourceArticleBreakdown: new Map<string, Set<string>>(),
      genderSplit: new Map<string, number>(),
      confidence: [],
      mentions: []
    };
    entry.mentionCount += 1;
    entry.sources.add(mention.post.source);
    entry.sourceBreakdown.set(mention.post.source, (entry.sourceBreakdown.get(mention.post.source) ?? 0) + 1);
    const articleKeyValue = articleKey(mention);
    const sourceArticles = entry.sourceArticleBreakdown.get(mention.post.source) ?? new Set<string>();
    sourceArticles.add(articleKeyValue);
    entry.sourceArticleBreakdown.set(mention.post.source, sourceArticles);
    entry.genderSplit.set(mention.audienceGender, (entry.genderSplit.get(mention.audienceGender) ?? 0) + 1);
    entry.confidence.push(mention.confidence);
    entry.mentions.push(mention);
    groups.set(key, entry);
  }
  return [...groups.values()]
    .map((entry) => {
      const current7d = anchorDate ? countWindow(entry.mentions, anchorDate, 0, 7) : null;
      const previous7d = anchorDate ? countWindow(entry.mentions, anchorDate, 7, 14) : null;
      const current7dArticlePresence = anchorDate ? countArticleWindow(entry.mentions, anchorDate, 0, 7) : null;
      const previous7dArticlePresence = anchorDate ? countArticleWindow(entry.mentions, anchorDate, 7, 14) : null;
      const current14d = anchorDate ? countWindow(entry.mentions, anchorDate, 0, 14) : null;
      const previous14d = anchorDate ? countWindow(entry.mentions, anchorDate, 14, 28) : null;
      const current14dArticlePresence = anchorDate ? countArticleWindow(entry.mentions, anchorDate, 0, 14) : null;
      const previous14dArticlePresence = anchorDate ? countArticleWindow(entry.mentions, anchorDate, 14, 28) : null;
      const sourceArticleBreakdown = sourceArticleCounts(entry.sourceArticleBreakdown);
      const articlePresence = Object.values(sourceArticleBreakdown).reduce((sum, value) => sum + value, 0);
      return {
        type: entry.type,
        value: entry.value,
        mentionCount: entry.mentionCount,
        articlePresence,
        sourceSpread: entry.sources.size,
        sources: [...entry.sources].sort(),
        sourceBreakdown: Object.fromEntries([...entry.sourceBreakdown.entries()].sort()),
        mentionRateBySource: mentionRates(entry.sourceBreakdown, sourcePostCounts),
        sourceArticleBreakdown,
        sourceArticleRate: articleRates(entry.sourceArticleBreakdown, sourcePostCounts),
        genderSplit: Object.fromEntries([...entry.genderSplit.entries()].sort()),
        confidenceAverage: entry.confidence.length ? entry.confidence.reduce((sum, value) => sum + value, 0) / entry.confidence.length : 0,
        current7d,
        previous7d,
        change7d: current7d !== null && previous7d !== null ? current7d - previous7d : null,
        current7dArticlePresence,
        previous7dArticlePresence,
        change7dArticlePresence: current7dArticlePresence !== null && previous7dArticlePresence !== null ? current7dArticlePresence - previous7dArticlePresence : null,
        current14d,
        previous14d,
        change14d: current14d !== null && previous14d !== null ? current14d - previous14d : null,
        current14dArticlePresence,
        previous14dArticlePresence,
        change14dArticlePresence: current14dArticlePresence !== null && previous14dArticlePresence !== null ? current14dArticlePresence - previous14dArticlePresence : null,
        evidenceArticles: entry.mentions
          .slice()
          .sort((a, b) => (b.post.publishedAt?.getTime() ?? 0) - (a.post.publishedAt?.getTime() ?? 0))
          .slice(0, 5)
          .map((mention) => ({
            source: mention.post.source,
            title: mention.post.title ?? "",
            url: mention.post.url ?? "",
            publishedAt: mention.post.publishedAt ?? null
          })),
        observation: previous7dArticlePresence === 0 && (current7dArticlePresence ?? 0) > 0 ? "NEWLY_OBSERVED" as const : "OBSERVED" as const,
        sourceContext: entry.sources.size >= 2 ? "MULTI_SOURCE" as const : "SINGLE_SOURCE" as const,
        signal: "BASELINE" as const
      };
    })
    .sort((a, b) => b.articlePresence - a.articlePresence || b.sourceSpread - a.sourceSpread || b.mentionCount - a.mentionCount || a.value.localeCompare(b.value));
}

export function auditUnmatchedFashionPhrases(
  posts: Array<{ source: string; title: string; text: string | null; mentions?: Array<{ type: string; value: string }> }>
): UnmatchedFashionPhrase[] {
  const candidates = [
    { phrase: "football jersey", pattern: /\bfootball jersey\b|\uD478\uD2B8\uBCFC \uC800\uC9C0/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "FOOTBALL_JERSEY" },
    { phrase: "varsity jacket", pattern: /\bvarsity jacket\b|\uBC14\uC2DC\uD2F0 \uC7AC\uD0B7|\uBC14\uC2DC\uD2F0 \uC790\uCF13/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "VARSITY_JACKET" },
    { phrase: "windbreaker", pattern: /\bwindbreaker\b|\uC708\uB4DC\uBE0C\uB808\uC774\uCEE4/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "WINDBREAKER" },
    { phrase: "blouson", pattern: /\bblouson\b|\uBE14\uB8E8\uC885/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "BLOUSON" },
    { phrase: "cargo pants", pattern: /\bcargo pants\b|\uCE74\uACE0 \uD32C\uCE20/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "CARGO_PANTS" },
    { phrase: "ball cap", pattern: /\bball cap\b|\uBCFC\uCEA1/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "BALL_CAP" },
    { phrase: "messenger bag", pattern: /\bmessenger bag\b|\uBA54\uC2E0\uC800\uBC31|\uBA54\uC2E0\uC800 \uBC31/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "MESSENGER_BAG" },
    { phrase: "tote bag", pattern: /\btote bag\b|\uD1A0\uD2B8\uBC31|\uD1A0\uD2B8 \uBC31/gim, suggestedType: "SUB_ITEM", suggestedNormalizedValue: "TOTE_BAG" },
    { phrase: "layered", pattern: /\blayered\b|\uB808\uC774\uC5B4\uB4DC/gim, suggestedType: "STYLE", suggestedNormalizedValue: "LAYERED" },
    { phrase: "stripe", pattern: /\bstripe\b|\bstriped\b|\uC2A4\uD2B8\uB77C\uC774\uD504/gim, suggestedType: "DETAIL", suggestedNormalizedValue: "STRIPE" },
    { phrase: "check", pattern: /\bcheck\b|\bplaid\b|\uCCB4\uD06C/gim, suggestedType: "DETAIL", suggestedNormalizedValue: "CHECK" },
    { phrase: "lookbook", pattern: /\blookbook\b|\uB8E9\uBD81/gim, suggestedType: "STYLE", suggestedNormalizedValue: "LOOKBOOK_EVIDENCE" },
    { phrase: "collaboration", pattern: /\bcollaboration\b|\bcollab\b|\uD611\uC5C5/gim, suggestedType: "COLLAB", suggestedNormalizedValue: "COLLABORATION" }
  ];
  const rows: UnmatchedFashionPhrase[] = [];
  for (const candidate of candidates) {
    let occurrences = 0;
    const articleKeys = new Set<string>();
    const sources = new Set<string>();
    for (const post of posts) {
      if ((post.mentions ?? []).some((mention) => mention.value === candidate.suggestedNormalizedValue)) continue;
      const body = `${post.title} ${post.text ?? ""}`;
      const matches = body.match(candidate.pattern) ?? [];
      if (matches.length === 0) continue;
      occurrences += matches.length;
      articleKeys.add(`${post.source}:${post.title}`);
      sources.add(post.source);
    }
    if (occurrences > 0) {
      rows.push({
        phrase: candidate.phrase,
        occurrences,
        articles: articleKeys.size,
        sources: [...sources].sort(),
        suggestedType: candidate.suggestedType,
        suggestedNormalizedValue: candidate.suggestedNormalizedValue
      });
    }
  }
  return rows.sort((a, b) => b.articles - a.articles || b.sources.length - a.sources.length || b.occurrences - a.occurrences || a.phrase.localeCompare(b.phrase));
}

function maxDate(values: Array<Date | null>) {
  const times = values.map((value) => value?.getTime() ?? Number.NaN).filter((value) => !Number.isNaN(value));
  return times.length ? new Date(Math.max(...times)) : null;
}

function countWindow(
  mentions: Array<{ post: { publishedAt?: Date | null } }>,
  anchorDate: Date,
  startDaysAgo: number,
  endDaysAgo: number
) {
  const end = anchorDate.getTime() - startDaysAgo * 24 * 60 * 60 * 1000;
  const start = anchorDate.getTime() - endDaysAgo * 24 * 60 * 60 * 1000;
  return mentions.filter((mention) => {
    const time = mention.post.publishedAt?.getTime();
    return time !== undefined && time > start && time <= end;
  }).length;
}

function countArticleWindow(
  mentions: Array<{ post: { source: string; title?: string; url?: string; publishedAt?: Date | null } }>,
  anchorDate: Date,
  startDaysAgo: number,
  endDaysAgo: number
) {
  const end = anchorDate.getTime() - startDaysAgo * 24 * 60 * 60 * 1000;
  const start = anchorDate.getTime() - endDaysAgo * 24 * 60 * 60 * 1000;
  return new Set(mentions.filter((mention) => {
    const time = mention.post.publishedAt?.getTime();
    return time !== undefined && time > start && time <= end;
  }).map(articleKey)).size;
}

function articleKey(mention: { post: { source: string; title?: string; url?: string } }) {
  return `${mention.post.source}:${mention.post.url || mention.post.title || "unknown"}`;
}

function mentionRates(sourceBreakdown: Map<string, number>, sourcePostCounts: Record<string, number>) {
  return Object.fromEntries(
    [...sourceBreakdown.entries()].sort().map(([source, count]) => {
      const posts = sourcePostCounts[source] ?? 0;
      return [source, posts > 0 ? count / posts : 0];
    })
  );
}

function sourceArticleCounts(sourceBreakdown: Map<string, Set<string>>) {
  return Object.fromEntries([...sourceBreakdown.entries()].sort().map(([source, articles]) => [source, articles.size]));
}

function articleRates(sourceBreakdown: Map<string, Set<string>>, sourcePostCounts: Record<string, number>) {
  return Object.fromEntries(
    [...sourceBreakdown.entries()].sort().map(([source, articles]) => {
      const posts = sourcePostCounts[source] ?? 0;
      return [source, posts > 0 ? articles.size / posts : 0];
    })
  );
}
