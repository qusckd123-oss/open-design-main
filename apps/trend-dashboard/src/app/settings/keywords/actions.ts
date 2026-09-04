"use server";

import { revalidatePath } from "next/cache";
import { defaultNaverShoppingCategory } from "@/config/naver-shopping-category";
import { prisma } from "@/db/client";

export async function createKeyword(formData: FormData) {
  const name = stringField(formData, "name");
  const category = stringField(formData, "category") || "TOP";
  if (!name) return;
  const aliases = splitAliases(stringField(formData, "aliases"));
  await prisma.trendKeyword.upsert({
    where: { name },
    update: {
      category,
      aliases: JSON.stringify(aliases),
      shoppingKeyword: stringField(formData, "shoppingKeyword") || name,
      naverShoppingCategory: stringField(formData, "naverShoppingCategory") || defaultNaverShoppingCategory(name),
      active: formData.get("active") === "on"
    },
    create: {
      name,
      category,
      aliases: JSON.stringify(aliases),
      shoppingKeyword: stringField(formData, "shoppingKeyword") || name,
      naverShoppingCategory: stringField(formData, "naverShoppingCategory") || defaultNaverShoppingCategory(name),
      active: formData.get("active") === "on"
    }
  });
  revalidatePath("/settings/keywords");
  revalidatePath("/trends");
}

export async function updateKeyword(formData: FormData) {
  const id = stringField(formData, "id");
  const name = stringField(formData, "name");
  if (!id || !name) return;
  await prisma.trendKeyword.update({
    where: { id },
    data: {
      name,
      category: stringField(formData, "category") || "TOP",
      aliases: JSON.stringify(splitAliases(stringField(formData, "aliases"))),
      shoppingKeyword: stringField(formData, "shoppingKeyword") || name,
      naverShoppingCategory: stringField(formData, "naverShoppingCategory") || defaultNaverShoppingCategory(name),
      active: formData.get("active") === "on"
    }
  });
  revalidatePath("/settings/keywords");
  revalidatePath("/trends");
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function splitAliases(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
