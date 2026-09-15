import type { MarketMetricType, RankingCategory, RankingScope } from "@/config/market-category-map";
import type { MarketCollectedProduct } from "@/collectors/market/types";

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
