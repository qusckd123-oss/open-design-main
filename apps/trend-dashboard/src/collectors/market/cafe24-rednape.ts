import { getSourceCategoryUrl, sourceCategoryConfigs, type MarketMetricType, type RankingCategory, type RankingScope } from "@/config/market-category-map";
import type { MarketSource } from "@/config/market-sources";
import { marketCollectorUserAgent, parseRobotsAllowed, type RobotsCheck } from "@/collectors/market/robots";
import type { MarketCollectedProduct, MarketCollectOptions, MarketCollectionError, MarketCollectionResult, MarketCollector } from "@/collectors/market/types";

/**
 * REDNAPE (rednape.kr) - source-specific pure parsing only.
 *
 * This file deliberately does NOT generalize to "any Cafe24 site" - only
 * Rednape's own markup/JSON-LD shape has been verified (see
 * docs/MARKET_SOURCE_AUDIT.md "Rednape" and its
 * "/category/accessories/45/ composition finding"). No network request
 * happens anywhere in this file; every function here takes already-parsed
 * structured data and returns a plain value.
 *
 * BAG CATEGORY COMPOSITION WARNING (verified 2026-09-15): the configured
 * /category/accessories/45/ page currently lists 22 products, of which only
 * 5 are confirmed bags - the rest are shoes, caps, belts, mufflers, a
 * beanie, and gloves. `isConfirmedBagProduct` exists specifically so a
 * future collector never emits the other 17 as BAG rows. See
 * docs/MARKET_SOURCE_AUDIT.md for the full 22-product enumeration this gate
 * is derived from.
 */

/**
 * Bag-name suffixes actually observed on the 5 confirmed-bag products in a
 * full enumeration of /category/accessories/45/ (2026-09-15). Deliberately
 * NOT broadened to generic terms like "백" or "가방", or to plausible-but-
 * unobserved terms like "토트백"/"숄더백" - only what was directly verified
 * in this exact catalog. Add a new suffix here only after it is actually
 * observed on a real product name, never speculatively.
 */
const CONFIRMED_BAG_SUFFIXES = ["에코백", "쇼퍼백", "로프백", "백팩", "크로스백"] as const;

/**
 * Rejects the 17 non-bag products found in the same category page (loafers,
 * caps, belts, mufflers, a beanie, gloves) - this is the ONLY thing standing
 * between "product is on the accessories page" and "product is emitted as a
 * BAG row". A product that fails this must never be emitted as BAG, and
 * must never be silently re-routed into an "OTHER" bag sub-type either - it
 * must simply not be collected as BAG at all.
 *
 * IMPORTANT: this is a source-local heuristic validated ONLY against the
 * Rednape /category/accessories/45/ catalog as audited on 2026-09-15 (22
 * products, 5 confirmed bags) - it is NOT a general Korean bag-word
 * classifier and must not be reused as one for any other source or
 * category. It will only ever recognize the 5 suffixes above; a genuine
 * Rednape bag using different wording (e.g. "토트백") would currently be
 * skipped rather than misclassified - the safer of the two failure modes,
 * but still a real gap to revisit only once that wording is actually
 * observed on a real product, never speculatively.
 */
export function isConfirmedBagProduct(name: string): boolean {
  return CONFIRMED_BAG_SUFFIXES.some((suffix) => name.includes(suffix));
}

/** One color option as it appears in the product detail page's Schema.org `Product.offers[]` JSON-LD entry. */
export type RawRednapeOffer = {
  /** Full offer name as Rednape writes it, e.g. "아카이브 나일론 에코백 (3C) 아쿠아블루" - base product name + color, space-separated. */
  name: string;
  price: number;
};

/**
 * Already-parsed structured data for one Rednape product - the shape a
 * future fetcher would assemble from the category page's
 * `anchorBoxId_{id}` (for `externalProductId`) plus the product detail
 * page's `<link rel="canonical">` and `application/ld+json` `Product`
 * block (for everything else). Nothing in this type is fetched by this
 * file.
 */
export type RawRednapeProduct = {
  /** The base numeric Cafe24 product ID (e.g. "593"), from the category page's `anchorBoxId_{id}` - never a per-color `item_code`. */
  externalProductId: string;
  /** Base product name, e.g. "아카이브 나일론 에코백 (3C)" - from JSON-LD `name`, matches the string `isConfirmedBagProduct` is checked against. */
  name: string;
  /** The site's own declared canonical URL (`<link rel="canonical">` / `og:url`), e.g. "https://rednape.kr/product/아카이브-나일론-에코백-3c/593/". */
  canonicalUrl: string;
  /** JSON-LD `image` array, already-resolved URLs, in the order the site lists them. */
  images: string[];
  /** JSON-LD `offers` array - one entry per color option. */
  offers: RawRednapeOffer[];
};

/**
 * Recovers just the color portion of one offer's name by stripping the
 * shared base-product-name prefix, e.g. "아카이브 나일론 에코백 (3C) 아쿠아블루"
 * with base "아카이브 나일론 에코백 (3C)" -> "아쿠아블루". Returns the literal
 * Korean text verbatim - no normalization/translation of Korean color
 * names is done here (not yet designed - see docs/MARKET_SOURCE_AUDIT.md).
 * Falls back to the raw offer name if it doesn't start with the base name
 * (defensive only; every sample observed during the audit followed the
 * "{base name} {color}" pattern).
 */
function extractOfferColor(baseName: string, offerName: string): string {
  const trimmedOffer = offerName.trim();
  if (trimmedOffer.startsWith(baseName)) {
    return trimmedOffer.slice(baseName.length).trim();
  }
  return trimmedOffer;
}

const RANKING_CATEGORY: RankingCategory = "BAG";
const RANKING_SCOPE: RankingScope = "CATEGORY";

/**
 * Pure normalizer - one Market row per BASE PRODUCT, never per color
 * variant (a per-color `item_code` must never be used as
 * `externalProductId`; see docs/MARKET_SOURCE_AUDIT.md "Rednape" for why -
 * in short, `MarketProduct.@@unique([source, externalProductId])` has no
 * variant dimension, so a per-color ID would fragment one physical product
 * into several synthetic ones).
 *
 * mainColor: null whenever the product has more than one distinct color
 * option - one row cannot honestly claim a single color for a product that
 * ships in several genuinely different colorways. Only set when the
 * product has exactly one distinct color, using that literal verified
 * Korean text unchanged (no color-name normalization in this pass).
 *
 * price: the SAME rule applies. If every offer shares one price, that price
 * is used; if offers disagree on price, `price` is null rather than
 * silently picking `offers[0]`'s price - a base-product row cannot honestly
 * claim one price for a product whose colors are actually priced
 * differently. The full list of distinct offer prices is always preserved
 * in `rawData` regardless of which case applies, for auditability.
 *
 * Throws if `raw.name` does not pass `isConfirmedBagProduct` - this is a
 * hard guarantee, not just a convention the caller has to remember: this
 * function must never be able to produce a BAG row for a non-bag product,
 * even if a future caller forgets to gate first.
 *
 * All fields not explicitly listed as populated below stay null/unset for
 * this first pass, per the v1 field-scope decision in
 * docs/MARKET_SOURCE_AUDIT.md: material and size/fit live only in free-form
 * Naver SmartEditor text (not parsed here); stock/availability has no slot
 * in MarketCollectedProduct at all and the one sample checked showed the
 * rendered page and the JSON-LD `availability` field disagreeing anyway;
 * salePrice/discountRate/reviewCount/likeCount have no confirmed live
 * example to source them from.
 */
export function normalizeRednapeProduct(input: {
  raw: RawRednapeProduct;
  sourcePosition: number;
  audienceSegment: string;
  periodDate: Date;
  metricType: MarketMetricType;
}): MarketCollectedProduct {
  const { raw, sourcePosition, audienceSegment, periodDate, metricType } = input;

  if (!raw.externalProductId) throw new Error("Missing Rednape product ID.");
  if (!raw.name) throw new Error("Missing Rednape product name.");
  if (!raw.canonicalUrl) throw new Error("Missing Rednape canonical URL.");
  if (!isConfirmedBagProduct(raw.name)) {
    throw new Error(`Rednape product "${raw.name}" (#${raw.externalProductId}) did not pass the confirmed-bag-name gate; refusing to emit as BAG.`);
  }

  const distinctColors = [...new Set(raw.offers.map((offer) => extractOfferColor(raw.name, offer.name)).filter((color) => color.length > 0))];
  const mainColor = distinctColors.length === 1 ? distinctColors[0] : null;

  const distinctPrices = [...new Set(raw.offers.map((offer) => offer.price))];
  const price = distinctPrices.length === 1 ? distinctPrices[0] : null;

  return {
    source: "REDNAPE",
    externalProductId: raw.externalProductId,
    brand: "레드네이프",
    name: raw.name,
    url: raw.canonicalUrl,
    imageUrl: raw.images[0] ?? null,
    metricType,
    rankingVerified: false,
    rankingScope: RANKING_SCOPE,
    sourcePosition,
    rank: null,
    rankingCategory: RANKING_CATEGORY,
    observedCategory: RANKING_CATEGORY,
    audienceSegment,
    periodDate,
    category: null,
    price,
    salePrice: null,
    discountRate: null,
    reviewCount: null,
    likeCount: null,
    itemType: null,
    subItemType: null,
    fit: null,
    mainColor,
    subColor: null,
    material: null,
    graphicType: null,
    detail: null,
    style: null,
    gender: null,
    rawData: JSON.stringify({
      externalProductId: raw.externalProductId,
      name: raw.name,
      colors: distinctColors,
      offerCount: raw.offers.length,
      offerPrices: distinctPrices
    })
  };
}

/* ------------------------------------------------------------------ */
/* Live collector - PHASE 1 (category listing) + PHASE 2 (per-product */
/* detail) - everything below this line does real network I/O. Only  */
/* the pure parsing functions (extractRednapeListingEntries,          */
/* extractRednapeProductJsonLd, extractRednapeCanonicalUrl) are unit   */
/* tested directly; Cafe24RednapeCollector itself is exercised only   */
/* via a live --dry-run or an explicitly-approved live collection run, */
/* never in the test suite (see AGENT_OPERATING_RULES.md "Validation  */
/* Expectations").                                                     */
/* ------------------------------------------------------------------ */

/** One product as it appears on a category listing page, before any detail fetch. */
export type RednapeListingEntry = {
  /** Base numeric Cafe24 product ID, from `<li id="anchorBoxId_{id}">`. */
  externalProductId: string;
  /** Listing-displayed name - same string `isConfirmedBagProduct` gates on, BEFORE any detail fetch happens. */
  name: string;
  /** Absolute product detail URL, resolved against `baseUrl`. May carry a `/category/{n}/display/{m}/` referrer suffix - only used to fetch the detail page, never stored as the final canonical URL (that comes from the detail page's own `<link rel="canonical">`). */
  detailUrl: string;
  /**
   * 1-based position in the FULL source listing (across pages), assigned
   * from raw card order BEFORE any BAG gating or dedup - observational
   * source metadata only, never renumbered by which products later pass
   * `isConfirmedBagProduct`. E.g. in a 5-card listing [loafer, beanie, eco
   * bag, cap, shopper bag], the eco bag keeps `listingPosition: 3` and the
   * shopper bag keeps `listingPosition: 5` even though they are the only
   * two products ever gated through to `normalizeRednapeProduct`. This
   * does NOT make the value a verified ranking - `rankingVerified` stays
   * `false` and `rank` stays `null` regardless.
   */
  listingPosition: number;
};

/**
 * Splits the category listing HTML into per-product slices anchored on
 * `<li id="anchorBoxId_{id}">`, then extracts id/name/href from each slice.
 *
 * Deliberately does NOT try to match a balanced closing `</li>` (the way a
 * naive `<li ...>[\s\S]*?<\/li>` lazy regex would) - each Rednape product
 * block contains several NESTED `<li>` elements of its own
 * (`class="left"`, `class="right"`, `class="price"`, `class="about"`,
 * `class="icon"`), so a lazy match would truncate at the first nested
 * `</li>`, not the real end of the block. Slicing between consecutive
 * `anchorBoxId_` match positions instead is robust to that nesting and
 * needs no HTML-balancing logic.
 *
 * `startPosition` (default 1) lets the caller continue a running,
 * cross-page listing ordinal instead of restarting at 1 on every page -
 * pass `1 + <number of entries returned by the previous page's call>` for
 * page 2, etc. `listingPosition` is assigned from the raw per-page card
 * index (`startPosition + i`), not from how many entries actually parsed
 * successfully, so a later card's position is never shifted by an earlier
 * card on the SAME page failing to parse. (A card that itself fails to
 * parse - missing name/href - is skipped from the returned array, so in
 * the rare case that happens, the cross-page running total the caller
 * advances by will undercount by that many positions; this is an accepted,
 * documented simplification, not a claim of perfect position-numbering
 * across a parse failure - no real sampled Rednape card has ever failed to
 * parse.)
 */
export function extractRednapeListingEntries(html: string, baseUrl: string, startPosition = 1): RednapeListingEntry[] {
  const anchorPattern = /<li id="anchorBoxId_(\d+)"/g;
  const starts: Array<{ index: number; id: string }> = [];
  for (const match of html.matchAll(anchorPattern)) {
    if (match.index != null && match[1]) starts.push({ index: match.index, id: match[1] });
  }

  const entries: RednapeListingEntry[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i]!;
    const end = i + 1 < starts.length ? starts[i + 1]!.index : html.length;
    const block = html.slice(start.index, end);

    const href = block.match(/<a href="(\/product\/[^"]+)"/)?.[1];
    const name = decodeRednapeHtml(block.match(/class="name">[\s\S]*?<span[^>]*>([^<]+)<\/span>/)?.[1] ?? "");
    if (!href || !name) continue;

    entries.push({
      externalProductId: start.id,
      name,
      detailUrl: new URL(href, baseUrl).toString(),
      listingPosition: startPosition + i
    });
  }
  return entries;
}

/**
 * Removes already-seen base product IDs from `entries`, in order,
 * mutating `seen` as a side effect so repeated calls across successive
 * listing pages accumulate one shared identity set (matches the
 * base-numeric-ID identity model - never the per-color `item_code`, and
 * never the URL string, which can carry a different referrer suffix for
 * the same product). Defaults to a fresh `Set` so it is directly
 * unit-testable standalone, e.g. simulating a duplicate id appearing
 * twice within what would be one page, or once each across two pages
 * concatenated into one call.
 */
export function dedupeListingEntries(entries: RednapeListingEntry[], seen: Set<string> = new Set()): RednapeListingEntry[] {
  const unique: RednapeListingEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.externalProductId)) continue;
    seen.add(entry.externalProductId);
    unique.push(entry);
  }
  return unique;
}

/** One raw JSON-LD offer entry as Rednape actually serializes it - `name` is present for multi-variant products (color-disambiguating) and absent for single-variant ones (verified live on #440, 2026-09-15). */
type RednapeJsonLdOffer = { name?: string; price?: number };

/** Minimal shape of the fields this collector actually uses from the product detail page's Schema.org `Product` JSON-LD block. */
export type RednapeProductJsonLd = {
  name?: string;
  image?: string[];
  /**
   * Schema.org allows `Product.offers` to be either a single `Offer` object
   * or an array of them, and Rednape actually uses BOTH shapes depending on
   * variant count: a single-variant product (e.g. #440, "토고 쉘 경량 그리드
   * 백팩") serializes `offers` as one bare object with no `name` field at
   * all (just `@type`/`url`/`priceCurrency`/`price`), while a multi-variant
   * product (e.g. #593, 3 colors) serializes an array with one named entry
   * per color. See `normalizeRednapeOffers` for the boundary that
   * reconciles this into the flat shape everything downstream expects.
   */
  offers?: RednapeJsonLdOffer[] | RednapeJsonLdOffer;
};

/**
 * Normalizes JSON-LD `Product.offers` into the flat `RawRednapeOffer[]`
 * shape `RawRednapeProduct.offers` and `normalizeRednapeProduct` already
 * expect - the single boundary point where the object/array ambiguity
 * documented on `RednapeProductJsonLd.offers` gets resolved, so nothing
 * downstream of this function (in particular `normalizeRednapeProduct`)
 * ever has to reason about that ambiguity itself.
 *
 * A single offer object (Rednape's single-variant shape) is wrapped into a
 * one-element array; a genuinely absent `offers` field normalizes to an
 * empty array, which `normalizeRednapeProduct` already handles safely
 * (zero distinct colors/prices -> mainColor/price both null - never a
 * thrown error just because a product happens to have no readable offers).
 *
 * Only `price` is required to keep an entry - Rednape's real single-variant
 * JSON-LD (verified live on #440, 2026-09-15) omits `name` entirely, and a
 * missing offer name must never be allowed to silently drop that offer's
 * price from the price-agreement calculation. A missing `name` normalizes
 * to `""` (never guessed at - e.g. never defaulted to the base product
 * name), which `extractOfferColor`'s existing color-extraction naturally
 * treats as "no distinguishable color for this offer" (filtered out of
 * `distinctColors` for having zero length) - consistent with `mainColor`
 * already being null whenever there is no single confirmable color text,
 * not only when there is more than one.
 */
export function normalizeRednapeOffers(offers: RednapeProductJsonLd["offers"]): RawRednapeOffer[] {
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  const normalized: RawRednapeOffer[] = [];
  for (const offer of list) {
    if (typeof offer?.price !== "number") continue;
    normalized.push({ name: typeof offer.name === "string" ? offer.name : "", price: offer.price });
  }
  return normalized;
}

/**
 * Finds and parses the `application/ld+json` `Product` block on a Rednape
 * product detail page. Tries every `<script type="application/ld+json">`
 * tag on the page (there is also an `Organization` block on some pages)
 * and skips any that fail to parse, rather than throwing on the first
 * malformed one - a category/campaign banner script or a genuinely broken
 * block should not prevent finding the real `Product` entry elsewhere on
 * the page. Returns null (never throws) when no `Product` block is found;
 * the caller decides whether that is an error.
 */
export function extractRednapeProductJsonLd(html: string): RednapeProductJsonLd | null {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed: unknown = JSON.parse((match[1] ?? "").trim());
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      const product = candidates.find((entry): entry is RednapeProductJsonLd & { "@type": string } => Boolean(entry) && typeof entry === "object" && (entry as { "@type"?: string })["@type"] === "Product");
      if (product) return product;
    } catch {
      // Malformed or unrelated JSON-LD block - try the next <script> tag.
    }
  }
  return null;
}

/** Extracts the site's own declared canonical URL (`<link rel="canonical">`), the correct value for `RawRednapeProduct.canonicalUrl` - never reconstructed from the listing's referrer-suffixed href. */
export function extractRednapeCanonicalUrl(html: string): string | null {
  return html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? null;
}

function decodeRednapeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Courtesy delay between sequential PHASE 2 product-detail requests only
 * (never before the single PHASE 1 listing fetch, and never between
 * listing pages, which are already infrequent). Rednape's own robots.txt
 * declares explicit per-engine crawl delays (Googlebot 1s, Yeti 2s,
 * Bingbot 5s) but nothing for a generic `*` agent, which is the group this
 * collector's own user agent falls into. 1000ms mirrors the LOWEST of
 * those three named delays - a deliberately conservative choice for a
 * small independent shop rather than a large platform, without meaningfully
 * slowing a run that only ever fetches a handful of detail pages (today:
 * up to 5). Source-local to this file - not a generalized throttling
 * framework, since no other collector in this repo currently needs one
 * (see docs/MARKET_SOURCE_AUDIT.md "Rednape").
 */
const RATE_LIMIT_DELAY_MS = 1000;

/** Defensive circuit breaker only - today's audited catalog has exactly one real page (page 2 already verified empty). Never expected to be reached; exists solely to guarantee this loop cannot run forever if the site's pagination ever misbehaves. */
const MAX_LISTING_PAGES = 20;

function withPage(categoryUrl: string, page: number): string {
  const url = new URL(categoryUrl);
  url.searchParams.set("page", String(page));
  return url.toString();
}

/**
 * Fetches and parses rednape.kr's robots.txt ONCE for the lifetime of a
 * single `collect()` call and reuses that parsed text for every URL that
 * call needs to check, via the same pure `parseRobotsAllowed` the shared
 * `verifyRobotsAllowed` helper (src/collectors/market/robots.ts) already
 * uses internally - this is a redundant-fetch elimination, not a
 * network-skipping shortcut. Every call still re-evaluates robots against
 * ITS OWN path (the listing page and each product detail page have
 * different paths, and `parseRobotsAllowed` is what actually applies the
 * path-specific allow/disallow rules), so a disallowed path can never slip
 * through just because an earlier path was allowed.
 *
 * Deliberately local to one `collect()` invocation (a plain closure created
 * fresh on every call, never a class field or module-level variable):
 * nothing here survives past the invocation that created it, is shared
 * across concurrent `collect()` calls, or is shared across other sources'
 * collectors - so this cannot become a stale-robots-across-runs bug or a
 * cross-source cache. Keyed by origin (not hardcoded to rednape.kr) purely
 * for correctness if this ever needs multiple origins in one run; in
 * practice Rednape's `baseUrl` is fixed, so there is only ever one entry.
 *
 * `verifyRobotsAllowed` itself is intentionally left untouched: it is
 * shared by every other collector in this codebase, and giving it a
 * persistent/shared cache would change its semantics for all of them, not
 * just Rednape - out of scope for a source-local Rednape fix. If robots.txt
 * cannot be fetched at all, every subsequent check for this run fails
 * closed (`allowed: false`), exactly matching `verifyRobotsAllowed`'s own
 * fetch-failure behavior - no bypass.
 */
function createRednapeRobotsChecker(userAgent: string): (targetUrl: string) => Promise<RobotsCheck> {
  const robotsTextByOrigin = new Map<string, Promise<string | null>>();

  function loadRobotsText(origin: string): Promise<string | null> {
    let pending = robotsTextByOrigin.get(origin);
    if (!pending) {
      pending = fetch(new URL("/robots.txt", origin).toString(), { headers: { "User-Agent": userAgent } })
        .then((response) => (response.ok ? response.text() : null))
        .catch(() => null);
      robotsTextByOrigin.set(origin, pending);
    }
    return pending;
  }

  return async function checkRobots(targetUrl: string): Promise<RobotsCheck> {
    const url = new URL(targetUrl);
    const robotsText = await loadRobotsText(url.origin);
    if (robotsText == null) {
      return { allowed: false, reason: "Unable to verify robots.txt." };
    }
    const allowed = parseRobotsAllowed(robotsText, userAgent, `${url.pathname}${url.search}`);
    return { allowed, reason: allowed ? "Allowed by robots.txt." : `Blocked by robots.txt for ${url.pathname}.` };
  };
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Live Rednape collector - BAG category only
 * (/category/accessories/45/). Any other category (e.g. LONG_SLEEVE_TSHIRT
 * or PANTS, which already map to /category/new-arrivals/23/ in
 * sourceCategoryConfigs) returns UNSUPPORTED here - new-arrivals
 * collection is out of scope for this pass and must not be attempted by
 * this class, even though the config mapping already exists.
 *
 * PHASE 1 (category listing): fetch page 1, extract every product's
 * id/name/href, apply `isConfirmedBagProduct` to the LISTING name for
 * every entry BEFORE any detail request is made - a product that fails
 * the gate here never causes a Phase 2 fetch at all. Advances to
 * additional pages only while more gated products are still needed
 * (`options.limit` not yet reached) and the previous page actually
 * produced at least one not-yet-seen id; stops on an empty page, on a
 * page that yields zero new ids (dedup safety net), or after
 * MAX_LISTING_PAGES regardless - never an unbounded loop. This relies on
 * an empty next page as the "no more products" signal (the simplest
 * robust option; Rednape's listing HTML exposes no separate "is this the
 * last page" flag) rather than a more complex total-count/last-page
 * parser - which means, with today's audited catalog (22 products, 5
 * confirmed bags, page 2 already verified empty), the ACTUAL PAGE request
 * count depends on `options.limit`: at `limit <= 5`, page 1 alone already
 * satisfies `gatedEntries.length >= options.limit`, so the loop exits
 * BEFORE ever requesting page 2 (1 listing + up to 5 detail page requests).
 * At `limit > 5`, page 1 still only yields 5 gated entries (fewer than the
 * limit), so the loop tries page 2 to discover that exhaustion, which
 * returns zero products and stops it (2 listing + 5 detail page requests).
 * Do not assume the same page-request count for every limit value. On top
 * of these page requests, exactly ONE robots.txt fetch happens per
 * `collect()` call regardless of how many pages/details are requested (see
 * `createRednapeRobotsChecker`) - before that fix, robots.txt was
 * re-fetched once per page/detail request with no caching at all (12 total
 * requests observed live for `limit=5` on 2026-09-15, confirmed reduced to
 * 7 after this fix: 1 robots.txt + 1 listing page + 5 detail pages).
 *
 * PHASE 2 (product detail): sequentially (never concurrently) fetches
 * only the gated products' detail pages, extracts the canonical URL and
 * `Product` JSON-LD, and hands the result straight to the already
 * unit-tested `normalizeRednapeProduct` - this class never reimplements
 * the BAG gate, mainColor, or price rules itself. `sourcePosition` passed
 * through is each entry's original `listingPosition` (assigned in Phase 1
 * before gating), never a post-filter/gated-only counter.
 */
export class Cafe24RednapeCollector implements MarketCollector {
  source: MarketSource = "REDNAPE";

  async collect(options: MarketCollectOptions): Promise<MarketCollectionResult> {
    const collectedAt = new Date();
    const audienceSegment = options.audienceSegment ?? "ALL";
    const periodDate = options.periodDate ?? startOfDay(collectedAt);
    const config = sourceCategoryConfigs[this.source];
    const baseResult = {
      source: this.source,
      category: options.category,
      audienceSegment,
      collectedAt,
      method: "CAFE24_CATEGORY_HTML",
      fetchedCount: 0,
      products: [] as MarketCollectedProduct[],
      errors: [] as MarketCollectionError[]
    };

    if (!config || config.method !== "CAFE24_CATEGORY_HTML") {
      return { ...baseResult, status: "UNSUPPORTED", errors: [{ source: this.source, category: options.category, reason: "Source is not configured for Cafe24 category HTML collection.", timestamp: collectedAt }] };
    }

    // REDNAPE's sourceCategoryConfigs entry already maps LONG_SLEEVE_TSHIRT
    // and PANTS to /category/new-arrivals/23/ (see docs/MARKET_SOURCE_AUDIT.md
    // "Rednape") - that config mapping existing does NOT mean a collector
    // exists for it. This guard is intentional and load-bearing: a future
    // agent must not assume LONG_SLEEVE_TSHIRT/PANTS are already
    // implemented just because getSourceCategoryUrl can resolve a URL for
    // them - only BAG (/category/accessories/45/) has real collector code
    // in this pass. Implementing new-arrivals is a separate, not-yet-done
    // task.
    if (options.category !== "BAG") {
      return {
        ...baseResult,
        status: "UNSUPPORTED",
        errors: [
          {
            source: this.source,
            category: options.category,
            reason: "Cafe24RednapeCollector only implements the BAG category (/category/accessories/45/) in this pass; other mapped categories (e.g. new-arrivals) are not yet implemented.",
            timestamp: collectedAt
          }
        ]
      };
    }

    const categoryUrl = getSourceCategoryUrl(this.source, options.category, options.limit);
    if (!categoryUrl) {
      return { ...baseResult, status: "UNSUPPORTED", errors: [{ source: this.source, category: options.category, reason: `No category mapping for ${options.category}.`, timestamp: collectedAt }] };
    }

    const seenIds = new Set<string>();
    const gatedEntries: RednapeListingEntry[] = [];
    let listingFetchedCount = 0;
    let nextListingPosition = 1;
    const checkRobots = createRednapeRobotsChecker(marketCollectorUserAgent());

    try {
      let page = 1;
      while (page <= MAX_LISTING_PAGES && gatedEntries.length < options.limit) {
        const pageUrl = withPage(categoryUrl, page);
        const robots = await checkRobots(pageUrl);
        if (!robots.allowed) {
          return { ...baseResult, status: "RESTRICTED", errors: [{ source: this.source, category: options.category, url: pageUrl, reason: robots.reason, timestamp: collectedAt }] };
        }

        const response = await fetch(pageUrl, { headers: { "User-Agent": marketCollectorUserAgent(), Accept: "text/html" } });
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${pageUrl}`);
        const html = await response.text();
        const entries = extractRednapeListingEntries(html, config.baseUrl, nextListingPosition);
        listingFetchedCount += entries.length;
        nextListingPosition += entries.length;
        if (entries.length === 0) break;

        const freshEntries = dedupeListingEntries(entries, seenIds);
        for (const entry of freshEntries) {
          if (!isConfirmedBagProduct(entry.name)) continue;
          gatedEntries.push(entry);
          if (gatedEntries.length >= options.limit) break;
        }
        if (freshEntries.length === 0) break;
        page += 1;
      }
    } catch (error) {
      return { ...baseResult, status: "FAILED", errors: [{ source: this.source, category: options.category, reason: error instanceof Error ? error.message : String(error), timestamp: new Date() }] };
    }

    const products: MarketCollectedProduct[] = [];
    const errors: MarketCollectionError[] = [];

    for (const [index, entry] of gatedEntries.entries()) {
      try {
        if (index > 0) await delay(RATE_LIMIT_DELAY_MS);
        const robots = await checkRobots(entry.detailUrl);
        if (!robots.allowed) throw new Error(robots.reason);

        const response = await fetch(entry.detailUrl, { headers: { "User-Agent": marketCollectorUserAgent(), Accept: "text/html" } });
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${entry.detailUrl}`);
        const html = await response.text();

        const jsonLd = extractRednapeProductJsonLd(html);
        if (!jsonLd) throw new Error(`Rednape product #${entry.externalProductId} detail page did not expose a parseable Product JSON-LD block.`);
        const canonicalUrl = extractRednapeCanonicalUrl(html) ?? entry.detailUrl;

        const raw: RawRednapeProduct = {
          externalProductId: entry.externalProductId,
          name: jsonLd.name ?? entry.name,
          canonicalUrl,
          images: Array.isArray(jsonLd.image) ? jsonLd.image : [],
          offers: normalizeRednapeOffers(jsonLd.offers)
        };

        // sourcePosition preserves the product's ORIGINAL listing position
        // (assigned before BAG gating - see RednapeListingEntry.listingPosition),
        // never a post-filter/gated-only counter. A product's position in the
        // real source listing is observational metadata and must not be
        // silently renumbered by which products happened to pass the BAG
        // gate. This does not make it a verified ranking: rankingVerified
        // stays false and rank stays null regardless (enforced inside
        // normalizeRednapeProduct itself).
        products.push(normalizeRednapeProduct({ raw, sourcePosition: entry.listingPosition, audienceSegment, periodDate, metricType: config.metricType }));
      } catch (error) {
        errors.push({
          source: this.source,
          category: options.category,
          externalProductId: entry.externalProductId,
          url: entry.detailUrl,
          reason: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    return {
      ...baseResult,
      fetchedCount: listingFetchedCount,
      products,
      errors,
      status: errors.length > 0 ? "PARTIAL_SUCCESS" : "SUCCESS"
    };
  }
}
