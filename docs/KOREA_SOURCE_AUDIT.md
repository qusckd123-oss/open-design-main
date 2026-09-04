# Korea Trend + Store Source Audit

Last verified: 2026-09-02.

This audit separates STORE, EDITORIAL, and ASSORTMENT semantics. `rankingVerified=true` is allowed only when an official ranking/best/popular page confirms ranking semantics and public, allowed HTML exposes stable ordered products. Instagram-only sources are not scraped.

| Source | Country | Source Type | Target URL | Data Type | Signal Type | Ranking Semantic | Ranking Verified | Gender Available | Public Access | robots.txt | Official API | Structured Data | Collection Method | Status | Reason | 10-20 Relevance | UNI Relevance | WOMEN Relevance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 053MAG | Korea | Editorial/Social | `https://www.053mag.com/` | UNKNOWN | EDITORIAL | N/A | NO | UNKNOWN | PARTIAL | robots 401 | Not found | Not verified | Not collected | PARTIAL | Official web returned launch/coming-soon style page; Instagram cannot be scraped without unofficial access. | Medium | Medium | Low |
| NONLABEL | Korea | Editorial | `https://nonlabel.co.kr/archive?category=FASHION` | Fashion/archive listing | EDITORIAL | N/A | NO | UNKNOWN/MIXED inferred only from explicit text | YES | ALLOW except auth/admin | Not used | HTML meta/OG article pages | Public HTML listing + article pages | SUPPORTED | Public fashion/archive listing exposes article URLs; article pages expose title, published time, image, and description/body via public HTML/meta. | High | High | Medium |
| GLOWUP | Korea | Editorial | `https://www.glowupmag.com/` | Article listing | EDITORIAL | N/A | NO | UNKNOWN | YES | robots 404 | Not used | Embedded JSON present | Candidate HTML listing | PARTIAL | Public site opens; content is broader culture/interview, fashion signal usefulness is lower and category extraction needs more validation. | Medium | Medium | Low |
| PAP Magazine | Korea | Editorial | `https://www.pap-magazine.com/en` | Article listing | EDITORIAL | N/A | NO | UNKNOWN | YES | ALLOW except admin/auth/api | Not used | Embedded JSON present | Candidate HTML listing | PARTIAL | Public magazine page opens and has recent stories, but fashion/category filtering is not stable enough yet for automatic mention scoring. | Medium | Medium | Medium |
| EYESMAG | Korea | Editorial | `https://www.eyesmag.com/sitemap.xml` | Monthly post sitemaps + article pages | EDITORIAL | N/A | NO | UNKNOWN/MIXED inferred only from explicit text | YES | ALLOW except admin | Not used | Sitemap index + JSON-LD NewsArticle | Public sitemap index/monthly post sitemap + article pages | SUPPORTED | Sitemap index exposes monthly post sitemaps; article pages expose canonical URL, title, date, image, and body/description. Fashion relevance is filtered by item/style/brand mention evidence; stale sitemap article URLs are skipped. | High | High | Medium |
| HYPEBEAST Korea | Korea | Editorial | `https://hypebeast.kr/fashion/feed` | Fashion RSS posts | EDITORIAL | N/A | NO | UNKNOWN/MIXED inferred only from explicit text | YES | ALLOW for public feed/page; search/admin paths restricted | Not used | RSS | Public Fashion RSS feed | SUPPORTED | Official Fashion RSS exposes title, date, link, and article body/excerpt. Useful for Korean fashion/editorial mention signal. | High | High | Medium |
| VISLA Magazine | Korea | Editorial | `https://visla.kr/category/news/fashion/feed/` | Fashion RSS posts | EDITORIAL | N/A | NO | UNKNOWN/MIXED inferred only from explicit text | YES | ALLOW except wp-admin | Not used | RSS | Public RSS feed | SUPPORTED | Official Fashion category RSS exposes title, date, link, guid, and text. Useful for fashion item/style mention baseline. | Medium | Medium | Low |
| DAZED Korea | Korea | Editorial | `https://dazedkorea.com/fashion/` | Fashion page | EDITORIAL | N/A | NO | WOMEN/MIXED possible by article | YES | ALLOW except wp-admin | Not used | WordPress page | Candidate HTML | PARTIAL | Fashion page opens, but `/fashion/feed/` returns comment feed with no article items. Needs HTML parser before REAL collection. | High | Medium | High |
| W Korea | Korea | Editorial | `https://www.wkorea.com/fashion/` | Fashion page | EDITORIAL | N/A | NO | WOMEN possible | YES | Public page opens; robots blocks several AI/scraping bots but not all agents | Not used | WordPress page | Not collected | PARTIAL | Public page opens, but feed route redirected to HTML and bot-specific restrictions require conservative handling. | High | Low | High |
| Vogue Korea | Korea | Editorial | `https://www.vogue.co.kr/fashion` | Fashion page | EDITORIAL | N/A | NO | WOMEN possible | YES | Public page opens; robots blocks several AI/scraping bots but not all agents | Not used | WordPress page | Not collected | PARTIAL | Public page opens, but feed route did not provide stable RSS article items. | High | Low | High |
| GQ Korea | Korea | Editorial | `https://www.gqkorea.co.kr/` | Fashion candidate | EDITORIAL | N/A | NO | MEN possible | PARTIAL | Public root; tested fashion path 404/comment feed | Not used | WordPress | Not collected | PARTIAL | Men's editorial relevance is high, but stable fashion listing/feed was not verified. MEN should not be auto-included in UNI. | Medium | Low | Low |
| Esquire Korea | Korea | Editorial | `https://www.esquirekorea.co.kr/fashion` | Fashion page | EDITORIAL | N/A | NO | MEN possible | YES | ALLOW except listed event/articles; AI bot disallow rules exist | Not used | HTML | Not collected | PARTIAL | Fashion page opens, but feed returned system error; MEN content should not be converted to UNI. | Medium | Low | Low |
| MUSINSA | Korea | Store | `https://www.musinsa.com/ranking/archive` | Monthly/category ranking candidate | STORE | Official title says monthly ranking and gender/category TOP30 | Candidate YES, not collectable here | YES | YES | User-agent `*` disallows `/` | Not used | Next data | Not collected | RESTRICTED | Strong ranking semantic, but robots for generic collectors disallows all paths; no automated collection. | Very High | High | High |
| 29CM | Korea | Store | `https://www.29cm.co.kr/store/best-items` | Best items page | STORE | Official BEST page with real-time/daily/weekly/monthly tabs | Candidate YES, not connected | WOMEN/MEN/category possible | YES | ALLOW except auth/embed/private paths | Frontend static JS references `/api/v4/best/categories` and `/api/v4/best/items`; direct same-origin test returned HTML 404, no documented public API confirmed | Next shell only; no SSR product rows | Not collected | PARTIAL | Official BEST semantic is clear, but product rows are client/API dependent and no stable documented public endpoint was verified. Do not connect as rankingVerified until a non-private stable product source is confirmed. | High | Medium | High |
| KREAM | Korea | Store | `https://kream.co.kr/` | Popular candidate | STORE | Not verified | NO | UNKNOWN | NO | robots/page returned HTTP 500 in audit environment | Not used | Not verified | Not collected | RESTRICTED | Public access failed; likely app/private API dependency. | High | High | Medium |
| EQL | Korea | Store | `https://www.eqlstore.com/` | Best/category candidate | STORE | BEST labels visible in nav | Not verified | WOMEN/MEN visible | YES | User-agent `*` disallows `/` except root/favicon/assetlinks | Not used | HTML | Not collected | RESTRICTED | Gender/category nav exists, but generic robots disallows collection paths. | Medium | Medium | High |
| W Concept | Korea | Store | `https://event.wconcept.co.kr/event/116057` | Event real-time ranking | STORE | Event title says real-time ranking | Candidate only | WOMEN/MEN sections visible | YES | Main domain user-agent `*` disallows `/`; event subdomain needs separate policy before use | Not used | HTML | Not collected | PARTIAL | Ranking semantic exists in event page, but event-specific temporary route and robots/domain ambiguity make it unsuitable for stable collector now. | High | Low | High |
| ZIGZAG | Korea | Store | `https://zigzag.kr/brand/shop-list` | Brand ranking | STORE | Brand ranking only, not product ranking | NO | WOMEN dominant | YES | ALLOW for `*`; GPTBot disallowed | Not used | Next/JSON | Not collected | PARTIAL | Useful for brand signal, not direct product/item STORE signal. | High | Low | High |
| ABLY | Korea | Store | `https://m.a-bly.com/` | App commerce | STORE | Not verified | NO | WOMEN dominant | NO | robots blocked with 403/security page | Not used | Not verified | Not collected | RESTRICTED | Security page/CAPTCHA-like block; do not bypass. | High | Low | High |
| SSF SHOP | Korea | Store | `https://www.ssfshop.com/` | Best candidate | STORE | Not verified | NO | WOMEN/MEN possible | YES | User-agent `*` disallows `/` | Not used | HTML | Not collected | RESTRICTED | Public root opens but robots disallows generic collection. | Medium | Medium | Medium |
| WORKSOUT | Korea | Store | `https://www.worksout.co.kr/` | Catalog | ASSORTMENT | No verified ranking page found | NO | UNKNOWN | YES | ALLOW | Not used | Next/JSON | Not collected | PARTIAL | Strong street relevance, but tested `/best` was 404 and no official ranking route was verified. | High | High | Low |
| KASINA | Korea | Store | `https://www.kasina.co.kr/best` | BEST page | STORE | BEST page exists, ranking semantic not yet verified as sales/popularity | Candidate only | UNKNOWN | YES | ALLOW except my-page/pick-out-jordan | Not used | Next/JSON | Not collected | PARTIAL | High street/sneaker relevance; needs product order semantic verification before rankingVerified. | High | High | Low |
| HEIGHTS | Korea | Store | `https://heights-store.com/` | Catalog/ranking labels | ASSORTMENT/STORE candidate | Site text includes ranking 기준, but stable target route not verified | NO | WOMEN/MEN visible | YES | ALLOW for public pages; admin/api/member disallowed | Not used | HTML | Not collected | PARTIAL | Strong Korean designer relevance, but stable product ranking route and ordered data need validation. | High | Medium | High |
| END | Overseas | Store | `https://www.endclothing.com/us/clothing/clothing-bestsellers` | BEST_SELLER | STORE | Official Clothing Bestsellers | YES | MEN/UNKNOWN by page | YES | ALLOW | Not used | Next data | Existing collector | SUPPORTED | Existing verified ranking source. | Medium | Medium | Low |
| RAKUTEN_FASHION | Japan | Store | `https://brandavenue.rakuten.co.jp/ranking/` | RANKING | STORE | Official sitewide fashion ranking | YES | Product breadcrumb possible | YES | ALLOW | Not used | HTML/LD JSON | Existing collector | SUPPORTED | Existing verified ranking source. | Medium | Medium | Medium |
| SLAM_JAM | Overseas | Store | Shopify collection JSON | COLLECTION_ORDER | ASSORTMENT | Not ranking | NO | UNKNOWN | YES | ALLOW | Shopify JSON | JSON | Existing collector | SUPPORTED | Existing assortment source. | Medium | Medium | Low |
| STUSSY | Overseas | Store | Shopify collection JSON | COLLECTION_ORDER | ASSORTMENT | Not ranking | NO | UNKNOWN | YES | PARTIAL | Shopify JSON | JSON | Existing collector | SUPPORTED | Existing assortment source. | High | High | Low |
| SSENSE | Overseas | Store | `https://www.ssense.com/` | POPULAR candidate | STORE | Trending sort requires disallowed query/API path | NO | WOMEN/MEN possible | YES | DISALLOW for sort/API | Not used | Not collected | Not collected | RESTRICTED | Existing audit: do not use sort/API workarounds. | High | Medium | High |
| ZOZOTOWN | Japan | Store | `https://zozo.jp/ranking/` | Ranking candidate | STORE | Official ranking candidate, not reliably retrievable | NO | WOMEN/MEN possible | PARTIAL | UNKNOWN | Not used | Not collected | Not collected | RESTRICTED | Existing audit: environment access unreliable. | High | Medium | High |
| WEAR | Japan | Editorial/Social | `https://wear.jp/ranking/` | General ranking candidate | SOCIAL | General coordinate ranking, item/store semantic unclear | NO | MIXED possible | YES | PARTIAL | Not used | Not collected | Not collected | PARTIAL | Existing audit: stable item/category route not identified. | Medium | Medium | Medium |
| BEAMS | Japan | Store/Editorial | Not audited | UNKNOWN | UNKNOWN | Not audited | NO | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Not collected | NOT_AUDITED | Deferred by scope. | Medium | Medium | Medium |
| GR8 | Japan | Store | Not audited | UNKNOWN | UNKNOWN | Not audited | NO | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Not collected | NOT_AUDITED | Deferred by scope. | Medium | Medium | Low |
| HBX | Overseas | Store | Not audited | UNKNOWN | UNKNOWN | Not audited | NO | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Not collected | NOT_AUDITED | Deferred by scope. | Medium | Medium | Low |

## Gender Semantics

- Internal source/content gender uses `UNISEX`, `WOMEN`, `MEN`, `MIXED`, `UNKNOWN`.
- Editorial stores both post-level `audienceGender` and mention-level `audienceGender`.
- User-facing planning filters should remain simple: `전체`, `UNI`, `WOMEN`.
- MEN content is not automatically included in UNI.
- UNKNOWN remains low-confidence and should be displayed separately or excluded from default planning scores.
- Gender inference priority: official source gender/category, official breadcrumb, official department, product/article metadata, clear title/text keyword, then `UNKNOWN`.

## Editorial Source Roles

- `HYPEBEAST_KR`: fast fashion news, brand, collab, culture crossover.
- `VISLA`: subculture, street, fashion commentary.
- `EYESMAG`: fashion news, brand campaign, item/collab mentions.
- `NONLABEL`: archive, Korean brand/style, vintage/subculture.

## 29CM Deep Audit

- Target: `https://www.29cm.co.kr/store/best-items`.
- robots.txt: `User-agent: *` allows public paths except embed/auth/order/my-page/inbox/preview paths.
- Ranking semantic: official page title and UI text confirm `BEST` with real-time/daily/weekly/monthly tabs.
- Ranking scope: not connected; likely category/period scoped but product rows were not available in server-rendered HTML.
- Public HTML: page shell and `__NEXT_DATA__` are accessible, but dehydrated queries are empty and no product rows were present.
- Static JS: public chunk references `/api/v4/best/categories` and `/api/v4/best/items` with `periodSort`, `categoryList`, `gender`, `limit`, and `offset`.
- Endpoint test: direct same-origin `/store/api/v4/best/items?...` returned HTML 404 in the audit environment.
- Decision: `PARTIAL`. Do not implement as a verified STORE source until a stable, documented or clearly public product endpoint/HTML source is confirmed.

## Supported For Initial REAL Collection

- EDITORIAL: `VISLA`, `HYPEBEAST_KR`, `EYESMAG`, `NONLABEL`.
- STORE: no new Korean store is connected in this pass. `MUSINSA` has strong ranking semantic but is robots-restricted for generic collection. `29CM` is the best next candidate, but stable public product rows were not verified without client/API calls.

## Data Semantics

- STORE SIGNAL: official ranking/best/popular pages only.
- EDITORIAL SIGNAL: article/post mention count, source spread, and momentum by item/sub-item/detail/material/color/style/brand.
- ASSORTMENT SIGNAL: catalog/collection presence, not ranking or sales.
