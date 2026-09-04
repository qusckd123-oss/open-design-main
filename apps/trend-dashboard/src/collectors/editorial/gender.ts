import type { EditorialGender } from "@/config/editorial-sources";

export function inferEditorialGender(input: { sourceCategory?: string | null; title?: string | null; text?: string | null }): EditorialGender {
  const source = normalize(input.sourceCategory ?? "");
  const title = normalize(input.title ?? "");
  const text = normalize(input.text ?? "");
  const explicit = `${source} ${title}`;
  const explicitWomen = hasWomen(explicit);
  const explicitMen = hasMen(explicit);
  if (explicitWomen && explicitMen) return "MIXED";
  if (explicitWomen) return "WOMEN";
  if (explicitMen) return "MEN";
  if (hasUnisex(explicit)) return "UNISEX";

  const body = `${title} ${text}`;
  const women = hasWomen(body);
  const men = hasMen(body);
  if (women && men) return "MIXED";
  if (women) return "WOMEN";
  if (men) return "MEN";
  if (hasUnisex(body)) return "UNISEX";
  return "UNKNOWN";
}

function hasWomen(text: string) {
  return /\bwomen'?s?\b|\bwomens\b|woman|female|womenswear|\uC5EC\uC131|\uC6B0\uBA3C|\uC5EC\uC790|\uAC78\uC988|w\s*concept/i.test(text);
}

function hasMen(text: string) {
  return /\bmen'?s?\b|\bmens\b|male|menswear|\uB0A8\uC131|\uB9E8\uC988|\uB0A8\uC790/i.test(text);
}

function hasUnisex(text: string) {
  return /unisex|gender neutral|genderless|\uACF5\uC6A9|\uC720\uB2C8\uC139\uC2A4|\uC820\uB354\uB9AC\uC2A4|\uB0A8\uB140\uACF5\uC6A9/i.test(text);
}

function normalize(text: string) {
  return text.toLowerCase();
}
