# Editorial Publisher-Family Diversity Audit

Checked date: 2026-09-09

Question: before integrating COSMOPOLITAN_KR, does the current corpus (or would Cosmopolitan) over-concentrate independent evidence inside one publisher family (ELLE / COSMOPOLITAN / Harper's BAZAAR / ESQUIRE - publicly reported as one Hearst-JoongAng family)? **Same publisher family does not automatically mean same evidence cluster** - the existing `independentEvidenceClusterCount` mechanism (unchanged this pass) already scores real article/story independence regardless of ownership. This pass adds a *separate*, audit-level-only lens - `publisherFamilySpread` - to see whether `sourceSpread` growth is coming from genuinely different companies or from more mastheads of the same one. No DB mutation, no schema change, no collection, no taxonomy change, no UI change.

## 0. Safety

```
pwd    -> C:/Users/bcave/dev/open-design-trend-dashboard/apps/trend-dashboard
branch -> feature/trend-dashboard
status -> clean before starting
HEAD   -> 81fe103
```

## 1. Current source ownership audit (explicit public evidence, not visual inference)

Fetched each source's own live homepage/about/terms page directly (not inferred from branding):

| Source | Operating Entity (public evidence) | Publisher Family | Domain |
|---|---|---|---|
| EYESMAG | `legalName: "주식회사 아이즈"` (Eyes Inc.), JSON-LD `founder: "Jinpyo Park"`, `foundingDate: 2021` (found on `/about`) | **EYES_INC** - independent | eyesmag.com |
| HYPEBEAST_KR | `legalName: "Hypebeast Hong Kong Limited"`, `foundingDate: 2005`; footer: "Hypebeast Limited. All Rights Reserved." (found on `/about`, `/terms`, `/privacy`) | **HYPEBEAST_HK** - independent, global company | hypebeast.kr |
| NONLABEL | Footer: "대표 : 강주련, 사업자번호 : 231-88-02051, 주소 : 서울특별시 마포구 양화로 186" | **NONLABEL_INDEPENDENT** | nonlabel.co.kr |
| VISLA | Footer/about/contact pages show only "© 2025 VISLA MAGAZINE" and editorial self-description; **no business-registration number or legal entity name found in public pages within this pass's time budget** | **VISLA_INDEPENDENT** (unconfirmed registration, but distinct domain/branding, no shared info with any other source) | visla.kr |
| ESQUIRE_KR | Footer (own page): "서울 강남구 도산대로 156(논현동), 대표자 : 강주연, 사업자등록번호 : 104-81-55280, 통신판매업신고 : 제 2014-서울강남-00333호... **© Hearst Joongang. All Rights Reserved.**" Footer nav: "Family & Global ... ELLE COSMOPOLITAN Harper's BAZAAR ESQUIRE" | **HEARST_JOONGANG** | esquirekorea.co.kr |
| HARPERSBAZAAR_KR | Identical footer block, own page: same address, same 대표자 강주연, **same registration number 104-81-55280**, "© Hearst Joongang. All Rights Reserved.", same Family & Global nav | **HEARST_JOONGANG** | harpersbazaar.co.kr |

**Explicit confirmation, not inference:** ESQUIRE_KR and HARPERSBAZAAR_KR share an *identical* Korean business registration number, representative name, and address - not merely "same conglomerate," but the same single registered business operating both mastheads.

**NONLABEL vs. Hearst JoongAng - checked explicitly, ruled out:** the representative names look superficially similar at a glance (NONLABEL: 강주련 vs. Hearst JoongAng: 강주연) but are different people (different final syllable, 련 vs. 연), with completely different registration numbers (231-88-02051 vs. 104-81-55280) and addresses (마포구 vs. 강남구). Verified character-by-character rather than assumed similar-looking.

## 2. Candidate family audit

Fetched each candidate's own live homepage directly (not inferred from ESQUIRE_KR's footer alone):

| Candidate | Operating Entity | Publisher Family | Relationship to ESQUIRE_KR / HARPERSBAZAAR_KR |
|---|---|---|---|
| **COSMOPOLITAN_KR** | Own footer: "서울 강남구 도산대로 156(논현동), 대표자 : 강주연, 사업자등록번호 : **104-81-55280**... © Hearst Joongang." | **HEARST_JOONGANG** | Same legal entity as both existing sources (identical registration number, address, representative). |
| **ELLE_KR** | Own footer: identical block, "서울 강남구 도산대로 156(논현동), 대표자 : 강주연, 사업자등록번호 : **104-81-55280**... © Hearst Joongang." | **HEARST_JOONGANG** | Same legal entity as both existing sources. |

Both candidates are **the same single business** already represented in the corpus by ESQUIRE_KR and HARPERSBAZAAR_KR, publishing under four separate mastheads (ELLE, COSMOPOLITAN, Harper's BAZAAR, ESQUIRE) from one company.

## 3-4. Family-spread metric (audit-level only, no schema/DB change)

A `publisherFamilySpread` lookup was computed in a scratch, non-committed script (`getAttributeBundles("real")` output post-processed against the ownership map above, then deleted) - **not** stored, **not** wired into `attribute-bundle-service.ts`, and it did **not** touch `independentEvidenceClusterCount`, which remains exactly the frozen, story-independence-based mechanism from the prior pass. Same-family articles are never collapsed by this metric or by the existing trust logic - it is purely an additional read-only lens.

## 5-6. Current 40-bundle audit: bundles with sourceSpread >= 2

Only two bundles currently qualify (unchanged from the prior pass's own count):

| Bundle | Sources | Publisher Families | Source Spread | Publisher Family Spread | Independent Clusters |
|---|---|---|---:|---:|---:|
| **니트 CARDIGAN** (primary) | HARPERSBAZAAR_KR, HYPEBEAST_KR | HEARST_JOONGANG, HYPEBEAST_HK | 2 | **2** | 4 |
| 체크 SHIRT | HYPEBEAST_KR, EYESMAG | HYPEBEAST_HK, EYES_INC | 2 | **2** | 2 |

**Both current multi-source bundles have `publisherFamilySpread == sourceSpread`.** Neither depends on more than one masthead from any single publisher family - each is confirmed by two genuinely unrelated companies. There is no current instance of "one family's two mastheads counted as if they were two independent confirmations."

### Current primary (니트 CARDIGAN) - full breakdown

| Source | Family | Article | Date |
|---|---|---|---|
| HARPERSBAZAAR_KR | HEARST_JOONGANG | 올가을 레드 컬러 조합, 퍼플 VS 브라운 어떻게 입을까? | 2026-09-08 |
| HARPERSBAZAAR_KR | HEARST_JOONGANG | 니트와 셔츠, 올가을엔 허리에 입으세요 | 2026-09-07 |
| HARPERSBAZAAR_KR | HEARST_JOONGANG | 도심에서 마주한 벨라우영, 다샤의 올가을 슈즈 | 2026-09-02 |
| HYPEBEAST_KR | HYPEBEAST_HK | Peezy가 미리 선보인 Denim Tears x Billionaire Boys Club 협업 | 2026-09-02 |
| HYPEBEAST_KR | HYPEBEAST_HK | JENNIE와 adidas Originals의 첫 협업, 'FUNCTIONAL GRACE' | 2026-08-31 |

**Answer to Section 6's question: 니트 CARDIGAN's strength does NOT depend on multiple Hearst-family publications.** Of its 5 evidence articles, exactly 3 are from a *single* Hearst masthead (HARPERSBAZAAR_KR only - not also ESQUIRE_KR or any other Hearst title) and 2 are from an entirely unrelated global company (HYPEBEAST_HK). Its 4 independent clusters break down as 1 merged same-source pair (both HARPERSBAZAAR_KR, within the existing 7-day same-case window - see Section 21 of the prior pass, unchanged and re-confirmed here, not a new finding) + 1 more HARPERSBAZAAR_KR-only cluster + 2 HYPEBEAST_KR clusters. The bundle would look identical in strength if HYPEBEAST_KR were instead any other unrelated outlet - its evidence is genuinely cross-company, not cross-masthead-within-one-company.

## 7-8. Cosmopolitan probe reuse and value split

Reused the same 20-article Cosmopolitan sample already gathered in the prior pass (no new candidate discovery). Re-verified each of its 14 direct relations' exact sentence windows (re-fetched the same 7 already-sampled URLs read-only, to check attribute co-occurrence precisely - not new discovery) and re-checked them against the **current** 40-bundle corpus (which now includes HARPERSBAZAAR_KR, unlike when this sample was first taken).

| Cosmopolitan evidence | Exact window | Category |
|---|---|---|
| SKIRT + COLOR:WHITE ("화이트 롱 스커트", article 1909181) | Clean, isolated (one item in an enumerated outfit list, phrase-contiguous) | **A - confirms 화이트 SKIRT, same family (HEARST_JOONGANG) already present via HARPERSBAZAAR_KR** |
| VEST + MATERIAL:DENIM ("오버사이즈 데님 베스트", article 1909243) | Clean, isolated | **B - confirms 데님 VEST, currently EYES_INC-only -> genuinely new family** |
| SHIRT + DETAIL:CHECK ("체크 셔츠에 트렌디한 안경으로...", article 1909207, from the site's real per-article "10초 안에 보는 요약 기사" abridged-recap box - confirmed genuine article-specific content, NOT the cross-article recirculation-widget chrome fixed in the prior pass) | Clean, isolated | **B - confirms 체크 SHIRT, currently HYPEBEAST_HK + EYES_INC -> would add a 3rd, genuinely new family** |
| SKIRT + COLOR:GREEN ("그린 크로셰 스커트", 1909306) | Clean, isolated | **C - new distinct bundle** (no existing pure GREEN+SKIRT bundle) |
| SKIRT + MATERIAL:DENIM ("데님 스커트를 매치하면", 1909306) | Clean, isolated | **C - new distinct bundle** |
| SHIRT + DETAIL:STRIPE + COLOR:BLUE ("블루 스트라이프 셔츠", 1909268) | Both co-occur in one short phrase -> compound key | **C - new distinct compound bundle**, not a merge into the existing pure "스트라이프 SHIRT" singleton |
| SHIRT + MATERIAL:DENIM ("데님 셔츠를 가볍게 걸쳐", 1909243) | Clean, isolated | **C - new distinct bundle** (no existing pure DENIM+SHIRT bundle) |
| SKIRT + MATERIAL:KNIT + DETAIL:CHECK ("니트와 체크 스커트", 1909236) | Both co-occur -> compound key | **C - new distinct compound bundle** |
| SWEATSHIRT + COLOR:BLACK ("검정색 맨투맨을 그냥 입으면", 1909236) | Clean, isolated | **C - new distinct bundle** (no existing pure BLACK+SWEATSHIRT bundle) |
| BACKPACK + COLOR:BLACK + MATERIAL:NYLON ("나일론 포니 백팩 블랙", 1909177) | Both co-occur -> compound key | **C - new distinct compound bundle**, not a merge into the existing pure "블랙 백팩" (EYES_INC-only) singleton |
| SHIRT + MATERIAL:KNIT ("...깊은 브이넥 니트에 카키 셔츠를 레이어드해...", article 1909268, a different sentence than the STRIPE one above) | **Likely misattribution** - "니트" (a separate knit top being layered *with* the shirt) grammatically modifies its own garment, not "셔츠"; the window heuristic appears to have bled the KNIT modifier onto the nearby SHIRT mention across a coordination boundary, the same class of risk already documented and tested for elsewhere in the corpus (`smoke-test.ts`'s "다른 head" regression) | **D - noise/questionable, disclosed rather than counted** |

### Value split summary (Section 8, the core output of this pass)

| Category | Count | Examples |
|---|---:|---|
| **A - New source confirmation, same family already present** | 1 | 화이트 SKIRT |
| **B - New publisher-family confirmation** | **2** | 데님 VEST (EYES_INC -> +HEARST_JOONGANG), 체크 SHIRT (HYPEBEAST_HK+EYES_INC -> +HEARST_JOONGANG) |
| **C - New distinct bundle** | 7 | 그린 SKIRT, 데님 SKIRT, 블루 스트라이프 SHIRT, 데님 SHIRT, 니트 체크 SKIRT, 블랙 SWEATSHIRT, 블랙 나일론 BACKPACK |
| **D - Noise / questionable** | 1 | SHIRT+KNIT misattribution (1909268) |

**The most important line in this table is Category B.** Cosmopolitan's real, verified evidence does not merely deepen Hearst JoongAng's existing footprint - it would independently confirm two bundles **currently owned by other, unrelated publisher families** (EYES_INC's 데님 VEST; HYPEBEAST_HK + EYES_INC's 체크 SHIRT), pushing 체크 SHIRT specifically to a 3rd independent company. This is real cross-family diversification, not concentration, on the concrete evidence sampled.

## 9. Diversity value decision

**HIGH DIVERSITY VALUE.**

Reasoning against the task's own rule: Direct Attribute Rate remains high (40% in the real, corrected-extractor probe - see prior pass), article independence is real (celebrity street-style/trend-roundup pieces, verified not to be press-release derivatives, on subjects unrelated to any existing evidence), and it adds meaningful independent clusters. Crucially, of its 3 existing-bundle touches, **2 of 3 (67%) are genuine new-publisher-family confirmations (Category B)**, not same-family padding (Category A, only 1 of 3). This is not "moderate" (mostly-within-an-already-heavy-family) - the majority of its existing-bundle value actively diversifies bundles currently owned by *other* companies.

## 10. Concentration audit

**Article share** (real DB counts, all 313 posts):

| Family | Sources | Posts | Share |
|---|---|---:|---:|
| HYPEBEAST_HK | HYPEBEAST_KR | 141 | 45.0% |
| EYES_INC | EYESMAG | 102 | 32.6% |
| **HEARST_JOONGANG** | ESQUIRE_KR + HARPERSBAZAAR_KR | 60 | **19.2%** |
| VISLA_INDEPENDENT | VISLA | 6 | 1.9% |
| NONLABEL_INDEPENDENT | NONLABEL | 4 | 1.3% |

**Direct-relation / bundle contribution** (bundle-evidence-derived, real data):

| Family | Bundles touched | Relation instances | Independent-repeated bundles |
|---|---:|---:|---:|
| HEARST_JOONGANG | 13 | 16 | 2 |
| HYPEBEAST_HK | 11 | 14 | 2 |
| EYES_INC | 17 | 17 | 1 |
| VISLA_INDEPENDENT | 1 | 1 | 0 |
| NONLABEL_INDEPENDENT | 0 | 0 | 0 |

**Flag:** HEARST_JOONGANG is not currently dominant by article count (19.2%, third of five families) but is already **second in relation-instance density** (16 instances from only 60 posts = 0.27/post, vs. HYPEBEAST_HK's 0.099/post) - a direct consequence of the two existing Hearst mastheads both being high-density outfit-styling sources rather than drop-news sources. This is a real, worth-watching structural point: **the corpus's per-article signal density, not its article volume, is where Hearst JoongAng is already punching above its weight**, and adding a third Hearst masthead (Cosmopolitan, itself measured at 40% Direct Attribute Rate) would extend that pattern further. No single family is dominant *today*; the trend is worth flagging honestly rather than waiting for it to become a problem.

## 11. Future source selection principle

**Recommend treating Direct Attribute Rate, Independent Confirmation Potential, and Publisher Family Diversity as three separate, explicitly reported criteria for every future candidate scorecard - not combined into one weighted number.** A weighted 0-100 score would hide exactly the nuance this pass needed (a source can be simultaneously excellent on density and risky on family concentration, or mediocre on density but valuable on diversity) behind one number a future pass might stop scrutinizing. Report all three, let the decision be a written judgment call as this document makes, per Section 12 of the *prior* pass's own acceptance-bar framing (numeric bars plus an explained exception, never an opaque composite).

## 12. Schema decision (recommendation only)

**A. Audit/config metadata is sufficient at current scale (8 sources total, one shared-family cluster of size 4).** A hand-maintained lookup table (source -> operating entity, built from explicit public evidence, as used in this pass's scratch script) costs nothing to maintain at this size and keeps the frozen `attribute-bundle-service.ts`/Prisma schema untouched, which the task explicitly protects.

**Recommendation for B (future):** if the corpus grows to a second same-family cluster (e.g., a JoongAng-family site is ever added alongside Hearst JoongAng, distinct from it), or total sources exceed roughly 10-12, promoting `publisherFamily` to real `EditorialSource` config metadata (not a DB/Prisma field - `src/config/editorial-sources.ts` already carries free-text `role`/`description` fields that a `publisherFamily` string could join without a migration) would be worth a small, low-risk follow-up pass. **Not needed now.**

## 13. Cosmopolitan collection decision

**COLLECT, BUT THEN STOP HEARST-FAMILY EXPANSION.**

Evidence for "collect": 40% Direct Attribute Rate (far above the corpus's other sources), verified real article independence, and - the deciding factor for this specific pass - **2 of 3 existing-bundle confirmations are genuine new-publisher-family evidence** (데님 VEST, 체크 SHIRT), which is real diversification, not concentration, on the concrete sample.

Evidence for "then stop": collecting Cosmopolitan would make HEARST_JOONGANG the **3rd of 8 sources and, on current per-article density, likely the single largest relation-instance contributor per post** in the corpus. ELLE_KR - the remaining probe-validated-but-unimplemented candidate - is *also* HEARST_JOONGANG and, at only a 20% Direct Attribute Rate (half of Cosmopolitan's), offers materially weaker density to justify becoming a 4th masthead from the same single business. Collecting Cosmopolitan now and then deliberately prioritizing a genuinely different publisher family for the *next* new-source pass (rather than reaching for Elle Korea next just because it is already probe-validated) keeps the corpus's independent-evidence growth spread across companies, matching this document's own concentration flag in Section 10.

## Data safety

- EditorialPost (real): **313**, unchanged - no collection ran this pass.
- MarketRankingSnapshot (real): **667**, unchanged.
- No Prisma migration, no schema change, no stored `publisherFamily` field added.
- No taxonomy change, no UI change.

## Validation

Audit/docs-only pass - no code or data changed, so no typecheck/test/build run was required or performed. All scratch analysis scripts (`_scratch-family-audit.ts`, `_scratch-article-share.ts`) were deleted after use and never staged; `git status --short` is clean except for this new documentation file.

## Next step

**Run the same real-collection-and-recompute cycle already proven for HARPERSBAZAAR_KR on COSMOPOLITAN_KR next** (access-checked, probe-validated at 40% density, same parser platform/widget fix already implemented and reusable, and - per this pass's own finding - expected to add genuine cross-family confirmation to 데님 VEST and 체크 SHIRT, not just deepen Hearst JoongAng's footprint). After that collection, the *following* new-source pass should deliberately screen for a publisher family distinct from EYES_INC, HYPEBEAST_HK, NONLABEL_INDEPENDENT, VISLA_INDEPENDENT, and HEARST_JOONGANG, rather than defaulting to ELLE_KR.
