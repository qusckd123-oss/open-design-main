export const editorialGenders = ["UNISEX", "WOMEN", "MEN", "MIXED", "UNKNOWN"] as const;
export type EditorialGender = (typeof editorialGenders)[number];

export const editorialMentionTypes = ["ITEM", "SUB_ITEM", "DETAIL", "MATERIAL", "COLOR", "STYLE", "BRAND", "COLLAB", "IP"] as const;
export type EditorialMentionType = (typeof editorialMentionTypes)[number];

export const editorialSources = ["VISLA", "HYPEBEAST_KR", "EYESMAG", "NONLABEL", "ESQUIRE_KR", "HARPERSBAZAAR_KR", "COSMOPOLITAN_KR"] as const;
export type EditorialSource = (typeof editorialSources)[number];

export type EditorialSourceConfig = {
  source: EditorialSource;
  country: "KOREA";
  sourceType: "EDITORIAL";
  signalType: "EDITORIAL";
  feedUrl: string;
  targetUrl: string;
  collectionMethod: "PUBLIC_RSS_FEED" | "PUBLIC_NEWS_SITEMAP" | "PUBLIC_HTML_LISTING";
  genderAvailable: boolean;
  role: string[];
  description: string;
};

export const editorialSourceConfigs: Record<EditorialSource, EditorialSourceConfig> = {
  VISLA: {
    source: "VISLA",
    country: "KOREA",
    sourceType: "EDITORIAL",
    signalType: "EDITORIAL",
    feedUrl: "https://visla.kr/category/news/fashion/feed/",
    targetUrl: "https://visla.kr/category/news/fashion/",
    collectionMethod: "PUBLIC_RSS_FEED",
    genderAvailable: false,
    role: ["SUBCULTURE", "STREET", "FASHION"],
    description: "Official VISLA Fashion category RSS feed. Useful for Korean editorial trend mentions; gender is inferred only from explicit text."
  },
  HYPEBEAST_KR: {
    source: "HYPEBEAST_KR",
    country: "KOREA",
    sourceType: "EDITORIAL",
    signalType: "EDITORIAL",
    feedUrl: "https://hypebeast.kr/fashion/feed",
    targetUrl: "https://hypebeast.kr/fashion",
    collectionMethod: "PUBLIC_RSS_FEED",
    genderAvailable: false,
    role: ["FAST_FASHION_NEWS", "BRAND", "COLLAB"],
    description: "Official Hypebeast Korea RSS feed. Fashion relevance is filtered from public article text and category/title signals."
  },
  EYESMAG: {
    source: "EYESMAG",
    country: "KOREA",
    sourceType: "EDITORIAL",
    signalType: "EDITORIAL",
    feedUrl: "https://www.eyesmag.com/sitemap/sitemap-news.xml.gz",
    targetUrl: "https://www.eyesmag.com/category/fashion/all",
    collectionMethod: "PUBLIC_NEWS_SITEMAP",
    genderAvailable: false,
    role: ["FASHION_NEWS", "BRAND", "ITEM", "COLLAB"],
    description: "Official EYESMAG news sitemap plus public article pages. Fashion relevance is filtered by title/body mention evidence."
  },
  NONLABEL: {
    source: "NONLABEL",
    country: "KOREA",
    sourceType: "EDITORIAL",
    signalType: "EDITORIAL",
    feedUrl: "https://nonlabel.co.kr/archive?category=FASHION",
    targetUrl: "https://nonlabel.co.kr/archive?category=FASHION",
    collectionMethod: "PUBLIC_HTML_LISTING",
    genderAvailable: false,
    role: ["ARCHIVE", "STYLE", "VINTAGE", "SUBCULTURE"],
    description: "Official NONLABEL archive/fashion listing and public article pages. Useful for Korean brand/style archive trend mentions."
  },
  ESQUIRE_KR: {
    source: "ESQUIRE_KR",
    country: "KOREA",
    sourceType: "EDITORIAL",
    signalType: "EDITORIAL",
    feedUrl: "https://www.esquirekorea.co.kr/sitemap/sitemap.xml",
    targetUrl: "https://www.esquirekorea.co.kr/fashion",
    collectionMethod: "PUBLIC_NEWS_SITEMAP",
    genderAvailable: false,
    role: ["MENSWEAR", "LIFESTYLE", "FASHION_NEWS"],
    description: "Official Esquire Korea public sitemap (10,000 dated article URLs, no login) plus public article pages. Selected 2026-09-07 for having the highest direct-attribute density found in a source audit (10% vs ~3-5% for existing sources), from a menswear/lifestyle angle that complements the streetwear-leaning existing corpus."
  },
  HARPERSBAZAAR_KR: {
    source: "HARPERSBAZAAR_KR",
    country: "KOREA",
    sourceType: "EDITORIAL",
    signalType: "EDITORIAL",
    feedUrl: "https://www.harpersbazaar.co.kr/sitemap/sitemap.xml",
    targetUrl: "https://www.harpersbazaar.co.kr/fashion",
    collectionMethod: "PUBLIC_NEWS_SITEMAP",
    genderAvailable: false,
    role: ["WOMENSWEAR", "STYLING", "FASHION_NEWS"],
    description: "Official Harper's Bazaar Korea public whole-site sitemap (same technical platform as ESQUIRE_KR: /article/<id> URLs, atc_body_cont body container, JSON-LD dates) plus public article pages. Selected 2026-09-09 for a cross-source independent-signal audit after a 20-article real-extractor probe measured a 40% Direct Attribute Rate (vs. ESQUIRE_KR's 10%) driven by its item+color/material outfit-styling article format ('이럴 땐 이런 아이템' shoppable callouts), including real evidence that independently confirms the existing 체크 SHIRT and 니트 CARDIGAN bundles from unrelated brands/products."
  },
  COSMOPOLITAN_KR: {
    source: "COSMOPOLITAN_KR",
    country: "KOREA",
    sourceType: "EDITORIAL",
    signalType: "EDITORIAL",
    feedUrl: "https://www.cosmopolitan.co.kr/sitemap/sitemap.xml",
    targetUrl: "https://www.cosmopolitan.co.kr/fashion",
    collectionMethod: "PUBLIC_NEWS_SITEMAP",
    genderAvailable: false,
    role: ["WOMENSWEAR", "CELEBRITY_STYLE", "FASHION_NEWS"],
    description: "Official Cosmopolitan Korea public whole-site sitemap - the same Hearst Joongang technical platform as ESQUIRE_KR/HARPERSBAZAAR_KR (identical business registration number 104-81-55280; /article/<id> URLs, atc_body_cont body container, JSON-LD dates). Selected 2026-09-09 after a 20-article real-extractor probe measured a 40% Direct Attribute Rate via celebrity street-style/outfit-comparison features, and after a publisher-family diversity audit found 2 of its 3 probe-sampled existing-bundle touches would add a publisher family (Hearst Joongang) not already supporting that bundle (데님 VEST, 체크 SHIRT), not merely deepen an already-represented family. Per that same audit, this is intended as the last Hearst Joongang source added for the current phase - ELLE_KR (same entity, weaker 20% probe density) is deliberately deferred in favor of publisher-family diversification next."
  }
};
