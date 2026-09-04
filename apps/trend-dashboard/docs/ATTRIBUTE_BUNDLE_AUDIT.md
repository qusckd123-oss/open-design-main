# Item Attribute Bundle Audit

Checked date: 2026-09-04 (architecture pass), updated 2026-09-04 (editorial body coverage pass)

> **Counts below are superseded.** The overnight editorial expansion run (corpus
> 148 → 223 posts, relations 6 → 11, bundles 4 → 7, plus three taxonomy additions
> and a HYPEBEAST_KR post-identity fix) is recorded in
> [`EDITORIAL_EXPANSION_NIGHT_RUN.md`](./EDITORIAL_EXPANSION_NIGHT_RUN.md).
> The architecture, the direct-vs-co-occurrence rule, and the extraction rule
> described in this document remain accurate.

Goal: move the analysis from "토트백이 많이 보인다" to "어떤 속성의 어떤 아이템이 보이는가" - but only where an attribute is genuinely attached to the item, never by promoting article co-occurrence into a product attribute.

## 2026-09-04 update: editorial body coverage pass

The architecture below was unchanged. What changed is the input: EYESMAG and VISLA article bodies were mostly unavailable (see "Corpus reality" below, now historical), which is why the first pass found only one bundle. A collector/parser fix recovered the real public article body for both sources, and the same 148 posts were then re-audited - no new posts were collected.

**Root cause:** the shared `parseArticlePage()` body field was the SEO `<meta name="description">` tag (a one-line tagline), not the article body, for EYESMAG. VISLA's RSS feed carries no `content:encoded` at all. Both sources' real bodies exist as **public data already sent to any browser** loading the article page:

- **EYESMAG** (Next.js `getStaticProps`): the page's own `__NEXT_DATA__` hydration script embeds `props.pageProps.initialPost.content`, a TipTap/ProseMirror JSON document. `parseEyesmagRichBody()` (`src/collectors/editorial/rss.ts`) walks `text` nodes and skips `slider`/`embed` nodes, which naturally excludes surrounding chrome without needing to identify a "content div".
- **VISLA** (WordPress): the body is plain HTML inside `<div class="entry-content ...">`. `parseVislaRichBody()` locates that div by its `class` attribute (not a bare substring match - an earlier version matched literal text containing the words "entry-content", caught by a smoke-test fixture) and cuts at the first of three trailing markers (hashtag-tag-list run, `VISLA Magazine` byline block, `SHARE THIS ARTICLE`), found by scanning the *whole* flattened region rather than a fixed-offset tail slice - the boundary position varies with article length.

No undocumented API, login, or anti-bot bypass was used; both are the standard public page response. `robots.txt` for both hosts was reconfirmed to allow the article routes (`eyesmag.com`: only `/admin/` disallowed; `visla.kr`: only `/wp/wp-admin/` disallowed).

**Safe refresh (`npm run refresh:editorial-body`):** re-fetches only the 108 existing EYESMAG+VISLA posts by their own stored `canonicalUrl` (never a fresh sitemap/listing crawl, so it cannot discover a new post), and calls `prisma.editorialPost.update` - never `upsert`/`create` - only replacing `text`/`excerpt` when the newly parsed body is strictly longer than what was stored, and `imageUrl` only when it was previously null. Result: **105 updated, 3 unchanged, 0 failed, EditorialPost count 148 -> 148.**

| Source | Coverage Before | Coverage After | Median Before | Median After |
|---|---:|---:|---:|---:|
| EYESMAG | 0% | 97% (99/102) | 15 chars | 706 chars |
| VISLA | 0% | 100% (6/6) | 29 chars | 2,511 chars |
| HYPEBEAST_KR | 100% | 100% (untouched) | 1,215 chars | 1,215 chars |
| NONLABEL | 100% | 100% (untouched) | 434 chars | 434 chars |

3 EYESMAG posts stayed near-title-only after refresh (the `[아이참]` interview series, e.g. `aicharm-anita-pallenberg-interview`) - their TipTap documents are almost entirely `embed` video blocks with a one-line text intro. This is an honest reflection of the source article (video-centric), not a parser gap.

`npm run reparse:editorial-mentions` was then run once, after the refresh was confirmed (never mixed into the same step, per the project's own sequencing rule) - `EditorialMention` moved from 179 to 489 as the richer bodies matched more existing taxonomy phrases. `EditorialPost` (148) and `MarketRankingSnapshot` (667) did not move; both are asserted in the smoke test's `verifyDomesticFirstFiltering`.

**Direct-attribute result, before -> after this pass:**

| | Before | After |
|---|---:|---:|
| Direct relations (post-level) | 2 | 6 |
| Distinct (item, attrType, attrValue) | 1 | 5 |
| Items with direct attributes | 1 (TOTE_BAG) | 2 (TOTE_BAG, BACKPACK) |
| Attribute bundles | 1 | 4 |

New bundles found in the richer HYPEBEAST_KR/EYESMAG text (all single-article, single-source - `단일 관측` per the conservative evidence-strength rule, except the original recycled-fabric tote which stays `반복 관측 · 특정 매체 집중`):

| Bundle | Attribute | Evidence |
|---|---|---|
| 재활용 원단 토트백 (unchanged) | MATERIAL:RECYCLED_FABRIC | 2 articles / 1 source |
| 나일론 체크 백팩 | DETAIL:CHECK, MATERIAL:NYLON | "나일론 소재에 체크를 직조한 홀스슈 백팩" |
| 체크 토트백 | DETAIL:CHECK | "…방식으로 체크 패턴을 구현한 마게이트 토트백" |
| 데님 토트백 | MATERIAL:DENIM | "…담은 까나쥬는 스폰지 질감의 데님 토트백" |

**TRACK_JACKET re-audit:** article presence rose 2 -> 4 with the richer bodies (co-occurrence SPORTY now 3 articles/2 sources, DENIM 3/2), but **direct attributes are still 0**. The extractor's enumeration guard continued to correctly reject every candidate even with twice the evidence volume - this is the exact behavior §15/§16 of the task asked to protect, now confirmed under real conditions rather than just the original 2-article case.

The "Corpus reality" table and the single-bundle results below are kept as a historical record of the state before this pass; see the numbers above for current state.

Re-run this audit at any time (read-only, no network):

```bash
corepack pnpm --filter @open-design/trend-dashboard run audit:attribute-relations
corepack pnpm --filter @open-design/trend-dashboard run audit:attribute-relations -- --all-relevance
```

## The distinction this audit enforces

| | Claim | Where it lives |
|---|---|---|
| **Direct attribute relation** | The attribute modifies the item ("카본 블랙 ELVO 백팩") | `attribute-relations.ts` -> `[직접 속성 근거]`, bundle cards |
| **Article co-occurrence** | Both appeared somewhere in the same article | `editorial-analytics-service.ts` -> `[함께 언급된 요소]` |

A roundup article covering eight unrelated product drops will co-mention `TRACK_JACKET` and `RED` without any red track jacket existing in it. Only the first column may be used for planning.

## Corpus reality (why results are sparse)

Body-text availability is extremely uneven, and this is the binding constraint on direct-attribute extraction:

| Source | Posts | Median body length | Images |
|---|---:|---:|---:|
| EYESMAG | 102 | 15 chars | 102 |
| HYPEBEAST_KR | 36 | 1,215 chars | 36 |
| NONLABEL | 4 | 434 chars | 4 |
| VISLA | 6 | 29 chars | 0 |

EYESMAG is 69% of the corpus but stores effectively title-only records, so it cannot contribute sentence-level modification evidence. **Every specific-item mention currently comes from HYPEBEAST_KR.** Direct-attribute coverage is therefore capped by ~40 posts with real body text, not by the extractor.

## Extraction rule (DIRECT_PHRASE only)

Korean is head-final, so a modifier attaches immediately *before* the item noun. The extractor takes a **20-character window** preceding the item and rejects the relation when:

1. a coordination boundary (`,` `·` `와` `과` `및` `그리고`) sits between the attribute and the item - the modifier then belongs to a different list element;
2. another specific-item noun appears in the window - the phrase is an enumeration;
3. no attribute from the existing taxonomy appears in the window.

`DIRECT_SENTENCE` (a looser same-sentence link) is defined in the type but deliberately **not implemented**: the current corpus produced no unambiguous case, and a looser rule would manufacture relations rather than find them.

The window was tightened from 40 to 20 characters after a real false positive: in "스무스 블랙 **후드**가 일체형으로 더해져 입을 수 있는 베스트로 펼쳐지는 RENO 숄더백", 블랙 modifies 후드, not the 숄더백 ~38 characters later. Recall is traded for precision on purpose.

## Results (FASHION_RELEVANT gate, 130 posts)

**Direct relations: 2 post-level rows / 1 distinct pair. Bundles: 1.**

| Specific Item | Attribute | Kind | Articles | Sources |
|---|---|---|---:|---:|
| TOTE_BAG | MATERIAL:RECYCLED_FABRIC | DIRECT_PHRASE | 2 | 1 (HYPEBEAST_KR) |

Evidence:
- "…컬래버레이션 티셔츠를 비롯해 **재활용 패브릭을 활용한 토트백**…" — *sacai TO GO, 파리에서 만나는 익스클루시브 피스*
- "…아카이브 **원단을 재활용해 만든** Zantan **토트백**…" — *이번 주 놓치지 말아야 할 8가지 드롭*

**Bundle:** `재활용 원단 토트백` — 2 articles / 1 source → **반복 관측 · 특정 매체 집중** (never "여러 매체 공통", since one outlet produced both).

## Rejected ambiguous relations

These were found by the extractor's guards and are documented so the rejections are auditable rather than invisible:

| Candidate | Text | Why rejected |
|---|---|---|
| TRACK_JACKET + SILHOUETTE:OVERSIZED | "오버사이즈 축구 셔츠**와** 트랙 재킷" | Enumeration - 오버사이즈 modifies 축구 셔츠 |
| SHOULDER_BAG + COLOR:BLACK | "스무스 블랙 **후드가** … 펼쳐지는 RENO 숄더백" | Attribute belongs to a different head noun |
| BACKPACK + COLOR:BLACK | "카본 블랙 ELVO 백팩" | Valid phrase, but the article is `fashionRelevance=UNKNOWN` and is excluded by the app-wide relevance gate. Visible via `--all-relevance`. |
| LONG_SLEEVE_TEE + SEQUIN / RAGLAN | "시퀸 라글란 롱슬리브 톱" | Valid phrase, but SEQUIN/RAGLAN are not in the taxonomy and appear in 1 article / 1 source - below the project's ≥2 articles or ≥2 sources addition threshold |

## TRACK_JACKET: the worked example

`TRACK_JACKET` has article co-occurrence with SPORTY (2), STRIPE, DENIM, FLEECE, KNIT, NYLON, RED, VINTAGE, ADIDAS, NIKE (1 each) — and **zero direct attributes**. Both of its articles mention it inside enumerations. The UI therefore shows an explicit "직접 수식한 속성 표현이 아직 확인되지 않았습니다" state and keeps the co-occurrence list clearly subordinate. This is the case the whole direct/indirect split exists to protect.

## Taxonomy change

One addition, meeting the project's existing threshold (≥2 articles or ≥2 sources):

- `MATERIAL:RECYCLED_FABRIC` (`recycled` / `재활용`) — 2 distinct articles.

Note: this rule now lives in `mentions.ts`, the single matching vocabulary. It was **not** applied to stored `EditorialMention` rows in this pass (no reparse was run, so the count stays 179). A future `npm run reparse:editorial-mentions` will additionally surface it as an article-level MATERIAL mention.

No new dimensions (`SILHOUETTE`, `FINISH`) were created: the corpus produced no direct silhouette/finish attachment, and adding empty dimensions to fill out the taxonomy is explicitly out of scope.

## Storage decision: no new table

`EditorialAttributeRelation` was specified as a possible model but **was not created**. Relations are derived on demand from stored post text in `attribute-bundle-service.ts` because:

- the corpus is 148 posts (~40 with body text); extraction costs milliseconds per request;
- it keeps `EditorialPost` / `EditorialMention` / `MarketRankingSnapshot` completely untouched — no migration, no reparse, no cache/text drift;
- the existing mention table genuinely cannot express the relation, but that only justifies a table once extraction cost matters.

Revisit if the corpus grows to where per-request extraction stops being cheap.

## Known limitations

- ~~Coverage is capped by body-text availability~~ - resolved for EYESMAG (97%) and VISLA (100%) by the 2026-09-04 body coverage pass. 3 EYESMAG `[아이참]` video-interview posts remain near-title-only because their real content is video, not text - an honest source limitation, not a parser gap.
- Every current direct relation comes from a single outlet each (HYPEBEAST_KR or EYESMAG), so most bundles are still `단일 관측`; none has yet reached "여러 매체 동시 관찰" (needs 2+ distinct sources on the same item+attribute pair).
- Only Korean head-final modifier order and simple English adjacency ("red track jacket") are handled. No POS tagging, so long relative clauses are rejected rather than parsed.
- Bundle images are article hero images (`EditorialPost.imageUrl`), i.e. editorial visuals, not product cutouts. They illustrate the source article and must not be read as the product itself.
- `parseVislaRichBody`'s stop-marker cut is heuristic (three known trailing patterns), not a real HTML parser; a future VISLA template change could require re-tuning it.

## Recommended next work

- Re-run `audit:attribute-relations` after any editorial backfill; promote SEQUIN/RAGLAN or a SILHOUETTE dimension only if they cross the ≥2 article / ≥2 source threshold.
- Revisit the `fashionRelevance=UNKNOWN` classification for the côte&ciel article, which currently hides a valid BACKPACK + BLACK relation.
- HYPEBEAST_KR and NONLABEL already had full bodies before this pass and were intentionally left untouched; if either source's RSS/parser changes upstream, re-run the body-quality audit to confirm they are still FULL_BODY.
