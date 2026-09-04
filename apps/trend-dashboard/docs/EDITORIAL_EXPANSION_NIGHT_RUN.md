# Editorial Expansion Night Run

Run date: 2026-09-04 (overnight, autonomous)
Branch: `feature/trend-dashboard`
Start HEAD: `2233c5a` · End HEAD: see git log

Goal: get more real `ITEM + DIRECT ATTRIBUTE` combinations like `재활용 원단 토트백`,
with more domestic editorial evidence — **without trading accuracy for count**.

---

## Start baseline

| | Value |
|---|---:|
| EditorialPost (REAL) | 148 |
| EditorialMention (REAL) | 489 |
| Sources | 4 |
| Direct relations | 6 |
| Items with direct attributes | 2 |
| Attribute bundles | 4 |
| Repeated bundles | 1 |
| MarketRankingSnapshot | 667 |

---

## Phase 0 — Direct attribute coverage audit

New read-only tool: `scripts/audit-missed-attribute-vocabulary.ts`. It reports, for
every specific-item occurrence, what the extractor actually saw and why no relation
was emitted, reusing the extractor's own code path (`describeItemContexts`) so an
audit can never drift from extraction behaviour.

Across the 130 FASHION_RELEVANT posts there were only **34 specific-item occurrences**:

| Outcome | Count | Share |
|---|---:|---:|
| RELATION (already counted) | 7 | 20.6% |
| NO_ATTRIBUTE_IN_WINDOW (candidate missed vocabulary) | 13 | 38.2% |
| NO_WINDOW (item starts the sentence) | 14 | 41.2% |
| ENUMERATION (guard fired) | 0 | 0% |

### Added (3 attributes + 1 normalization)

Each is an unambiguous **direct pre-item modifier inside the extractor's real
20-character window**, filling an obvious gap next to PIPING/EMBROIDERY/STRIPE/CHECK:

| Added | Evidence | Source |
|---|---|---|
| `DETAIL:SHIRRING` | "셔링 디테일의 트랙 재킷" | EYESMAG |
| `DETAIL:RAGLAN` | "시퀸 라글란 롱슬리브 톱" | HYPEBEAST_KR |
| `DETAIL:SEQUIN` | "시퀸 라글란 롱슬리브 톱" | HYPEBEAST_KR |
| `CHECK` += 플래드 | "플래드 패턴의 …" — Korean spelling of "plaid", which CHECK already matched in English (normalization, not a new concept) | EYESMAG |

`시퀀` is deliberately **not** matched — it would fire on 시퀀스(sequence).

### Rejected — and why (this is the important half)

A normalization probe measured every candidate's corpus presence **and** whether it
ever shares a sentence with a specific-item noun:

| Candidate | Articles | Articles sharing a sentence with an item | Verdict |
|---|---:|---:|---|
| BLUE / GREY / YELLOW / PINK / NAVY / BEIGE … | 16 / 14 / 12 / 10 / 5 / 5 | **0** | rejected |
| MESH | 12 | 0 | rejected |
| LOGO | 15 | 0 | rejected |
| GRAPHIC | 18 | 2 (never a direct modifier) | rejected |
| MINI / BIG / SLIM / CROPPED | 10 / 7 / 8 / 4 | 0 | rejected |
| CANVAS / JACQUARD / MONOGRAM / VELVET | 5 / 4 / 4 / 3 | 0 | rejected |
| OVERSIZED | 12 | 1 — and that one is the enumeration the guard exists to reject ("오버사이즈 축구 셔츠와 트랙 재킷") | rejected |
| QUILTED | 1 | 1, but sits outside the 20-char window | rejected |

**Colours are the clearest signal in the whole audit:** they are everywhere in the
corpus and never once attached to a specific item. Adding them could not have
produced a single bundle — only inflated the taxonomy.

Result: direct relations 6 → 9, bundles 4 → 6, items with direct attributes 2 → 4.
`TRACK_JACKET` gained its first genuine direct attribute.

---

## Phase 1–2 — Corpus quality + per-source attribute density

New read-only tool: `scripts/audit-editorial-quality.ts` (BEFORE/AFTER diffable).

The decisive finding — **outlets are not interchangeable**:

| Source | Posts | Item-bearing | Direct-attribute | Relations/post | Window held |
|---|---:|---:|---:|---:|---|
| EYESMAG | 101 | 13% | 3% | **0.05** | 2026-06-17 → 09-01 |
| HYPEBEAST_KR | 20 | 15% | 10% | **0.20** | 2026-09-01 → 09-02 (2 days!) |
| NONLABEL | 3 | 0% | 0% | 0.00 | 4 posts total |
| VISLA | 6 | 50% | 0% | 0.00 | 6 posts total |

HYPEBEAST_KR carried **4× EYESMAG's attribute density but only two days of history**,
because its RSS feed exposes only the newest items — `--days` could filter that feed
but never reach back through it. EYESMAG spans months only because it already had a
sitemap path.

**So the biggest available lever was not a new source at all: it was depth on the best
existing source.**

---

## Phase 3–5 — New source discovery

| Candidate | Access | Robots | Body | Fashion mix | Decision |
|---|---|---|---|---|---|
| GQ Korea | 200 | **`User-agent: ClaudeBot` → `Disallow: /`** | — | — | **RESTRICTED** |
| W Korea | 200 | **ClaudeBot `Disallow: /`** | — | — | **RESTRICTED** |
| Dazed Digital | 200 | **ClaudeBot in blocked group** | — | — | **RESTRICTED** |
| the-edit.co.kr | 12/12 | allowed | not statically parseable with a generic container | **1/12 fashion**, 0 item-bearing | **LOW_VALUE** |
| apparelnews.co.kr | 10/10 | allowed | body not statically extractable | B2B trade/corporate news | **LOW_VALUE** |
| visla.kr (expansion) | 200 | allowed | tested parser exists | richest bodies, but 0.00 relations/post | declined — see below |

**GOOD candidates: 0.** No source was forced in. The three restricted sites are
excluded on their own robots.txt instruction naming ClaudeBot; no bypass was attempted.

New tool `scripts/audit-candidate-source.ts` scores a candidate over the network using
the *production* extractors and never writes to the DB, so future candidates are judged
on direct-attribute density rather than article volume.

---

## Phase 6–8 — HYPEBEAST_KR historical collection

`hypebeast.kr/robots.txt` allows every article route (disallowing only `/api`,
`/account`, `/wp-admin`-style paths) and declares public monthly sitemaps
(`sitemap-post-YYYY-MM.xml`) — the same shape EYESMAG already uses.

Implemented (`src/collectors/editorial/rss.ts`):

- `parseHypebeastRichBody()` — body from `<div class="post-body-content">`, cut before
  the tag list / related-articles / "Read Full Article" chrome. Fixture-tested.
- `getHypebeastEntries(days)` — monthly sitemap discovery, window-filtered.
- Historical path used **only when `--days` is given**; the daily RSS flow is unchanged.
- **No `sourceCategory` is passed** on this path: the monthly sitemap spans every
  Hypebeast section (music, gaming, film), so fashion relevance must be earned from the
  article's own text rather than assumed the way the `/fashion` RSS feed legitimately can.
- Per-article `publishedAt` re-checked against the window (sitemap entries are not
  date-filtered).
- Numeric HTML entity decoding (hex + decimal): titles arrive as `&#xBC84;` = 버. Without
  this the stored title is both unreadable and unmatchable by the phrase rules.
- 1.2s delay between article fetches (the site publishes Crawl-delay for several bots).

Active window: **90 days**, matching the existing `backfill:korea-editorial` setting.
No historical article outside that window entered the REAL dataset.

Collected: **109 posts**.

### Integrity bug found and fixed

The run produced **34 duplicate canonical URLs**. Cause: the RSS `<guid>` is a permalink
on a *different host* (`kr.hypebeast.com/?post=NNN`) than the canonical article URL, so
an article seen by both paths was stored twice.

Fixes:
1. `rss.ts` — HYPEBEAST_KR now keys `externalPostId` on the canonical URL, the one
   identity both discovery paths agree on.
2. `scripts/migrate-hypebeast-post-identity.ts` — idempotent repair (dry-run by default).
   Applied: posts 257 → 223, HYPEBEAST_KR 145 → 111, canonical duplicates 34 → **0**,
   non-canonical identities → **0**.
3. `collect-korea-editorial.ts` — collection may now **add** body text but never shrink
   it, and mentions are re-derived from whichever body is actually stored.

### Known evidence regression (honest record)

`재활용 원단 토트백` dropped from **2 articles → 1**. The second article was the roundup
"이번 주 놓치지 말아야 할 8가지 드롭": its RSS `content:encoded` lists every product
(including the Zantan 토트백 sentence), but the article page's `post-body-content` does
not, and the identity migration kept the canonical-identity row.

The never-shrink rule now prevents this from recurring, and a normal RSS re-collection
would restore the richer body — but **hypebeast.kr began returning `HTTP 202` with an
empty body** (bot mitigation) after the ~400-page crawl, so no further request was made
to that host. No bypass was attempted. Re-run `npm run collect:korea-editorial --
--source=HYPEBEAST_KR` once the host serves normally again.

---

## Final counts

| | Before | After |
|---|---:|---:|
| EditorialPost (REAL) | 148 | **223** |
| EditorialMention (REAL) | 489 | **688** |
| Sources | 4 | 4 |
| Canonical duplicates | 0 | **0** |
| Mention duplicates | 0 | **0** |
| Direct relations | 6 | **11** |
| Distinct (item, attr) pairs | 5 | **9** |
| Items with direct attributes | 2 | **4** |
| Attribute bundles | 4 | **7** |
| Repeated bundles | 1 | 1 |
| MarketRankingSnapshot | 667 | **667 (untouched)** |

Per source after: EYESMAG 102 · HYPEBEAST_KR 111 · NONLABEL 4 · VISLA 6.
HYPEBEAST_KR window is now 2026-08-30 → 2026-09-04 with median body 1344 chars.

### Bundles

| Bundle | Articles | Sources | Strength |
|---|---:|---:|---|
| 라글란 시퀸 긴팔 티셔츠 | 2 | 1 | 반복 관측 · 특정 매체 집중 |
| 나일론 체크 백팩 | 1 | 1 | 단일 관측 |
| 데님 토트백 | 1 | 1 | 단일 관측 |
| **블랙 백팩** (NEW) | 1 | 1 | 단일 관측 |
| **셔링 트랙 재킷** (NEW) | 1 | 1 | 단일 관측 |
| 재활용 원단 토트백 | 1 | 1 | 단일 관측 |
| 체크 토트백 | 1 | 1 | 단일 관측 |

`블랙 백팩` resolves a gap the previous audit had explicitly flagged: the côte&ciel
BACKPACK+BLACK relation was hidden behind a `fashionRelevance=UNKNOWN` classification,
which the richer body corrected.

`라글란 시퀸 긴팔 티셔츠` reached 2 articles via a newly collected Supreme article using
**래글런** — the alternate spelling added in Phase 0.

### Per item

- **TOTE_BAG** — 3 bundles (재활용 원단 / 데님 / 체크), each 1 article, 2 sources overall.
  No size/shape/finish vocabulary (빅, 컬러 다잉, 스웨이드, 포켓 디테일) exists in the
  corpus as a direct modifier; none was invented.
- **TRACK_JACKET** — article presence 3, direct attributes **1** (`DETAIL:SHIRRING`).
  Its co-occurrence values (SPORTY/RED/NYLON/DENIM/…) remain unpromoted; the smoke test
  now asserts the exact direct set rather than mere emptiness.
- **BACKPACK** — 2 bundles (나일론 체크, 블랙).
- **LONG_SLEEVE_TEE** — 1 bundle, now the only repeated one.
- **SHOULDER_BAG / BALL_CAP / KNIT_BEANIE / BUCKET_HAT** — mentioned but never directly
  modified; their windows hold brand/model names (DIESEL 1DR, 뉴에라, 999휴머니티) or
  narrative verbs, not product attributes. Honest zero.

### Dimension coverage

| Dimension | Distinct attrs | Relations | Verdict |
|---|---:|---:|---|
| DETAIL | 4 | 5 | strongest |
| MATERIAL | 3 | 3 | strong |
| COLOR | 1 | 1 | weak (new) |
| SILHOUETTE / FINISH / STYLE | 0 | 0 | absent |

---

## Data quality gates

Future-dated 0 · missing publishedAt 0 · empty titles 0 · missing canonicalUrl 0 ·
bodies <200 chars 3 (1%) · canonical duplicates 0 · mention duplicates 0 ·
relevance FASHION_RELEVANT 214 / UNKNOWN 9 / NON_FASHION 0 · MarketRankingSnapshot 667.

Gender semantics unchanged: explicit evidence only, UNKNOWN never promoted, MEN ≠ UNISEX.
Evidence-strength wording unchanged (1기사/1매체 → 단일 관측; 2+기사/1매체 → 반복 관측 ·
특정 매체 집중; 2+매체 → 여러 매체 동시 관찰).

---

## Primary bottleneck

**SOURCE COVERAGE**, with a specific shape:

1. Only 34 specific-item occurrences existed in 130 posts, and 41% of those had no
   modifier zone at all — Korean editorial frequently *names* an item without describing it.
2. The vocabulary probe showed the most common descriptive words never co-occur with a
   specific item in one sentence, so taxonomy expansion has a hard ceiling here.
3. The one outlet that does describe products (HYPEBEAST_KR, 0.20 rel/post) was the least
   collected — and after expansion its density fell to 0.06, because the monthly sitemap
   pulls in every section (gaming/music/film), not just fashion.

That last point is the actionable one: **volume from a good source is not the same as
fashion volume from a good source.**

## Next best action

1. **Category-scoped Hypebeast discovery.** The `/fashion` RSS proves a fashion-only view
   exists; find a fashion-scoped listing/pagination path so historical collection inherits
   that filter instead of the all-section sitemap. Expected to restore ~0.20 rel/post
   across a 90-day window — the single biggest available win.
2. **Re-run the plain RSS collection** for HYPEBEAST_KR once the host stops returning 202,
   to restore the roundup body (never-shrink now protects it).
3. Roundup articles ("이번 주 …드롭") are the densest product-listing format; treat their
   full capture as a first-class requirement of any Hypebeast parser work.
4. Re-run `audit-missed-attribute-vocabulary.ts` after any collection; promote a candidate
   only on ≥2 articles or one unambiguous in-window direct phrase.
5. Leave colours/silhouette alone until a source actually writes "블루 토트백".
