/**
 * Bar width as a percentage of the strongest attribute currently shown -
 * never an invented score. A 6% floor keeps a real but small count (e.g. 1
 * out of a much larger max) visible as a sliver rather than disappearing;
 * it never changes the relative ORDER of bars, only the legibility of the
 * smallest ones, and the exact count is always shown alongside it anyway.
 * Kept framework-free (no React/Next import) so it can be unit-tested from
 * a plain Node script without pulling in the component's import chain.
 */
export function attributeBarWidthPercent(articlePresence: number, maxArticlePresence: number): number {
  if (articlePresence <= 0 || maxArticlePresence <= 0) return 0;
  const ratio = Math.round((articlePresence / maxArticlePresence) * 100);
  return Math.max(6, Math.min(100, ratio));
}
