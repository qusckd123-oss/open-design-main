# Korea STORE Source Deep Audit

Checked date: 2026-09-03

Goal: confirm at least one domestic (Korea) source where product order is a real, official BEST/인기/랭킹 (ranking) semantic - not a catalog/collection/recommendation order - and reachable through public HTML, public structured data, or a documented public feed without bypassing access controls.

This audit does not use login-only data, CAPTCHA bypasses, private/undocumented app API reverse engineering, robots.txt whitelist evasion (e.g. impersonating a different named crawler), or rate-limit evasion. All requests below used the project's own collector identity (`TrendSignalDashboard/0.1 (+local market audit)`).

Order followed: PUBLIC ACCESS -> RANKING SEMANTIC -> data-shape verification. A source only qualifies as `SUPPORTED` if it satisfies every condition in `README.md` (see "Ranking Scope") and every condition below.

## Summary

| Source | Target URL | Status | Ranking Semantic | Ranking Verified | Ranking Scope | Gender Support | Public HTML | Structured Data | robots.txt | Collection Method | 10-20 Relevance | UNI Relevance | WOMEN Relevance | Reason |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| 29CM | https://www.29cm.co.kr/store/best-items | PARTIAL | Official 베스트 (BEST) page exists, semantic is genuine | false | N/A (not collectible) | Category param exists (`gender`) but unreachable | Yes (200, no challenge) | None - `__NEXT_DATA__.props.pageProps.dehydratedState.queries` is empty; no JSON-LD product data on best page or homepage | Allowed (`User-agent: *` `Allow: /`, target route not disallowed) | None implemented | High | Medium | High | Public HTML/SSR carries zero product rows. The visible ranking list is populated client-side by an undocumented internal API (`/api/v4/best/items`-style). Rule 7/8 fail - collector not implemented. |
| W Concept | https://www.wconcept.co.kr/Best | RESTRICTED | Not evaluated (blocked before data check) | false | N/A | N/A | Not fetched (robots-blocked) | Not fetched | Strict whitelist: `User-agent: *` -> `Disallow: /`; only named crawlers (Googlebot, Bingbot, NaverBot, named AI bots, etc.) are allowed | None implemented | High (WOMEN-led catalog) | Medium | Very High | robots.txt disallows every path for any UA not explicitly whitelisted. Our collector identity is not whitelisted; using a whitelisted bot's name would be access-restriction evasion, which is explicitly out of scope. |
| EQL | https://www.eqlstore.com | RESTRICTED | Not evaluated (blocked before data check) | false | N/A | N/A | Not fetched (robots-blocked) | Not fetched | Strict whitelist: `User-agent: *` -> `Disallow: /`, `Allow: /$` (homepage only) + favicon; only named crawlers get broader access | None implemented | Medium (contemporary/designer) | Medium | Medium | Same pattern as W Concept - full-site disallow for any non-whitelisted UA, homepage only. |
| ZIGZAG | https://zigzag.kr/categories | PARTIAL | Not verifiable - no product data reachable at all | false | N/A | N/A | Yes (200, no challenge) | None - homepage `dehydratedState` has 1 prefetched query (`["banner","list"]`, a banner carousel) and zero product queries; `/categories` has 0 prefetched queries | Allowed (`User-agent: *` `Allow: /`; only `GPTBot` disallowed) | None implemented | Very High | High | High | robots.txt is open, but the entire product/category browsing surface is client-hydrated through ZIGZAG's internal app API with no SSR fallback and no static HTML rows. Nothing here is collectible without that private API. |
| ABLY | https://a-bly.com | RESTRICTED | Not evaluated (blocked before data check) | false | N/A | N/A | Not fetched (robots-blocked) | Not fetched | `User-agent: *` -> `Allow: /$` + `Allow: /app*`, else `Disallow: /`; only `Googlebot`/`Mediapartners-Google` get the full site | None implemented | Very High | High | Very High | robots.txt restricts non-Google UAs to the bare homepage and `/app*`; no ranking/category page is reachable for our collector identity without impersonating Googlebot, which is out of scope. |

## Evidence detail

### 29CM

- `robots.txt`: `User-agent: *` / `Allow: /` with a short disallow list (`/embed/`, `/my-page/`, `/order/`, `/auth/`, `/inbox/`, `/content/post/preview`). `/store/best-items` is not disallowed.
- `GET https://www.29cm.co.kr/store/best-items` -> `200 OK`, `Server: cloudflare`, 112 KB of real page HTML (title "베스트 - 29CM", full meta/OG tags) - not a bot-challenge page.
- The page contains exactly one `<script id="__NEXT_DATA__">` payload. Its `props.pageProps.dehydratedState.queries` array has length 0 - no React Query state was hydrated server-side, so no product/rank/brand/price fields exist anywhere in the response body (`rank`, `productName`, `goodsNo`, `itemId`, `price` all return zero matches).
- The 29CM homepage (`/`, 822 KB) has no `__NEXT_DATA__` script at all and only one JSON-LD block (`@type: Organization` - brand metadata, not products).
- Conclusion: the previously-documented internal API shape (`/api/v4/best/items` with `periodSort`, `categoryList`, `gender`, `limit`, `offset`) is confirmed to be the only path to this data, and it remains undocumented/private. Per the audit rule ("private undocumented API를 직접 collector로 사용하지 않음"), no collector is implemented. Status stays `PARTIAL`.

### W Concept

- `robots.txt` is an explicit "Whitelist Only" policy (its own header comment: `# - 지정된 User-Agent만 Allow` / `# - 그 외 모든 UA는 Disallow`). Every named block (search engines, ad/commerce bots, SNS preview bots, listed AI crawlers, infra bots) gets `Allow: /`; the catch-all `User-agent: *` block is `Disallow: /`.
- Our collector's own identity is not on any allowed list, so every page - including any BEST/ranking page - is robots-disallowed for it. No further public-HTML/structured-data check was performed, per the audit's own ordering (PUBLIC ACCESS must pass before ranking-semantic verification).
- Status: `RESTRICTED`.

### EQL

- `robots.txt` follows the identical pattern: named search/AI crawlers get `Allow: /`; `User-agent: *` gets `Disallow: /` with only `Allow: /$` (exact homepage) and the favicon/`.well-known` asset carved out.
- Status: `RESTRICTED`.

### ZIGZAG

- `robots.txt`: `User-agent: *` / `Allow: /`, with only `GPTBot` disallowed. This passes the robots gate cleanly.
- `GET https://zigzag.kr/` -> `200 OK`, 66 KB HTML, real page (title "지그재그 스토어"). `__NEXT_DATA__` is present; `dehydratedState.queries` has exactly one entry, `["banner", "list"]` - a homepage banner carousel, not products.
- `GET https://zigzag.kr/categories` -> `200 OK`, 33 KB HTML, `__NEXT_DATA__` present but `dehydratedState.queries` has length 0.
- No JSON-LD, no other embedded script IDs beyond `__NEXT_DATA__`, and only static nav links (`/`, `/cart`, `/categories`, `/home`, `/my-page`, `/picks`, `/search`) appear in raw HTML - no product/ranking URLs are exposed as plain links either.
- Conclusion: ZIGZAG's entire catalog (including any BEST/랭킹 section) is populated purely client-side via its internal API after hydration. Nothing product-shaped exists in public HTML or SSR state. Status: `PARTIAL` (robots is open, but there is no public data to collect without the private API).

### ABLY

- `robots.txt`: `User-agent: *` gets `Allow: /$` (bare homepage) + `Allow: /app*`, else `Disallow: /`. Only `Googlebot` and `Mediapartners-Google` get `Allow: /` more broadly (still with `/api/*` and `/markets/*/info` disallowed even for Googlebot).
- No ranking/category page is reachable under our own collector identity. Status: `RESTRICTED`.

## Outcome

No source audited in this pass reached `SUPPORTED`. All five fail at one of the two hard gates the task defines:

- **Access gate** (W Concept, EQL, ABLY): robots.txt explicitly disallows the collector's own honest identity from anything beyond the homepage (or nothing at all). The only way through would be to impersonate a differently-named, whitelisted crawler - which the task explicitly rules out as access-restriction evasion.
- **Data gate** (29CM, ZIGZAG): robots.txt is open and the target pages return real `200` HTML, but the actual ranking/BEST product list is not present anywhere in the public HTML, SSR payload, or structured data - it is loaded exclusively by an internal, undocumented app API after client-side hydration. Using that API would violate the "private undocumented API를 직접 collector로 사용하지 않음" rule.

Per the task's own priority ("수집 가능성보다 ranking semantic 검증이 우선이다" and "숫자를 맞추기 위해 억지 구현 금지"), no collector was implemented this pass. Domestic verified STORE ranking sources remain at 0. See the final report in the conversation for recommended next steps (official partner/affiliate API access is the only path that does not require bypassing any of the above).
