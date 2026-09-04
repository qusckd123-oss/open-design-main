# Item Attribute Bundle Audit

Checked date: 2026-09-04

Goal: move the analysis from "토트백이 많이 보인다" to "어떤 속성의 어떤 아이템이 보이는가" - but only where an attribute is genuinely attached to the item, never by promoting article co-occurrence into a product attribute.

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

- Coverage is capped by body-text availability, not by the extractor. EYESMAG (69% of posts) stores title-only records.
- Every current direct relation comes from a single outlet (HYPEBEAST_KR), so no bundle can legitimately reach "여러 매체 동시 관찰" yet.
- Only Korean head-final modifier order and simple English adjacency ("red track jacket") are handled. No POS tagging, so long relative clauses are rejected rather than parsed.
- Bundle images are article hero images (`EditorialPost.imageUrl`), i.e. editorial visuals, not product cutouts. They illustrate the source article and must not be read as the product itself.

## Recommended next work

- Improve body capture for EYESMAG (or accept it as a title-only signal source) — this is the highest-leverage change for direct-attribute coverage.
- Re-run `audit:attribute-relations` after any editorial backfill; promote SEQUIN/RAGLAN or a SILHOUETTE dimension only if they cross the ≥2 article / ≥2 source threshold.
- Revisit the `fashionRelevance=UNKNOWN` classification for the côte&ciel article, which currently hides a valid BACKPACK + BLACK relation.
