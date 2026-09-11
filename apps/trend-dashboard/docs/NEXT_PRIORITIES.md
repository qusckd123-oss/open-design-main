# Next Priorities - Trend Dashboard

Short by design. For rules, see `AGENT_OPERATING_RULES.md`. For live numbers, see `CURRENT_STATE.md`. Pick the highest tier with a real, live task in it - don't manufacture work in a tier just because it's next.

## P0 - Operations

- Observe the first naturally scheduled Monday refresh (next: **2026-09-14 08:30 KST**) - don't intervene preemptively.
- After it runs: verify logs (`apps/trend-dashboard/logs/editorial-refresh/`), verify source health (all 8 sources succeeded / any rate-limited), verify DB/signal deltas look sane (no sudden collapse, no duplicate-count regression).
- React only to real failures - a WARN-level quality gate (e.g. a single zero-result source, or a bundle-count swing under 25%) is not a failure.

## P1 - Quality Maintenance

- Parser/source-health fixes **only when real evidence shows a problem** (a failing source, a reproduced parsing bug, a duplicate that shouldn't exist).
- No speculative taxonomy expansion of any kind.

## P2 - Product-Planning Usability

- User explicitly authorized safe UI-only pre-gate work on 2026-09-10 while P0 remains pending. First fix completed: `/editorial` no longer shows the no-op domestic/overseas scope toggle; gender filtering remains.
- Second fix completed (2026-09-10): unified specific-item Korean label rendering (`specificItemKoreanLabel`) across `/items`, `/editorial`, and `/`'s trend×store matrix table - these previously showed the raw English SUB_ITEM enum (e.g. `TRACK JACKET`) where `/` (EditorialTrendCard) and the item detail page already showed the Korean label (`트랙 재킷`) for the exact same data. No taxonomy/dictionary expansion; reused the existing helper and the existing SUB_ITEM-only conditional pattern already established in `EditorialTrendCard`.
- New user-directed P2 focus (2026-09-11): shift toward a **visual-first trend board** that answers “요즘 뭐가 뜨는가?” using planning-ready `ITEM + DIRECT ATTRIBUTE(S) + MOOD/STYLE CONTEXT + VISUAL EVIDENCE`, not broad category counts. See `WORK_START_HERE.md`.
- Safe pre-gate work may include rendered-UI audit, visual-evidence architecture, existing-image reuse audit, and Instagram/editorial-Instagram feasibility research. Do not fabricate Instagram metrics or weaken direct-relation semantics.
- Visual-first baseline audit completed (2026-09-11): `docs/VISUAL_FIRST_TREND_BOARD_AUDIT.md` records the rendered 0-image home baseline, 587/587 article-image coverage, 0 evidence-bound bundle images, the frozen evidence-lane contract, and official-API-only Instagram feasibility boundary.
- `EditorialVisualContextStrip` completed after explicit review (2026-09-11): the current bundle now shows up to six unique existing article heroes (currently five) with publisher/date/title/link and permanent non-proof wording. Desktop and mobile rendered checks confirm first-viewport imagery and no page-level horizontal overflow. It does not replace the evidence-bound hero slot, infer mood, change ranking, or touch collectors/schema.
- Next visual-first architecture work, after the healthy natural P0 observation and separate review: preserve ordered editorial content blocks with image position so `DIRECT_BLOCK`/`ADJACENT_BLOCK` can become real, and define human-reviewed visual mood observations in a separate evidence lane. Do not infer either relationship from today's article hero images.
- Ordered-visual-evidence feasibility audit completed (2026-09-11, read-only, no code/schema/collector change): `docs/EDITORIAL_ORDERED_VISUAL_EVIDENCE_AUDIT.md` traces each of the 8 sources' parsers, confirms 0/617 stored articles carry any recoverable block/image-position data (all destroyed at parse time, none in the Prisma schema to begin with), rates per-source feasibility for a future ordered-block collector (HIGH: EYESMAG; MEDIUM: VISLA, HYPEBEAST_KR, ESQUIRE_KR, HARPERSBAZAAR_KR, COSMOPOLITAN_KR, MARIECLAIRE_KR asymmetric; LOW: NONLABEL), and proposes (design only) a minimal `OrderedContentBlock` shape plus a separate human-reviewed mood-observation shape. This still waits for explicit review and the first healthy P0 observation before any implementation - the priority tier and gate are unchanged by this audit.
- Larger implementation that changes evidence semantics, collection architecture, ranking, taxonomy, or major IA should still wait for explicit review and/or the first healthy natural P0 scheduler observation.
- Trend research source-map audit completed (2026-09-11, docs/config-independent, no code/config/collector change): `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` checks 8 sources the user actually references (5 Instagram accounts/posts, HBX women's, Musinsa's content/magazine section, Coverchord) against existing repo coverage, classifies each into an EDITORIAL DIRECT EVIDENCE / VISUAL DIFFUSION-STYLE CONTEXT / MARKET-ASSORTMENT / MANUAL-ONLY lane, and proposes (design only) a `VisualDiffusionSourceConfig`/`VisualDiffusionReference` model kept structurally separate from `EditorialMention`/ranking. Two concrete new-action candidates surfaced, neither implemented in this pass: (1) `coverchord.com` is a Shopify storefront with a confirmed public `products.json` endpoint - a small, isolated, config-only Market-source addition mirroring Slam Jam/Stussy, ready whenever explicitly approved and independent of the Editorial P0 gate; (2) the 4 editorial Instagram accounts plus the 1 example permalink are candidates for a `MANUAL_CURATION`-tier registry entry, pending explicit approval and a human reviewer workflow - no automated Instagram collection is proposed.

## P3 - Optional Future Research

- A new publisher family: only when source diversity becomes a *demonstrated* bottleneck again (it currently isn't - see `docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md` Section 20).
- New taxonomy vocabulary: only when the current corpus proves a recoverable trust-tier signal exists to capture (not a speculative "might help" addition).
- New Market source: `COVERCHORD` (Shopify `products.json`, confirmed public and working 2026-09-11 - see `docs/TREND_RESEARCH_SOURCE_REGISTRY.md` Section 3.3/8) is ready for a small, reviewed, config-only follow-up mirroring Slam Jam/Stussy - not yet added, pending explicit approval.

## Explicitly NOT Current Priority

Do not pursue these unless the user explicitly reopens them in-session:

- More generic source collection.
- BAGS taxonomy, ACCESSORIES taxonomy, COAT taxonomy (tried, reverted - see `docs/EDITORIAL_CATEGORY_COVERAGE_GAP_AUDIT.md`).
- Product Reference (closed/frozen).
- Ranking redesign (current sort order is documented, working, and frozen - see `CURRENT_STATE.md` "Current Ranking Order").
- Scheduler redesign (current Windows Task Scheduler setup is working - verify, don't rebuild).
