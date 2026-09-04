const brands = ["COVERNAT", "THISISNEVERTHAT", "MARDI", "LEE", "YALE", "WACKY WILLY", "LMC", "MUSINSA STANDARD"];
const categories = ["상의", "아우터", "팬츠", "가방", "모자", "신발", "액세서리"];
const itemTypes = ["Graphic T-Shirt", "Ringer T-Shirt", "Track Jacket", "Nylon Bag", "Cargo Pants", "Ball Cap", "Sneakers"];
const colors = ["Charcoal", "White", "Navy", "Black", "Grey", "Khaki", "Sky Blue"];
const fits = ["Semi Oversized", "Regular", "Relaxed", "Cropped"];
const graphics = ["Character", "Lettering", "Symbol", "Logo", "Solid"];

export function makeMockProductBase(index: number) {
  const brand = brands[index % brands.length]!;
  const category = categories[index % categories.length]!;
  const itemType = itemTypes[index % itemTypes.length]!;
  const color = colors[index % colors.length]!;
  const price = 29000 + (index % 12) * 5000;
  const discountRate = (index % 5) * 5;
  const salePrice = Math.round((price * (100 - discountRate)) / 100 / 100) * 100;

  return {
    externalId: `musinsa-mock-${String(index + 1).padStart(3, "0")}`,
    source: "musinsa",
    brand,
    name: `${color} ${itemType} ${String(index + 1).padStart(2, "0")}`,
    url: `https://www.musinsa.com/app/goods/${100000 + index}`,
    imageUrl: `https://images.unsplash.com/photo-${mockImageIds[index % mockImageIds.length]}?auto=format&fit=crop&w=480&q=80`,
    category,
    gender: "Unisex",
    color,
    isNew: index % 11 === 0,
    price,
    salePrice,
    discountRate,
    reviewCount: 80 + index * 17,
    likeCount: 300 + index * 43,
    isSoldOut: index % 29 === 0,
    tag: {
      itemType,
      fit: fits[index % fits.length]!,
      mainColor: color,
      subColor: colors[(index + 2) % colors.length]!,
      material: index % 3 === 0 ? "Cotton" : index % 3 === 1 ? "Nylon" : "Polyester",
      graphicType: graphics[index % graphics.length]!,
      detail: index % 4 === 0 ? "Ringer" : index % 4 === 1 ? "Washed" : index % 4 === 2 ? "Pocket" : "Logo Patch",
      style: "Casual / Street",
      gender: "Unisex"
    }
  };
}

export function rankForDay(index: number, dayOffset: number) {
  const currentBase = 1 + ((index * 7) % 120);
  if (index % 13 === 0) return dayOffset <= 3 ? 135 - dayOffset : 18 + dayOffset;
  if (index % 5 === 0) return Math.max(1, currentBase + dayOffset * 8);
  if (index % 7 === 0) return Math.min(140, currentBase - dayOffset * 5);
  if (index % 3 === 0) return Math.max(1, currentBase + dayOffset * 3);
  return Math.max(1, currentBase + ((dayOffset % 3) - 1) * 2);
}

const mockImageIds = [
  "1523398002811-999ca8dec234",
  "1515886657613-9f3515b0c78f",
  "1503342217505-b0a15ec3261c",
  "1489987707025-afc232f7ea0f",
  "1529139574466-a303027c1d8b",
  "1506629905607-d9d297d3b6a7",
  "1516762689617-e1cffcef479d",
  "1554568218-0f1715e72254"
];
