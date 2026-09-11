# Visual-First Trend Board Audit

Checked date: 2026-09-11

This audit is the implementation gate for the new product question:

> 요즘 뜨는 아이템이 뭐냐?

The planning answer remains `ITEM + DIRECT ATTRIBUTE(S) + MOOD/STYLE CONTEXT + VISUAL EVIDENCE`. This document does not reopen taxonomy, ranking, evidence clustering, Product Reference, Market semantics, or the scheduler. It defines how a later UI/collection pass can become visual-first without turning an image into a claim it cannot support.

## 1. Live state verified before the audit

- Repo/branch: `C:/Users/bcave/dev/open-design-trend-dashboard`, `feature/trend-dashboard`
- HEAD at audit start: `8295eba6cb5b24028aa586d51c8a6a1fac4b0bca`
- Working tree at audit start: clean
- App: `http://localhost:3001` returned HTTP 200 and rendered the real dashboard
- EditorialPost(real): 617
- EditorialMention(real): 2781
- Direct relation instances: 179
- Bundles: 89
- Independent repeated: 18
- Multi-source independent: 16
- Publisher-family-diverse: 10
- Current primary: `화이트 SKIRT`
- Canonical duplicates: 0
- Mention duplicates: 0
- Market (`dataMode="real"`): 667
- Scheduler: Ready/enabled; last result 0; next run 2026-09-14 08:30 KST; action and working directory match the documented wrapper

The first sandboxed scheduler lookup was access-denied and therefore not treated as evidence. The values above were re-read from the host Task Scheduler with read-only access.

## 2. Rendered planner-experience audit

The home page was inspected as a real rendered document at a 1280×720 browser viewport, not inferred only from JSX.

### What is currently visible

- Total rendered page height: 2,465px.
- Rendered `<img>` count: **0**.
- The header/filter block starts at the top and is about 249px tall.
- `Current Signal` starts around 337px and shares a roughly 587px text-only section with `New Observations`.
- The broad `Item Signals` list starts around 940px and occupies about 1,051px.
- Store/data-status material comes later, after the primary item/bundle story.

### Product conclusion

The page has already improved from a broad-category-only dashboard: `화이트 SKIRT` and the next four exact bundles answer with an item plus direct attributes. But it still asks the planner to understand the trend entirely through text, dots, counts, and English subtitles. The page does not yet let the planner recognize silhouettes, styling context, or repeated visual motifs before reading.

The broad `Item Signals` section also consumes more vertical space than the planning-ready bundle story. It remains useful as supporting evidence, but it should not be the dominant visual object in a visual-first version.

## 3. Existing image inventory and its honest meaning

The real fashion-relevant corpus has 587/587 article-level image URLs (100% coverage):

| Source | Fashion-relevant posts | With article image | Stored image host |
|---|---:|---:|---|
| EYESMAG | 109 | 109 | `cdn.eyesmag.com` |
| HYPEBEAST_KR | 160 | 160 | `image-cdn.hypb.st` |
| NONLABEL | 6 | 6 | `cdn.imweb.me` |
| VISLA | 6 | 6 | `visla.kr` |
| ESQUIRE_KR | 80 | 80 | `www.esquirekorea.co.kr` |
| HARPERSBAZAAR_KR | 84 | 84 | `www.harpersbazaar.co.kr` |
| COSMOPOLITAN_KR | 82 | 82 | `www.cosmopolitan.co.kr` |
| MARIECLAIRE_KR | 60 | 60 | `img.marieclairekorea.com` |

Across the current 89 bundles:

- 89 have at least one evidence article with an article hero image.
- The retained top-five evidence lists contain 129 article references; all 129 have article hero images.
- **0 bundles have an image structurally bound to the direct attribute evidence text.**

This is not missing UI wiring. The current collectors flatten text and discard paragraph/image position. `contentBlocksFromStoredText()` therefore correctly produces no image-bearing block, and `resolveEvidenceImage()` correctly returns `NONE` for real data.

### Safe semantic reuse now

Existing `EditorialPost.imageUrl` values may be shown only as **article-level visual context**, attached to the corresponding publisher/title/date/link. The item detail page already uses this exact model in its `Evidence` list.

They must not be:

- promoted as the hero image of `화이트 SKIRT` or another bundle;
- captioned as proof that the pictured garment has the direct attribute;
- used by image frequency to change bundle order or evidence strength;
- interpreted as a mood/style claim unless a direct STYLE relation exists in text;
- cached, cropped, transformed, or redistributed under an assumed license.

“Semantically safe” is not the same as “rights-cleared.” The stored URLs are public publisher/CDN URLs and are technically reusable as linked thumbnails in this local internal tool, but public accessibility does not itself grant reproduction rights. A broader deployment needs a rights/terms review. The conservative implementation is source attribution, article link, no local copy, no transformation, and graceful failure when a remote image disappears.

## 4. The evidence lanes must stay separate

The visual-first surface should render four visibly distinct lanes. Counts and labels must never cross lanes.

| Lane | What it may say | Current source | Ranking impact |
|---|---|---|---|
| Direct text relation | Item plus directly attached color/material/detail/style | Existing direct relation extractor and bundles | Existing frozen bundle sort only |
| Direct visual evidence | Image is in the same or adjacent stored content block as the evidence text | None in real data today | None until separately reviewed |
| Editorial visual context | This image represents the cited article and may provide styling context | Existing `EditorialPost.imageUrl` | None |
| Visual diffusion | Public/authorized Instagram imagery suggests repeated real-wear styling | Future separate source and review workflow | Never treated as sales or direct-relation proof |
| Store reference | Ranked/assorted product evidence under existing Market semantics | Existing Market data | Existing Market surface only |

The UI should not use color alone to distinguish the lanes. Every image needs an explicit text label and source link.

## 5. Home-screen representation contract

The first viewport should answer in this order:

1. **ITEM** — Korean specific-item label is the primary noun.
2. **DIRECT ATTRIBUTES** — dimension-labelled chips from the exact bundle only.
3. **MOOD/STYLE** — show only a direct STYLE relation. Otherwise say `직접 무드 근거 없음`; do not infer mood from photography.
4. **VISUAL EVIDENCE** — direct/adjacent evidence image when one truly exists.
5. **EDITORIAL VISUAL CONTEXT** — a small multi-image strip of cited article heroes, explicitly labelled `기사 대표 이미지 · 아이템/속성 직접 증거 아님`.
6. Concise strength/source/date copy, then detailed counts below the first viewport.

Do not select one article hero as a dominant bundle hero. A contact-sheet treatment is safer because it visually communicates “several cited articles” rather than “this is the product.” The existing primary bundle and ranking order remain unchanged.

## 6. Smallest safe UI implementation after review

Because the standing UI freeze requires an explicit review gate, this audit does not change JSX or CSS. The smallest later patch should be one UI-only vertical slice:

- Add an `EditorialVisualContextStrip` to the existing `CurrentSignalHero`.
- Read only `bundle.evidenceArticles`; do not query or rank anything new.
- Include at most three newest article hero images with publisher, date, and article link.
- Keep `BundleHeroImage` restricted to `evidenceImageUrl` (`DIRECT_BLOCK`/`ADJACENT_BLOCK`) exactly as today.
- Add the permanent disclaimer `기사 대표 이미지 · 아이템/속성 직접 증거 아님` above the strip.
- Render an explicit `직접 연결된 이미지 없음` state in the direct-visual lane rather than silently substituting an article hero.
- Show a direct STYLE chip as mood; otherwise show `직접 무드 근거 없음`.
- Move no section, change no rank, and touch no collector/schema in this first patch.

Acceptance checks for that patch:

- `화이트 SKIRT` remains primary on the current corpus.
- No article hero reaches `BundleHeroImage`.
- Removing all `imageUrl` values leaves the signal text and evidence counts unchanged.
- Image failures do not collapse layout or hide source/title links.
- Keyboard focus reaches every image/article link; alt text describes the article, not an asserted item.
- Home at desktop and narrow viewport has no horizontal overflow.
- `corepack pnpm typecheck`, relevant pure tests, `corepack pnpm test`, and `corepack pnpm build` pass.
- Real rendered screens are inspected after implementation.
- Read-only audit remains Canonical Duplicates 0, Mention Duplicates 0, Market(real) 667.

## 7. Instagram/editorial-Instagram feasibility

Checked against Meta's current official Instagram API collection on 2026-09-11:

- The supported APIs are for Instagram professional accounts (Business/Creator), not arbitrary consumer accounts.
- Instagram Login requires a Meta app and user access token; the current permission name for basic professional-account access is `instagram_business_basic`.
- Facebook Login can expose owned/authorized professional media, @mentions, hashtagged media, and limited metadata about other professional accounts. It cannot access consumer accounts, does not support result ordering, and only User Insights supports time-based pagination.
- A production app serving professional accounts it does not own/manage can require Advanced Access/App Review.

Primary reference: Meta's official [Instagram API collection](https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api) and [Instagram API with Facebook Login](https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login).

### Feasible paths

1. **Owned/partner magazine accounts:** use the official API only after the account owner authorizes the app. Best long-term route for editorial-Instagram visuals.
2. **Professional-account/hashtag research:** a narrow proof of concept may be possible through the official Facebook Login API, subject to app permissions/review and returned-field limits. It is not a complete “what everyone is wearing” feed.
3. **Planner-curated permalinks:** store only a human-selected public permalink plus source/account and review notes; display an official embed or outbound link only when its terms permit that display. Do not derive automated analytics from oEmbed metadata/content.
4. **Licensed feed or direct publisher agreement:** preferred when persistent thumbnails, caching, transformation, or wider internal distribution are required.

### Not acceptable

- Logged-in browser automation, private endpoints, rotating accounts/proxies, or scraping around access restrictions.
- Treating likes, views, post counts, or hashtag frequency as verified demand or sales.
- Collecting arbitrary personal-account outfit images as if the professional-account API covered them.
- Persisting image binaries or face/profile data before a privacy/retention review.
- Using Instagram oEmbed content as an analytics corpus; Meta documents oEmbed for front-end display, not extraction/persistence/derived analytics.

Meta describes unauthorized automated collection as scraping and actively rate-limits/blocks it; see Meta's [data scraping guidance](https://www.facebook.com/help/463983701520800). Instagram's community guidance also states that users should share only media they own or have the right to share; see the [Instagram Community Guidelines](https://www.facebook.com/help/477434105621119?locale=en_GB). These are product-risk boundaries, not a substitute for legal advice.

## 8. Staged delivery plan

### Before the 2026-09-14 P0 observation

- Complete this audit and freeze the lane/copy contract.
- If explicitly approved after review, implement only the existing-image context strip described in Section 6.
- Do not add a collector, token, schema, taxonomy term, ranking key, or scheduled job.

### After a healthy natural P0 run

- Validate the small context-strip patch against the newly refreshed corpus if it was approved.
- Design block-level editorial storage/collection as a Category B proposal. It must preserve source document order and image adjacency; it requires separate schema/collector review before implementation or re-collection.
- Define a human-reviewed visual-observation model separate from `EditorialMention` and `MarketRankingSnapshot`.
- Run a narrow official-API feasibility spike only after a Meta app/account owner and permissions are available. No credentials belong in git.
- Obtain an explicit rights/privacy decision before caching or computer-vision analysis of third-party images.

## 9. Decision

The current data is already sufficient to make the dashboard **more visual without weakening trust**, but only by showing article heroes as a clearly separated editorial-context strip. It is not sufficient to provide a truthful bundle hero image or visual-derived mood. The next implementation should therefore be the small, labelled context strip after review; block-level editorial images and Instagram diffusion remain separate post-P0 architecture tracks.
