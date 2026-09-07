# HYPEBEAST_KR Fashion Scope Audit

Run date: 2026-09-07 · Branch: `feature/trend-dashboard`
Follows [`EDITORIAL_EXPANSION_NIGHT_RUN.md`](./EDITORIAL_EXPANSION_NIGHT_RUN.md), which ended with
HYPEBEAST_KR collected through an **all-section** sitemap (gaming/music/film mixed in),
its relation density diluted 0.20 → 0.06, and `재활용 원단 토트백` down from 2 articles to 1.

Goal: make HYPEBEAST_KR an accurate *fashion* source, and separate
"collected" from "analysis-eligible" honestly.

---

## Discovery: before → after

| | Before | After |
|---|---|---|
| Historical discovery | `sitemap-post-YYYY-MM.xml` (every Hypebeast section) | **`/fashion` listing + `/fashion/page/N`** |
| Category evidence | none — relevance guessed from text | explicit `class="category fashion-category"` per post box |
| Window filter | after fetching each article | listing date first (where published), article `datePublished` re-checked after fetch |
| All-section sitemap | primary | **fallback only**, used if the fashion listing yields nothing |

`robots.txt` allows every article route (only `/api`, `/account`, `/wp-admin`-style paths are
disallowed) and declares the sitemaps; `/fashion/page/2` is a link the listing itself publishes,
so pagination is read from the site rather than guessed.

### Listing parser findings

Each post box carries the article URL, a machine-readable category class, and *sometimes*
`<time datetime>`. **Only the newest ~5 boxes per page publish a datetime**; the rest render
relative time ("2 Days ago") client-side.

An early version required a date and therefore silently discovered **5 articles instead of 480**.
Undated entries are now kept, and pagination only stops on evidence: a page that carried dates
where *every* one predates the window. Each article's real `datePublished` is still re-checked
after fetching, so an undated listing entry can never smuggle an out-of-window article in.

Dry run (`scripts/dryrun-hypebeast-fashion.ts`, listing pages only, no bodies, no writes):

```
Would discover (fashion-labelled, in window): 480
Already existing in DB:                       54
New canonical URLs to fetch:                 426
Category labels seen:                    fashion=480   (100%)
```

Active window: **90 days**, unchanged from `backfill:korea-editorial`.

---

## Request safety / HTTP 202

hypebeast.kr answers heavy automated traffic with **HTTP 202 and an empty body**. That, 429, and
an empty 200 body are now all treated as "stop asking":

- `EditorialRateLimitedError` is thrown by the shared fetch helper.
- The collector **stops on the first refusal** and returns everything fetched before it, so an
  interrupted run still makes progress and the next run continues via `skipUrls`.
- `refresh-editorial-body.ts` stops the same way, and uses a 2.5s cadence for this host.
- Articles already stored are never re-fetched during collection (`skipUrls`).
- **No bypass, no retry storm, no alternate identity** — ever.

**This pass hit that limit.** A bounded collection (limit 100, 2.5s cadence) was refused partway:

```
HYPEBEAST_KR: FAILED posts=0 mentions=0
error=.../kith-fall-2026-collection... refused automated request: HTTP 202
```

So **no new fashion articles were collected in this pass**. The fashion-scoped path is
implemented, dry-run verified, and ready; it needs to run in small batches over time rather than
in one large crawl. The partial-return behaviour above was added precisely so those batches
accumulate.

---

## Body preservation (never-shrink) — and a real bug it exposed

`재활용 원단 토트백` had lost an article. Cause was **not** the site: `parseHypebeastRichBody`
sliced the body region at a fixed **120,000 characters**. A weekly roundup
("이번 주 놓치지 말아야 할 8가지 드롭") spans ~650,000 characters of markup, and the
`Zantan 토트백` sentence sits ~541,000 in — past the cap. The stop-marker logic was fine; the cap
was not.

Fixed: the cut is driven purely by trailing-chrome markers (tag list, related section,
"Read Full Article", the machine-translation disclaimer and newsletter CTA), with only a generous
sanity bound. That article's stored body went **2,117 → 7,403 chars**.

Repair used the existing safe refresh (`--source=HYPEBEAST_KR`), which updates rows in place by
their own stored `canonicalUrl`, never creates or deletes, and only replaces a body when the new
one is longer:

```
Updated (body grew): 2      Unchanged: 109     Failed: 0
Stopped early by host rate limiting: no
EditorialPost 223 -> 223    Duplicate canonicalUrl groups: 0
```

Only 2 rows were truncated — exactly the long roundups.

---

## Raw vs analysis-eligible

Two different numbers that were being presented as one:

| | Count |
|---|---:|
| Collected posts (raw) | **223** |
| Analysis-eligible (FASHION_RELEVANT) | **214** |
| Excluded from analysis | 9 |

Dashboard copy corrected (text only — layout untouched):

- intro: `현재 패션 관련 기사 214개를 기준으로 분석합니다 (전체 수집 223개).`
- data status: `수집 223개 · 분석 214개 · 4개 매체`

Both read live from `summary.fashionPosts` / `summary.editorialPosts`; nothing hard-coded.

### Contamination, and why the excluded count is misleading

Only 7 HYPEBEAST posts are excluded (드래곤볼, NBA, F1, 메시 은퇴, VHILS, 태민, 맷 맥코믹). The
real contamination is *inside* the eligible set: `classifyFashionRelevance` passes anything
containing broad words like 브랜드/컬렉션, so gaming and film articles from the all-section
sitemap still read as FASHION_RELEVANT.

The honest measure is item signal:

| Source | eligible posts with **no** specific-item mention |
|---|---|
| EYESMAG | 88 / 101 |
| HYPEBEAST_KR | **94 / 104** |
| VISLA | 3 / 6 |

That is what the fashion-scoped route is meant to fix, and why route membership is used to decide
*what to read* — never as proof on its own that an article is about a product. Existing
non-fashion rows were **kept, not deleted**: they are excluded from analysis, and raw corpus
preservation is preferred.

---

## UNKNOWN relevance / 블랙 백팩

`블랙 백팩` comes from *côte&ciel, FW26 트랜스포머블 백과 액세서리 컬렉션 공개* — a genuine bag
collection article, evidence `"…확장·압축되는 카본 블랙 ELVO 백팩"`.

It was previously `UNKNOWN` only because its stored body was too thin to earn relevance. The
richer page-parsed body supplies real fashion text, so it now earns FASHION_RELEVANT **on its own
evidence**. No UNKNOWN was auto-promoted, and 9 UNKNOWN posts remain excluded.

---

## Relation density

| Source | Raw | Eligible | Relations | Rel/eligible |
|---|---:|---:|---:|---:|
| EYESMAG | 102 | 101 | 5 | 0.050 |
| HYPEBEAST_KR | 111 | 104 | 7 | **0.067** |
| NONLABEL | 4 | 3 | 0 | 0.000 |
| VISLA | 6 | 6 | 0 | 0.000 |

HYPEBEAST_KR density is unchanged from the diluted post-expansion figure, because the fashion
collection was refused before adding anything. The pre-expansion RSS figure (0.20) came from the
`/fashion` feed — i.e. from exactly the scope this pass now implements — which is the reason to
expect recovery once the batches actually land.

---

## Bundles

| | Before this pass | After |
|---|---:|---:|
| Direct relations | 11 | **12** |
| Distinct (item, attr) pairs | 9 | 9 |
| Items with direct attributes | 4 | 4 |
| Attribute bundles | 7 | 7 |
| **Repeated bundles** | 1 | **2** |

| Bundle | Articles | Sources | Strength |
|---|---:|---:|---|
| 라글란 시퀸 긴팔 티셔츠 | 2 | 1 | 반복 관측 · 특정 매체 집중 |
| **재활용 원단 토트백** (restored) | 2 | 1 | 반복 관측 · 특정 매체 집중 |
| 나일론 체크 백팩 / 데님 토트백 / 블랙 백팩 / 셔링 트랙 재킷 / 체크 토트백 | 1 | 1 | 단일 관측 |

Dashboard Current Signal shows **라글란 시퀸 긴팔 티셔츠**: both repeated bundles tie on
2 articles / 1 source, and the existing sort breaks the tie by attribute richness (2 attributes
vs 1). `재활용 원단 토트백` appears in New Observations, correctly labelled 반복 관측.

### Item checks

- **TOTE_BAG** — 3 bundles. `재활용 원단 토트백` back to 2 articles / 1 source, evidence
  `"재활용 패브릭을 활용한 토트백"` (sacai TO GO) and `"아카이브 원단을 재활용해 만든 Zantan 토트백"`
  (the restored roundup).
- **TRACK_JACKET** — `셔링 트랙 재킷`, 1 article. Full sentence:
  `"…플래드 패턴의 돌먼 슬리브 해링턴과 코치 재킷, 셔링 디테일의 트랙 재킷과 데님 재킷 등…"`.
  The comma before `셔링 디테일의 트랙 재킷` is what the coordination cut uses, so 셔링 attaches to
  트랙 재킷 and 플래드 correctly stays with 해링턴/코치 재킷. Not an enumeration false positive.
- **LONG_SLEEVE_TEE** — 2 distinct articles, distinct URLs and titles:
  *이번 주 놓치지 말아야 할 8가지 드롭* and *Supreme, Larry Clark의 'Tulsa' 유산을 기념하는 FW26 협업 공개*.
  Not a repost pair, though the roundup does cover the same Supreme drop — which is exactly why
  2 articles from 1 source stays 반복 관측 · 특정 매체 집중 and never "다수 매체 공통".
  The second uses 래글런, the alternate spelling added in the previous pass.

---

## Data quality

posts 223 · mentions 699 · canonical duplicates **0** · mention duplicates **0** ·
future-dated 0 · missing publishedAt 0 · empty titles 0 · missing canonicalUrl 0 ·
bodies <200 chars 3 (1%) · MarketRankingSnapshot **667 (untouched)**.

---

## Known limits

1. **The fashion-scoped collection has not run to completion.** 426 in-window fashion articles are
   discovered but unfetched; the host refuses large crawls. Run in small batches
   (`--limit-per-source=15..25`), spaced out; `skipUrls` makes each run resume where the last stopped.
2. Listing dates are only available for the newest few boxes per page, so pagination depth is
   bounded by `maxPages` (40) rather than by dates alone.
3. `classifyFashionRelevance` still passes non-fashion articles that use words like 브랜드/컬렉션.
   Route membership is now available as much stronger evidence but is deliberately *not* wired in
   as an automatic override — that would promote category into product evidence.
4. The all-section sitemap remains as a fallback; if the fashion listing ever returns nothing, a
   run could silently fall back to mixed-section discovery.
5. Existing non-fashion rows from the earlier expansion are retained (excluded from analysis, not
   deleted). Deleting them is a separate decision.
