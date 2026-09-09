# Editorial Coordination Fix + Publisher-Family Ranking Pass

Checked date: 2026-09-09

Follow-up to `docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md`, which found two concrete, disclosed problems: (1) the "니트나 카디건" relation is a Korean `A나 B` ("A or B") alternative-coordination false positive, and (2) 화이트 SKIRT (2 sources, but both the same Hearst Joongang masthead) outranked every genuinely 2-publisher-family bundle in the corpus because `publisherFamilySpread` was not part of the sort at all. This pass: fixed the coordination bug generally (not just the one cited example), recomputed real bundle evidence, confirmed the ranking contradiction still existed after that cleanup (it got worse, not better), and added the smallest possible tiebreak to fix it. No collection, no taxonomy expansion, no UI work, no DB migration.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> 750cca2
```

## 1. Exact current sort, traced from the real code (not inferred from prior docs)

Read `src/services/attribute-bundle-service.ts` directly. Before this pass, `getAttributeBundles`'s sort (in order):

```
bundleSourceSpread desc, independentEvidenceClusterCount desc, bundleArticlePresence desc,
directAttributes.length desc, displayName asc (locale compare)
```

`independentEvidenceClusterCount` participates as the **second** key, immediately after `bundleSourceSpread` and before raw article count - it is computed once per bundle via `countIndependentEvidenceClusters(acc.clusterInputs)` inside the same `.map()` that builds each bundle object, and is never touched by anything in this pass (Section 12 below).

## 2. Corpus-wide 나/이나 audit

Ran the real, unmodified `extractDirectAttributeRelations` over the raw stored text of all 373 real posts (no assumptions from prior docs), then filtered for any relation whose `evidenceText` contains `나 `/`이나 `. Found exactly 3 real sentences, producing 4 relations total:

| Source | Article | Sentence | Relation(s) extracted (pre-fix) |
|---|---|---|---|
| HARPERSBAZAAR_KR | "니트와 셔츠, 올가을엔 허리에 입으세요" | "옷차림이 어딘가 허전하게 느껴진다면 **니트나 카디건**, 셔츠 한 장을 허리에 둘러보자." | CARDIGAN + MATERIAL:KNIT |
| HARPERSBAZAAR_KR | "티셔츠 하나 바꿨을 뿐인데 분위기가 달라졌다" | "빈티지한 **데님이나 와이드 팬츠**를 매치해보세요." (approximate; real sentence continues) | WIDE_PANTS + MATERIAL:DENIM, WIDE_PANTS + STYLE:VINTAGE |
| MARIECLAIRE_KR | "돌아온 시퀸 트렌드와 셀럽들의 리얼웨이 스타일링 팁" | "오버사이즈 **화이트 탱크 톱이나 셔츠**를 무심하게 매치해." | SHIRT + COLOR:WHITE |

Not all `나`/`이나` occurrences are coordination boundaries (Section 2 of the task's own instruction: "do not assume all are invalid") - none of the other ~370 posts' relations showed this pattern, and the fix (Section 4) is scoped narrowly enough that it does not touch any of them.

## 3. 니트나 카디건 - deep audit

- **Source:** HARPERSBAZAAR_KR
- **Article:** "니트와 셔츠, 올가을엔 허리에 입으세요" (2026-09-07)
- **Full sentence:** "옷차림이 어딘가 허전하게 느껴진다면 니트나 카디건, 셔츠 한 장을 허리에 둘러보자."
- **Current (pre-fix) relation:** CARDIGAN + MATERIAL:KNIT
- **Expected behavior:** the sentence lists THREE alternative garments to tie at the waist - 니트(a knit top), 카디건(a cardigan), 셔츠(a shirt) - joined by 나 ("or") and a comma. 니트 is not describing 카디건's material; it is a separate, competing item choice.
- **Determination: FALSE POSITIVE.** Not left QUESTIONABLE - the grammar is unambiguous (a `나`-joined list of three distinct nouns, matching the article's own title "니트와 셔츠" which pairs 니트 as its own garment category alongside 셔츠, not as a material).

## 4. Minimum coordination fix implemented

Root-caused to the **wrong insertion point in the existing architecture**: `COORDINATION` (a window-wide cut) was considered and rejected - it is too broad, and re-testing it against the whole corpus would have also destroyed a legitimately-adjacent case (Section 8 below). The correct, narrowest fix extends `ATTACHED_PARTICLE` in `src/collectors/editorial/attribute-relations.ts` - the mechanism that already handles the structurally identical "에/에는/에도/에서/도 immediately suffixed to a matched attribute word" pattern (e.g. "니트에는 와이드 팬츠"). Added a second, purpose-built check, `ALTERNATION_PARTICLE = /(이나|나)(?![가-힣])/`, searched **anywhere within the remaining text between the matched attribute and the item** (not anchored at position 0 like `ATTACHED_PARTICLE`) - because the coordinated noun a `나`/`이나`-attached attribute actually describes is not always the word directly touching the particle (Section 8's harder case).

Safety properties, matching the task's explicit requirements:
- **Not a blanket "reject every 나"**: only ever scans the already-bounded (<=20 char) span between one already-matched attribute keyword and one already-matched item - never arbitrary article text. A `나`-ending word anywhere else in an article (outside a modifier window, or before the attribute match) is never inspected.
- **Word-internal collision guard**: the same `(?![가-힣])` negative lookahead as `ATTACHED_PARTICLE` - a `나` immediately followed by another Hangul syllable (word-internal, e.g. mid-word) is never treated as this particle.
- **No taxonomy change, no COORDINATION/CLAUSE_BOUNDARY/PAIRING_PARTICLE mechanism change** - purely additive to `isGenuineModifier`'s existing per-attribute-match check.

## 5. Full-corpus before/after verification (established methodology, reused)

Created a git-committed-version side-by-side copy of the pre-fix extractor (renamed functions, same file location so its relative import resolves), ran BOTH old and new extractors over all 373 real posts' stored text, and diffed the resulting relation sets by post+item+attribute key (deleted immediately after use, never staged):

```
OLD total relations: 82
NEW total relations: 78
REMOVED (4): exactly the 3 sentences in Section 2 (CARDIGAN+KNIT, WIDE_PANTS+DENIM, WIDE_PANTS+VINTAGE, SHIRT+WHITE)
ADDED (0): the fix is strictly restrictive - it can only remove relations, never add one
```

**All 4 removals confirmed as genuine false positives on manual sentence inspection** (Section 3's CARDIGAN case, plus two more found by the corpus-wide scan, not assumed from the task's own two cited examples):

- **WIDE_PANTS + MATERIAL:DENIM and WIDE_PANTS + STYLE:VINTAGE** (both from the same sentence, "빈티지한 데님이나 와이드 팬츠"): 데님 is directly `이나`-attached (caught the same way as the CARDIGAN case); 빈티지 sits two syllables earlier, modifying 데님 (the coordinated alternative), not 와이드 팬츠 directly - this is the "harder case" the anywhere-in-remaining-text scan exists for, since an anchored-only check would have missed it.
- **SHIRT + COLOR:WHITE** ("오버사이즈 화이트 탱크 톱이나 셔츠"): the immediately preceding pass (`docs/EDITORIAL_SIGNAL_SATURATION_AUDIT.md` §17) had called this **VALID** under a narrower reading - 화이트 precedes the entire `이나`-coordinated pair, so it seemed to describe both alternatives. Re-examined here with the express goal of fixing this bug class: 탱크 톱 is simply not an independently taxonomized `SUB_ITEM`, which is the only reason this one relation survived the earlier, narrower check undetected - structurally it is the identical "modifier attaches to the nearer of two `이나`-coordinated nouns" pattern as the WIDE_PANTS case. **This pass's finding supersedes the prior pass's VALID call for this one instance** - disclosed here rather than silently overwritten.

## 6. Regression tests added (`scripts/smoke-test.ts`)

7 new fixtures: the 3 real confirmed-false-positive sentences (CARDIGAN+KNIT rejected, both WIDE_PANTS attributes rejected, SHIRT+WHITE rejected), the task's own cited "니트나 가죽 재킷" case (asserted generically - `LEATHER_JACKET` was never shipped as a `SUB_ITEM`, so this fixture proves no `MATERIAL:KNIT` relation of any kind survives, not a `LEATHER_JACKET`-keyed one), a positive control for a legitimate adjacent modifier with no alternation particle nearby, and a collision-guard fixture proving a `나`-ending word (그러나, "however") sitting outside the 20-char modifier window never triggers the guard. Full existing suite re-run (2427+ lines): **`Smoke test passed`** - zero regressions, including every prior fixture class named in the task brief (attached-particle bleed, pairing-particle boundary, 물론이고, verb clause, `+`, roundup clustering, SHIRT boundaries).

Two existing real-data assertions had to be **corrected, not weakened**: `scripts/smoke-test.ts` previously asserted 니트 CARDIGAN resolves to exactly 4 independent clusters, citing "Denim Tears x BBC, adidas x JENNIE, H&M color-pairing feature, COS waist-tie feature - four different real products." The "COS waist-tie feature" citation was itself the false positive fixed in this pass - it was never a real 4th product. Updated to the correct real value (3 clusters, 4 articles), with the fixture's own comment explaining why the number changed.

## 7. Signal impact of the KNIT+CARDIGAN removal

| | Before | After (parser fix only) |
|---|---|---|
| 니트 CARDIGAN articles | 5 | **4** |
| 니트 CARDIGAN sources | 2 (HARPERSBAZAAR_KR, HYPEBEAST_KR) | 2 (unchanged) |
| 니트 CARDIGAN families | 2 (HEARST_JOONGANG, HYPEBEAST_HK) | 2 (unchanged) |
| 니트 CARDIGAN clusters | 4 | **3** |
| 니트 CARDIGAN rank | #2 | **#2, still** (immediately after) |
| Total bundles | 47 | **46** (the compound "데님 빈티지 와이드 팬츠" bundle's only evidence was entirely the false WIDE_PANTS relations, so it disappeared entirely - not a removed real observation) |
| Independent Repeated | 10 | **9** (화이트 SHIRT dropped from 2 clusters to 1 - its 2nd article was the now-removed SHIRT+WHITE false positive - so it exited the repeated tier; genuinely correct, it never should have counted as repeated) |
| Multi-source Independent | 8 | 8 (unchanged) |
| Publisher-family-diverse | 7 | 7 (unchanged) |
| Current Primary | 체크 SHIRT | **체크 SHIRT, unchanged** - not assumed, verified: its evidence never touched any 나/이나 sentence, its `bundleSourceSpread=4` remains the highest in the corpus |

## 8. Ranking contradiction re-evaluated after parser cleanup ONLY (before the ranking fix)

**Still present - and worse than before, not resolved.** With `니트 CARDIGAN`'s cluster count correctly reduced from 4 to 3 (Section 7), and `화이트 SKIRT`'s cluster count untouched at 4 (its evidence never involved a 나/이나 sentence), 화이트 SKIRT's 4-cluster count now beat 니트 CARDIGAN's (now-correct) 3-cluster count on the sort's second key, moving 화이트 SKIRT from rank #3 up to **rank #2** - directly ahead of a genuinely 2-publisher-family bundle, worse than the pre-cleanup state. Per Section 8's own instruction ("If the prior contradiction disappeared: DO NOT add ranking logic. If it remains: continue"), the contradiction did not disappear, so the ranking tiebreak (Sections 9-13) proceeded.

## 9-10. Publisher family lookup + sort semantics

No DB field added. Promoted the existing audit-level publisher mapping (used identically across the last 3 docs) to real config metadata: added `publisherFamily: string` to `EditorialSourceConfig` in `src/config/editorial-sources.ts` (a plain TypeScript config object, no Prisma schema/migration) - exactly the follow-up `docs/EDITORIAL_PUBLISHER_DIVERSITY_AUDIT.md` §12 recommended once the corpus reached its current size (8 sources). All 8 sources' families were populated from that same doc's own verified public business-registration evidence, re-used without re-deriving: EYESMAG->EYES_INC, HYPEBEAST_KR->HYPEBEAST_HK, NONLABEL->NONLABEL_INDEPENDENT, VISLA->VISLA_INDEPENDENT, ESQUIRE_KR/HARPERSBAZAAR_KR/COSMOPOLITAN_KR->HEARST_JOONGANG, MARIECLAIRE_KR->MCK_PUBLISHING.

Added `publisherFamilySpread: number` to `AttributeBundle` (computed in `src/services/attribute-bundle-service.ts` from the same `Set<source>` already used for `bundleSourceSpread`, mapped through the new config field, falling back to the source name itself for anything unmapped so an unknown source can never spuriously count as sharing a family). No weighted score - a single new integer, inserted as one more key in the existing lexicographic sort:

```
bundleSourceSpread desc, publisherFamilySpread desc, independentEvidenceClusterCount desc,
bundleArticlePresence desc, directAttributes.length desc, displayName asc
```

**Insertion point chosen from the actual demonstrated contradiction, not blindly copied from the task's example order** (though it happens to match it): the concrete failure was `화이트 SKIRT`'s cluster count beating a family-diverse bundle's cluster count - meaning `publisherFamilySpread` had to be checked BEFORE `independentEvidenceClusterCount` to fix it; inserting it any later (e.g. after cluster count) would not have changed the outcome at all.

## 11. Real contradiction fix - focused test

Added a synthetic sort-order test in `smoke-test.ts` re-using the exact 5-key comparator: a same-family bundle with a DEEPER cluster count (3) is deliberately pitted against a cross-family bundle with a shallower one (2), proving `publisherFamilySpread` is checked before cluster count, not merely used to break an exact tie. Also added a real-data assertion: every bundle with `bundleSourceSpread >= 2 && publisherFamilySpread >= 2` in the live corpus must rank above 화이트 SKIRT. Both pass.

## 12. Family is a tiebreak, not a cluster-collapsing rule

`countIndependentEvidenceClusters` (in `attribute-bundle-service.ts`) was not touched by this pass - verified by reading the diff, not just asserting it. Same-family articles remain full, valid independent evidence exactly as before (e.g. 니트 CARDIGAN's HARPERSBAZAAR_KR-only clusters are untouched; 화이트 SKIRT's 4 clusters, all real, are untouched - it simply now ranks lower, its evidence strength is not disputed). `publisherFamilySpread` only ever participates in the bundle **sort**, never in the cluster-count computation itself.

## 13. Top 15 - before / after (both changes)

| Bundle | Rank before (both changes) | Rank after parser fix only | Rank after ranking fix too | Src spread | Fam spread | Clusters | Latest |
|---|---:|---:|---:|---:|---:|---:|---|
| 체크 SHIRT | 1 | 1 | **1 (unchanged)** | 4 | 3 | 4 | 2026-09-07 |
| 니트 CARDIGAN | 2 | 3 | **2 (restored)** | 2 | 2 | 3 (was 4) | 2026-09-08 |
| 화이트 SKIRT | 3 | 2 (WORSE) | **8 (fixed)** | 2 | **1** | 4 | 2026-09-09 |
| 데님 SHORTS | 4 | 4 | **3** | 2 | 2 | 2 | 2026-09-07 |
| 데님 VEST | 5 | 5 | **4** | 2 | 2 | 2 | 2026-09-07 |
| 레드 SHORTS | 6 | 6 | **5** | 2 | 2 | 2 | 2026-09-08 |
| 레드 SKIRT | 7 | 7 | **6** | 2 | 2 | 2 | 2026-09-04 |
| 스트라이프 SHIRT | 8 | 8 | **7** | 2 | 2 | 2 | 2026-09-08 |
| 시퀸 SKIRT | 9 | 9 | 9 (unchanged) | 1 | 1 | 2 | 2026-09-07 |
| 화이트 SHIRT | 10 | *(dropped - see §7)* | *(dropped)* | - | - | 1 (was 2) | - |
| 라글란 시퀸 긴팔 티셔츠 | 11 | 10 | 10 (unchanged) | 1 | 1 | 1 | 2026-09-03 |
| 재활용 원단 토트백 | 12 | 11 | 11 (unchanged) | 1 | 1 | 1 | 2026-09-03 |

**One bundle materially changed rank: 화이트 SKIRT, from #2-3 to #8.** Every other bundle either stayed in place or shifted by exactly the one position 화이트 SKIRT's departure/return created - a small, understandable change, not ranking churn. Ranks 9+ (all `sourceSpread=1`, `publisherFamilySpread=1` by construction) are entirely untouched, since the new tiebreak only ever activates when `bundleSourceSpread` ties at 2+.

## 14. Current primary

**체크 SHIRT remains #1 throughout every stage of this pass** (before either fix, after the parser fix alone, and after the ranking fix). Why: its `bundleSourceSpread=4` is the highest in the entire corpus - the sort's very first key already decides it outright, before `publisherFamilySpread` or cluster count are ever consulted. Confirmed via the real, unmodified `selectPrimaryPlanningBundle`, not assumed.

## 15. White skirt - exact before/after

| | Before this pass | After |
|---|---|---|
| Sources | 2 (COSMOPOLITAN_KR, HARPERSBAZAAR_KR) | 2 (unchanged) |
| Publisher Families | **1 (HEARST_JOONGANG - both sources are the same company)** | 1 (unchanged - this was never in question, only its RANK was) |
| Independent Clusters | 4 | 4 (unchanged - its evidence is genuine, untouched by the parser fix) |
| Rank before | 3 | - |
| Rank after | - | **8** |

This is the exact regression target named in the task. Its evidence strength was never disputed; only its position relative to genuinely cross-family bundles was corrected.

## 16. Ranking robustness (top 10, post-change)

Checked all 4 patterns from the task brief against the new top 10:
- **Same-family padding beating broader families:** the exact case that motivated this pass - now fixed, not present.
- **Same-case remention beating independent observations:** not present (라글란 시퀸 긴팔 티셔츠, 1 cluster, correctly sits below every 2+-cluster bundle).
- **sourceSpread inversion:** not present - `sourceSpread=4` (체크 SHIRT) still strictly outranks the `sourceSpread=2` tier, which strictly outranks `sourceSpread=1`.
- **Old one-off evidence outranking repeated evidence:** not present - singletons (라글란, 재활용 원단 토트백 at 1 cluster each) remain below every 2+-cluster bundle.

No further ranking rules added - none were needed.

## 17. UI

No visual redesign. No new field displayed. Verified via the route check in Section 21 that `/items/SKIRT`, `/items/CARDIGAN`, `/editorial`, and `/market` all render without error against the new sort/field - the existing UI already treats `getAttributeBundles`'s array order as authoritative and does not hardcode any position, so it required no change to handle the new ordering.

## 18. Product Reference freeze

`product-reference/` was not touched by either code change (the parser fix is scoped to `attribute-relations.ts`; the ranking fix to `attribute-bundle-service.ts` and `editorial-sources.ts` - none of which `product-reference/object-relations.ts` or `attributes.ts` import from, per the existing frozen-scope-isolation design verified in `docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md`). The full smoke suite's Product Reference frozen-behavior assertions (the KIRSH/TNF real-fixture proofs, `verifyEditorialProductReferenceScopeIsolation`) ran as part of the green full-suite pass in Section 6 - no separate script exists to print the specific "58/120 item-bearing / 32/120 attribute-bearing / 52 relations" figures as a standalone number; they are guarded by inline assertions, and all passed unchanged.

## 19. Data safety

- **EditorialPost: 373, unchanged** - this pass touched only pure, on-demand computation logic (`extractDirectAttributeRelations`, `getAttributeBundles`'s sort), never DB rows.
- **EditorialMention: 1496, unchanged** - bundles/relations are computed live at request time directly from stored `EditorialPost.text`, per the codebase's own documented design ("Relations are derived on demand... rather than persisted in their own table"). The parser fix changes what `extractDirectAttributeRelations` returns when called, not any stored mention row - `EditorialMention` is populated by a completely separate function (`extractEditorialMentions`) that this pass did not touch. No reparse was needed or run.
- **MarketRankingSnapshot: 667, unchanged.**
- Canonical duplicates: 0. Mention duplicates: 0.
- No source collection, no taxonomy addition, no Prisma migration, no Product Reference feature work, no Market change, no UI redesign.
- Scratch verification files (a renamed old-extractor copy for the before/after diff, and metrics scripts) were used read-only and deleted immediately after use - never staged.

## 21. Validation

- `npx tsc -b --noEmit`: **clean, no errors** (including after adding the required `publisherFamilySpread` field to 4 synthetic bundle fixtures in `smoke-test.ts` that the type system correctly flagged as needing it).
- `npx tsx scripts/smoke-test.ts` (full suite, 7 new coordination fixtures + 2 new ranking fixtures + all prior regressions): **`Smoke test passed`**, zero regressions.
- `npm run build` (`prisma generate && next build`, Turbopack): **compiled successfully**, all 16 routes generated with no errors.
- Route check on a scratch `next start -p 3001` server (port 3000 never touched - confirmed via `netstat`, a pre-existing unrelated listener was left alone): `/` 200, `/editorial` 200, `/items` 200, `/items/SKIRT` 200, `/items/CARDIGAN` 200, `/market` 200. Server stopped afterward, confirmed no LISTENING socket remains on 3001.

## Next step

**None required from this pass's own findings** - the two problems this pass set out to fix (the 나/이나 false positive and the family-diversity ranking contradiction) are both resolved and verified. Carrying forward the saturation audit's own still-open recommendation unchanged: the next highest-leverage action remains a targeted new-source search (`ITEM COVERAGE` gaps in BAGS/ACCESSORIES/COAT) rather than any further ranking work, now that the ranking layer correctly reflects the publisher-family diversity work already banked.
