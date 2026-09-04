# Editorial Planning Audit

Checked date: 2026-09-03

Goal: make the existing 148 REAL domestic editorial articles usable by a merchandiser as a planning-evidence surface - "what specific item is showing up" + "why we think so" + "what it co-occurs with" + "which article/outlet it came from" - without collecting any new source.

## Current editorial dataset (REAL)

- `EditorialPost` REAL: 148, `MarketRankingSnapshot` REAL: 667. Both are floors enforced by `scripts/smoke-test.ts` (`verifyDomesticFirstFiltering`) - a reparse or taxonomy change must never drop below these counts.
- `EditorialMention` REAL: 179, 0 duplicate `(postId, type, value)` rows (DB-level `@@unique` constraint on `EditorialMention`).
- Gender distribution across REAL mentions: UNKNOWN 136, WOMEN 32, MEN 6, MIXED 5, UNISEX 0. UNKNOWN is expected and correct - most fashion copy has no explicit gender marker, and `inferEditorialGender`/`inferMentionGender` never guess gender from item type (see `verifyDomesticFirstFiltering`, `verifyDomesticFirstTaxonomy` in `scripts/smoke-test.ts`).

## Source distribution (imbalance)

- EYESMAG 102, HYPEBEAST_KR 36, NONLABEL 4, VISLA 6.
- Because EYESMAG alone accounts for ~69% of posts, raw mention/article count is not a safe trend signal by itself. `evidenceStrengthLabel` (`src/lib/market-ui.ts`) weights **source spread** (distinct outlets) above raw article count: a single outlet repeating a phrase reads as "특정 매체 집중", never a broad trend claim, and "트렌드 상승" requires 3+ sources AND recent momentum. This rule is asserted in `verifyEvidenceStrengthLabels` and must stay the single source of trend-strength wording across dashboard/detail pages.

## Specific item (SUB_ITEM) coverage

- Distinct SUB_ITEM values currently extracted: 5 (`scripts/audit-specific-item-phrases.ts`), 7 total SUB_ITEM mentions.
- 2026-09-03 read-only phrase audit (`npm run audit:specific-item-phrases`) over the 130 FASHION_RELEVANT real posts found only 2 unmatched candidate phrases (`layered` -> STYLE, `varsity jacket` -> SUB_ITEM), each at 1 article / 1 source. Per the taxonomy-expansion rule (article presence >= 2 OR source spread >= 2), **neither qualifies** - no taxonomy/alias was added in this pass. This is a report-only finding, not a gap that needs a code change today.

## Evidence strength rule

- `evidenceStrengthLabel({ articlePresence, sourceSpread, change7dArticlePresence })`:
  - `sourceSpread >= 3` + recent momentum -> "트렌드 상승"
  - `sourceSpread >= 3`, no recent momentum -> "다수 매체 공통"
  - `sourceSpread >= 2` -> "여러 매체 동시 관찰"
  - `articlePresence >= 2`, single source -> "특정 매체 집중"
  - otherwise -> "관찰 시작"
- Article presence (distinct posts) is the unit throughout, not raw mention count - `extractEditorialMentions` already dedupes to one mention per `(type, value)` per post, and the DB enforces it again at the schema level.

## Co-occurrence semantics (new: `getSpecificItemEditorialDetail`)

- `src/services/editorial-analytics-service.ts` exposes `getSpecificItemEditorialDetail(specificItem, dataMode)`, reused by `src/app/items/[itemType]/page.tsx`. It does **not** duplicate the trend-aggregation logic - it reuses `getEditorialTrendRows`/`aggregateEditorialMentions` for the trend summary (article presence, source spread, 7D/14D momentum, gender split, evidence articles) and adds one new query: for the set of posts mentioning the specific item, group co-occurring `DETAIL` / `MATERIAL` / `COLOR` / `STYLE` / `BRAND` mentions and count by distinct article.
- Because `(postId, type, value)` is unique at the DB level, a plain `group by (type, value), count()` over the joined posts is already article-presence-correct - no extra dedupe pass is needed, and no duplicate-mention inflation is possible.
- Dimension separation is preserved end-to-end: `DENIM`/`KNIT`/`NYLON`/`SUEDE` only ever surface under MATERIAL, `STRIPE`/`CHECK`/`WASHED` only under DETAIL, `BLACK`/`WHITE`/etc. only under COLOR, `SPORTY`/`WORKWEAR`/etc. only under STYLE. Covered by `verifySpecificItemEditorialCoOccurrence` in `scripts/smoke-test.ts`.

## UI: specific item detail page

- `src/app/items/[itemType]/page.tsx` (existing route, reused - no new route created) now renders, for any specific item with real editorial evidence: evidence-strength label + source-spread note, a plain-language "왜 이 아이템인가" block (`editorialWhyThisItemLines`, `src/lib/market-ui.ts` - every line is traced to a real `EditorialTrendRow` field, no aspirational language), co-occurring 디테일/소재/컬러/스타일 cards, a 브랜드 evidence card when brand mentions exist, and an evidence-article list linking out with `target="_blank" rel="noopener noreferrer"` to `canonicalUrl`.
- Domestic STORE block on this page continues to read "국내 스토어 랭킹 데이터가 없습니다" - it was never replaced with NAVER or overseas data.

## Known limitations

- SUB_ITEM taxonomy coverage is narrow (5 items) relative to the 148-article corpus; expansion is intentionally gated on repeated evidence (article presence >= 2 or source spread >= 2) so the taxonomy does not get seeded with one-off phrasing.
- EYESMAG's ~69% share of posts means most single-source "특정 매체 집중" reads may, in practice, be EYESMAG-only; this is disclosed via source-spread wording rather than hidden.
- No domestic (Korea) verified STORE ranking source exists yet (`docs/KOREA_SOURCE_AUDIT.md`); editorial evidence cannot be cross-checked against domestic sell-through until one exists.

## Domestic STORE gap

- Unchanged from `docs/KOREA_SOURCE_AUDIT.md`: 29CM/ZIGZAG/W Concept/EQL/ABLY all fail public-access or ranking-semantic requirements. This audit does not revisit that conclusion or attempt new collection.

## Recommended next work

- Re-run `npm run audit:specific-item-phrases` after any meaningful growth in the editorial corpus (new backfill), not on a fixed schedule - it is read-only and cheap.
- If a future backfill pushes `varsity jacket` or `layered` past the article-presence/source-spread threshold, add them as a single small taxonomy diff plus a matching `reparse:editorial-mentions` pass (verify REAL post/snapshot counts before and after per `verifyDomesticFirstFiltering`).
- Consider surfacing `sourceArticleRate` (per-source normalized article rate) on the detail page once there are enough non-EYESMAG articles to make the ratio meaningful; currently the raw source-spread count is the more honest signal given the corpus imbalance.
