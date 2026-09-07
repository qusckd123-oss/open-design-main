import { editorialSourceConfigs, type EditorialSource } from "@/config/editorial-sources";
import { inferEditorialGender } from "@/collectors/editorial/gender";
import { extractEditorialMentions } from "@/collectors/editorial/mentions";

export type EditorialCollectedPost = {
  source: EditorialSource;
  externalPostId: string;
  url: string;
  canonicalUrl: string;
  title: string;
  publishedAt: Date | null;
  imageUrl: string | null;
  excerpt: string | null;
  text: string | null;
  audienceGender: string;
  fashionRelevance: "FASHION_RELEVANT" | "NON_FASHION" | "UNKNOWN";
  mentions: ReturnType<typeof extractEditorialMentions>;
};

export type EditorialCollectOptions = {
  days?: number;
  /** Canonical URLs already stored; discovery still lists them but they are not re-fetched. */
  skipUrls?: Set<string>;
};

export async function collectEditorialFeed(source: EditorialSource, limit = 30, options: EditorialCollectOptions = {}): Promise<EditorialCollectedPost[]> {
  const config = editorialSourceConfigs[source];
  if (source === "EYESMAG") return collectEyesmag(limit, options);
  if (source === "NONLABEL") return collectNonlabel(limit);
  if (source === "VISLA") return collectVisla(limit, options);
  // HYPEBEAST_KR's RSS feed only ever exposes the newest items, so `--days`
  // could filter but never reach back - which is why the corpus held ~2 days of
  // the single highest attribute-density source. When a window IS requested we
  // switch to the site's own public monthly sitemaps, exactly as EYESMAG
  // already does. The default (no `days`) path stays on RSS, unchanged.
  if (source === "HYPEBEAST_KR" && options.days) return collectHypebeastHistorical(limit, options.days, options.skipUrls);
  const response = await fetch(config.feedUrl, {
    headers: {
      "User-Agent": "TrendSignalDashboard/0.1 (+editorial source audit)",
      Accept: "application/rss+xml, application/xml, text/xml, */*"
    }
  });
  if (!response.ok) throw new Error(`${source} feed request failed: HTTP ${response.status}`);
  const xml = await response.text();
  const items = parseRssItems(xml)
    .filter((item) => isInsideDays(item.pubDate, options.days))
    .slice(0, limit);
  return items.map((item) => {
    const text = stripHtml(item.content || item.description || "");
    const title = decodeEntities(stripHtml(item.title));
    const url = canonicalizeUrl(item.link || item.guid || "");
    const imageUrl = extractImage(item.content || item.description || "");
    // VISLA is handled by collectVisla above; this generic path now only
    // ever runs for HYPEBEAST_KR.
    const sourceCategory = source === "HYPEBEAST_KR" ? "fashion" : null;
    const audienceGender = inferEditorialGender({ sourceCategory, title, text });
    const mentions = extractEditorialMentions({ title, text, postGender: audienceGender });
    const fashionRelevance = classifyFashionRelevance({ sourceCategory, title, text, mentionCount: mentions.length });
    // HYPEBEAST_KR's RSS guid is a permalink on a DIFFERENT host
    // (kr.hypebeast.com/?post=NNN) than the canonical article URL, so keying
    // identity on the guid stores the same article twice once historical
    // sitemap collection also runs. The canonical URL is the one identity both
    // discovery paths agree on, so it wins for this source.
    const externalPostId = source === "HYPEBEAST_KR" ? url || item.guid || title : item.guid || url || title;
    return {
      source,
      externalPostId,
      url,
      canonicalUrl: url,
      title,
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
      imageUrl,
      excerpt: text.slice(0, 280) || null,
      text: text || null,
      audienceGender,
      fashionRelevance,
      mentions
    };
  }).filter((post) => post.url && post.title && post.fashionRelevance !== "NON_FASHION");
}

async function collectEyesmag(limit: number, options: EditorialCollectOptions): Promise<EditorialCollectedPost[]> {
  const config = editorialSourceConfigs.EYESMAG;
  const entries = await getEyesmagEntries(options.days);
  const posts: EditorialCollectedPost[] = [];
  for (const entry of entries) {
    if (posts.length >= limit) break;
    try {
      const html = await fetchText(entry.url);
      const article = parseArticlePage(html, entry.url);
      const title = article.title || entry.title;
      // parseArticlePage's `text` is the SEO meta description (a one-line
      // tagline, ~15 chars median on EYESMAG) - not the article body. The
      // real body is publicly embedded as a TipTap editor document in the
      // page's own Next.js hydration payload (__NEXT_DATA__), which every
      // browser loading the page already receives. Prefer it when present.
      const richBody = parseEyesmagRichBody(html);
      const text = (richBody && richBody.length > article.text.length ? richBody : article.text) || "";
      const audienceGender = inferEditorialGender({ title, text });
      const mentions = extractEditorialMentions({ title, text, postGender: audienceGender });
      const fashionRelevance = classifyFashionRelevance({ title, text, mentionCount: mentions.length });
      if (fashionRelevance !== "FASHION_RELEVANT") continue;
      posts.push({
        source: "EYESMAG",
        externalPostId: article.canonicalUrl || entry.url,
        url: article.canonicalUrl || entry.url,
        canonicalUrl: article.canonicalUrl || entry.url,
        title,
        publishedAt: article.publishedAt ?? new Date(entry.publishedAt),
        imageUrl: article.imageUrl,
        excerpt: text.slice(0, 280) || null,
        text: text || null,
        audienceGender,
        fashionRelevance,
        mentions
      });
    } catch {
      continue;
    }
  }
  return posts;
}

async function collectNonlabel(limit: number): Promise<EditorialCollectedPost[]> {
  const config = editorialSourceConfigs.NONLABEL;
  const listing = await fetchText(config.feedUrl);
  const links = [
    ...new Set(
      [...listing.matchAll(/href=["']([^"']*\/archive\/\?idx=\d+&bmode=view[^"']*)["']/gi)]
        .flatMap((match) => {
          const value = match[1];
          return value ? [new URL(value, config.targetUrl).toString()] : [];
        })
    )
  ].slice(0, limit * 2);
  const posts: EditorialCollectedPost[] = [];
  for (const url of links) {
    if (posts.length >= limit) break;
    const html = await fetchText(url);
    const article = parseArticlePage(html, url);
    const title = article.title;
    const text = article.text || "";
    const audienceGender = inferEditorialGender({ sourceCategory: "archive fashion", title, text });
    const mentions = extractEditorialMentions({ title, text, postGender: audienceGender });
    const fashionRelevance = classifyFashionRelevance({ sourceCategory: "archive fashion", title, text, mentionCount: mentions.length });
    if (!title) continue;
    const canonicalUrl = canonicalizeNonlabelUrl(url);
    posts.push({
      source: "NONLABEL",
      externalPostId: canonicalUrl,
      url: canonicalUrl,
      canonicalUrl,
      title,
      publishedAt: article.publishedAt,
      imageUrl: article.imageUrl,
      excerpt: text.slice(0, 280) || null,
      text: text || null,
      audienceGender,
      fashionRelevance,
      mentions
    });
  }
  return posts;
}

export function parseRssItems(xml: string) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item) => ({
    title: tagValue(item, "title"),
    link: tagValue(item, "link"),
    guid: tagValue(item, "guid"),
    pubDate: tagValue(item, "pubDate"),
    description: tagValue(item, "description"),
    content: tagValue(item, "content:encoded")
  }));
}

function tagValue(xml: string, tag: string) {
  const escaped = tag.replace(":", "\\:");
  const match = xml.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  if (!match?.[1]) return "";
  return decodeEntities(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim());
}

function stripHtml(value: string) {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractImage(value: string) {
  return value.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

/**
 * Raised when a host signals it is refusing automated traffic. It is thrown -
 * not swallowed like an ordinary per-article failure - so a collection stops
 * on the FIRST refusal instead of hammering through hundreds of them. Never
 * bypassed, never retried under a different identity.
 */
export class EditorialRateLimitedError extends Error {}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TrendSignalDashboard/0.1 (+editorial source audit)",
      Accept: "text/html,application/xml,application/rss+xml,*/*"
    }
  });
  // hypebeast.kr answers heavy automated traffic with 202 + an empty body.
  // Together with 429 that means "stop asking", not "try again".
  if (response.status === 429 || response.status === 202) {
    throw new EditorialRateLimitedError(`${url} refused automated request: HTTP ${response.status}`);
  }
  if (!response.ok) throw new Error(`${url} request failed: HTTP ${response.status}`);
  const body = await response.text();
  if (body.trim().length === 0) {
    throw new EditorialRateLimitedError(`${url} returned an empty body - host is refusing automated requests`);
  }
  return body;
}

export function parseNewsSitemap(xml: string) {
  return [...xml.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<news:publication_date>(.*?)<\/news:publication_date>[\s\S]*?<news:title>(.*?)<\/news:title>[\s\S]*?<\/url>/g)]
    .map((match) => ({ url: decodeEntities(match[1] ?? ""), publishedAt: match[2] ?? "", title: decodeEntities(match[3] ?? "") }));
}

export function parseSitemapIndex(xml: string) {
  return [...xml.matchAll(/<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/g)]
    .map((match) => decodeEntities(match[1] ?? ""))
    .filter(Boolean);
}

export function parseGenericSitemap(xml: string) {
  return [...xml.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?(?:<lastmod>(.*?)<\/lastmod>)?[\s\S]*?<\/url>/g)]
    .map((match) => ({ url: decodeEntities(match[1] ?? ""), publishedAt: match[2] ?? "", title: "" }))
    .filter((entry) => entry.url);
}

/**
 * EYESMAG's article pages are Next.js (`getStaticProps`), and the page's own
 * `__NEXT_DATA__` hydration script - sent to every browser that loads the
 * page, not a private/undocumented endpoint - embeds the full post under
 * `props.pageProps.initialPost`. Its `content` field is a TipTap/ProseMirror
 * JSON document (`contentFormat: "TIPTAP"`): `{ type: "doc", content: [...] }`
 * with node types such as `paragraph`, `heading`, `text`, `slider` (image
 * gallery, no body text), and `embed` (social embed, no body text). Walking
 * only `text` nodes and skipping unknown node types naturally excludes nav,
 * footer, related-article, and share-widget chrome, since none of that is
 * part of the article's own content document.
 */
export function parseEyesmagRichBody(html: string): string | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match?.[1]) return null;
  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return null;
  }
  const content = (data as { props?: { pageProps?: { initialPost?: { content?: unknown } } } })?.props?.pageProps?.initialPost?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  let doc: unknown;
  try {
    doc = JSON.parse(content);
  } catch {
    return null;
  }
  const parts: string[] = [];
  walkTipTapNode(doc, parts);
  const text = parts.join("").replace(/\s+/g, " ").trim();
  return text || null;
}

const TIPTAP_BLOCK_TYPES = new Set(["paragraph", "heading", "listItem", "blockquote"]);

function walkTipTapNode(node: unknown, out: string[]): void {
  if (!node || typeof node !== "object") return;
  const record = node as { type?: unknown; text?: unknown; content?: unknown };
  if (record.type === "text" && typeof record.text === "string") out.push(record.text);
  if (Array.isArray(record.content)) {
    for (const child of record.content) walkTipTapNode(child, out);
    if (typeof record.type === "string" && TIPTAP_BLOCK_TYPES.has(record.type)) out.push(" ");
  }
}

/**
 * VISLA is standard WordPress: the full body is plain, publicly visible HTML
 * inside `<div class="entry-content ...">`. There is no JSON-LD `articleBody`
 * and no `content:encoded` in the RSS feed (confirmed by direct feed
 * inspection), so this source needs its own article-page fetch, mirroring
 * how EYESMAG/NONLABEL already work.
 *
 * The region is cut at the first of a fixed set of trailing boilerplate
 * markers (hashtag run, "VISLA Magazine" byline block, "SHARE THIS ARTICLE"
 * widget) rather than trying to find the div's true closing tag - VISLA's
 * markup nests multiple `<div>` blocks (image sliders) inside entry-content,
 * so a naive first-closing-`</div>` match would truncate the article, and a
 * full HTML parser is out of scope here. The stop markers are searched only
 * in the trailing portion of the region so they can never cut a legitimate
 * early mention of, say, a brand hashtag inside the actual article body.
 */
/** Public og:image lookup, exposed for the safe-refresh script (VISLA's RSS feed carries no image at all; the article page's own og:image is a real quality improvement, not a fabricated one). */
export function extractOgImage(html: string): string | null {
  return stringMeta(html, "og:image") || null;
}

export function parseVislaRichBody(html: string): string | null {
  const classMatch = html.match(/<div[^>]+class="[^"]*\bentry-content\b[^"]*"[^>]*>/);
  if (!classMatch || classMatch.index === undefined) return null;
  const startMarker = classMatch.index + classMatch[0].length;
  // Cap the window generously (an unusually long feature article) but the
  // real cut almost always comes from a stop marker well before this.
  const regionEnd = Math.min(html.length, startMarker + 60000);
  // Strip tags BEFORE looking for stop markers: the tag list ("#HYUNHXEE
  // #visla ...") is rendered as separate <a> elements per tag, so the raw
  // markup has HTML between hashtags that breaks a whitespace-only pattern.
  // Once flattened to plain text, the tag run becomes contiguous and the
  // FIRST occurrence of any marker reliably lands right after the real
  // article content, before any "more articles" teaser section further down
  // the page.
  const plain = stripHtml(html.slice(startMarker, regionEnd));
  // "# HYUNHXEE # visla department store ..." - the site renders a space
  // between "#" and the tag word, so the pattern must allow for it.
  const stopPatterns = [/(?:#\s*\S+\s+){2,}/, /VISLA Magazine/, /SHARE THIS ARTICLE/i];
  let cutAt = plain.length;
  for (const pattern of stopPatterns) {
    const found = plain.match(pattern);
    if (found?.index !== undefined) cutAt = Math.min(cutAt, found.index);
  }
  const text = plain.slice(0, cutAt).trim();
  return text || null;
}

/**
 * HYPEBEAST KR article body. The public article page carries no JSON-LD
 * `articleBody`, but the body itself is plain public HTML inside
 * `<div class="post-body-content">`. The region is cut at the first trailing
 * chrome marker (the tag list, a related-articles section, or the
 * "Read Full Article" widget) rather than by counting closing tags, because
 * the body legitimately nests figures/embeds - the same approach already used
 * for VISLA's entry-content.
 */
export function parseHypebeastRichBody(html: string): string | null {
  const match = html.match(/<div[^>]+class="[^"]*\bpost-body-content\b[^"]*"[^>]*>/);
  if (!match || match.index === undefined) return null;
  const start = match.index + match[0].length;
  // The region must run to the real trailing-chrome marker, NOT to a fixed
  // offset. A weekly roundup ("이번 주 놓치지 말아야 할 8가지 드롭") carries
  // eight products across ~650,000 characters of markup; an earlier 120,000
  // char cap silently truncated it and dropped genuine product evidence
  // (a "Zantan 토트백" sentence sitting ~541,000 chars into the body). The cut
  // is therefore driven purely by the stop markers, with only a generous
  // sanity bound so a pathological page cannot pin memory.
  const region = html.slice(start, Math.min(html.length, start + 2_000_000));
  // Trailing chrome sits inside the same container, so it is cut by content
  // markers too. Both Korean strings are fixed site furniture (a machine
  // translation disclaimer and the newsletter CTA), long enough that they
  // cannot plausibly occur inside real article prose.
  const stopPatterns = [
    /<div[^>]+class="[^"]*\bpost-body-content-tags\b/,
    /<section[^>]+class="[^"]*related/i,
    /Read Full Article/i,
    /영어에서 자동으로 번역되었습니다/,
    /뉴스레터를 구독해 최신 뉴스를 놓치지 마세요/
  ];
  let cutAt = region.length;
  for (const pattern of stopPatterns) {
    const found = region.match(pattern);
    if (found?.index !== undefined) cutAt = Math.min(cutAt, found.index);
  }
  const text = stripHtml(region.slice(0, cutAt));
  return text || null;
}

export type HypebeastListingEntry = { url: string; publishedAt: string; category: string };

/**
 * Parses the public /fashion listing. Every post box carries three things we
 * need before deciding to fetch anything: the article URL, an explicit
 * machine-readable category class (`category fashion-category`), and an ISO
 * `datetime`. Discovering all three from the listing means the active window
 * and the category filter are both applied BEFORE any article body is
 * requested - which is what keeps the request count (and the risk of tripping
 * the host's bot mitigation) low.
 */
export function parseHypebeastListing(html: string): HypebeastListingEntry[] {
  const entries: HypebeastListingEntry[] = [];
  const blocks = html.split('class="post-box-content-container"');
  for (const block of blocks.slice(1)) {
    // One post box is comfortably inside this bound; slicing keeps a very long
    // listing page from being re-scanned in full for every block.
    const scope = block.slice(0, 4000);
    const category = scope.match(/class="category\s+([a-z0-9-]+)-category"/)?.[1] ?? "";
    const titleIndex = scope.indexOf("post-box-content-title");
    const urlScope = titleIndex >= 0 ? scope.slice(titleIndex, titleIndex + 900) : scope;
    const url = urlScope.match(/href="(https:\/\/hypebeast\.kr\/20\d{2}\/\d{1,2}\/[A-Za-z0-9-]+)"/)?.[1] ?? "";
    // Only the newest few boxes carry a machine-readable <time datetime=...>;
    // the rest render relative time ("2 Days ago") client-side. An entry
    // without a listing date is therefore kept, not dropped - requiring one
    // silently limited discovery to a single day. The article's own
    // datePublished is checked against the window after fetching.
    const publishedAt = scope.match(/datetime="([^"]+)"/)?.[1] ?? "";
    if (url) entries.push({ url, publishedAt, category });
  }
  return entries;
}

/**
 * Fashion-scoped historical discovery. Walks /fashion, then /fashion/page/N -
 * a pagination link the listing itself publishes - keeping only entries the
 * site labels `fashion-category` and that fall inside the active window.
 * Stops as soon as a page contains no in-window entry, so it reads only as far
 * back as the window actually needs.
 */
export async function getHypebeastFashionEntries(days: number, maxPages = 40): Promise<HypebeastListingEntry[]> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const base = editorialSourceConfigs.HYPEBEAST_KR.targetUrl;
  const collected: HypebeastListingEntry[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const url = page === 1 ? base : `${base}/page/${page}`;
    let html: string;
    try {
      html = await fetchText(url);
    } catch (error) {
      // A refusal here must not discard every earlier page's already-collected
      // entries the way an uncaught throw would (that is exactly what happened
      // on 2026-09-07: page 32 was refused and the whole batch reported zero
      // articles despite 31 pages having already been read successfully). Stop
      // the walk and return what is already collected - the per-article fetch
      // loop below has the identical partial-return shape.
      if (error instanceof EditorialRateLimitedError) {
        console.warn(`HYPEBEAST_KR fashion listing stopped early at page ${page}: ${error.message}`);
        break;
      }
      throw error;
    }
    const entries = parseHypebeastListing(html);
    if (entries.length === 0) break;

    let datedEntries = 0;
    let datedInWindow = 0;
    for (const entry of entries) {
      const time = entry.publishedAt ? new Date(entry.publishedAt).getTime() : Number.NaN;
      if (!Number.isNaN(time)) {
        datedEntries += 1;
        if (time >= cutoff) datedInWindow += 1;
        else continue; // dated and demonstrably older than the window
      }
      // Route membership alone is not treated as proof an article is about a
      // product - it only decides what is worth reading. The article's own
      // text still has to earn FASHION_RELEVANT downstream, and its real
      // datePublished is re-checked against the window after fetching.
      if (entry.category !== "fashion") continue;
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      collected.push(entry);
    }
    // Stop only on evidence: this page carried dates and every one of them
    // predates the window, so older pages will too. Pages whose boxes render
    // relative time client-side carry no such evidence and must not stop the
    // walk.
    if (datedEntries > 0 && datedInWindow === 0) break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return collected;
}

/**
 * Public monthly sitemaps (declared in hypebeast.kr/robots.txt, which allows
 * every article route and only disallows /api, /account, /wp-admin and the
 * like). Returns article URLs whose month could still fall inside the window;
 * the per-article publish date is checked again after parsing.
 *
 * NOTE: this spans EVERY Hypebeast section (gaming, music, film), so it is no
 * longer the primary discovery path for trend collection - it is kept only as
 * a fallback for when the fashion listing yields nothing.
 */
async function getHypebeastEntries(days: number): Promise<string[]> {
  const index = await fetchText("https://hypebeast.kr/sitemap.xml");
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const monthlySitemaps = parseSitemapIndex(index)
    .filter((url) => /sitemap-post-\d{4}-\d{2}\.xml$/.test(url))
    .filter((url) => {
      const match = url.match(/sitemap-post-(\d{4})-(\d{2})\.xml$/);
      if (!match) return false;
      // Month sitemaps are inclusive of the whole month, so keep any month
      // whose END is still on or after the cutoff.
      const year = Number(match[1]);
      const month = Number(match[2]);
      return new Date(year, month, 0, 23, 59, 59) >= cutoff;
    });

  const urls: string[] = [];
  for (const sitemapUrl of monthlySitemaps) {
    const xml = await fetchText(sitemapUrl);
    for (const entry of parseGenericSitemap(xml)) {
      if (entry.url) urls.push(entry.url);
    }
  }
  return [...new Set(urls)];
}

async function collectHypebeastHistorical(limit: number, days: number, skipUrls: Set<string> = new Set()): Promise<EditorialCollectedPost[]> {
  // Fashion-scoped listing is the primary path; the all-section sitemap is only
  // a fallback, because it mixes gaming/music/film into a trend corpus.
  const fashionEntries = await getHypebeastFashionEntries(days);
  const urls = fashionEntries.length > 0 ? fashionEntries.map((entry) => entry.url) : await getHypebeastEntries(days);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const posts: EditorialCollectedPost[] = [];

  for (const url of urls) {
    if (posts.length >= limit) break;
    // Already stored: discovery still lists it, but there is no reason to spend
    // a request re-reading it.
    if (skipUrls.has(url)) continue;
    try {
      const html = await fetchText(url);
      const article = parseArticlePage(html, url);
      const publishedAt = article.publishedAt;
      // The sitemap is not date-filtered per entry, so enforce the window here.
      if (!publishedAt || Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < cutoff) continue;
      const richBody = parseHypebeastRichBody(html);
      const text = (richBody && richBody.length > article.text.length ? richBody : article.text) || "";
      const title = article.title;
      if (!title) continue;
      // NOTE: no sourceCategory is passed. The monthly sitemap covers every
      // Hypebeast section (music, gaming, film...), so relevance must be earned
      // from the article's own title/body evidence - never assumed "fashion"
      // the way the /fashion RSS feed legitimately can.
      const audienceGender = inferEditorialGender({ title, text });
      const mentions = extractEditorialMentions({ title, text, postGender: audienceGender });
      const fashionRelevance = classifyFashionRelevance({ title, text, mentionCount: mentions.length });
      if (fashionRelevance === "NON_FASHION") continue;
      posts.push({
        source: "HYPEBEAST_KR",
        externalPostId: article.canonicalUrl || url,
        url: article.canonicalUrl || url,
        canonicalUrl: article.canonicalUrl || url,
        title,
        publishedAt,
        imageUrl: article.imageUrl,
        excerpt: text.slice(0, 280) || null,
        text: text || null,
        audienceGender,
        fashionRelevance,
        mentions
      });
    } catch (error) {
      // A single bad article is skipped. A refusal stops the walk immediately -
      // but everything already fetched is RETURNED rather than thrown away, so
      // an interrupted run still makes progress and the next run simply
      // continues from what is missing (see `skipUrls`). Retrying into a block
      // is never attempted.
      if (error instanceof EditorialRateLimitedError) {
        console.warn(`HYPEBEAST_KR collection stopped early: ${error.message}`);
        console.warn(`Returning ${posts.length} article(s) fetched before the refusal; re-run later to continue.`);
        break;
      }
      continue;
    }
    // Be a polite client on a site that publishes Crawl-delay for several bots,
    // and that has previously answered a large crawl with bot mitigation.
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  return posts;
}

async function collectVisla(limit: number, options: EditorialCollectOptions): Promise<EditorialCollectedPost[]> {
  const config = editorialSourceConfigs.VISLA;
  const response = await fetch(config.feedUrl, {
    headers: { "User-Agent": "TrendSignalDashboard/0.1 (+editorial source audit)", Accept: "application/rss+xml, application/xml, text/xml, */*" }
  });
  if (!response.ok) throw new Error(`VISLA feed request failed: HTTP ${response.status}`);
  const xml = await response.text();
  const items = parseRssItems(xml)
    .filter((item) => isInsideDays(item.pubDate, options.days))
    .slice(0, limit);

  const posts: EditorialCollectedPost[] = [];
  for (const item of items) {
    const url = canonicalizeUrl(item.link || item.guid || "");
    if (!url) continue;
    const title = decodeEntities(stripHtml(item.title));
    const feedExcerpt = stripHtml(item.description || "");
    try {
      const html = await fetchText(url);
      const richBody = parseVislaRichBody(html);
      const text = (richBody && richBody.length > feedExcerpt.length ? richBody : feedExcerpt) || "";
      const imageUrl = extractOgImage(html) || extractImage(item.description || "");
      const audienceGender = inferEditorialGender({ title, text });
      const mentions = extractEditorialMentions({ title, text, postGender: audienceGender });
      const fashionRelevance = classifyFashionRelevance({ sourceCategory: "fashion", title, text, mentionCount: mentions.length });
      posts.push({
        source: "VISLA",
        externalPostId: item.guid || url || title,
        url,
        canonicalUrl: url,
        title,
        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
        imageUrl: imageUrl || null,
        excerpt: text.slice(0, 280) || null,
        text: text || null,
        audienceGender,
        fashionRelevance,
        mentions
      });
    } catch {
      continue;
    }
  }
  return posts.filter((post) => post.url && post.title && post.fashionRelevance !== "NON_FASHION");
}

export function parseArticlePage(html: string, fallbackUrl: string) {
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => parseJson(match[1] ?? ""))
    .find((value) => value && (value["@type"] === "NewsArticle" || value["@type"] === "Article")) as Record<string, unknown> | undefined;
  const title = stringMeta(html, "og:title") || stringMeta(html, "twitter:title") || String(ld?.headline ?? "") || stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = stringMeta(html, "description") || stringMeta(html, "og:description") || String(ld?.description ?? "");
  const image = stringMeta(html, "og:image") || stringMeta(html, "twitter:image") || imageFromLd(ld);
  const canonical = stringMeta(html, "og:url") || String(ld?.mainEntityOfPage ?? "") || fallbackUrl;
  const date = stringMeta(html, "article:published_time") || String(ld?.datePublished ?? "");
  const text = stripHtml(description || html);
  return {
    title: stripHtml(title).replace(/\s+:\s*아카이브$/i, ""),
    canonicalUrl: canonicalizeUrl(canonical),
    publishedAt: date ? new Date(date) : null,
    imageUrl: image || null,
    text
  };
}

function stringMeta(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRegExp(key)}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapeRegExp(key)}["'][^>]*>`, "i")
  ];
  return patterns.map((pattern) => decodeEntities(html.match(pattern)?.[1] ?? "")).find(Boolean) ?? "";
}

function imageFromLd(ld: Record<string, unknown> | undefined) {
  const image = ld?.image;
  if (typeof image === "string") return image;
  if (Array.isArray(image) && typeof image[0] === "string") return image[0];
  return "";
}

function parseJson(value: string) {
  try {
    return JSON.parse(value.trim());
  } catch {
    return null;
  }
}

async function getEyesmagEntries(days: number | undefined) {
  if (!days) {
    const sitemap = await fetchText(editorialSourceConfigs.EYESMAG.feedUrl);
    return parseNewsSitemap(sitemap);
  }
  const index = await fetchText("https://www.eyesmag.com/sitemap.xml");
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const monthSitemaps = parseSitemapIndex(index)
    .filter((url) => /sitemap-posts-\d{4}-\d{2}\.xml\.gz$/.test(url))
    .filter((url) => {
      const match = url.match(/sitemap-posts-(\d{4})-(\d{2})\.xml\.gz$/);
      if (!match) return false;
      const year = Number(match[1]);
      const month = Number(match[2]);
      return new Date(year, month, 1) >= cutoff;
    });
  const entries: Array<{ url: string; publishedAt: string; title: string }> = [];
  for (const sitemapUrl of monthSitemaps) {
    const xml = await fetchText(sitemapUrl);
    entries.push(...parseGenericSitemap(xml).filter((entry) => isInsideDays(entry.publishedAt, days)));
  }
  return entries.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function classifyFashionRelevance(input: { sourceCategory?: string | null; title?: string | null; text?: string | null; mentionCount?: number }) {
  const source = `${input.sourceCategory ?? ""}`.toLowerCase();
  const body = `${input.title ?? ""} ${input.text ?? ""}`;
  if (/fashion|archive fashion/.test(source)) return "FASHION_RELEVANT" as const;
  if (isNonFashionText(body) && !isFashionText(body)) return "NON_FASHION" as const;
  if (isFashionText(body) || (input.mentionCount ?? 0) >= 2) return "FASHION_RELEVANT" as const;
  if ((input.mentionCount ?? 0) === 1) return "UNKNOWN" as const;
  return "NON_FASHION" as const;
}

function isInsideDays(value: string | undefined, days: number | undefined) {
  if (!days || !value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function isFashionText(text: string) {
  return /fashion|brand|campaign|collection|denim|jacket|bag|shoes|sneaker|\bt-?shirt\b|\btee\b|\bhoodie\b|\bpants\b|\bcap\b|\bhat\b|\uD328\uC158|\uBE0C\uB79C\uB4DC|\uCEA0\uD398\uC778|\uCEEC\uB809\uC158|\uB370\uB2D8|\uC7AC\uD0B7|\uC790\uCF13|\uAC00\uBC29|\uC2A4\uB2C8\uCEE4|\uD2F0\uC154\uCE20|\uD6C4\uB514|\uBAA8\uC790/i.test(text);
}

function isNonFashionText(text: string) {
  return /movie|music|album|single|concert|game|tech|car|automotive|food|restaurant|\uC601\uD654|\uC74C\uC545|\uC568\uBC94|\uACF5\uC5F0|\uAC8C\uC784|\uD14C\uD06C|\uC790\uB3D9\uCC28|\uC2DD\uB2F9/i.test(text);
}

function legacyFashionText(text: string) {
  return /fashion|brand|campaign|collection|denim|jacket|bag|shoes|sneaker|패션|브랜드|캠페인|컬렉션|데님|재킷|가방|스니커/i.test(text);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalizeUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/g, "/");
    return parsed.toString();
  } catch {
    return value.trim().replace(/[?#].*$/g, "");
  }
}

function canonicalizeNonlabelUrl(value: string) {
  const parsed = new URL(value);
  const idx = parsed.searchParams.get("idx");
  parsed.hash = "";
  parsed.search = "";
  if (idx) parsed.searchParams.set("idx", idx);
  return parsed.toString();
}

function decodeEntities(value: string) {
  return value
    // Numeric character references. HYPEBEAST_KR encodes Korean titles as hex
    // entities ("&#xBC84;&#xD37C;" = 버퍼), which would otherwise be stored raw
    // and break both display and phrase matching. Decimal form handled too.
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => safeCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, decimal: string) => safeCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, "\"")
    .replace(/&#8221;/g, "\"");
}

/** Guards against malformed entities producing an exception or a lone surrogate. */
function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  if (code >= 0xd800 && code <= 0xdfff) return "";
  return String.fromCodePoint(code);
}
