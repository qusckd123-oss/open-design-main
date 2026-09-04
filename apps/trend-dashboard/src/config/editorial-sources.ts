export const editorialGenders = ["UNISEX", "WOMEN", "MEN", "MIXED", "UNKNOWN"] as const;
export type EditorialGender = (typeof editorialGenders)[number];

export const editorialMentionTypes = ["ITEM", "SUB_ITEM", "DETAIL", "MATERIAL", "COLOR", "STYLE", "BRAND", "COLLAB", "IP"] as const;
export type EditorialMentionType = (typeof editorialMentionTypes)[number];

export const editorialSources = ["VISLA", "HYPEBEAST_KR", "EYESMAG", "NONLABEL"] as const;
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
  }
};
