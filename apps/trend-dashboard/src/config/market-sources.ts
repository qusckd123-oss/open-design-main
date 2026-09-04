export const marketSources = [
  "MUSINSA",
  "29CM",
  "ZOZOTOWN",
  "KREAM",
  "ABLY",
  "ZIGZAG",
  "WEAR",
  "RAKUTEN_FASHION",
  "BEAMS",
  "SSENSE",
  "END",
  "SLAM_JAM",
  "HBX",
  "STUSSY",
  "BODEGA",
  "OTHER"
] as const;

export type MarketSource = (typeof marketSources)[number];

export function normalizeMarketSource(value: string | null | undefined): MarketSource {
  const normalized = String(value ?? "").trim().toUpperCase().replace(/[\s._-]+/g, "");
  if (normalized === "29" || normalized === "29CM") return "29CM";
  if (normalized.includes("MUSINSA") || normalized.includes("MSS")) return "MUSINSA";
  if (normalized.includes("ZOZO")) return "ZOZOTOWN";
  if (normalized.includes("KREAM")) return "KREAM";
  if (normalized.includes("ABLY")) return "ABLY";
  if (normalized.includes("ZIGZAG")) return "ZIGZAG";
  if (normalized.includes("WEAR")) return "WEAR";
  if (normalized.includes("RAKUTEN")) return "RAKUTEN_FASHION";
  if (normalized.includes("BEAMS")) return "BEAMS";
  if (normalized.includes("SSENSE")) return "SSENSE";
  if (normalized === "END" || normalized.includes("ENDCLOTHING")) return "END";
  if (normalized.includes("SLAMJAM")) return "SLAM_JAM";
  if (normalized.includes("HBX")) return "HBX";
  if (normalized.includes("STUSSY")) return "STUSSY";
  if (normalized.includes("BODEGA")) return "BODEGA";
  return "OTHER";
}
