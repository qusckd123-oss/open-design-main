import { itemTypes, type ItemType } from "@/config/item-types";
import { importRows } from "@/services/import-service";
import { prisma } from "@/db/client";

const brands = ["WACKY WILLY", "COVERNAT", "THISISNEVERTHAT", "MARDI", "MUSINSA STANDARD", "LMC", "YALE", "SATUR", "ADER", "KIRSH"];
const categories = ["TOP", "OUTER", "BOTTOM", "BAG", "CAP", "SHOES", "ACCESSORY"];
const colors = ["Charcoal", "Black", "Navy", "White", "Grey", "Cream", "Khaki", "Blue"];
const fits = ["Regular", "Semi Oversized", "Oversized", "Wide", "Relaxed"];
const graphics = ["Lettering", "Character", "Symbol", "Stripe", "Solid", "College"];
const details = ["Ringer", "Washed", "Pocket", "Track Line", "Vintage", "Logo"];

const salesMapping = {
  productCode: "productCode",
  productName: "productName",
  periodDate: "periodDate",
  brand: "brand",
  category: "category",
  season: "season",
  gender: "gender",
  imageUrl: "imageUrl",
  itemType: "itemType",
  subItemType: "subItemType",
  fit: "fit",
  mainColor: "mainColor",
  graphicType: "graphicType",
  detail: "detail",
  salesQty: "salesQty",
  salesAmount: "salesAmount",
  stockQty: "stockQty",
  orderQty: "orderQty",
  sellThroughRate: "sellThroughRate",
  normalSalesRate: "normalSalesRate",
  discountRate: "discountRate",
  onlineSalesQty: "onlineSalesQty",
  storeSalesQty: "storeSalesQty"
};

const marketMapping = {
  source: "source",
  externalProductId: "externalProductId",
  productName: "productName",
  brand: "brand",
  periodDate: "periodDate",
  rank: "rank",
  category: "category",
  url: "url",
  imageUrl: "imageUrl",
  itemType: "itemType",
  subItemType: "subItemType",
  fit: "fit",
  mainColor: "mainColor",
  graphicType: "graphicType",
  detail: "detail",
  price: "price",
  salePrice: "salePrice",
  discountRate: "discountRate",
  reviewCount: "reviewCount",
  likeCount: "likeCount"
};

export async function resetSampleBusinessData() {
  await prisma.importError.deleteMany({ where: { importRun: { dataMode: "sample" } } });
  await prisma.importRun.deleteMany({ where: { dataMode: "sample" } });
  await prisma.salesSnapshot.deleteMany({ where: { dataMode: "sample" } });
  await prisma.marketRankingSnapshot.deleteMany({ where: { dataMode: "sample" } });
  await prisma.internalProduct.deleteMany({ where: { dataMode: "sample" } });
  await prisma.marketProduct.deleteMany({ where: { dataMode: "sample" } });

  const salesRows = buildSampleSalesRows();
  const marketRows = buildSampleMarketRows();
  const sales = await importRows({ type: "SALES", source: "INTERNAL_SAMPLE", fileName: "sample-sales-generated", dataMode: "sample", rows: salesRows, mapping: salesMapping });
  const market = await importRows({ type: "MARKET", source: "MARKET_SAMPLE", fileName: "sample-market-generated", dataMode: "sample", rows: marketRows, mapping: marketMapping });
  return { sales, market };
}

export function buildSampleSalesRows() {
  const weeks = recentWeekDates(12);
  const rows: Record<string, string>[] = [];
  for (let index = 0; index < 100; index += 1) {
    const itemType = sampleItemType(index);
    const subItemType = sampleSubItemType(index, itemType);
    const pattern = index % 6;
    const baseQty = 18 + (index % 24) * 4;
    const price = 29000 + (index % 12) * 5000;
    for (const [weekIndex, periodDate] of weeks.entries()) {
      const salesQty = Math.max(2, Math.round(baseQty * patternMultiplier(pattern, weekIndex)));
      const orderQty = 120 + (index % 8) * 30;
      const stockQty = Math.max(5, orderQty - salesQty * Math.max(1, weekIndex / 2));
      const sellThroughRate = Math.min(98, (salesQty / Math.max(orderQty, 1)) * 100 + weekIndex * 2);
      rows.push({
        productCode: `OD${String(index + 1).padStart(4, "0")}`,
        productName: `${displayName(itemType)} ${pick(details, index)} ${pick(colors, index)}`,
        brand: index % 4 === 0 ? "WACKY WILLY" : pick(brands, index),
        category: categoryFor(itemType),
        season: index % 2 === 0 ? "26SS" : "26FW",
        gender: "UNISEX",
        imageUrl: "",
        itemType,
        subItemType,
        fit: pick(fits, index),
        mainColor: pick(colors, index),
        graphicType: pick(graphics, index),
        detail: pick(details, index),
        periodDate,
        salesQty: String(salesQty),
        salesAmount: String(salesQty * price),
        stockQty: String(Math.round(stockQty)),
        orderQty: String(orderQty),
        sellThroughRate: sellThroughRate.toFixed(1),
        normalSalesRate: String(Math.max(35, 95 - (index % 5) * 10)),
        discountRate: String((index % 5) * 5),
        onlineSalesQty: String(Math.round(salesQty * 0.62)),
        storeSalesQty: String(Math.round(salesQty * 0.38))
      });
    }
  }
  return rows;
}

export function buildSampleMarketRows() {
  const weeks = recentWeekDates(12);
  const rows: Record<string, string>[] = [];
  const sources = ["MUSINSA", "29CM", "ZOZOTOWN", "KREAM"];
  let globalIndex = 0;
  for (const source of sources) {
    for (let index = 0; index < 60; index += 1) {
      const itemType = sampleItemType(index + sources.indexOf(source) * 3);
      const subItemType = marketSubItemType(index, itemType);
      const pattern = marketPattern(subItemType, index);
      const initialRank = 22 + ((index * 7 + sources.indexOf(source) * 11) % 108);
      for (const [weekIndex, periodDate] of weeks.entries()) {
        if (pattern === 4 && weekIndex < 8) continue;
        const rank = Math.max(1, Math.min(180, Math.round(initialRank - rankMovement(pattern, weekIndex))));
        const price = 35000 + (globalIndex % 14) * 6000;
        rows.push({
        source,
        externalProductId: `${source}-MK${String(index + 1).padStart(4, "0")}`,
        productName: `${subItemDisplayName(subItemType)} ${pick(colors, globalIndex + 1)}`,
        brand: pick(brands, globalIndex + 2),
        category: categoryFor(itemType),
        url: `https://example.com/${source.toLowerCase()}/products/MK${String(index + 1).padStart(4, "0")}?utm_source=sample`,
        imageUrl: "",
        itemType,
        subItemType,
        fit: pick(fits, globalIndex + 1),
        mainColor: pick(colors, globalIndex + 1),
        graphicType: graphicForSubItem(subItemType, globalIndex),
        detail: detailForSubItem(subItemType, globalIndex),
        periodDate,
        rank: String(rank),
        price: String(price),
        salePrice: String(Math.round(price * (0.75 + (globalIndex % 4) * 0.05))),
        discountRate: String(10 + (globalIndex % 4) * 5),
        reviewCount: String(30 + weekIndex * 8 + globalIndex * 3),
        likeCount: String(100 + weekIndex * 20 + globalIndex * 7)
      });
    }
      globalIndex += 1;
    }
  }
  return rows;
}

function recentWeekDates(count: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(today);
  latest.setDate(today.getDate() - today.getDay());
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(latest);
    date.setDate(latest.getDate() - (count - 1 - index) * 7);
    return date.toISOString().slice(0, 10);
  });
}

function sampleItemType(index: number): ItemType {
  const weighted: ItemType[] = ["T_SHIRT", "T_SHIRT", "LONG_SLEEVE", "SWEATSHIRT", "HOODIE", "SHIRT", "JACKET", "WINDBREAKER", "DENIM", "PANTS", "SHORTS", "BAG", "CAP", "ACCESSORY"];
  return weighted[index % weighted.length] ?? itemTypes[index % itemTypes.length] ?? "OTHER";
}

function sampleSubItemType(index: number, itemType: ItemType) {
  if (itemType === "T_SHIRT") return ["GRAPHIC_TEE", "RINGER_TEE", "STRIPED_TEE", "PIGMENT_TEE", "LOGO_TEE"][index % 5]!;
  if (itemType === "SHIRT") return ["CHECK_SHIRT", "OXFORD_SHIRT", "WORK_SHIRT"][index % 3]!;
  if (itemType === "JACKET") return ["TRACK_JACKET", "WORK_JACKET", "COACH_JACKET"][index % 3]!;
  if (itemType === "WINDBREAKER") return "WINDBREAKER";
  if (itemType === "PANTS") return ["WIDE_PANTS", "CARGO_PANTS", "TRACK_PANTS"][index % 3]!;
  if (itemType === "SHORTS") return "BERMUDA_SHORTS";
  if (itemType === "BAG") return ["NYLON_BAG", "BACKPACK"][index % 2]!;
  if (itemType === "CAP") return "BALL_CAP";
  if (itemType === "ACCESSORY") return "KEYRING";
  return "OTHER";
}

function marketSubItemType(index: number, itemType: ItemType) {
  const focus = ["RINGER_TEE", "TRACK_JACKET", "NYLON_BAG", "CHECK_SHIRT", "CARGO_PANTS", "GRAPHIC_TEE"];
  if (index < focus.length * 3) return focus[index % focus.length]!;
  return sampleSubItemType(index, itemType);
}

function marketPattern(subItemType: string, index: number) {
  if (["RINGER_TEE", "TRACK_JACKET", "NYLON_BAG"].includes(subItemType)) return index % 2 === 0 ? 1 : 0;
  if (subItemType === "GRAPHIC_TEE") return 2;
  if (subItemType === "PIGMENT_TEE") return 3;
  return index % 6;
}

function patternMultiplier(pattern: number, weekIndex: number) {
  if (pattern === 0) return 0.8 + weekIndex * 0.08;
  if (pattern === 1) return weekIndex < 8 ? 0.7 : 1.1 + (weekIndex - 8) * 0.25;
  if (pattern === 2) return 1.2;
  if (pattern === 3) return 1.6 - weekIndex * 0.08;
  if (pattern === 4) return weekIndex < 8 ? 0.35 : 1.4 + (weekIndex - 8) * 0.12;
  return 1 + Math.sin(weekIndex / 2) * 0.22;
}

function rankMovement(pattern: number, weekIndex: number) {
  if (pattern === 0) return weekIndex * 4;
  if (pattern === 1) return weekIndex < 8 ? weekIndex : 18 + (weekIndex - 8) * 12;
  if (pattern === 2) return 4;
  if (pattern === 3) return -weekIndex * 4;
  if (pattern === 4) return weekIndex * 7;
  return Math.sin(weekIndex / 2) * 10;
}

function displayName(itemType: ItemType) {
  return {
    T_SHIRT: "Graphic T-Shirt",
    LONG_SLEEVE: "Long Sleeve Tee",
    SWEATSHIRT: "College Sweatshirt",
    HOODIE: "Zip Hoodie",
    SHIRT: "Check Shirt",
    KNIT: "Summer Knit",
    JACKET: "Track Jacket",
    WINDBREAKER: "Nylon Windbreaker",
    DENIM: "Washed Denim",
    PANTS: "Wide Pants",
    SHORTS: "Bermuda Shorts",
    SKIRT: "Skirt",
    BAG: "Nylon Bag",
    CAP: "Ball Cap",
    SHOES: "Sneakers",
    ACCESSORY: "Keyring",
    OTHER: "Item"
  }[itemType];
}

function subItemDisplayName(subItemType: string) {
  return {
    GRAPHIC_TEE: "Graphic T-Shirt",
    RINGER_TEE: "Ringer T-Shirt",
    STRIPED_TEE: "Striped T-Shirt",
    PIGMENT_TEE: "Pigment T-Shirt",
    LOGO_TEE: "Logo T-Shirt",
    CHECK_SHIRT: "Check Shirt",
    TRACK_JACKET: "Track Jacket",
    WINDBREAKER: "Nylon Windbreaker",
    CARGO_PANTS: "Cargo Pants",
    WIDE_PANTS: "Wide Pants",
    BERMUDA_SHORTS: "Bermuda Shorts",
    NYLON_BAG: "Nylon Bag",
    BACKPACK: "Backpack",
    BALL_CAP: "Ball Cap",
    KEYRING: "Bag Charm Keyring"
  }[subItemType] ?? "Market Item";
}

function graphicForSubItem(subItemType: string, index: number) {
  if (subItemType === "RINGER_TEE") return "Lettering";
  if (subItemType === "GRAPHIC_TEE") return pick(["Character", "Photo", "Symbol", "College"], index);
  if (subItemType === "STRIPED_TEE") return "Stripe";
  return pick(graphics, index + 2);
}

function detailForSubItem(subItemType: string, index: number) {
  if (subItemType === "RINGER_TEE") return "Ringer";
  if (subItemType === "TRACK_JACKET") return "Track Line";
  if (subItemType === "NYLON_BAG") return "Nylon";
  return pick(details, index + 2);
}

function categoryFor(itemType: ItemType) {
  if (["BAG", "CAP", "SHOES", "ACCESSORY"].includes(itemType)) return "ACCESSORY";
  if (["DENIM", "PANTS", "SHORTS", "SKIRT"].includes(itemType)) return "BOTTOM";
  if (["JACKET", "WINDBREAKER"].includes(itemType)) return "OUTER";
  return "TOP";
}

function pick<T>(values: readonly T[], index: number): T {
  return values[index % values.length]!;
}
