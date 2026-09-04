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
};

export async function collectEditorialFeed(source: EditorialSource, limit = 30, options: EditorialCollectOptions = {}): Promise<EditorialCollectedPost[]> {
  const config = editorialSourceConfigs[source];
  if (source === "EYESMAG") return collectEyesmag(limit, options);
  if (source === "NONLABEL") return collectNonlabel(limit);
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
    const sourceCategory = source === "VISLA" || source === "HYPEBEAST_KR" ? "fashion" : null;
    const audienceGender = inferEditorialGender({ sourceCategory, title, text });
    const mentions = extractEditorialMentions({ title, text, postGender: audienceGender });
    const fashionRelevance = classifyFashionRelevance({ sourceCategory, title, text, mentionCount: mentions.length });
    return {
      source,
      externalPostId: item.guid || url || title,
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
      const text = article.text || "";
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

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TrendSignalDashboard/0.1 (+editorial source audit)",
      Accept: "text/html,application/xml,application/rss+xml,*/*"
    }
  });
  if (!response.ok) throw new Error(`${url} request failed: HTTP ${response.status}`);
  return response.text();
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
