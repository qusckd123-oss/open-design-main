import type { EditorialMentionType } from "@/config/editorial-sources";

/**
 * PRODUCT REFERENCE'S FROZEN COPY OF EDITORIAL'S SURFACE VOCABULARY
 *
 * WHY THIS FILE EXISTS (2026-09-08 decoupling pass, see
 * docs/EDITORIAL_ITEM_TAXONOMY_AUDIT.md, "Previous Coupling"):
 *
 * `product-reference/object-relations.ts#resolveSpecificItem` used to import
 * `editorialRules` directly from `editorial/mentions.ts` and treat it as an
 * always-wins Tier-1 item check ahead of Product Reference's own supplemental
 * vocabulary (`./taxonomy.ts`). That made Product Reference's resolution
 * output for the persisted 120-product regression sample silently drift
 * every time Editorial's live taxonomy grew - even for items whose NAME
 * never collided with anything in `./taxonomy.ts` (`COAT`, `VEST`, and
 * `DOWN_JACKET`, added in the prior Editorial pass, newly resolved 3
 * products and reclassified a 4th in the persisted sample, moving
 * item-bearing from the documented, frozen 58/120 to 61/120 - discovered by
 * re-running the freeze check before this pass touched anything).
 *
 * Product Reference is closed, archived research (STOP decision recorded in
 * docs/PRODUCT_REFERENCE_MULTIBRAND_AUDIT.md: 58/120 item-bearing, 32/120
 * attribute-bearing, 52 relations, 92.3% conservative precision). Its
 * resolution behavior on that persisted sample is a REGRESSION CONTRACT, not
 * a live target to keep chasing. Editorial must remain free to expand its
 * own SUB_ITEM taxonomy indefinitely without that contract ever moving
 * again.
 *
 * THE FIX: this file is a byte-for-byte, hand-copied, PERMANENTLY FROZEN
 * snapshot of `editorial/mentions.ts`'s SUB_ITEM/attribute rule set exactly
 * as it stood at commit `7f75410` ("feat: support multilingual product item
 * aliases") - the last commit before Editorial's item-taxonomy expansion
 * passes began, and the version verified (by re-running the persisted
 * 120-product sample against it) to reproduce the documented 58/120 baseline
 * exactly. `object-relations.ts` and `attributes.ts` import ONLY this file
 * for their "existing item/attribute" tier - never `editorial/mentions.ts`.
 *
 * THIS FILE MUST NEVER BE EDITED to track future Editorial taxonomy changes.
 * It is a frozen artifact, not a living export. If Product Reference
 * research is ever explicitly reopened, that would be a deliberate, scoped
 * decision to change this file - not a side effect of an Editorial pass.
 * A regression test (`verifyEditorialProductReferenceScopeIsolation` in
 * `scripts/smoke-test.ts`) pins this file's exact rule count and value set
 * so an accidental edit here is caught immediately.
 */
export type FrozenEditorialRule = {
  type: EditorialMentionType;
  value: string;
  patterns: RegExp[];
};

function rx(pattern: string) {
  return new RegExp(pattern, "i");
}

const rules: FrozenEditorialRule[] = [
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
  { type: "DETAIL", value: "CHECK", patterns: [rx("\\bcheck\\b|\\bplaid\\b|\\uCCB4\\uD06C|\\uD50C\\uB798\\uB4DC")] },
  { type: "DETAIL", value: "SHIRRING", patterns: [rx("\\bshirring\\b|셔링")] },
  { type: "DETAIL", value: "RAGLAN", patterns: [rx("\\braglan\\b|라글란|래글런")] },
  { type: "DETAIL", value: "SEQUIN", patterns: [rx("\\bsequin\\b|시퀸|스팽글")] },
  { type: "DETAIL", value: "CAMO", patterns: [rx("\\bcamo\\b|\\bcamouflage\\b|카모|카모플라주")] },
  { type: "MATERIAL", value: "DENIM", patterns: [rx("\\bdenim\\b|\\uB370\\uB2D8")] },
  { type: "MATERIAL", value: "NYLON", patterns: [rx("\\bnylon\\b|\\uB098\\uC77C\\uB860")] },
  { type: "MATERIAL", value: "SUEDE", patterns: [rx("\\bsuede\\b|\\uC2A4\\uC6E8\\uC774\\uB4DC")] },
  { type: "MATERIAL", value: "FLEECE", patterns: [rx("\\bfleece\\b|\\uD50C\\uB9AC\\uC2A4")] },
  { type: "MATERIAL", value: "KNIT", patterns: [rx("\\bknit\\b|\\uB2C8\\uD2B8")] },
  { type: "MATERIAL", value: "CORDUROY", patterns: [rx("\\bcorduroy\\b|\\uCF54\\uB4C0\\uB85C\\uC774")] },
  { type: "MATERIAL", value: "RECYCLED_FABRIC", patterns: [rx("\\brecycled\\b|\\uC7AC\\uD65C\\uC6A9")] },
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

/**
 * Exactly 57 rules, frozen at commit 7f75410. Do not add, remove, or edit
 * entries here in response to an Editorial taxonomy change - see the module
 * docstring above.
 */
export const frozenEditorialRules: ReadonlyArray<FrozenEditorialRule> = rules;
