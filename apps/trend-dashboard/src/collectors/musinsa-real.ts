import { mapMusinsaCategory } from "@/collectors/category-map";
import type { CollectedProduct, CollectionFailure, CollectionResult, CollectorAdapter, CollectOptions } from "@/collectors/types";

export type RawMusinsaProduct = {
  externalId?: string;
  rank?: number;
  brand?: string;
  name?: string;
  url?: string;
  imageUrl?: string | null;
  price?: number | null;
  salePrice?: number | null;
  discountRate?: number | null;
  reviewCount?: number | null;
  likeCount?: number | null;
  isSoldOut?: boolean;
  category?: string | null;
  gender?: string | null;
  isNew?: boolean;
};

const rankingUrl = "https://www.musinsa.com/main/musinsa/ranking";
const robotsUrl = "https://www.musinsa.com/robots.txt";

export class MusinsaRealAdapter implements CollectorAdapter {
  source = "musinsa";
  mode = "real" as const;

  async collect(options: CollectOptions = {}): Promise<CollectionResult> {
    const startedAt = new Date();
    const allowed = await isAllowedByRobots(rankingUrl, process.env.MUSINSA_USER_AGENT ?? "TrendSignalDashboard/0.1");
    if (!allowed.allowed) {
      return {
        source: this.source,
        mode: this.mode,
        fetchedCount: 0,
        items: [],
        failures: [
          {
            source: this.source,
            url: rankingUrl,
            reason: allowed.reason,
            timestamp: startedAt
          }
        ]
      };
    }

    const html = await fetchText(rankingUrl);
    const rawItems = extractRawProductsFromHtml(html).slice(0, options.limit ?? 100);
    const items: CollectedProduct[] = [];
    const failures: CollectionFailure[] = [];
    const collectedAt = new Date();

    rawItems.forEach((raw, index) => {
      try {
        items.push(normalizeMusinsaProduct(raw, index + 1, collectedAt));
      } catch (error) {
        failures.push({
          source: this.source,
          externalId: raw.externalId,
          url: raw.url,
          reason: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    });

    return {
      source: this.source,
      mode: this.mode,
      fetchedCount: rawItems.length,
      items,
      failures
    };
  }
}

export function normalizeMusinsaProduct(raw: RawMusinsaProduct, fallbackRank: number, collectedAt: Date): CollectedProduct {
  const externalId = raw.externalId ?? extractGoodsNo(raw.url);
  if (!externalId) throw new Error("Missing product externalId.");
  if (!raw.brand) throw new Error("Missing brand.");
  if (!raw.name) throw new Error("Missing product name.");
  if (!raw.url) throw new Error("Missing product URL.");

  return {
    externalId,
    source: "musinsa",
    brand: raw.brand.trim(),
    name: raw.name.trim(),
    url: toAbsoluteMusinsaUrl(raw.url),
    imageUrl: raw.imageUrl ?? null,
    category: mapMusinsaCategory(raw.category, raw.name),
    gender: raw.gender ?? null,
    isNew: raw.isNew ?? false,
    rank: raw.rank ?? fallbackRank,
    price: raw.price ?? null,
    salePrice: raw.salePrice ?? null,
    discountRate: raw.discountRate ?? null,
    reviewCount: raw.reviewCount ?? null,
    likeCount: raw.likeCount ?? null,
    isSoldOut: raw.isSoldOut ?? false,
    collectedAt
  };
}

export function extractRawProductsFromHtml(html: string): RawMusinsaProduct[] {
  const nextData = extractNextData(html);
  if (nextData) {
    const products = findProductLikeObjects(nextData);
    if (products.length > 0) return products.map(objectToRawProduct).filter((product) => product.name || product.externalId);
  }

  return extractAnchorBasedProducts(html);
}

function extractNextData(html: string): unknown | null {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>(.*?)<\/script>/s);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeHtmlEntities(match[1]));
  } catch {
    return null;
  }
}

function findProductLikeObjects(root: unknown): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const seen = new Set<object>();

  function visit(value: unknown) {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);

    if (!Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).join(" ").toLowerCase();
      const hasProductName = ["goodsName", "goodsNm", "productName", "name"].some((key) => key in record);
      const hasBrand = ["brandName", "brand", "brandNm"].some((key) => key in record);
      const hasId = ["goodsNo", "goodsId", "productId", "id"].some((key) => key in record);
      if (hasProductName && hasBrand && hasId && (keys.includes("rank") || keys.includes("price") || keys.includes("goods"))) {
        results.push(record);
      }
    }

    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      visit(child);
    }
  }

  visit(root);
  return dedupeRawObjects(results);
}

function objectToRawProduct(record: Record<string, unknown>): RawMusinsaProduct {
  const externalId = stringValue(record.goodsNo) ?? stringValue(record.goodsId) ?? stringValue(record.productId) ?? stringValue(record.id);
  const name = stringValue(record.goodsName) ?? stringValue(record.goodsNm) ?? stringValue(record.productName) ?? stringValue(record.name);
  const brand = stringValue(record.brandName) ?? stringValue(record.brand) ?? stringValue(record.brandNm);
  const url = stringValue(record.goodsUrl) ?? stringValue(record.productUrl) ?? (externalId ? `/app/goods/${externalId}` : undefined);

  return {
    externalId: externalId ? `musinsa-${externalId}` : undefined,
    rank: numberValue(record.rank) ?? numberValue(record.ranking),
    brand,
    name,
    url,
    imageUrl: stringValue(record.imageUrl) ?? stringValue(record.thumbnail) ?? stringValue(record.goodsImageUrl),
    price: numberValue(record.normalPrice) ?? numberValue(record.price),
    salePrice: numberValue(record.salePrice) ?? numberValue(record.finalPrice),
    discountRate: numberValue(record.discountRate) ?? numberValue(record.discount),
    reviewCount: numberValue(record.reviewCount) ?? numberValue(record.reviewCnt),
    likeCount: numberValue(record.likeCount) ?? numberValue(record.likeCnt),
    isSoldOut: booleanValue(record.isSoldOut) ?? booleanValue(record.soldOut),
    category: stringValue(record.categoryName) ?? stringValue(record.category),
    gender: stringValue(record.gender),
    isNew: booleanValue(record.isNew)
  };
}

function extractAnchorBasedProducts(html: string): RawMusinsaProduct[] {
  const productBlocks = [...html.matchAll(/<a[^>]+href=["']([^"']*(?:goods|products?)\/(\d+)[^"']*)["'][^>]*>(.*?)<\/a>/gis)];
  return productBlocks.map((match, index) => {
    const body = stripTags(match[3] ?? "");
    return {
      externalId: `musinsa-${match[2]}`,
      rank: index + 1,
      name: body || undefined,
      brand: undefined,
      url: match[1],
      imageUrl: extractFirstImage((match[0] ?? "").toString())
    };
  });
}

async function isAllowedByRobots(url: string, userAgent: string) {
  try {
    const robots = await fetchText(robotsUrl);
    const path = new URL(url).pathname;
    const allowed = parseRobotsAllowed(robots, userAgent, path);
    return {
      allowed,
      reason: allowed
        ? "Allowed by robots.txt."
        : `Blocked by robots.txt for user-agent "${userAgent}" on path "${path}".`
    };
  } catch (error) {
    return {
      allowed: false,
      reason: `Unable to verify robots.txt: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function parseRobotsAllowed(robots: string, userAgent: string, path: string) {
  const groups = robots.split(/\n(?=User-agent:)/i);
  const normalizedAgent = userAgent.toLowerCase();
  let wildcardRules: string[] = [];

  for (const group of groups) {
    const lines = group
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    const agents = lines
      .filter((line) => /^user-agent:/i.test(line))
      .map((line) => line.split(":").slice(1).join(":").trim().toLowerCase());
    const rules = lines.filter((line) => /^disallow:/i.test(line) || /^allow:/i.test(line));
    if (agents.includes("*")) wildcardRules = rules;
    if (agents.some((agent) => normalizedAgent.includes(agent))) return applyRobotsRules(rules, path);
  }

  return applyRobotsRules(wildcardRules, path);
}

function applyRobotsRules(rules: string[], path: string) {
  let matched: { directive: "allow" | "disallow"; value: string } | null = null;
  for (const rule of rules) {
    const [rawDirective, ...rest] = rule.split(":");
    const directive = rawDirective?.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!value) continue;
    if (path.startsWith(value) && (!matched || value.length > matched.value.length)) {
      matched = { directive: directive === "allow" ? "allow" : "disallow", value };
    }
  }
  return matched?.directive !== "disallow";
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": process.env.MUSINSA_USER_AGENT ?? "TrendSignalDashboard/0.1",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return response.text();
}

function dedupeRawObjects(records: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const id = stringValue(record.goodsNo) ?? stringValue(record.goodsId) ?? stringValue(record.productId) ?? stringValue(record.id);
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function extractGoodsNo(url: string | undefined) {
  if (!url) return null;
  const match = url.match(/(?:goods|products?)\/(\d+)/);
  return match?.[1] ? `musinsa-${match[1]}` : null;
}

function toAbsoluteMusinsaUrl(url: string) {
  return url.startsWith("http") ? url : new URL(url, "https://www.musinsa.com").toString();
}

function extractFirstImage(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : typeof value === "number" ? String(value) : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (["true", "Y", "y", "1"].includes(value)) return true;
    if (["false", "N", "n", "0"].includes(value)) return false;
  }
  return undefined;
}
