import { fashionKeywordSeeds } from "@/collectors/naver/keywords";
import { defaultNaverShoppingCategory } from "@/config/naver-shopping-category";
import { prisma } from "@/db/client";

export async function seedTrendKeywords() {
  for (const keyword of fashionKeywordSeeds) {
    await prisma.trendKeyword.upsert({
      where: { name: keyword.name },
      update: {
        category: keyword.category,
        aliases: JSON.stringify(keyword.aliases),
        shoppingKeyword: keyword.name,
        naverShoppingCategory: defaultNaverShoppingCategory(keyword.name),
        specificItem: keyword.specificItem ?? null,
        planningGender: keyword.planningGender ?? null
      },
      create: {
        name: keyword.name,
        category: keyword.category,
        aliases: JSON.stringify(keyword.aliases),
        shoppingKeyword: keyword.name,
        naverShoppingCategory: defaultNaverShoppingCategory(keyword.name),
        specificItem: keyword.specificItem ?? null,
        planningGender: keyword.planningGender ?? null,
        active: true
      }
    });
  }
}

export async function getActiveNaverKeywordInputs() {
  const keywords = await prisma.trendKeyword.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });

  return keywords.map((keyword) => ({
    name: keyword.name,
    category: keyword.category as "TOP" | "BOTTOM" | "ACCESSORY",
    aliases: parseAliases(keyword.aliases),
    shoppingKeyword: keyword.shoppingKeyword,
    naverShoppingCategory: keyword.naverShoppingCategory,
    specificItem: keyword.specificItem,
    planningGender: keyword.planningGender as "UNISEX" | "WOMEN" | null,
    active: keyword.active
  }));
}

function parseAliases(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
