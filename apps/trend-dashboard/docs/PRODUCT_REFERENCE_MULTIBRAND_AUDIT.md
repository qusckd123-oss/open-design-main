# Product Reference Multi-Brand Portability Audit

Checked date: 2026-09-08

## Purpose

The Covernat-only passes (`docs/PRODUCT_ATTRIBUTE_REFERENCE_AUDIT.md`) measured a real 93.3% direct-attribute rate with 100%/94.7% precision - but Covernat is one brand, and the task explicitly flagged the risk that this result could be Covernat-specific rather than a property of Korean fashion e-commerce copy generally. This pass answers exactly that question: **does the Product Reference extractor generalize to independent brands, or is it overfit to Covernat's naming/copy conventions?** This is a PORTABILITY VALIDATION pass, not a production-collection pass - no brand's data is treated as trend, ranking, or store-response evidence anywhere in this document.

**Methodology caveat carried forward**: the Covernat 0% -> 93.3% comparison across the two prior passes was never a controlled same-sample measurement (the exact 30 URLs could not be recovered; the sitemap grew between passes). Nothing here treats that as a controlled uplift - it is cited only as "the best real measurement available for that one brand," compared honestly against four newly, freshly measured independent brands.

## 0. Safety

```
pwd:              C:/Users/bcave/dev/open-design-trend-dashboard
branch:           feature/trend-dashboard
starting HEAD:    f43d432 (feat: expand product reference taxonomy coverage)
working tree:     clean except an unrelated, pre-existing apps/trend-dashboard/next-env.d.ts
                  auto-generated diff (not part of this pass's work; left unstaged)
```

No DB mutation, no Prisma migration, no Editorial/Market collection, no UI changes were made. No private APIs, login bypass, robots bypass, CAPTCHA/anti-bot bypass were used anywhere in this pass.

## 1. Candidate discovery (Section 3)

10 official brand domains were checked for `robots.txt` reachability, AI-crawler policy, product-URL discoverability, and structured-data quality before selecting 4:

| Company | Domain | Robots | Usage Notice | Structured Product Data | Active Products | Access Stability | Aesthetic | Decision |
|---|---|---|---|---|---|---|---|---|
| Musinsa | musinsa.com | 403 on plain fetch | n/a | n/a | n/a | Failed at first check | Multi-brand retailer | **Rejected** - retailer, not a brand, and inaccessible |
| this is never that | thisisneverthat.com | Permissive (`Allow: /`) | None found | Unknown - could not verify | Unknown | `/products` and `/sitemap_products_1.xml` both returned a ~2.3KB SPA shell, not server-rendered content | Street/casual | **Rejected** - client-side-rendered storefront; "usable text product metadata" could not be confirmed via plain HTTP fetch |
| mahagrid | mahagrid.com | Cafe24-template, permissive | None found | Cafe24 `Product` JSON-LD (same family as Covernat) | Unknown | `sitemap.xml` resolved to product URLs on a DIFFERENT domain (`keyth.co.kr`, an apparently unrelated cosmetics brand) while the homepage itself is genuinely mahagrid's own site | Street/casual | **Rejected** - sitemap misconfiguration is a real data-quality red flag, not a workable data source for this pass |
| ADD (에드) | add-seoul.com | Cafe24-template, permissive | None found | Cafe24 `Product` JSON-LD (unverified) | Sitemap has zero `/product/` URLs, only category pages dated 2019-2023 | Likely stale/low-turnover storefront | Street/casual | **Rejected** - no usable product-URL discovery path found |
| Kolon Sport | kolonsport.com | Named-agent-only `Allow` list (Googlebot/Bingbot/etc.), no generic `User-agent: *` rule | n/a | Unknown | Unknown | n/a | Sports/outdoor | **Rejected** - no explicit allowance for an unlisted crawler identity |
| ADER ERROR | adererror.com | Explicit: "AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot, etc.) are intentionally ALLOWED" | Explicit allow, no restriction | Not deeply verified this pass | Unknown | 200 OK on robots.txt | Designer/youth | **Not selected** - deprioritized once POST ARCHIVE FACTION's real Shopify `ProductGroup` JSON-LD was confirmed working for the same category slot; kept here as a strong alternate candidate for a future pass |
| KIRSH (키르시) | kirsh.co.kr | Cafe24-template, permissive | None found | Cafe24 `Product` JSON-LD, verified real (`name`, `description`, `offers`) | 1,641 product URLs (`sitemap0.xml.gz` + `sitemap1.xml.gz`) | Stable, same platform family as Covernat | Street/casual (graphic-forward, character-driven) | **Selected** |
| MMLG | mmlg.co.kr | Cafe24-template, permissive | None found | Cafe24 `Product` JSON-LD, verified real | 1,179 product URLs (`sitemap.xml`, flat) | Stable | Contemporary (minimal, English-branded) | **Selected** |
| The North Face Korea | thenorthfacekorea.co.kr | Explicit two-tier allow list: named search bots (Googlebot etc.) AND a dedicated "AI 크롤러 — AEO/GEO 대응" section explicitly listing `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, **`ClaudeBot`**, `Google-Extended`, `Applebot-Extended`, all `Allow: /` | Explicit allow | No JSON-LD Product found (client-side-injected via `document.createElement('script')`); real `og:type=product`, `og:title`, `og:description` meta tags confirmed | 3,431 product URLs (`sitemap/NF-sitemap-products.xml`) | Stable | Sports/outdoor-inspired | **Selected** |
| POST ARCHIVE FACTION (PAF) | postarchivefaction.com | Standard Shopify `robots.txt`, permissive | None found | Shopify `ProductGroup` JSON-LD, verified real (`name`, `description`, `category`, `hasVariant`) - Korean-locale text confirmed at the `/ko/` path (the default/global path serves English/JPY-priced copy) | 93 product URLs (`/ko/sitemap_products_1.xml`) | Stable | Designer/youth (avant-garde) | **Selected** |

This is 10 domains examined for 4 selected, satisfying the task's "audit 6-8 candidates" instruction with margin. None of the 4 selected brands is B:CAVE-operated; none shares ownership with Covernat, with each other, or (as far as public information indicates) with ADER ERROR.

## 2. Sample manifests (Section 1, Section 30)

Persisted at `docs/product-reference-samples/*.jsonl` (one JSON object per line: `brand`, `sourceDomain`, `canonicalUrl`, `productId`, `sampledAt`, `productName` - no description/body text, per the task's "no full copyrighted body dump" instruction). See `docs/product-reference-samples/README.md` for the full reproducibility record (extractor commit, sample timestamp, sampling formula, per-brand catalog sizes). All four URL sets were fixed before extraction and never changed during this pass.

**Sampling method**: deterministic, evenly-spaced across each brand's full current product-URL catalog: for catalog size `K`, position `i` (`i = 0..29`) is `round(1 + i * (K-1) / 29)`. No product was hand-picked for having an attribute-rich name.

## 3. Category composition (Section 7)

None of the four brands sell a single narrow category; actual composition (from the 30-sample item resolution, real counts, not fabricated for balance):

| Brand | Tops (tee/sweat/hoodie/knit/shirt/cardigan) | Bottoms (pants/shorts/skirt) | Outerwear (jacket) | Bags/Accessories | Other/Unresolved |
|---|---:|---:|---:|---:|---:|
| KIRSH | 10 | 9 | 0 | 1 (eco bag) + 1 (wallet, unresolved) | 9 |
| MMLG | 0 resolved (many English hoodie/sweat/tee names present but unresolved - see Section 8) | 1 resolved (WIDE_PANTS) | 0 | 1 unresolved (bag) | 28 |
| The North Face Korea | 3 | 5 | 5 | 3 (backpack/bucket hat/bag, 2 unresolved) | 14 |
| PAF | 4 | 0 resolved (trousers/jeans present, unresolved) | 5 | 2 (belt/organizer, unresolved) + 1 boots | 18 |

## 4. Baseline: current (f43d432, unmodified) extractor run first (Section 8)

Run BEFORE any taxonomy change, exactly as the task requires:

| Brand | Products | Item-bearing | Specific Item Rate | Attribute-bearing | Direct Attribute Rate | Relations | Distinct Pairs | Relations/Product |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| KIRSH | 30 | 21 | 70.0% | 13 | 43.3% | 33 | 30 | 1.10 |
| MMLG | 30 | 1 | 3.3% | 1 | 3.3% | 1 | 1 | 0.03 |
| The North Face Korea | 30 | 14 | 46.7% | 6 | 20.0% | 6 | 4 | 0.20 |
| PAF | 30 | 9 | 30.0% | 6 | 20.0% | 12 | 9 | 0.40 |
| **Combined** | **120** | **45** | **37.5%** | **26** | **21.7%** | **52** | - | **0.43** |

Baseline dimension coverage (real, before any Round 2 change):

| Dimension | KIRSH | MMLG | TNF Korea | PAF |
|---|---:|---:|---:|---:|
| SILHOUETTE | 1 rel / 1 val | 0 | 0 | 6 rel / 2 val |
| DETAIL | 9 rel / 5 val | 1 rel / 1 val | 0 | 4 rel / 2 val |
| MATERIAL | 8 rel / 4 val | 0 | 0 | 2 rel / 2 val |
| FINISH | 0 | 0 | 0 | 0 |
| COLOR | 15 rel / 7 val | 0 | 6 rel / 2 val | 0 |
| STYLE | 0 | 0 | 0 | 0 |

## 5. Manual precision audit - baseline, every one of the 52 relations (Section 11)

| Brand | VALID | QUESTIONABLE | FALSE POSITIVE | Total | Strict Precision | Conservative Precision |
|---|---:|---:|---:|---:|---:|---:|
| KIRSH | 16 | 8 | 9 | 33 | 64.0% | 48.5% |
| MMLG | 1 | 0 | 0 | 1 | 100% | 100% |
| The North Face Korea | 6 | 0 | 0 | 6 | 100% | 100% |
| PAF | 12 | 0 | 0 | 12 | 100% | 100% |
| **Combined** | **35** | **8** | **9** | **52** | **79.5%** | **67.3%** |

**This fails the >=90% conservative precision target - investigated immediately (Section 11's own instruction), root cause found, and fixed (Section 6 below).**

### Root cause: KIRSH's "available colors" list

9 of 9 false positives and all 8 questionables trace to ONE mechanism, not to any specific vocabulary value. KIRSH restates a shared "이 디자인이 나온 컬러들" (colors this design comes in) list inside the `[원단]`-equivalent section of its description - verbatim on EVERY color-variant's own page. Example, real evidence:

```
Product page NAME: "컬렉션 벨트 포인트 투턱 팬츠 [블랙]"   (this SKU is BLACK)
Product page DESCRIPTION (same page): "...컬러 : 베이지, 블랙[사이즈]..."
```

The (pre-fix) `descriptionRelations()` function scanned the whole description unconditionally for COLOR, per the "structured product object" license established for Covernat - and matched BOTH "베이지" (BEIGE, a sibling variant's color, wrong for this exact page) and "블랙" (BLACK, correct only by coincidence of list order). Every KIRSH product whose description named 2-3 sibling colors produced exactly this pattern: one coincidentally-correct QUESTIONABLE hit and 1-3 genuine FALSE POSITIVEs.

This is a genuine, generalizable finding about the EXTRACTION MECHANISM, not about Covernat's or KIRSH's specific vocabulary: **a "colors available" list describes the whole design family, not the one page it renders on** - unlike a `[디자인]` bullet (which, in Covernat, KIRSH, and PAF alike, genuinely does describe the exact SKU throughout).

## 6. Fix: COLOR removed from description-wide scanning (Section 20)

Per Section 20's explicit instruction to identify and recommend refinement of any mechanism found to be "overbroad, ambiguous, poorly transferable" rather than keeping it merely because it helped the original Covernat score: `descriptionRelations()` in `src/collectors/product-reference/object-relations.ts` no longer includes COLOR in its scanned dimension set. COLOR is now captured ONLY via the existing NAME-anchored bidirectional check (`nameColorRelations`), which requires the color to sit immediately adjacent (whitespace-only gap) to the item it's naming - a claim about THIS exact page, not a shared list.

**Verified cost/benefit, not assumed**: every one of Covernat's 26 real COLOR relations already came from the NAME-anchored check, none from `descriptionRelations` - so this fix costs Covernat's own measured result nothing. It eliminates all 9 KIRSH false positives and (necessarily, since the mechanism is now gone entirely) all 8 KIRSH color-list questionables, at the cost of losing a small number of relations that happened to be correct-by-coincidence.

This is a mechanism fix, not a taxonomy addition, and is not counted against the Round 2 vocabulary-addition budget below.

## 7. Round 2: minimal taxonomy additions (Section 21) - 2 canonical additions, well under the 10-item cap

Only after the baseline was frozen and the mechanism bug fixed was any new vocabulary considered, and only vocabulary meeting the multi-brand bar (Section 19: `>= 2 independent brands`, OR an extremely standard generic term with unambiguous semantics and multiple occurrences):

| Canonical | Dimension | Surface Forms | Brand Count | Product Count | Example | Reason |
|---|---|---|---:|---:|---|---|
| SKIRT | SUB_ITEM | 스커트 | 2 (KIRSH, The North Face Korea) | 3 | KIRSH: "텍스처 패턴 니트 롱 스커트"; TNF: "걸즈 서프 레깅스 스커트" | Clean 2-brand cross-confirmation; unambiguous generic garment noun; not previously tracked anywhere in this project's taxonomy |
| GRAY | COLOR | 그레이, gray, grey | 2 (KIRSH, The North Face Korea) | 4 | KIRSH: "멜란지 그레이"; TNF: "GRAY", "MELANGE_GREY", "CHARCOAL_GREY" | Base color, closed/low-ambiguity vocabulary (same asymmetry argued throughout this project); real textual evidence from 2 independent brands, even though (disclosed honestly below) neither motivating example itself produces a captured relation |

**A note on discipline, not an addition**: `MATERIAL:CORDUROY` fired for real on PAF's own description ("내구성이 돋보이는 코듀로이 넥 비조 단추 여밈") during this pass's baseline run - BEFORE any taxonomy code was touched. Investigation found `CORDUROY` already exists as an `editorialRules` MATERIAL value from an earlier, unrelated pass (`src/collectors/editorial/mentions.ts:79`), reachable by `object-relations.ts`'s existing read-only merge of `editorialRules` from day one. **This is a real, valuable cross-brand generalization finding for an EXISTING value - not a new Round 2 addition.** (An earlier draft of this pass mistakenly re-added it as a duplicate rule in `taxonomy.ts`; caught and reverted before commit - the final code has exactly one CORDUROY rule, in `editorialRules`, unchanged.)

### Parser Grammar Misses disclosed alongside the additions (not fixed this pass)

- **GRAY's own motivating examples don't fire.** KIRSH wraps its suffix color in brackets (`"[멜란지 그레이]"`), and TNF's compound forms put another word directly before "그레이"/"GREY" (`"MELANGE_GREY"`, `"CHARCOAL_GREY"`) - both correctly rejected by the existing whitespace-only-gap adjacency check. GRAY *does* fire on a real, clean The North Face Korea naming pattern with the color standing alone as a suffix (verified in this pass's test fixtures), just not on the two specific strings that motivated adding it. This is the identical class of miss as NAVY's own motivating example in the Covernat pass - real vocabulary, blocked by adjacency grammar, disclosed rather than hidden.
- **KIRSH's bracket-wrapped color convention (`아이템 [컬러]`) is never captured**, for the same reason. A real, verified miss: KIRSH product #28 ("스몰 체리 컬러믹스 래글런 크롭 티셔츠 [네이비]") should yield `T_SHIRT + COLOR:NAVY` but does not, because the bracket breaks the required whitespace-only gap. **Not fixed this pass** (see Section 15/Section 20 recommendation below) - fixing it means loosening `attributes.ts`'s and `object-relations.ts`'s shared COLOR-adjacency design, a file this pass deliberately did not otherwise touch to avoid regression risk on an already-tested module, and the fix needs its own precision analysis (a bare `[` is a much lower-risk gap-filler than free text, but that should be verified with its own test fixtures before landing, not folded into this already-large pass).
- **MMLG's parenthesis-wrapped color convention (`ITEM (COLOR)`) has the identical grammar problem**, compounding with the item-resolution failure below - even if MMLG's items resolved, its colors would not be captured today.

## 8. After Round 2: re-run all 120 products (Section 22)

| Brand | Products | Item-bearing | Specific Item Rate | Attribute-bearing | Direct Attribute Rate | Relations | Distinct Pairs | Relations/Product |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| KIRSH | 30 | 21 | 70.0% | 10 | 33.3% | 17 | 16 | 0.57 |
| MMLG | 30 | 1 | 3.3% | 1 | 3.3% | 1 | 1 | 0.03 |
| The North Face Korea | 30 | 15 | 50.0% | 7 | 23.3% | 7 | 5 | 0.23 |
| PAF | 30 | 9 | 30.0% | 6 | 20.0% | 12 | 9 | 0.40 |
| **Combined** | **120** | **46** | **38.3%** | **24** | **20.0%** | **37** | - | **0.31** |

Dimension coverage after Round 2 (real):

| Dimension | KIRSH | MMLG | TNF Korea | PAF |
|---|---:|---:|---:|---:|
| SILHOUETTE | 1 rel / 1 val | 0 | 0 | 6 rel / 2 val |
| DETAIL | 9 rel / 5 val | 1 rel / 1 val | 0 | 4 rel / 2 val |
| MATERIAL | 7 rel / 4 val | 0 | 0 | 2 rel / 2 val |
| FINISH | 0 | 0 | 0 | 0 |
| COLOR | 0 | 0 | 6 rel / 2 val | 0 |
| STYLE | 0 | 0 | 1 rel / 1 val | 0 |

KIRSH's COLOR relations dropping to 0 is the intended, verified effect of Section 6's fix (KIRSH's real, clean color usage is entirely bracket-wrapped, so removing the unsound description-list mechanism removes ALL of its COLOR relations, not just the bad ones - an accepted precision-over-recall trade, consistent with this project's stated philosophy throughout).

**One real, interesting side effect of adding SKIRT**: KIRSH product #21 ("텍스처 패턴 니트 롱 스커트") previously resolved (silently, and arguably wrongly) to item `KNIT`, because "니트" was the only tracked noun present. After adding SKIRT, BOTH "니트" and "스커트" now match, and the item-resolution guard correctly reports `AMBIGUOUS` rather than picking one. This is a **net honesty improvement** (a silent likely-misclassification became a transparent "don't know"), not a regression, but it does surface a real architecture limitation worth flagging for a future pass: Korean is head-final, so when multiple item-shaped tokens appear in one name, the LAST one is usually the true head noun ("텍스처 패턴 니트 롱 스커트" = a skirt, made of knit fabric - not a "knit"), and a future refinement could prefer the rightmost match instead of declaring ambiguity, provided it can still distinguish this case from a genuine `[SET]` two-item enumeration. **Not implemented this pass** - recommended as a Round 3 candidate.

## 9. Manual precision audit - after Round 2, all 37 relations (Section 11)

| Brand | VALID | QUESTIONABLE | FALSE POSITIVE | Total | Strict Precision | Conservative Precision |
|---|---:|---:|---:|---:|---:|---:|
| KIRSH | 14 | 3 | 0 | 17 | 100% | 82.4% |
| MMLG | 1 | 0 | 0 | 1 | 100% | 100% |
| The North Face Korea | 7 | 0 | 0 | 7 | 100% | 100% |
| PAF | 12 | 0 | 0 | 12 | 100% | 100% |
| **Combined** | **34** | **3** | **0** | **37** | **100%** | **91.9%** |

**Clears both the >= 90% requirement and comes close to the preferred >= 95%.** The 3 remaining KIRSH QUESTIONABLE relations (none FALSE POSITIVE): a stylized product-line name ("치크체크") that plausibly but not certainly refers to a literal check pattern; and two minor-blend-percentage MATERIAL calls (`니트`-item + `MATERIAL:KNIT` tautology, same class of issue already disclosed for Covernat's own KNIT item; `MATERIAL:WOOL` at a 6% blend component) - both already-disclosed classes of limitation from the Covernat pass, now confirmed to recur on an independent brand rather than being Covernat-specific artifacts.

## 10. Evidence-field distribution (Section 13)

| Brand | PRODUCT_NAME | DESCRIPTION | VARIANT | OTHER_STRUCTURED_FIELD |
|---|---:|---:|---:|---:|
| KIRSH | 4 | 13 | 0 (not read) | 0 (not read) |
| MMLG | 1 | 0 | 0 (not read) | 0 (not read) |
| The North Face Korea | 6 | 1 | 0 (not read) | 0 (not read) |
| PAF | 1 | 11 | 0 (not read) | 0 (not read) |
| **Combined** | **12** | **25** | **0** | **0** |

VARIANT and OTHER_STRUCTURED_FIELD are both 0 because `extractProductObjectRelations` only ever reads `name` and `description` - it does not read Shopify `hasVariant[].name`/`sku`, Cafe24 `offers[].name`, or PAF's own color-in-URL-slug convention. **PAF's real color data lives entirely in the URL slug** (e.g. `souvenir-tee-1-white`) and in `hasVariant`, never in the scanned `name`/`description` text - a genuine `OTHER_STRUCTURED_FIELD` case this pass's extractor cannot see at all. This is disclosed as a real, current blind spot, not fixed this pass (reading variant/URL-slug color would be a meaningfully larger scope change, and PAF's own `name`/`description` already proved rich enough in DETAIL/MATERIAL/SILHOUETTE to be a genuinely valuable brand for this pass without it).

## 11. Cross-field (name + description) relations outside Covernat (Section 14)

Confirmed working exactly as designed, on two independent brands:

```
KIRSH, real:
name:        "우먼 울 블렌드 크롭 가디건 헤더 그레이" (analogous Covernat-style fixture used in tests;
              the equivalent real KIRSH case is #19's own gap-filled fields)
description: "...소프트한 터치감의 울 블랜딩 원사사용으로..."
-> CARDIGAN + MATERIAL:WOOL (description-only, item from name)

PAF, real (product f26-a-jacket-ivory, "A 자켓"):
name:        "A 자켓"
description: "...내구성이 돋보이는 코듀로이... A® 프론트 지퍼 크롭 핏"
-> JACKET + MATERIAL:CORDUROY, JACKET + SILHOUETTE:CROP_FIT (both description-only, item from name)
```

Both were manually audited (Section 9 above) and classified VALID - the cross-field linkage mechanism itself (item identity from `name`, attributes from `description`, licensed by the same-JSON-LD-object reasoning) generalizes cleanly. The one place it broke down (KIRSH's shared color list) was fixed in Section 6, not by weakening the cross-field license itself, but by excluding one specific dimension (COLOR) that turned out to violate the "describes this exact SKU" assumption the license depends on.

## 12. COLOR suffix portability (Section 15)

Five real, independently observed conventions across five brands (Covernat + the four here):

| Brand | Convention | Example | Currently captured? |
|---|---|---|---|
| Covernat | `ITEM COLOR` (bare trailing word) | "백팩 블랙" | Yes |
| KIRSH | `ITEM [COLOR]` (bracket-wrapped) | "티셔츠 [화이트]" | **No** - bracket breaks the whitespace-only-gap check |
| The North Face Korea | `ITEM COLOR CODE` (bare word, then a separate SKU code after) | "자켓 BLACK NJ3LS33A" | Yes - the gap check only cares about what precedes the color match, not what follows |
| MMLG | `ITEM (COLOR)` (parenthesis-wrapped) | "HOODIE (EVERY BLACK)" | **No** - same class of issue as KIRSH, compounded by item-resolution also failing |
| PAF | Color lives in the URL slug / `hasVariant`, never in `name` or `description` text | `souvenir-tee-1-white` | **No** - not a text-adjacency problem, a "wrong field" problem (Section 10 above) |

**Covernat's bare-trailing-word convention is the exception among these five brands, not the rule.** 2 of 5 (KIRSH, MMLG) use punctuation-wrapped suffix color, which the current adjacency check does not tolerate. This is the single most actionable, well-scoped Round 3 recommendation from this pass: extend the whitespace-only-gap check to also tolerate exactly one matching bracket/parenthesis pair with no other content inside the gap (e.g. `" ["`/`"] "` or `" ("`/`") "`), which would likely recover real relations on both KIRSH and MMLG without materially loosening precision (a single bracket character is a very different, much lower-risk gap-filler than arbitrary text). **Not implemented this pass** - it touches the already-tested COLOR-adjacency logic shared by `attributes.ts` and `object-relations.ts`, and deserves its own dedicated precision verification pass rather than being folded into an already-large multi-brand validation pass.

## 13. Item portability (Section 17)

| Item | Brands (this pass + Covernat) | Brand Count |
|---|---|---:|
| HOODIE | Covernat, KIRSH, The North Face Korea, PAF | **4** |
| PANTS | Covernat, KIRSH, The North Face Korea | 3 |
| T_SHIRT | Covernat, KIRSH, The North Face Korea | 3 |
| SHIRT | Covernat, KIRSH, PAF | 3 |
| JACKET | Covernat, The North Face Korea, PAF | 3 |
| SKIRT (new) | KIRSH, The North Face Korea | 2 |
| KNIT | Covernat, KIRSH | 2 |
| CARDIGAN | Covernat, KIRSH | 2 |
| SHORTS | Covernat, The North Face Korea | 2 |
| BOOTS | Covernat, PAF | 2 |
| ECO_BAG | Covernat, KIRSH | 2 |
| TRACK_JACKET (existing, pre-Covernat) | PAF only (this pass) | 1 |
| BACKPACK / BUCKET_HAT / KNIT_BEANIE (existing, pre-Covernat) | 1 brand each (TNF/TNF/KIRSH) this pass | 1 each |
| WIDE_PANTS (existing, pre-Covernat) | MMLG only (this pass) | 1 |
| CANVAS_BAG / ZIP_HOODIE / PUFFER / BLOUSE (Covernat-added) | Covernat only so far | 1 each |

**HOODIE, PANTS, T_SHIRT, SHIRT, and JACKET are the genuinely general-purpose core of this taxonomy** - each independently confirmed across 3-4 unrelated brands. The Covernat-only additions that have NOT yet been re-confirmed elsewhere (CANVAS_BAG, ZIP_HOODIE, PUFFER, BLOUSE) remain plausible but unproven outside Covernat - a legitimate open question for a future pass, not evidence they are wrong.

## 14. Item-resolution bottleneck (Section 10) - the real headline finding

| Brand | Item Rate | Unknown-Item Products | Known-Item + No-Attribute-Text | Known-Item + Attribute Found |
|---|---:|---:|---:|---:|
| KIRSH | 70.0% (21/30) | 9 | 11 | 10 |
| MMLG | 3.3% (1/30) | 29 | 0 | 1 |
| The North Face Korea | 50.0% (15/30) | 15 | 8 | 7 |
| PAF | 30.0% (9/30) | 21 | 3 | 6 |
| Combined | 38.3% (46/120) | 74 | 22 | 24 |

**Item resolution, not attribute vocabulary, is the dominant bottleneck.** Once an item resolves, it is quite likely to also carry a real attribute (KIRSH 10/21 = 47.6%, TNF 7/15 = 46.7%, PAF 6/9 = 66.7%, MMLG 1/1 = 100%) - roughly comparable to Covernat's own 28/28 = 100% (every resolved Covernat item had an attribute). The gap between Covernat's 93.3% specific-item rate and this pass's combined 38.3% is overwhelmingly an ITEM-recognition gap, not a DIMENSION/attribute gap. Three distinct root causes, by brand:

- **MMLG (3.3%)**: 100% English product naming (`"[Mmlg] SLOGAN HOODIE (EVERY BLACK)"`). This taxonomy's item patterns are Korean-surface-form only (`SUB_ITEM: HOODIE` matches `"후디"`, never `"hoodie"`/`"HOODIE"`) - a genuine, disclosed language-scope limitation, not a vocabulary gap fixable by adding a handful of canonical values. Retrofitting bilingual aliases onto every existing Korean-only SUB_ITEM pattern would be a much larger change than this pass's Round 2 budget (max 10 canonical additions) and was deliberately NOT attempted here.
- **The North Face Korea (50.0%)**: item nouns ARE mostly Korean and DO resolve well (자켓/팬츠/쇼츠/백팩/후디/버킷햇 all matched real products) - the gap here is thinner attribute TEXT (no JSON-LD description; only a short `og:description` restating the product name and category, not a `[디자인]`-style feature list), not item recognition per se.
- **PAF (30.0%)**: minimalist, almost art-piece-style product NAMES (`"티"`, `"셔츠"`, `"진"`, `"트라우저"`) that often use a synonym this taxonomy doesn't track (`"진"` for jeans, `"트라우저"` for trousers) or are simply too bare to carry a head noun at all (`"커브드 슬라이드"`, `"클라우드소마 PAF"`). When the name DOES carry a recognized noun, the description is consistently rich (Section 11 above).

## 15. Taxonomy gap audit after baseline (Section 18) - full missed-vocabulary table

| Surface Form | Proposed Canonical | Brand Count | Product Count | Example | Reason (added / candidate / rejected) |
|---|---|---:|---:|---|---|
| 스커트 | SKIRT (SUB_ITEM) | 2 (KIRSH, TNF) | 3 | "레깅스 스커트" | **Added** (Section 7) |
| 그레이/gray/grey | GRAY (COLOR) | 2 (KIRSH, TNF) | 4 | "GRAY", "MELANGE_GREY" | **Added** (Section 7) |
| 코듀로이 | CORDUROY (MATERIAL) | 1 this batch (PAF) + Covernat's original pre-resample audit | 1 this batch | "코듀로이 넥 비조" | **Already existing** in `editorialRules` from an earlier pass - not a new addition; real cross-brand confirmation only |
| 진 | JEANS or fold into PANTS/DENIM | 1 (PAF) | 1 | "진" (product name, bare) | Candidate only - 1 brand, 1 occurrence |
| 트라우저 | TROUSERS or fold into PANTS | 1 (PAF) | 1 | "트라우저" | Candidate only - 1 brand, 1 occurrence |
| 벨트 | BELT (SUB_ITEM) | 1 (PAF) | 2 | "버클 벨트", "스트림 벨트" | Candidate only - 1 brand (2 occurrences, but same brand) |
| 백 (generic bag) | BAG (SUB_ITEM) | 1 (TNF) | 2 | "티엔에프 트리그 백" | Candidate only - single-syllable-adjacent risk noted; 1 brand |
| 캡 (generic, bare) | CAP (SUB_ITEM) | 1 (PAF) | 1 | "워크 캡" | Candidate only - 1 brand, 1 occurrence |
| 지갑 | WALLET (SUB_ITEM) | 1 (KIRSH) | 1 | "포켓 시그니처 PU 지갑" | Candidate only - 1 brand, 1 occurrence |
| 슬리퍼 | SLIPPERS (SUB_ITEM) | 1 (KIRSH) | 1 | "키르시 멜로우 룸 슬리퍼" | Candidate only - 1 brand, 1 occurrence |
| 베스트 | VEST (SUB_ITEM) | 1 this batch (KIRSH) + 1 in Covernat's original pre-resample audit | 1 this batch | "우븐 베스트 집업" | Candidate only within this batch; cross-pass corroboration noted but not acted on (kept the bar consistent: this pass only converts CURRENT-BATCH >=2-brand evidence into additions) |
| 하프집업 | HALF_ZIP (DETAIL) | 1 (KIRSH) | 1 | "C로고 하프집업 맨투맨" (Covernat, prior pass) + KIRSH context | Candidate only |
| 시어서커 | SEERSUCKER (MATERIAL) | 1 (PAF) | 1 | "시어서커 체크 패턴" | Candidate only |
| 깅엄 | GINGHAM (DETAIL/pattern) | 1 (PAF) | 1 | "깅엄 체크 면 소재" | Candidate only |
| 리브드/골조직 | RIBBED (DETAIL) | 1 this batch (Covernat's own prior pass, "골조직") | - | - | Candidate only, no new evidence this batch |
| 퍼 (fur) | FUR (MATERIAL) | 1 (KIRSH: "프릴 퍼 부츠", cross-referenced against Covernat's "프릴 퍼 부츠" too - same style existing in both catalogs, likely a licensed/shared design) | 1-2 | "프릴 퍼 부츠" | **Rejected** - single Korean syllable, real substring-collision risk with unrelated words (e.g. "퍼플"/purple, "퍼포먼스"/performance); same caution class as the previously-rejected 헤어리/멜란지/글리터 |

## 16. Covernat taxonomy stress test (Section 20) - full disclosure

- **Overbroad mechanism found and fixed**: unconditional description-wide COLOR scanning (Section 6). This was the single largest, most consequential finding of this pass.
- **No existing canonical VALUE was found to be wrong, only under-specified in one place**: the KNIT-item / MATERIAL:KNIT tautology (a `KNIT` garment will always also trigger `MATERIAL:KNIT` from its own description, since both use the identical Korean word) recurred on KIRSH exactly as disclosed for Covernat - confirmed as a real, generalizable (not Covernat-specific) design quirk, still not fixed (low severity: it's a true, if circular, fact, not a fabrication).
- **The whitespace-only-gap COLOR adjacency check** (shared by `attributes.ts` and `object-relations.ts`) is not "wrong," but is now shown to be **narrower than Korean fashion e-commerce actually needs**: 2 of 5 examined brands wrap their suffix color in punctuation it does not tolerate (Section 12). Recommended for Round 3, not fixed this pass.
- **No Covernat-specific canonical item or attribute VALUE was found to be actively harmful on other brands.** Every Covernat-derived SILHOUETTE value (CROP_FIT, REGULAR_FIT) and every Covernat-derived generic item (HOODIE, PANTS, T_SHIRT, SHIRT, JACKET, KNIT, CARDIGAN, SHORTS, BOOTS, ECO_BAG) that appeared in another brand's real text produced VALID relations there, with the sole caveat of the already-disclosed KNIT tautology. This is a positive, real finding: the VOCABULARY layer built from Covernat generalizes well; the ADJACENCY GRAMMAR (bracket/parenthesis handling) and DESCRIPTION-SCAN SCOPE (the COLOR-list bug) were the actual weak points, both now understood and one of the two fixed.

## 17. Brand-bias test (Section 23)

```
Covernat (prior pass, real, measured):     93.3% attribute-bearing
KIRSH:                                     33.3%
MMLG:                                       3.3%
The North Face Korea:                      23.3%
PAF:                                       20.0%
Independent-brand range:                    3.3% - 33.3% (average 20.0%)
```

**Conclusion: closest to scenario B ("other brands ~30-60% -> useful but Covernat was unusually descriptive"), with one brand (MMLG) falling into scenario C territory for a distinct, disclosed reason (an all-English catalog, outside this taxonomy's current language scope) rather than because the extraction mechanism itself is unsound.** Covernat's 93.3% is real but is the outcome of an unusually rich, extremely consistent, per-exact-SKU `[디자인]`-bullet-plus-fabric-table description convention that only PAF (among the four brands tested here) approaches in richness, and only when its terse product names happen to resolve at all. The underlying MECHANISM (item resolution -> name-direct-phrase -> name-color-adjacency -> description-object scan, each independently deduplicated) is validated as sound and portable (91.9% conservative precision across 4 independent brands, 0 false positives after the one mechanism fix); the bottleneck is COVERAGE (item-noun vocabulary breadth, language scope, and per-brand page-copy richness), not CORRECTNESS.

## 18. Production success gate (Section 24) - evaluated honestly, not weakened

| Gate | Threshold | Combined Result | Pass? |
|---|---|---|:---:|
| A. Direct Attribute Product Rate | >= 40% | 20.0% | **NO** |
| B. Conservative Precision | >= 90% | 91.9% | YES |
| C. Useful attribute dimensions | >= 3 | 5 (DETAIL, COLOR, SILHOUETTE, MATERIAL, STYLE all real) | YES |
| D. Not dominated by one brand | - | Relations share: KIRSH 45.9%, PAF 32.4%, TNF 18.9%, MMLG 2.7% (products share: 41.7%/25.0%/29.2%/4.2%) - no brand > 50% | YES |
| E. Structured product-object confidence | generally HIGH/MEDIUM | KIRSH HIGH, MMLG HIGH (structure, not content), PAF HIGH, TNF Korea MEDIUM (no JSON-LD, but consistent `og:type=product` + title/description linkage) | YES |

**Overall: NO-GO for immediate production architecture**, failing specifically and only on Gate A. Per the task's explicit instruction not to weaken thresholds to proceed, this is reported as a clean NO-GO rather than a qualified yes - but a SPECIFIC, actionable one: the blocker is item-noun vocabulary coverage and (for one brand) language scope, not extraction soundness, precision, dimension diversity, or brand concentration.

## 19. Cross-brand attribute distribution (Section 25) - reference examples only, not trend claims

```
HOODIE
Brands represented: 4 (Covernat, KIRSH, The North Face Korea, PAF)
Observed product attributes across all instances: COLOR:DUSTY_BLUE, DETAIL:EMBROIDERY,
  SILHOUETTE:REGULAR_FIT, MATERIAL:FLEECE
-> PRODUCT REFERENCE DISTRIBUTION. Not a sales, ranking, or trend claim - it only
   states that these attribute values were each observed on at least one real,
   independently-sourced HOODIE product page.

PANTS
Brands represented: 3 (Covernat, KIRSH, The North Face Korea)
Observed product attributes: COLOR:BLACK, COLOR:KHAKI, COLOR:DARK_GRAY, MATERIAL:NYLON,
  MATERIAL:DENIM, DETAIL:CHECK, DETAIL:WASHED, DETAIL:BIG_POCKET, DETAIL:EMBROIDERY,
  SILHOUETTE:REGULAR_FIT, SILHOUETTE:SEMI_WIDE
-> Same PRODUCT REFERENCE DISTRIBUTION caveat as above.
```

## 20. Legitimate future metrics (Section 26)

Based on what this pass actually measured (not aspirational):

- **Brand Presence** (how many independently-sourced brands carry a given item or attribute value) - directly supported by this pass's own Section 13/17 tables; the single most defensible metric for distinguishing "generalizable vocabulary" from "one brand's marketing language."
- **Item x Attribute Brand Spread** (e.g. "HOODIE + REGULAR_FIT: 2 brands") - a natural extension of Brand Presence, and the right level of granularity for a future "reference distribution" view; must always report the brand count alongside any value, never a bare product/relation count.
- **Attribute Product Share within a resolved item** (e.g. "of all resolved PANTS across all brands, N% carry a COLOR relation") - legitimate as a QUALITY metric for the extractor itself (how often does a recognized item also carry evidence), not as a market-share claim.
- **NOT legitimate yet, given current data**: any Brand-level "assortment share" or "which brand leads in X" framing - with only 4 independent brands and 30 products each, and Covernat added as a 5th non-independent B:CAVE source, any per-brand ranking would vastly overstate the statistical basis. Not recommended until a materially larger, more brands, and (per Section 24) a passing Gate A.

## 21. MarketProduct schema decision (Section 27)

**Recommendation: C - a separate `ProductReference` model, not reuse of `MarketProduct`.**

This reverses the prior pass's tentative "reuse `MarketProduct` + explicit evidenceRole discriminator" lean, based on a concrete, verified risk found in the ACTUAL codebase this pass, not a hypothetical one:

```
src/services/business-analytics-service.ts:39:  const products = await prisma.marketProduct.findMany({
src/services/business-analytics-service.ts:470: const products = await prisma.marketProduct.findMany({ where: { dataMode }, include: { rankingSnapshots: ... } });
```

Both of these real, currently-shipping queries filter `MarketProduct` only by `dataMode` (`"real"`/`"sample"`), never by anything resembling a source-role discriminator. Retrofitting an `evidenceRole` field onto `MarketProduct` (Option A) or a separate source-metadata mechanism alongside it (Option B) would require finding and updating every existing consumer like these two - a real, nontrivial, easy-to-miss migration risk on a shared table already serving production ranking/business-analytics views, for a feature (Product Reference) that this pass's own Gate A result says is not yet ready for production collection anyway.

A separate `ProductReference` model additionally fits the ACTUAL shape differences this pass surfaced better than a shared table would: Covernat/KIRSH/MMLG provide a real Cafe24 `Product` JSON-LD shape; PAF provides a Shopify `ProductGroup` shape with `hasVariant`; The North Face Korea provides neither, only `og:*` meta tags. A dedicated model can carry a `sourceStructureType` field (`"JSONLD_PRODUCT" | "JSONLD_PRODUCT_GROUP" | "OG_META" | ...`) and treat "no JSON-LD" as a first-class, expected case, rather than forcing every source through `MarketProduct`'s ranking-shaped columns (`rank`, price-trend fields, etc.) that have no meaning for a reference catalog entry. `MarketRankingSnapshot` remains completely untouched either way, per the project's standing invariant.

**No schema change was implemented this pass** - this is a recommendation only, consistent with the task's explicit instruction.

## 22. Source/brand identity (Section 28)

For any future implementation: `brand` (e.g. `"KIRSH"`), `sourceDomain` (e.g. `"kirsh.co.kr"`), and `canonicalUrl` must all be stored per product, exactly as done in this pass's manifests (`docs/product-reference-samples/*.jsonl`). A retailer (e.g. Musinsa, rejected in Section 1 partly for being one) must never be recorded as a `brand` - only the actual manufacturer/label. A color/size variant (e.g. PAF's `souvenir-tee-1-white` vs `souvenir-tee-1-black`) must never be treated as an independent brand or an independent product identity beyond its own SKU - both are the same design, same brand, different `productId`.

## 23. Image semantics (Section 29)

| Brand | name/description/image tied together? | Rating |
|---|---|---|
| KIRSH | Yes - same Cafe24 `Product` JSON-LD object as Covernat | HIGH |
| MMLG | Yes - same Cafe24 `Product` JSON-LD object | HIGH (structural; content yield is separately low, see Section 14) |
| PAF | Yes - Shopify `ProductGroup.hasVariant[].image` tied to `mpn`/`sku`/`name` per variant | HIGH |
| The North Face Korea | Partial - `og:image` is tied to the page's `og:title`/`og:description`, but there is no JSON-LD object formally binding all three; a real, if weaker, structural link (all three meta tags describe the same page) | MEDIUM |

No pixel/visual attribute inference was performed anywhere in this pass, consistent with the explicit prohibition.

## 24. Reproducibility confirmation (Section 30)

- All 4 selected brands have a persisted 30-URL manifest at `docs/product-reference-samples/*.jsonl`.
- Extractor version, sample timestamp, and sampling method are recorded in `docs/product-reference-samples/README.md`.
- The one-off fetch/measurement script used to produce the numbers in this document was deleted after use, per this project's established convention (only the reusable extraction code, taxonomy, and test fixtures are kept).

## Data safety confirmed

- EditorialPost: 283 (unchanged, reconfirmed via `audit-editorial-quality.ts` before AND after this pass's code changes)
- EditorialMention: 916 (unchanged)
- Editorial Direct Relations: 15 (unchanged)
- Editorial Bundles: 8 (unchanged)
- MarketRankingSnapshot: 667 (unchanged)
- Canonical duplicates: 0, Mention duplicates: 0
- No DB writes of any kind were made; no Prisma schema changes were made; no Editorial or Market collection was run

## Validation

- `pnpm --filter @open-design/trend-dashboard typecheck`: PASS
- `pnpm --filter @open-design/trend-dashboard test`: PASS (all existing Editorial and prior Product Reference fixtures, plus new `verifyMultiBrandPortability` fixtures using real KIRSH and PAF text - covering SKIRT ambiguity/resolution, GRAY matching a clean suffix while coexisting with HEATHER_GRAY, the KIRSH color-list false-positive regression guard, DETAIL/MATERIAL/SILHOUETTE continuing to work after the COLOR-scan fix, and the Editorial enumeration-guard regression)
- `pnpm --filter @open-design/trend-dashboard build`: PASS (no route/UI changes)
- No production DB read/write path was touched by any new code - all extraction is pure functions over fetched text, invoked only from this pass's now-deleted probe/measurement script

## Next step (exactly one recommendation)

**Do not proceed to production Product Reference collection yet (Gate A fails).** The single highest-leverage next action is a small, dedicated, standalone precision pass that extends the COLOR-adjacency check (shared by `attributes.ts` and `object-relations.ts`) to tolerate exactly one matching bracket or parenthesis pair with no other content in the gap - the single change most likely to meaningfully close the item-resolution/attribute-rate gap on real brands, since it directly addresses a grammar convention confirmed on 2 of the 5 brands examined so far (KIRSH, MMLG), without touching item vocabulary at all. That pass should re-measure Gate A specifically (Direct Attribute Product Rate), since Gates B-E already pass comfortably.

**Addendum (2026-09-08, later same day): this recommendation was acted on as a dedicated gate test.** See "Color Adjacency Gate Test" below for the controlled before/after result on the exact same 120 persisted products - the fix was real, safe, and precision-positive, but did not clear the production gate on its own, and per that section's own decision rule, no further grammar patch is recommended.

---

## Color Adjacency Gate Test (2026-09-08)

**Question**: does a narrowly-scoped fix for `ITEM [COLOR]` / `ITEM (COLOR)` syntax materially improve multi-brand Product Reference coverage without reducing precision? This is a GATE TEST, not a new taxonomy expansion pass - no new items/colors/silhouettes/materials/details/styles were added in this section, and description-wide COLOR scanning remains disabled exactly as the prior pass fixed it.

### Known misses (Section 2) - identified from the exact persisted 120 products before any code change

Every `[COLOR]`/`(COLOR)` case where the bracketed/parenthesized content matched an already-registered COLOR value was enumerated across all 120 products (script-verified, not spot-checked). Two clusters, both real:

**Bracket cases - KIRSH, 24 of 30 products** (every KIRSH product samples uses `[COLOR]`). Of these, 16 had the item already resolved and were pure adjacency misses (the rest were `item=NONE`/`AMBIGUOUS` for unrelated reasons - e.g. an untracked noun like "지갑"/wallet, or the KNIT/SKIRT ambiguity already disclosed in the prior pass - and would not have benefited from a color fix alone):

| Product | Raw Name | Expected Item | Expected Color | Current Failure Reason |
|---|---|---|---|---|
| 3201 | "아치 로고 트랙 팬츠 KA [아이보리]" | PANTS | IVORY | A product code ("KA") sits between item and bracket - correctly still rejected after this fix (see below) |
| 5318 | "체리 브이넥 가디건 셋업 [라이트 레드]" | CARDIGAN | RED | "셋업" sits between item and bracket - correctly still rejected |
| 6456 | "유니 텍스처 니트 [아이보리]" | KNIT | IVORY | Bracket immediately adjacent, nothing else in the gap - **fixed** |
| 6904 | "컬렉션 벨트 포인트 투턱 팬츠 [블랙]" | PANTS | BLACK | **Fixed** |
| 7006 | "유스호스텔 피그먼트 포인트 하프 팬츠 [아이보리]" | PANTS | IVORY | **Fixed** |
| 7778 | "치크체크 슬림핏 스판 팬츠 [브라운]" | PANTS | BROWN | **Fixed** |
| 8250 | "체리 컨셉 워딩 니트 [다크 네이비]" | KNIT | NAVY | "다크" sits inside the bracket before the matched word - correctly still rejected (see "residual misses" below) |
| 9189 | "빅 체리 후디 [블랙]" | HOODIE | BLACK | **Fixed** |
| 9454 | "두들 체리 서클 로고 조거 팬츠 [멜란지 그레이]" | PANTS | GRAY | "멜란지" sits inside the bracket before the matched word - correctly still rejected |
| 9603 | "72 볼링 셔츠 [블랙]" | SHIRT | BLACK | **Fixed** |
| 10323 | "모헤어 메탈 로고 비니 [블랙]" | KNIT_BEANIE | BLACK | **Fixed** |
| 10495 | "키즈 스몰 체리 스탠다드 티셔츠 [블랙]" | T_SHIRT | BLACK | **Fixed** |
| 10804 | "체리 그래픽 루즈핏 스웻팬츠 [멜란지 그레이]" | PANTS | GRAY | Same as 9454 - correctly still rejected |
| 10981 | "플레인 루즈핏 버뮤다 데님 팬츠 [블랙]" | PANTS | BLACK | **Fixed** |
| 11198 | "스몰 체리 컬러믹스 래글런 크롭 티셔츠 [네이비]" | T_SHIRT | NAVY | **Fixed** |
| 11277 | "키르시 X 챠미키티 러플 우븐 스커트 [화이트]" | SKIRT | WHITE | **Fixed** |

**Parenthesis cases - MMLG, 15 of 30 products.** All 15 have `item=NONE` (MMLG's English-only item nouns don't resolve at all - the already-disclosed, out-of-scope language-scope limitation from the prior pass). None of these could benefit from a color-adjacency fix alone, since there is no item to anchor the color to; confirmed, not assumed, by re-running after the fix (Section "Per-brand effect" below).

**Brands affected**: KIRSH (16 real, in-scope misses) and MMLG (15 real misses, but blocked by a separate, out-of-scope cause). The North Face Korea and PAF had zero bracket/parenthesis-wrapped recognized-color cases in their real sampled names.

### Rule implemented (Sections 3-7)

In `src/collectors/product-reference/object-relations.ts`, the SUFFIX side of `nameColorRelations` (`ITEM` followed by `COLOR`) now accepts a gap that is either pure whitespace (unchanged, original behavior) OR whitespace plus exactly one opening bracket/paren (`[` or `(`) - and, when a bracket/paren opener is present, additionally requires the matching CLOSER (`]`/`)`) to appear immediately (optionally after whitespace) after the color match, i.e. a genuinely **balanced** wrapper around the color, not a stray character. No punctuation stripping was implemented; no long-distance relation is allowed; the PREFIX direction (`[COLOR] ITEM`) was deliberately left untouched, since no real evidence in the 120-product sample showed that convention (per the task's explicit "do not implement on hypothetical syntax" instruction). The change is entirely inside `object-relations.ts`; `product-reference/attributes.ts`'s separate, independently-tested COLOR module was not touched, and neither Editorial file was touched.

**Description-wide COLOR scanning remains disabled**, exactly as the prior pass fixed it - verified explicitly by a new regression test (`verifyColorAdjacencyGate`) reusing the exact KIRSH "available colors" list fixture from the prior pass's own regression guard.

### Baseline re-confirmation (Section 9)

Re-ran the exact same 120 persisted products (re-fetched from the manifests' own `canonicalUrl`s, not resampled) against the UNMODIFIED `47a5d22` code before any change:

```
Item-bearing:        46/120 = 38.3%
Attribute-bearing:   24/120 = 20.0%
Relations:           37
```

Identical to the persisted baseline - confirmed comparable, controlled measurement.

### After the fix (Section 10)

```
Item-bearing:        46/120 = 38.3%   (unchanged - this fix does not touch item resolution)
Attribute-bearing:   29/120 = 24.2%   (+5 products, +4.2 percentage points)
Relations:           48                (+11)
Distinct pairs (global union): 40      (+9)
```

### New relations audit - every one of the 11 new relations inspected (Section 11)

| Product | Item | New Relation | Evidence | Classification |
|---|---|---|---|---|
| 6456 | KNIT | COLOR:IVORY | "니트 [아이보리]" | VALID |
| 6904 | PANTS | COLOR:BLACK | "팬츠 [블랙]" | VALID |
| 7006 | PANTS | COLOR:IVORY | "팬츠 [아이보리]" | VALID |
| 7778 | PANTS | COLOR:BROWN | "팬츠 [브라운]" | VALID |
| 9189 | HOODIE | COLOR:BLACK | "후디 [블랙]" | VALID |
| 9603 | SHIRT | COLOR:BLACK | "셔츠 [블랙]" | VALID |
| 10323 | KNIT_BEANIE | COLOR:BLACK | "비니 [블랙]" | VALID |
| 10495 | T_SHIRT | COLOR:BLACK | "티셔츠 [블랙]" | VALID |
| 10981 | PANTS | COLOR:BLACK | "팬츠 [블랙]" | VALID |
| 11198 | T_SHIRT | COLOR:NAVY | "티셔츠 [네이비]" | VALID |
| 11277 | SKIRT | COLOR:WHITE | "스커트 [화이트]" | VALID |

**11 VALID, 0 QUESTIONABLE, 0 FALSE POSITIVE.** Every new relation is the exact color stated in the product's own name, immediately and unambiguously wrapped - precisely the class of case this narrow rule targets. No sampling was used; all 11 were inspected.

### Full precision audit (Section 12)

```
Combined VALID:          34 (prior pass) + 11 (new) = 45
Combined QUESTIONABLE:   3 (unchanged - all pre-existing KIRSH cases, unrelated to this fix)
Combined FALSE POSITIVE: 0 (unchanged)
Combined total:          48

Strict precision:        45 / 45       = 100%
Conservative precision:  45 / 48       = 93.75%
```

**Improved from 91.9% to 93.75%** - the fix is precision-positive, not merely precision-neutral, because every one of its 11 new relations is unambiguously correct. Clears the required >= 90% and is close to the preferred >= 95%.

### Per-brand effect (Section 13)

| Brand | Before (attribute rate) | After (attribute rate) | Delta |
|---|---:|---:|---:|
| KIRSH | 33.3% (10/30) | 50.0% (15/30) | **+16.7pp** |
| MMLG | 3.3% (1/30) | 3.3% (1/30) | 0 |
| The North Face Korea | 23.3% (7/30) | 23.3% (7/30) | 0 |
| PAF | 20.0% (6/30) | 20.0% (6/30) | 0 |

**All improvement comes from exactly one brand (KIRSH).** This is stated plainly, per the task's explicit instruction: the fix is real and safe, but it is a KIRSH-specific grammar fix in its measured effect, not a general multi-brand unlock - MMLG's parenthesis convention exists (verified working in this pass's own test fixtures using a constructed Korean-item example) but never fires on MMLG's own real 30 products because MMLG's item resolution fails first, for the separate, already-disclosed, out-of-scope reason (English-only item nouns).

### Dimension effect (Section 14)

Only COLOR changed. DETAIL (KIRSH 9 relations, unchanged), MATERIAL (KIRSH 7, PAF 2, unchanged), SILHOUETTE (KIRSH 1, PAF 6, unchanged), STYLE (TNF 1, unchanged) are all bit-for-bit identical before and after - expected, and confirmed rather than assumed.

### Gate interpretation (Section 15)

```
Combined Attribute Rate:        24.2%
Combined Conservative Precision: 93.75%
```

24.2% is **below 30%** - bucket **C** applies: `Attribute Rate < 30% -> NO-GO remains. Do NOT continue stacking small grammar patches.`

### Minimum meaningful delta (Section 16)

```
Before: 20.0%
After:  24.2%
Delta:  +4.2 percentage points
```

**Classified MODERATE IMPACT** (+3 to +9.9pp) - a real, measurable, safe gain, but not enough on its own to change the production decision.

### Out-of-scope taxonomy candidates noticed during this pass (Section 17)

No new taxonomy was added or is recommended from this pass. Two vocabulary-adjacent observations, logged as out-of-scope only:

- Compound colors written INSIDE a bracket with a qualifier before the base word this taxonomy already tracks (`"[다크 네이비]"`, `"[멜란지 그레이]"`) are not reached by this narrow rule, since the qualifier ("다크"/"멜란지") sits between the bracket-open and the matched word - correctly treated as "extra content in the gap," not a grammar bug. A future pass could register these as their own compound COLOR values (already partially done for `DUSTY_BLUE`/`HEATHER_GRAY` etc.) rather than loosening the adjacency rule further - a taxonomy question, not a grammar question, and out of scope here.
- MMLG's English item vocabulary gap (already disclosed in the prior pass) remains the actual blocker for that brand; this pass's own new parenthesis-tolerance fixture proves the GRAMMAR side is now ready for MMLG whenever/if item-noun coverage is later addressed - but that is a taxonomy/language-scope decision for a separate, dedicated pass, not this one.

### Covernat regression check (Section 18)

All existing Covernat-derived fixtures (`verifyProductReferenceAttributes`, `verifyProductReferenceTaxonomy`) and the prior multi-brand fixtures (`verifyMultiBrandPortability`) were re-run unchanged and pass - see Validation below. No Covernat product's plain-whitespace suffix behavior changed (explicitly re-verified with a dedicated `"티셔츠 화이트"` fixture in `verifyColorAdjacencyGate`).

### Gate decision

**NO-GO remains.** Per the task's own decision rule for this bucket: *"product-page attribute richness varies heavily by brand, and current Product Reference layer does not justify production integration yet."* The color-adjacency fix was real, safe, isolated, and even precision-positive - but it confirms rather than changes the prior pass's core finding: the dominant bottleneck is brand-by-brand page-copy richness and item-noun/language coverage, not any single fixable grammar rule. Per Section 15's explicit instruction for this bucket, **no further grammar patch is recommended** - continued small grammar patching is not the productive next step.

### Data safety (this section)

- EditorialPost: 283 (unchanged) - reconfirmed via `audit-editorial-quality.ts` before and after this section's code change
- EditorialMention: 916 (unchanged)
- Editorial Direct Relations: 15 (unchanged)
- Editorial Bundles: 8 (unchanged)
- MarketRankingSnapshot: 667 (unchanged)
- No DB mutation, no Prisma change, no Editorial/Market collection, no UI change

### Validation (this section)

- `pnpm --filter @open-design/trend-dashboard typecheck`: PASS
- `pnpm --filter @open-design/trend-dashboard test`: PASS (all existing fixtures, plus new `verifyColorAdjacencyGate` - real KIRSH bracket positive, constructed-Korean-item parenthesis positive, unbalanced/multi-value-bracket negative, product-code-between-item-and-bracket negative, plain-whitespace-suffix regression, description-COLOR-scan-disabled regression, Editorial regression; one pre-existing multi-brand fixture assertion was updated, not weakened, to reflect that its own motivating case is now correctly captured via the NAME check rather than remaining an unexplained non-match)
- `pnpm --filter @open-design/trend-dashboard build`: PASS (no route/UI changes)
- The two ad-hoc scripts used to produce this section's numbers (`probe-color-adjacency.ts`, `probe-color-adjacency-misses.ts`) were deleted after use, per this project's established convention

---

## Item Language Final Gate (2026-09-08)

**This is the final Product Reference extraction gate for this research track.** Grammar work is frozen (per the prior section's own conclusion); the one remaining high-confidence portability question is whether Korean-only/Korean-heavy item vocabulary, not grammar, is the last major bottleneck - tested here by adding ONLY English item-noun aliases, with zero attribute-taxonomy or grammar changes, and measuring the real effect on the exact persisted 120 products.

### Baseline re-confirmation (Section 1)

Re-fetched the exact 120 canonical URLs from `docs/product-reference-samples/*.jsonl` (no resampling) and ran the unmodified `c70f93e` code:

```
Item-bearing:        46/120 = 38.3%
Attribute-bearing:   29/120 = 24.2%
Relations:           48
```

Identical to the persisted baseline - confirmed comparable.

### Item=NONE/AMBIGUOUS audit - all 74 misses classified (Section 2)

| Category | Count | Brands |
|---|---:|---|
| English item noun present (some real word, whether aliasable or brand jargon) | 29 | MMLG only |
| Korean item noun missing from current taxonomy (지갑/베스트/후드/다운/탑/슬리퍼/백참/라운드티/다운코트/삭스/래쉬가드/집티/백/티/트라우저/진/캡/벨트/오거나이저, etc.) | 34 | KIRSH (7), TNF Korea (9), PAF (18) |
| Brand-specific model name only, no generic item noun at all (와오나/로켓/벡티브 엔듀리스/DV+PAF 준야 레이서/커브드 슬라이드/클라우드소마 PAF) | 6 | TNF Korea (3), PAF (3) |
| No product noun present at all (attribute/material combo with no head noun, e.g. "패스트팩 보아 고어텍스", "타이니 멀티팩 퍼") | 2 | TNF Korea |
| `[SET]`/multi-item ambiguous name (by design, not a vocabulary gap) | 3 | KIRSH (2), TNF Korea (1) |
| **Total** | **74** | |

**Would recognizing the item unlock a relation? Answered empirically in Section "After metrics" below, not guessed.** Note the Korean-item-noun-missing category (34, the single largest bucket) is explicitly OUT OF SCOPE for this pass, per the task's own framing ("Korean-only/Korean-heavy item taxonomy VS real multilingual fashion product naming" - i.e. testing whether ENGLISH coverage helps, not expanding Korean vocabulary further) - these are reported for completeness, not acted on.

### MMLG deep audit - every real English item noun, with counts (Section 3)

All 29 of MMLG's misses carry an identifiable English item-shaped token. Exact recurring nouns, real counts from the actual sample (not assumed):

| Surface Form | Product Count | Category | Action |
|---|---:|---|---|
| HOODIE | 5 | Standard, unambiguous | **Aliased** to existing `HOODIE` canonical |
| SWEAT (bare, no "-shirt"/"-pants" suffix) | 5 | Ambiguous as a standalone English word | Rejected - candidate only |
| HF-T | 5 | Brand-specific house abbreviation | Rejected - brand jargon, audit-only |
| BALLCAP (no space) | 4 | Standard, unambiguous, alternate spelling of an already-tracked concept | **Aliased** to existing `BALL_CAP` canonical (editorialRules) |
| PANTS (as "...SWEAT PANTS") | 2 | Standard, unambiguous | **Aliased** to existing `PANTS` canonical |
| HOOD (bare, not "HOODIE") | 1 | Names a garment PART, not a garment - real ambiguity risk | Rejected - candidate only |
| KNITVEST (one-word compound) | 1 | Unusual brand coinage, no existing VEST canonical to alias to | Rejected - candidate only |
| ANORAK | 1 | Standard noun, but only 1 real occurrence and no existing canonical to alias to (would require a brand-new item type) | Rejected - candidate only |
| CAP (bare) | 1 | Standard, but no existing generic-cap canonical to alias to (would require a brand-new item type on 1 occurrence) | Rejected - candidate only |
| BAG (bare) | 1 | Standard, but no existing generic-bag canonical (would require a brand-new item type on 1 occurrence) | Rejected - candidate only |
| HAT (bare) | 1 | Standard, but no existing generic-hat canonical (would require a brand-new item type on 1 occurrence) | Rejected - candidate only |
| SHIRT (as "...HF SHIRT") | 1 | Standard, unambiguous - included at n=1 specifically because it is a SAME-CANONICAL alias (zero new taxonomy surface), not a new item type | **Aliased** to existing `SHIRT` canonical |
| LSV-T | 1 | Brand-specific house abbreviation | Rejected - brand jargon, audit-only |

**Policy applied, stated explicitly**: a NEW canonical item requires >= 2 real occurrences (this project's established bar from prior passes); a SAME-CANONICAL ALIAS for an already-existing item may be added at n=1 when the word is genuinely a universally standard, unambiguous fashion noun (SHIRT), because it adds zero new taxonomy surface. This is why SHIRT (n=1) was added but CAP/BAG/HAT/ANORAK (also n=1, but each would need a brand-new canonical) were not.

### Other brands (Section 4)

**Zero English item nouns recur outside MMLG.** KIRSH's, The North Face Korea's, and PAF's 45 combined misses are entirely Korean-vocabulary gaps, brand-specific model names, no-product-noun cases, or `[SET]` ambiguity - none is an untranslated English item word. This means every alias in this pass is, by the classification in Section 18 below, **SINGLE-BRAND BUT GENERIC**, never MULTI-BRAND - included anyway per the task's own explicit allowance for that category, and reported as such rather than overstated.

### Aliases added (Sections 5-8) - all in `product-reference/taxonomy.ts` only

| Canonical (existing) | New Pattern | Scope Note |
|---|---|---|
| `HOODIE` | `\bhoodie\b` (case-insensitive) | Alias added inside the existing `taxonomy.ts` HOODIE rule |
| `PANTS` | `\bpants\b` (case-insensitive) | Alias added inside the existing `taxonomy.ts` PANTS rule |
| `SHIRT` | `(?<!t-)(?<!t )\bshirt\b` (case-insensitive) | Same T-exclusion logic already used for the Korean pattern, ported to English so "T-SHIRT"/"T SHIRT" never double-resolve as SHIRT |
| `BALL_CAP` | `\bballcap\b` (case-insensitive) | New entry in `taxonomy.ts` with the SAME canonical value as the existing `editorialRules` `BALL_CAP` (spaced "ball cap") - reached only when the spaced pattern doesn't match, per the existing two-tier priority rule; `editorial/mentions.ts` was not touched |

Zero changes to `editorial/mentions.ts`. Zero new COLOR/MATERIAL/DETAIL/SILHOUETTE/STYLE values. Zero grammar changes (the wrapped-color rule, description scanning, and cross-field linkage from the prior two passes are untouched).

### After metrics (Section 13)

```
Item-bearing:        58/120 = 48.3%   (+12 products, +10.0 percentage points)
Attribute-bearing:   32/120 = 26.7%   (+3 products, +2.5 percentage points)
Relations:           52                (+4)
Distinct pairs (global union): 44      (+4)
```

### Unlocked relations - every one of the 4 new relations inspected (Section 14)

| Brand | Product | Recognized Item | Attribute | Evidence Field | Evidence | Classification |
|---|---|---|---|---|---|---|
| MMLG | 8037 | BALL_CAP | COLOR:GREEN | NAME (suffix, parenthesis-wrapped - the prior pass's own gate-test rule, unchanged) | "BALLCAP (GREEN)" | VALID |
| MMLG | 9000 | BALL_CAP | DETAIL:WASHED | NAME (direct-phrase) | "WASHED JUST WALKING" | QUESTIONABLE - genuinely ambiguous whether "WASHED" describes a garment-wash finish or is part of a sub-collection/print name ("Just Walking"); no additional context available to resolve it either way |
| MMLG | 9000 | BALL_CAP | COLOR:BLACK | NAME (suffix, parenthesis-wrapped) | "BALLCAP (BLACK)" | VALID |
| MMLG | 9961 | BALL_CAP | COLOR:RED | NAME (suffix, parenthesis-wrapped) | "BALLCAP (RED)" | VALID |

**3 VALID, 1 QUESTIONABLE, 0 FALSE POSITIVE.** All 4 come from BALL_CAP specifically - the 5 newly-resolved HOODIE products and 2 newly-resolved PANTS products produced ZERO relations, a real, diagnosed, disclosed finding (Section "Bottleneck" below), not a bug.

### Full precision audit (Section 15)

```
Combined VALID:          45 (prior pass) + 3 (new) = 48
Combined QUESTIONABLE:   3 (unchanged) + 1 (new)    = 4
Combined FALSE POSITIVE: 0 (unchanged)               = 0
Combined total:          52

Strict precision:        48 / 48 = 100%
Conservative precision:  48 / 52 = 92.3%
```

Clears the required >= 90%. Precision moved from 93.75% to 92.3% (a small, expected dip - one genuinely ambiguous new case out of only 4 - not a hidden tradeoff: every new relation is individually itemized above, none hidden).

### MMLG result - the central portability test (Section 16)

```
MMLG Before:
  Recognized Item Products: 1/30  = 3.3%
  Attribute Products:       1/30  = 3.3%

MMLG After:
  Recognized Item Products: 13/30 = 43.3%   (+12 products, +40.0 percentage points)
  Attribute Products:       4/30  = 13.3%   (+3 products, +10.0 percentage points)
  Relations:                 5    (+4)

Recovered wrapped-color products (parenthesis COLOR now reachable because the
item resolved - the SAME grammar rule from the prior color-adjacency gate
test pass, unchanged): 3 of 4 new relations (BALL_CAP x GREEN/BLACK/RED)
```

Item recognition on MMLG rose dramatically (+40pp) - proof the language gap was real and the alias fix genuinely closed it for the aliased nouns. Attribute recognition rose far less (+10pp on MMLG, +2.5pp combined) - proof that item recognition was necessary but not sufficient: most of MMLG's newly-recognized items (HOODIE x5, PANTS x2) still produced zero attribute relations, because their own real color data sits inside a QUALIFIED parenthesis ("EVERY BLACK", "SQUID BLACK", "BABY LEAF", "DEEP GREEN" - a qualifier word before the actual color, inside the wrapper) that the already-frozen adjacency rule correctly does not reach (the same class of limitation already disclosed for KIRSH's "다크 네이비"/"멜란지 그레이" in the prior pass) - not because MMLG lacks a description worth reading (MMLG's Cafe24 `description` field, when present, is thin/templated, not a real per-SKU design-bullet convention).

### Per-brand summary (Section 17)

| Brand | Item Rate Before | Item Rate After | Attribute Rate Before | Attribute Rate After |
|---|---:|---:|---:|---:|
| KIRSH | 70.0% | 70.0% (unchanged) | 50.0% | 50.0% (unchanged) |
| MMLG | 3.3% | 43.3% | 3.3% | 13.3% |
| The North Face Korea | 50.0% | 50.0% (unchanged) | 23.3% | 23.3% (unchanged) |
| PAF | 30.0% | 30.0% (unchanged) | 20.0% | 20.0% (unchanged) |

**All item-recognition and attribute gain is isolated to MMLG**, exactly as expected given Section 4's finding that no English item noun recurred elsewhere. Stated plainly, per the task's instruction: this is a single-brand fix in its measured effect, even though the aliases themselves are generic (not brand-specific) vocabulary.

### Item language portability classification (Section 18)

| Alias | Classification |
|---|---|
| HOODIE | SINGLE-BRAND BUT GENERIC (universally standard word; only observed on MMLG in this sample) |
| PANTS | SINGLE-BRAND BUT GENERIC |
| SHIRT | SINGLE-BRAND BUT GENERIC |
| BALLCAP | SINGLE-BRAND BUT GENERIC |
| HF-T, LSV-T | BRAND-SPECIFIC - correctly left audit-only, not implemented |

No alias in this pass reached the MULTI-BRAND tier (Section 4). Both implemented tiers permitted by the task were used correctly; the disallowed tier (brand-specific) was identified and explicitly rejected rather than implemented.

### Final gate (Section 19)

```
Combined Attribute Rate:        26.7%
Combined Conservative Precision: 92.3%
```

26.7% is **below 30%** - bucket **C** applies: `Attribute Rate < 30% => STOP PRODUCT REFERENCE DEVELOPMENT. No further parser/taxonomy passes.`

### Secondary interpretation (Section 20)

```
Item Recognition Rate:  38.3% -> 48.3%  (+10.0pp, a strong, real rise)
Attribute Rate:         24.2% -> 26.7%  (+2.5pp, a modest rise)
```

Item recognition rose strongly while attribute rate rose only modestly -> **conclusion: SOURCE COPY RICHNESS BOTTLENECK.** Language/vocabulary coverage was a real, fixable gap (proven by MMLG's own +40pp item-recognition jump), but fixing it mostly surfaced items with no real attribute-bearing text behind them at all. The dominant, now twice-confirmed bottleneck across all three passes (multi-brand baseline, color-adjacency, item-language) is that most real-world fashion e-commerce product pages simply do not carry Covernat's (and, to a lesser extent, KIRSH's and PAF's) rich per-SKU `[디자인]`-style design-bullet convention - not a fixable taxonomy or grammar gap.

### 21. The 40% bar was not lowered

Reported plainly: 26.7% is not close to 30%, let alone 40%. No rationalization was applied.

### Tests (Section 22)

Added `verifyItemLanguageAliases` to `scripts/smoke-test.ts`: real MMLG fixtures for HOODIE/PANTS/SHIRT/BALLCAP resolution, a word-boundary negative (`"HOODIED"` must not match `hoodie`), a case-insensitivity positive, T-SHIRT/T SHIRT must never double-resolve as SHIRT, MMLG's own brand-jargon abbreviations (`HF-T`, `LSV-T`) must remain unresolved, bare `SWEAT` must remain unresolved (deliberately rejected), plus regression checks for KIRSH's existing bracket-color behavior, description-COLOR-scan-disabled, and Editorial. All prior fixtures (`verifyColorAdjacencyGate`, `verifyMultiBrandPortability`, `verifyProductReferenceTaxonomy`, `verifyProductReferenceAttributes`, all Editorial fixtures) were kept and re-verified passing, not removed or weakened.

### Data safety (this section)

- EditorialPost: 283 (unchanged) - reconfirmed via `audit-editorial-quality.ts` before and after this section's code change
- EditorialMention: 916 (unchanged)
- Editorial Direct Relations: 15 (unchanged)
- Editorial Bundles: 8 (unchanged)
- MarketRankingSnapshot: 667 (unchanged)
- No DB mutation, no Prisma change, no Editorial/Market collection, no UI change, no new source/brand discovery

### Validation (this section)

- `pnpm --filter @open-design/trend-dashboard typecheck`: PASS
- `pnpm --filter @open-design/trend-dashboard test`: PASS
- `pnpm --filter @open-design/trend-dashboard build`: PASS (no route/UI changes)
- The one ad-hoc script used to produce this section's numbers (`probe-item-language.ts`) was deleted after use

## Final Product Reference decision

**STOP PRODUCT REFERENCE DEVELOPMENT.** Across four passes - Covernat taxonomy closure, multi-brand baseline, color-adjacency grammar, and item-language vocabulary - every fixable mechanism this research track could identify was found, evidence-checked, and (where the evidence justified it) fixed: a real precision bug (KIRSH's shared color list), a real grammar gap (bracket/parenthesis-wrapped colors), and a real vocabulary gap (English item nouns on MMLG). Each fix was genuine, safe, and precision-positive-or-neutral. None of them, individually or combined, moved the combined Direct Attribute Product Rate close to the 30% "promising" threshold, let alone the 40% production bar (16.7% -> 20.0% -> 24.2% -> 26.7% across the three post-Covernat passes). Per the task's own decision rule for this outcome: **no further parser/taxonomy passes.** The validated extractor and this document's findings should be archived as research (the core mechanism - item resolution, direct-phrase/adjacency attribute extraction, structured-object cross-field linkage - is sound, portable, and precision-safe, at 92.3% conservative precision across 5 independent brands/sources), and further product-signal effort should return to Editorial or other already-productive signal sources rather than continuing to tune this extractor.

### Next step (superseding all prior "next step" recommendations in this document)

**None for Product Reference extraction.** If a future need reopens this track, the single most useful preparatory step would not be another grammar or taxonomy patch, but a deliberate SOURCE SELECTION change: seek out brands whose product pages are independently known to carry rich, structured, per-SKU descriptive copy (the trait that made Covernat, KIRSH, and PAF's resolved items 3-4x more attribute-dense than TNF Korea's and MMLG's), since this pass's own evidence shows that trait - not language, not grammar - is what actually predicts whether a brand's Product Reference data will be useful.
