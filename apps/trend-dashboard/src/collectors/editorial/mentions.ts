import type { EditorialMentionType } from "@/config/editorial-sources";
import type { EditorialGender } from "@/config/editorial-sources";

export type EditorialMentionInput = {
  title: string;
  text: string;
  postGender?: EditorialGender | string | null;
};

export type EditorialMention = {
  type: EditorialMentionType;
  value: string;
  audienceGender: EditorialGender;
  confidence: number;
  evidence: string;
};

type Rule = {
  type: EditorialMentionType;
  value: string;
  patterns: RegExp[];
};

const rules: Rule[] = [
  { type: "ITEM", value: "T_SHIRT", patterns: [rx("\\bt-?shirt\\b|\\btee\\b|\\uD2F0\\uC154\\uCE20|\\uBC18\\uD314|\\uB871t")] },
  { type: "ITEM", value: "JACKET", patterns: [rx("\\bjacket\\b|\\uC7AC\\uD0B7|\\uC790\\uCF13|\\uBE14\\uB8E8\\uC885|\\uC544\\uC6B0\\uD130")] },
  { type: "ITEM", value: "PANTS", patterns: [rx("\\bpants\\b|\\btrousers\\b|\\bjeans\\b|\\bdenim\\b|\\uD32C\\uCE20|\\uB370\\uB2D8")] },
  { type: "ITEM", value: "BAG", patterns: [rx("\\bbag\\b|\\uBC31\\uD329|\\uBCF4\\uB514\\uBC31|\\uBC14\\uB514\\uBC31|\\uC204\\uB354\\uBC31|\\uD1A0\\uD2B8\\uBC31|\\uAC00\\uBC29")] },
  { type: "ITEM", value: "HEADWEAR", patterns: [rx("\\bcap\\b|\\bhat\\b|\\bbeanie\\b|\\uCEA1|\\uBAA8\\uC790|\\uBE44\\uB2C8")] },
  { type: "ITEM", value: "HOODIE", patterns: [rx("\\bhoodie\\b|\\bhooded\\b|\\uD6C4\\uB514|\\uD6C4\\uB4DC")] },
  { type: "SUB_ITEM", value: "BODY_BAG", patterns: [rx("\\bbody bag\\b|\\uBCF4\\uB514\\uBC31|\\uBC14\\uB514\\uBC31|\\uC6E8\\uC774\\uC2A4\\uD2B8\\uBC31")] },
  { type: "SUB_ITEM", value: "BACKPACK", patterns: [rx("\\bbackpack\\b|\\uBC31\\uD329|\\u30EA\\u30E5\\u30C3\\u30AF")] },
  { type: "SUB_ITEM", value: "SHOULDER_BAG", patterns: [rx("\\bshoulder bag\\b|\\uC204\\uB354\\uBC31")] },
  { type: "SUB_ITEM", value: "TRACK_JACKET", patterns: [rx("\\btrack jacket\\b|\\uD2B8\\uB799 \\uC7AC\\uD0B7|\\uD2B8\\uB799 \\uC790\\uCF13")] },
  { type: "SUB_ITEM", value: "COACH_JACKET", patterns: [rx("\\bcoach jacket\\b|\\uCF54\\uCE58 \\uC7AC\\uD0B7|\\uCF54\\uCE58 \\uC790\\uCF13")] },
  { type: "SUB_ITEM", value: "WORK_JACKET", patterns: [rx("\\bwork jacket\\b|\\uC6CC\\uD06C \\uC7AC\\uD0B7|\\uC6CC\\uD06C \\uC790\\uCF13")] },
  { type: "SUB_ITEM", value: "RINGER_TEE", patterns: [rx("\\bringer\\b|\\uB9C1\\uAC70")] },
  { type: "SUB_ITEM", value: "LONG_SLEEVE_TEE", patterns: [rx("\\blong sleeve tee\\b|\\blong sleeve t-?shirt\\b|\\uB871t|\\uB871 \\uD2F0|\\uB871\\uC2AC\\uB9AC\\uBE0C")] },
  { type: "SUB_ITEM", value: "RUGBY_SHIRT", patterns: [rx("\\brugby shirt\\b|\\uB7ED\\uBE44 \\uC154\\uCE20")] },
  { type: "SUB_ITEM", value: "WIDE_DENIM", patterns: [rx("\\bwide denim\\b|\\uC640\\uC774\\uB4DC \\uB370\\uB2D8")] },
  { type: "SUB_ITEM", value: "WIDE_PANTS", patterns: [rx("\\bwide pants\\b|\\uC640\\uC774\\uB4DC \\uD32C\\uCE20")] },
  { type: "SUB_ITEM", value: "KNIT_BEANIE", patterns: [rx("\\bknit beanie\\b|\\bbeanie\\b|\\uB2C8\\uD2B8 \\uBE44\\uB2C8|\\uBE44\\uB2C8")] },
  { type: "SUB_ITEM", value: "CAMP_CAP", patterns: [rx("\\bcamp cap\\b|캠프캡|캠프 캡")] },
  { type: "SUB_ITEM", value: "BALL_CAP", patterns: [rx("\\bball cap\\b|baseball cap|baseball hat|볼캡")] },
  { type: "SUB_ITEM", value: "BUCKET_HAT", patterns: [rx("\\bbucket hat\\b|버킷햇|버킷 햇")] },
  { type: "SUB_ITEM", value: "TOTE_BAG", patterns: [rx("\\btote bag\\b|\\uD1A0\\uD2B8\\uBC31|\\uD1A0\\uD2B8 \\uBC31")] },
  { type: "DETAIL", value: "PIPING", patterns: [rx("\\bpiping\\b|\\uD30C\\uC774\\uD551")] },
  { type: "DETAIL", value: "EMBROIDERY", patterns: [rx("\\bembroidery\\b|\\uC790\\uC218")] },
  { type: "DETAIL", value: "WASHED", patterns: [rx("\\bwashed\\b|\\uC6CC\\uC2F1|\\uD53C\\uADF8\\uBA3C\\uD2B8")] },
  { type: "DETAIL", value: "BIG_POCKET", patterns: [rx("\\bbig pocket\\b|\\uBE45 \\uD3EC\\uCF13|\\uCE74\\uACE0 \\uD3EC\\uCF13")] },
  { type: "DETAIL", value: "STRIPE", patterns: [rx("\\bstripe\\b|\\bstriped\\b|\\uC2A4\\uD2B8\\uB77C\\uC774\\uD504")] },
  { type: "DETAIL", value: "CHECK", patterns: [rx("\\bcheck\\b|\\bplaid\\b|\\uCCB4\\uD06C")] },
  { type: "MATERIAL", value: "DENIM", patterns: [rx("\\bdenim\\b|\\uB370\\uB2D8")] },
  { type: "MATERIAL", value: "NYLON", patterns: [rx("\\bnylon\\b|\\uB098\\uC77C\\uB860")] },
  { type: "MATERIAL", value: "SUEDE", patterns: [rx("\\bsuede\\b|\\uC2A4\\uC6E8\\uC774\\uB4DC")] },
  { type: "MATERIAL", value: "FLEECE", patterns: [rx("\\bfleece\\b|\\uD50C\\uB9AC\\uC2A4")] },
  { type: "MATERIAL", value: "KNIT", patterns: [rx("\\bknit\\b|\\uB2C8\\uD2B8")] },
  { type: "MATERIAL", value: "CORDUROY", patterns: [rx("\\bcorduroy\\b|\\uCF54\\uB4C0\\uB85C\\uC774")] },
  { type: "STYLE", value: "WORKWEAR", patterns: [rx("\\bworkwear\\b|\\uC6CC\\uD06C\\uC6E8\\uC5B4")] },
  { type: "STYLE", value: "PREPPY", patterns: [rx("\\bpreppy\\b|\\uD504\\uB808\\uD53C")] },
  { type: "STYLE", value: "SPORTY", patterns: [rx("\\bsporty\\b|\\uC2A4\\uD3EC\\uD2F0|\\uC2A4\\uD3EC\\uCE20")] },
  { type: "STYLE", value: "GORPCORE", patterns: [rx("\\bgorpcore\\b|\\uACE0\\uD504\\uCF54\\uC5B4")] },
  { type: "STYLE", value: "OUTDOOR", patterns: [rx("\\boutdoor\\b|\\uC544\\uC6C3\\uB3C4\\uC5B4")] },
  { type: "STYLE", value: "VINTAGE", patterns: [rx("\\bvintage\\b|\\uBE48\\uD2F0\\uC9C0")] },
  { type: "STYLE", value: "COLLEGE", patterns: [rx("\\bcollege\\b|\\uCE7C\\uB9AC\\uC9C0")] },
  { type: "COLOR", value: "BLACK", patterns: [rx("\\bblack\\b|\\uBE14\\uB799|\\uAC80\\uC815")] },
  { type: "COLOR", value: "WHITE", patterns: [rx("\\bwhite\\b|\\uD654\\uC774\\uD2B8|\\uD770\\uC0C9")] },
  { type: "COLOR", value: "RED", patterns: [rx("\\bred\\b|\\uB808\\uB4DC|\\uBE68\\uAC04")] },
  { type: "COLOR", value: "GREEN", patterns: [rx("\\bgreen\\b|\\uADF8\\uB9B0|\\uCD08\\uB85D")] },
  { type: "COLOR", value: "BROWN", patterns: [rx("\\bbrown\\b|\\uBE0C\\uB77C\\uC6B4|\\uAC08\\uC0C9")] },
  { type: "COLLAB", value: "COLLABORATION", patterns: [rx("\\bcollaboration\\b|\\bcollab\\b|\\uD611\\uC5C5")] },
  { type: "BRAND", value: "STUSSY", patterns: [rx("\\bstussy\\b|\\uC2A4\\uD22C\\uC2DC")] },
  { type: "BRAND", value: "NIKE", patterns: [rx("\\bnike\\b|\\uB098\\uC774\\uD0A4")] },
  { type: "BRAND", value: "ADIDAS", patterns: [rx("\\badidas\\b|\\uC544\\uB514\\uB2E4\\uC2A4")] },
  { type: "BRAND", value: "STONE_ISLAND", patterns: [rx("\\bstone island\\b|\\uC2A4\\uD1A4 \\uC544\\uC77C\\uB79C\\uB4DC")] },
  { type: "BRAND", value: "LACOSTE", patterns: [rx("\\blacoste\\b|\\uB77C\\uCF54\\uC2A4\\uD14C")] }
];

export function extractEditorialMentions(input: EditorialMentionInput): EditorialMention[] {
  const body = `${input.title}\n${input.text}`;
  const mentions = new Map<string, EditorialMention>();
  for (const rule of rules) {
    const evidence = rule.patterns.map((pattern) => body.match(pattern)?.[0]).find(Boolean);
    if (!evidence) continue;
    const key = `${rule.type}:${rule.value}`;
    const context = mentionContext(body, evidence);
    mentions.set(key, {
      type: rule.type,
      value: rule.value,
      audienceGender: inferMentionGender({ postGender: input.postGender, type: rule.type, value: rule.value, context }),
      confidence: input.title.match(rule.patterns[0]!) ? 0.95 : 0.75,
      evidence
    });
  }
  return [...mentions.values()];
}

function rx(pattern: string) {
  return new RegExp(pattern, "i");
}

function mentionContext(body: string, evidence: string) {
  const index = body.toLowerCase().indexOf(evidence.toLowerCase());
  if (index < 0) return body.slice(0, 240);
  return body.slice(Math.max(0, index - 120), index + evidence.length + 120);
}

function inferMentionGender(input: { postGender?: EditorialGender | string | null; type: EditorialMentionType; value: string; context: string }): EditorialGender {
  const context = input.context.toLowerCase();
  const women = /\bwomen'?s?\b|\bwomens\b|woman|female|womenswear|\uC5EC\uC131|\uC6B0\uBA3C|\uC5EC\uC790|\uAC78\uC988/i.test(context);
  const men = /\bmen'?s?\b|\bmens\b|male|menswear|\uB0A8\uC131|\uB9E8\uC988|\uB0A8\uC790/i.test(context);
  const unisex = /\bunisex\b|gender neutral|genderless|\uACF5\uC6A9|\uC720\uB2C8\uC139\uC2A4|\uC820\uB354\uB9AC\uC2A4|\uB0A8\uB140\uACF5\uC6A9/i.test(context);
  if (women && men) return "MIXED";
  if (women) return "WOMEN";
  if (men) return "MEN";
  if (unisex) return "UNISEX";
  if (input.postGender === "WOMEN" || input.postGender === "MEN" || input.postGender === "UNISEX" || input.postGender === "MIXED") return input.postGender;
  return "UNKNOWN";
}
