export type EditorialVisualContextCandidate = {
  imageUrl: string | null;
  url: string;
};

const DEFAULT_VISUAL_LIMIT = 6;

/**
 * UI-only selection for an editorial context strip.
 *
 * Input order is preserved (bundle evidence is already newest-first), and
 * image identity deliberately ignores query/hash transformations so the same
 * publisher asset cannot occupy multiple visual slots. This helper never
 * scores an image or changes bundle/evidence ranking.
 */
export function selectEditorialVisualContext<T extends EditorialVisualContextCandidate>(
  articles: readonly T[],
  limit = DEFAULT_VISUAL_LIMIT
): T[] {
  const safeLimit = Math.max(0, Math.min(DEFAULT_VISUAL_LIMIT, Math.trunc(limit)));
  if (safeLimit === 0) return [];
  const seen = new Set<string>();
  const selected: T[] = [];

  for (const article of articles) {
    if (!article.imageUrl || !article.url) continue;
    const identity = imageIdentity(article.imageUrl);
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    selected.push(article);
    if (selected.length >= safeLimit) break;
  }

  return selected;
}

function imageIdentity(imageUrl: string): string {
  const trimmed = imageUrl.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname}`;
  } catch {
    return trimmed.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";
  }
}
