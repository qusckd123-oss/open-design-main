# Editorial Ordered Visual Evidence Audit

Checked date: 2026-09-11. READ-ONLY architecture audit - no code, schema, collector, taxonomy, or ranking change in this pass. No live network fetch was made; every finding below is traced from already-committed collector/parser source code (`src/collectors/editorial/*.ts`) plus read-only Prisma queries against the already-stored corpus.

Scope: this document answers whether `DIRECT_BLOCK`/`ADJACENT_BLOCK` image-relation evidence (the second rung of `ITEM + DIRECT ATTRIBUTE(S) + MOOD/STYLE CONTEXT + VISUAL EVIDENCE`) can become real, and how - not whether to build it now. It does not reopen taxonomy, ranking, Product Reference, Market semantics, or the scheduler.

## 0. Live state verified before the audit

- Repo/branch: `C:/Users/bcave/dev/open-design-trend-dashboard`, `feature/trend-dashboard`
- HEAD at audit start: `b673b382c17a3a6e1c9ae6166673adbc7dd45596` ("feat: add editorial visual context strip to current signal")
- Working tree at audit start: clean
- EditorialPost(real): 617 across 8 sources - COSMOPOLITAN_KR 87, ESQUIRE_KR 90, EYESMAG 110, HARPERSBAZAAR_KR 90, HYPEBEAST_KR 167, MARIECLAIRE_KR 60, NONLABEL 7, VISLA 6 (re-queried fresh, read-only, this pass)
- Article-level `imageUrl` coverage: 617/617 (100%)
- Posts whose stored `text` contains a literal newline: **0/617**
- Posts with no body text at all, by source: none (every source has at least some text, including NONLABEL - see Section 1.7)
- Bundles: 89; retained evidence-article references across all bundles: 129 (5 max per bundle, per the frozen `.slice(0, 5)` in `attribute-bundle-service.ts`); all 129 carry an article-hero image; **0 carry a `DIRECT_BLOCK`/`ADJACENT_BLOCK` `evidenceImageUrl`** - unchanged from the 2026-09-11 baseline audit

## 1. What each source's current parser stores, per the audit checklist

All eight sources are implemented in one file, `src/collectors/editorial/rss.ts`. None of them persist raw HTML/JSON, figure/caption structure, inline-image position, or paragraph boundaries - `EditorialPost` (`prisma/schema.prisma`) has exactly `title`, `text`, `excerpt`, `imageUrl` (single, article-level), no raw/structured field. Every parser below ends by calling (directly or via `stripHtml()`) `.replace(/\s+/g, " ")` on its extracted body region, which is the single point where paragraph/image position is destroyed.

### 1.1 EYESMAG - `parseEyesmagRichBody` (rss.ts:270)

- **What it reads:** the page's own `__NEXT_DATA__` hydration script, a Next.js `getStaticProps` payload containing `props.pageProps.initialPost.content` - a TipTap/ProseMirror JSON document: `{ type: "doc", content: [...] }`.
- **What the source format actually preserves:** a fully ordered node tree. Sibling node types observed in the walker's own type list: `paragraph`, `heading`, `listItem`, `blockquote` (all walked for `text`), plus `slider` (image gallery) and `embed` (social embed) - both explicitly present as distinct node types in the schema, both currently **skipped** by `walkTipTapNode` (`rss.ts:295`, `TIPTAP_BLOCK_TYPES` only lists the four text-bearing types).
- **What is discarded, and where:** the walker only ever pushes `record.text` for `type: "text"` nodes into a flat array, then `parts.join("").replace(/\s+/g, " ").trim()` collapses everything - block boundaries and every `slider`/`embed` node (i.e. every image) are dropped at this single `walkTipTapNode` call, not upstream.
- **DOM/paragraph order:** preserved in the source JSON (`content` is an ordered array) until the moment `walkTipTapNode` flattens it; never touches raw DOM at all (no HTML parsing risk).
- **Figure/caption:** TipTap `slider` nodes were not inspected further in this pass (no live fetch performed) - unknown whether individual slide items carry their own caption sub-node. Flagged as a specific open question for whoever picks this up (see Section 6).

### 1.2 VISLA - `parseVislaRichBody` (rss.ts:326)

- **What it reads:** raw HTML sliced from `<div class="entry-content ...">` (standard WordPress), region capped at 60,000 chars, cut at the first of three stop markers (hashtag run, byline, share widget).
- **What the source format preserves:** the module's own comment states plainly that "VISLA's markup nests multiple `<div>` blocks (image sliders) inside entry-content" - i.e. the raw HTML region, before any processing, does contain image-bearing markup interleaved with the article's paragraph markup (this is stated as the reason a naive first-closing-`</div>` match would truncate the article, not as unconfirmed speculation - it comes from a prior pass's own reading of the real markup).
- **What is discarded, and where:** `stripHtml(html.slice(startMarker, regionEnd))` is called on the *entire* sliced region in one shot, before the stop-marker search even runs - every tag (`<p>`, `<img>`, `<figure>`, `<div>`) is regex-stripped to a space in the same call that produces the plain-text region searched for stop markers. No block/image position is captured at any intermediate step.
- **Confirmed vs. inferred:** the *presence* of image markup nested in the body is confirmed by the module's own comment (from direct prior inspection). The *exact* tag shape (bare `<img>` vs. `<figure><img><figcaption>`) and whether images sit between paragraphs (interleaved) vs. only in a single leading/trailing slider block was **not independently re-verified in this pass** (would require a live fetch, out of scope here - see Section 6).

### 1.3 HYPEBEAST_KR - `parseHypebeastRichBody` (rss.ts:362) + the generic RSS path (rss.ts:57-99)

Two independent code paths write this source's `text`/`imageUrl`, and they behave differently - this is itself a finding:

- **Historical/backfill path** (`options.days` set): sitemap discovery → `fetchText(articleUrl)` → `parseHypebeastRichBody`, which slices raw HTML from `<div class="post-body-content">` (region capped at 2,000,000 chars specifically because a real weekly-roundup article ran to ~650,000 chars of markup - the cap comment explicitly documents "eight products across ~650,000 characters of markup", strong indirect evidence the body legitimately contains many inline product images/figures, not just text), cut at stop markers, then `stripHtml()` collapses the whole cut region in one call - same discard point as VISLA.
- **Default/incremental path** (no `--days`): goes through the *generic* RSS branch at the top of the file - `item.content` (the RSS `content:encoded` field, itself raw HTML) is stripped via `stripHtml()` for `text`, and a *single* `<img src>` is pulled via `extractImage()` (first-match regex) for `imageUrl` - `content:encoded` is never inspected for additional inline images or their position; whatever structure the RSS feed's own HTML fragment carries is discarded identically to the article-page path.
- **What is discarded, and where:** both paths destroy structure at their respective `stripHtml()` call; neither ever captures more than the one article-hero `imageUrl`.
- **Design implication:** a future ordered-block collector for this source must pick ONE canonical HTML source (almost certainly always re-fetch the article page HTML, not `content:encoded`) so blocks are structurally consistent regardless of which collection path a given post came through - not something to reconcile silently.

### 1.4 ESQUIRE_KR / HARPERSBAZAAR_KR / COSMOPOLITAN_KR - same Hearst Joongang platform

Confirmed the same technical platform by prior direct sampling (shared `/article/<id>` URL scheme, shared `atc_body_cont` body container, shared JSON-LD shape, shared business registration number per `rss.ts`'s own comments) - implemented as three parallel, independently-testable functions rather than one shared helper (a deliberate choice per the existing code comments, preserved as-is in this audit).

- **What each reads:** raw HTML sliced from `class="atc_body_cont"`, region capped at 30,000 chars, cut at the first of 2-3 stop markers (`관련기사`, `이 기사엔 이런 키워드`, and for HARPERSBAZAAR_KR/COSMOPOLITAN_KR also `이 기사도 흥미로우실` - a site-wide recirculation widget).
- **Structural evidence found in the code itself:** the HARPERSBAZAAR_KR comment documents a *real, previously-shipped bug* - before the recirculation-widget stop marker was added, the widget's OTHER-article headline text was being matched as if it were this article's own evidence ("the exact same '체크 셔츠' headline card appearing to be evidence in two unrelated articles"). A recirculation widget rendering other articles' headlines as clickable cards is standard practice with a thumbnail `<img>` per card - so this bug report is indirect but real evidence that `<img>` tags exist inside the raw HTML region *before* the stop-marker cut, in the widget portion at least.
- **What is NOT confirmed:** whether the actual article PROSE (the portion that survives the stop-marker cut, i.e. what becomes `EditorialPost.text` today) itself contains inline photos interleaved between paragraphs, as opposed to images appearing only in a lead image slot (already captured separately as `imageUrl` via `og:image`) and the widget (already cut away). Fashion magazine feature articles commonly interleave photos through the body, but this is a plausible expectation, not a code-traced fact, for these three sources - see Section 6.
- **What is discarded, and where:** `stripHtml(region.slice(0, cutAt))` - one call, same pattern as VISLA/HYPEBEAST_KR.

### 1.5 MARIECLAIRE_KR - `parseMarieClaireKrBody` (rss.ts:968) - the one structurally different source

- **Primary path:** a `NewsArticle`/`Article` JSON-LD block's `articleBody` field - **plain text, not HTML** (`"articleBody":"...text with \\n paragraph breaks..."`). Schema.org's `articleBody` is defined as text content; it does not and cannot carry an `<img>` node - image data for JSON-LD articles lives in a *separate* `image` property, never inline in the body string. This is a hard, spec-level ceiling, not a gap in this particular parser.
- **What is discarded, and where:** the code does `ld[1].replace(/\\n/g, " ")` - i.e. the raw JSON-LD string it reads FROM STORAGE genuinely still has `\n` paragraph-break escapes in it at read time; the collapse to a single space happens in this same line, one step later than every HTML-based source (whose structure is gone before the string ever reaches a JS variable inside our code).
- **Fallback path** (JSON-LD absent, confirmed rare in this audit's own comment - "only if a page ever lacks the JSON-LD block"): `post-content` HTML container, same `stripHtml()`-collapses-everything pattern as the other raw-HTML sources.
- **Net effect:** paragraph-level TEXT order is the single easiest thing to recover across all 8 sources for this platform (no regex HTML walking needed, just stop collapsing `\n`) - but image position is the single hardest, because the primary (JSON-LD) path structurally cannot carry it at all, and the source would have to fall back to the rarely-taken HTML path specifically to get any image beyond the article-hero `og:image`.

### 1.6 NONLABEL - `parseArticlePage` (generic, rss.ts:1127) via `collectNonlabel` (rss.ts:144)

- **What it reads:** `og:description` meta tag (via `stringMeta`) as `text`, falling back to `stripHtml(html)` (the ENTIRE page, nav/footer/everything) only if no description meta exists.
- **This source's body container is never targeted at all** - unlike every other source above, there is no `atc_body_cont`/`entry-content`/`post-body-content`-equivalent extraction step written for NONLABEL. The stored text (median 430 chars per the 2026-09-11 baseline audit; this pass's own sample shows 351 chars, e.g. "옷의 형태에 집중하다...") is real, on-site body-like copy - `og:description` on this site is populated with a genuine summary paragraph, not a one-line teaser - but it is a *meta-tag copy* of (part of) the article, not the article's own DOM order.
- **Implication:** before ANY block-ordering work is meaningful for NONLABEL, a genuine body-container parser (finding this site's actual article-content class name) would need to be written first - a separate, more foundational gap than "add block tracking" for this specific source. It is also this project's lowest-volume source (6-7 real posts total), so the return on that investment is smallest.

### 1.7 Sentence-level structure IS already recoverable today - paragraph/image structure is not

`splitSentences()` (`attribute-relations.ts:371`) runs live, on demand, over the stored flattened `text` field for every relation-extraction call - sentence boundaries are NOT destroyed by storage, because they are re-derived from punctuation at read time, not from any stored structural marker. This is a genuinely different claim from paragraph/image order: **word- and sentence-level text structure survives storage; paragraph and image position do not**, because paragraph/image boundaries were never punctuation-based to begin with (`\s+` collapse treats a paragraph break and a mid-sentence space identically) and there is no equivalent "re-derive from the stored string" trick available for something that was never encoded in the string in the first place. This is why Section 3's `TEXT → IMAGE → TEXT → IMAGE` ordering genuinely requires new data at collection time, not a smarter parse of what already exists.

## 2. Is order-preserving information already available at the raw-HTML/JSON stage, or lost at parse time?

**Available at the raw stage, lost at parse time**, for every source with a written body parser:

| Source | Raw stage has order info? | Where it is destroyed |
|---|---|---|
| EYESMAG | Yes - TipTap JSON `content` array, confirmed by the walker's own node-type list | `walkTipTapNode` skips `slider`/`embed` and flattens `text` nodes with no separator tracking |
| VISLA | Yes (per existing code comment - images nested in the same container as paragraphs) | Single `stripHtml()` call over the whole sliced region |
| HYPEBEAST_KR | Yes (per the 650,000-char comment, strongly implying rich inline structure) | Single `stripHtml()` call, both collection paths |
| ESQUIRE_KR / HARPERSBAZAAR_KR / COSMOPOLITAN_KR | Likely (widget images confirmed present in-region; body-prose images plausible but not code-confirmed) | Single `stripHtml()` call |
| MARIECLAIRE_KR (JSON-LD path) | Paragraphs yes (`\n` in the raw string); images structurally never (schema ceiling) | `.replace(/\\n/g, " ")` for paragraphs; images were never there to begin with |
| MARIECLAIRE_KR (HTML fallback path) | Yes, same as the other raw-HTML sources, but this path is rarely taken | Single `stripHtml()` call |
| NONLABEL | N/A - no body container is ever fetched into a variable that could preserve order | N/A - nothing to destroy; the gap is upstream of parsing |

**None of this is stored anywhere today.** `EditorialPost` has no raw-HTML/JSON column, and the zero-literal-newline query in Section 0 confirms the destruction is total and already-completed for all 617 stored rows - not a partially-preserved signal waiting to be mined from what is already in SQLite.

## 3. Can each source produce a stable `TEXT → IMAGE → TEXT → IMAGE` block list?

Feasibility of the underlying **source data shape** supporting ordered blocks, independent of whether we do the (separate, future, Category B) work of implementing it:

| Source | Can produce ordered blocks? | Basis |
|---|---|---|
| EYESMAG | Yes, cleanly | Structured JSON tree with typed sibling nodes - walking it and keeping `slider`/`embed` instead of skipping them is a direct, low-risk extension of code that already exists and is already tested against this exact tree shape |
| VISLA | Yes, with a real (not-yet-written) HTML-block parser | Needs a proper tag-aware walk (or a light HTML parser) of the `entry-content` region instead of `stripHtml()` - doable with the same stop-marker boundary technique already proven, but genuinely new parsing code, not a config flip |
| HYPEBEAST_KR | Yes, with the same caveat as VISLA, plus a path-unification decision | Two collection paths must converge on one canonical HTML source first (Section 1.3) |
| ESQUIRE_KR / HARPERSBAZAAR_KR / COSMOPOLITAN_KR | Probably, with a real HTML-block parser | Same `atc_body_cont` shape across all three, so one parser design serves all three once written; in-body image interleaving needs confirming (Section 6) before promising it will look like an editorial magazine's photo-per-section layout |
| MARIECLAIRE_KR | Split answer | TEXT blocks: yes, easily, from JSON-LD `\n` splits. IMAGE blocks: only via the rarely-taken HTML fallback path - the two would need different code paths merged into one block list, an explicit design wrinkle worth flagging, not hand-waved as "same as the others" |
| NONLABEL | Not yet meaningful | No body container is targeted at all today; ordering work here is blocked on writing a basic body parser first, which this source currently lacks entirely |

## 4. What structural conditions would make DIRECT_BLOCK / ADJACENT_BLOCK real (not a distance heuristic)

The existing, frozen contract in `src/collectors/editorial/image-relation.ts` is exactly right and should not change on its own terms: `ContentBlock = { text, imageUrl }`, position = array index, `resolveEvidenceImage` returns `DIRECT_BLOCK` for same-index and `ADJACENT_BLOCK` for index ±1 only, `NONE` otherwise. The module's own header comment already states the constraint this section is elaborating on: "No pixel/content inspection of the image is ever performed - only its position in the article's own document structure relative to the evidence text."

Concretely, for a future ordered-block collector to produce a `DIRECT_BLOCK`/`ADJACENT_BLOCK` relation that deserves to be called direct evidence (not a distance heuristic dressed up as one):

- A "block" must be a real structural unit the SOURCE itself produced - one TipTap `paragraph`/`heading` node, one HTML `<p>`/`<figure>` element, one JSON-LD-adjacent unit - never an artificial N-character or N-word chunk invented by our own code. This is the same principle `extractDirectAttributeRelations` already enforces for text (grammatical attachment, not article co-occurrence) - Section 4 of this audit is asking for the visual-evidence equivalent of that same discipline.
- An IMAGE block must come from an `<img>`/`<figure>` (or TipTap `slider`) element the source placed at that position in its OWN document order - never "the nearest image by character distance" computed after the fact by our code.
- **DIRECT_BLOCK**, strongest case: a `<figure><img><figcaption>evidence text</figcaption></figure>` where the evidence text is co-located with the image inside the exact same DOM node. **None of the current 8 parsers extract `<figcaption>` at all today** - this is a concrete, low-risk, high-confidence opportunity flagged for whoever builds this: a real caption is structurally stronger evidence than paragraph-adjacency, and capturing it costs little beyond what these parsers already do.
- **DIRECT_BLOCK**, weaker case worth naming explicitly because current sources don't cleanly support the strong case: an image block whose position sits inside the same enclosing structural container as the text block (e.g. both inside the same `<section>`/logical group the source itself demarcates) - only usable if such a container genuinely exists in the source markup, not invented by grouping N nearby paragraphs ourselves.
- **ADJACENT_BLOCK**: the image block is the immediately preceding or following SIBLING block at the same nesting level as the text block containing the evidence - i.e. index ±1 in the SAME ordered list the source produced, exactly what `resolveEvidenceImage` already implements. Not "within N paragraphs", not "same page section" loosely defined - one sibling step, full stop.
- **Hard boundary, unchanged from today's text-only cut:** content after a stop marker (related-articles widget, tag list, recirculation block) must never enter the ordered-block list at all - the existing "cut first, then only walk within the cut region" discipline (already used for text) must extend identically to images. An image that lives only in a recirculation widget must never become DIRECT/ADJACENT evidence for a sentence that precedes the cut.
- No cross-modal inference of any kind: proximity is the entire signal. Alt-text keyword matching, caption sentiment, or "this photo looks like it matches this attribute" are all explicitly out of scope for `DIRECT_BLOCK`/`ADJACENT_BLOCK` - that boundary is what keeps this lane honest, and nothing found in this audit suggests relaxing it.

## 5. Recoverable-from-current-data vs. requires-re-fetch, across the 617 stored articles

- **0% (0/617)** of currently stored articles can have block-level TEXT/IMAGE order reconstructed from what is already in SQLite. This is not an estimate - it follows directly from (a) the Prisma schema having no raw/structured field to reconstruct from, and (b) the read-only query in Section 0 showing 0/617 stored `text` values contain even a literal newline, meaning the destruction described in Section 1 has already fully happened for every real row on disk today.
- **100% (617/617)** would require a genuinely NEW network fetch of each article's already-known `canonicalUrl` - this is re-collection against source-of-record, not a "reparse" of anything already stored (there is nothing structural left in storage to reparse). This distinction matters against `AGENT_OPERATING_RULES.md`'s Category B boundary: `scripts/reparse-editorial-mentions.ts` reparses stored TEXT for taxonomy changes; recovering block order is a different operation entirely (a new collection pass, not a reparse), and neither is performed in this read-only pass.
- Feasibility of that future re-fetch succeeding at all varies sharply by source (Section 3) - EYESMAG's JSON tree is deterministic and low-risk; the six raw-HTML sources need new HTML-block parsers of varying confidence; NONLABEL needs a body parser it currently lacks entirely before block-ordering is even a meaningful next step.
- One thing IS already recoverable without any re-fetch: sentence-level text structure (Section 1.7) - but this offers zero image-position information, so it cannot advance `DIRECT_BLOCK`/`ADJACENT_BLOCK` on its own.

## 6. Feasibility by source - HIGH / MEDIUM / LOW, with basis

| Source | Feasibility | Basis |
|---|---|---|
| **EYESMAG** | **HIGH** | Structured JSON tree, already walked by existing tested code, only change is capturing (not skipping) `slider`/`embed` nodes in order. Lowest technical risk of all 8; no live fetch was needed to reach this conclusion because the tree shape is fully evidenced in the current parser's own type-handling logic. |
| **VISLA** | **MEDIUM** | Image-bearing markup nested in the body region is confirmed present by an existing code comment from a prior direct inspection, but the *exact* interleaving pattern (paragraph/image/paragraph vs. images clustered in one slider block) was not re-verified in this pass. One read-only sample-page fetch (explicitly NOT performed here) would raise this to HIGH or reveal a lower true ceiling. |
| **HYPEBEAST_KR** | **MEDIUM** | Same interleaving-pattern uncertainty as VISLA, plus a genuine added complication this audit surfaced: two divergent collection paths (RSS `content:encoded` vs. article-page HTML) currently produce this source's data, and a block-ordering implementation must deliberately choose and unify on one, which is a real design decision, not free. |
| **ESQUIRE_KR** | **MEDIUM** | Same platform as HARPERSBAZAAR_KR/COSMOPOLITAN_KR; widget-region images are confirmed present via the HARPERSBAZAAR_KR false-positive bug history, but in-body prose image interleaving is a plausible, not code-confirmed, expectation for this source specifically. |
| **HARPERSBAZAAR_KR** | **MEDIUM** | Same basis as ESQUIRE_KR; slightly stronger indirect evidence than ESQUIRE_KR/COSMOPOLITAN_KR because the false-positive bug that led to the extra stop marker was found and documented ON this source, directly confirming image-bearing widget markup sits in the raw region - still not proof about in-body prose images specifically. |
| **COSMOPOLITAN_KR** | **MEDIUM** | Same platform/basis as HARPERSBAZAAR_KR; also carries a genuine per-article "10초 요약" recap box (confirmed real content, not chrome) that a future block parser would need to classify correctly (real evidence block vs. a summary that duplicates body evidence) - a small extra design wrinkle unique to this source. |
| **MARIECLAIRE_KR** | **MEDIUM (asymmetric)** | TEXT-block order recovery is arguably the EASIEST of all 8 sources (JSON-LD `\n` splits, no HTML walking needed) - but IMAGE-block recovery is structurally blocked on the primary path (schema.org `articleBody` cannot carry images by definition) and only reachable via a fallback HTML path this audit's own code comment says is rarely taken. Net MEDIUM because the two halves of the same source pull in opposite directions. |
| **NONLABEL** | **LOW** | No body-container parser exists for this source at all today (Section 1.6) - block-ordering work is blocked behind writing basic body extraction first, a separate and more foundational gap. Also this project's lowest-volume source (6-7 real posts), so priority is low even if feasibility improves. |

## 7. Proposed minimal future data model (design only - no Prisma/schema change performed or proposed for immediate implementation)

```ts
type OrderedContentBlock =
  | { type: "TEXT"; text: string; order: number }
  | { type: "IMAGE"; url: string; caption: string | null; order: number };
```

Design notes for whoever picks this up later (Category B, explicit review required, not started here):

- `order` must be the integer sequence position exactly as the SOURCE's own document produced it - never a position we compute or infer.
- `caption` exists specifically to capture `<figcaption>` text where a source provides it (Section 4's strongest DIRECT_BLOCK case) - `null` everywhere it is not structurally present; never backfilled from nearby paragraph text.
- **This shape is a genuine, deliberate revision of `image-relation.ts`'s current `ContentBlock = { text, imageUrl }`, not a drop-in reuse of it.** The current type models "one block that MAY have an image", which implicitly assumes text and its image can share a single array slot. None of the real per-source structures audited here actually work that way - EYESMAG's TipTap tree keeps `paragraph` and `slider` as separate sibling nodes; every raw-HTML source keeps `<p>` and `<img>`/`<figure>` as separate sibling elements. A future implementation will need to decide how `resolveEvidenceImage`'s DIRECT_BLOCK/ADJACENT_BLOCK logic maps onto two distinct block *types* at adjacent orders (e.g. DIRECT_BLOCK = an IMAGE block whose own `caption` contains the evidence text, OR an IMAGE block sitting at `order` between the TEXT block containing the evidence and its immediate neighbor; ADJACENT_BLOCK = an IMAGE block at the nearest preceding/following `order` value outside that). This is flagged here explicitly so a future pass does not assume the existing frozen type can be reused verbatim - the underlying DIRECT/ADJACENT *concept* is unchanged, but the concrete mapping needs a deliberate, reviewed design pass of its own.
- Whatever is ultimately stored, it should sit alongside (not silently replace) the current flattened `text` field during any transition, since `splitSentences`-based direct-relation extraction (Section 1.7) already depends on a single contiguous string today and that mechanism is frozen and must not regress.
- Per-source parser work would be genuinely different code for each of the three tiers in Section 6 (JSON-tree walk for EYESMAG; new HTML-block parsers for the six raw-HTML sources; a net-new body parser for NONLABEL before block-ordering is even applicable) - there is no single shared implementation shortcut across all 8.

## 8. Human-reviewed visual mood lane - design only

Per `WORK_START_HERE.md` Section 5 and this project's standing rule, mood/style must never be auto-inferred from an image - no code path may decide "빈티지", "90s", or "워크웨어" from pixels, alt text, or caption sentiment. The `VISUAL_FIRST_TREND_BOARD_AUDIT.md` home-screen contract already reserves the MOOD/STYLE slot for "a direct STYLE relation... otherwise `직접 무드 근거 없음`" - this lane is an intentionally separate, additional evidence type, not a way to fill that slot automatically.

Minimal proposed shape (design only, no table created):

```ts
type EditorialVisualMoodObservation = {
  imageUrl: string;               // the exact image being described - never a bundle in the abstract
  sourceArticleUrl: string;       // the article this image came from, for auditability
  moodLabels: string[];           // chosen from a small, human-curated controlled vocabulary - never free-generated, never inferred
  reviewerNote: string | null;    // optional free-text justification, human-written
  reviewedBy: string;             // human identity/handle - this is a person's judgment call, not a system output
  reviewedAt: string;             // ISO timestamp
  status: "PENDING" | "APPROVED" | "REJECTED";
};
```

Constraints, restated because they are the entire point of this lane:

- A completely separate store from `EditorialMention`/`MarketRankingSnapshot` - never merged into the direct-relation extraction pipeline, and never allowed to influence `bundleSourceSpread`, `independentEvidenceClusterCount`, `publisherFamilySpread`, or bundle sort order in any way.
- `moodLabels` come from a small, explicitly curated vocabulary a human maintains - not free text an LLM generates per-image, not a classifier's output, not derived from the image's alt text or nearby caption automatically. A human decides the label; the system only records that decision.
- Every observation is scoped to one specific `imageUrl` plus its `sourceArticleUrl` - never to a bundle/item in the abstract - so the record stays an auditable "a person looked at this exact picture and judged X", not a claim about the underlying merchandise.
- Displayed, if ever surfaced, under its own explicitly labelled lane, visually and textually distinct from the direct STYLE relation chip - never merged with or substituted for it.
- No scoring, no ranking impact, no auto-suggestion - a pure human-observation ledger, matching the smallest-possible-shape instruction this audit was given.

## 9. Decisions needed before any of this is implemented

None of these are decided by this audit - they are the open questions a future implementation pass (explicit review required, Category B) would need answered first:

1. **Re-collection scope and cost**: recovering block order for existing articles requires re-fetching all (or a chosen subset of) the 617 already-known `canonicalUrl`s - a real, bounded but non-trivial network operation against 8 live third-party sites, not a local reparse. Should this ever run against the full historical corpus, or only prospectively for newly collected articles from here forward?
2. **Per-source rollout order**: given Section 6's spread, does EYESMAG (HIGH) ship alone first as a proof of concept, or does the work wait until the MEDIUM-tier sources are also designed, so the UI doesn't have to explain "why does only one source ever show a real bundle hero"?
3. **HYPEBEAST_KR's two-path unification** (Section 1.3): which canonical HTML source wins, and does the incremental (non-`--days`) refresh path change its network behavior to always re-fetch the article page?
4. **MARIECLAIRE_KR's asymmetry** (Section 1.5, Section 7): does a future implementation accept TEXT-only ordered blocks (no images) for this source as a valid partial state, or hold it back entirely until the image-bearing fallback path is also built out?
5. **NONLABEL's missing body parser** (Section 1.6): is writing one in scope at all, given this is the lowest-volume source in the corpus?
6. **`figcaption` capture** (Section 4, Section 7): worth doing as a small, low-risk, source-by-source addition ahead of full block-ordering, since it is the single strongest DIRECT_BLOCK signal available and currently captured nowhere?
7. **Data model transition**: does the future `OrderedContentBlock` shape live alongside the current flattened `text` field permanently (two representations of the same article), or does storage move to blocks-as-source-of-truth with `text` derived from them for the direct-relation extractor?
8. **Mood lane ownership**: who is the human reviewer in practice, what triggers a review (all article images? only bundle-linked ones? only visual-context-strip-selected ones?), and does it need any UI at all before a first manual/spreadsheet-based pilot?
9. **Rights/licensing review** (carried over, unchanged, from `VISUAL_FIRST_TREND_BOARD_AUDIT.md` Section 3): still unresolved and still applies to any additional image use this future work would introduce.

None of these decisions were made in this pass. This document's purpose is to make them informed, not to make them.
