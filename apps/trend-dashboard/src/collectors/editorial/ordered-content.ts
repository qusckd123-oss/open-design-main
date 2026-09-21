/**
 * Canonical ordered editorial content produced by a source adapter.
 *
 * This is intentionally raw source structure only. DIRECT_BLOCK and
 * ADJACENT_BLOCK remain derived relationships and are not persisted here.
 */
export type OrderedEditorialContentBlock = {
  blockIndex: number;
  blockType: "TEXT" | "IMAGE";
  text: string | null;
  imageUrl: string | null;
  caption: string | null;
};

type TipTapRecord = {
  type?: unknown;
  text?: unknown;
  content?: unknown;
  attrs?: unknown;
};

/**
 * Extracts the public EYESMAG TipTap document from __NEXT_DATA__ and keeps
 * only the article's own ordered paragraph/heading/list/blockquote and slider
 * nodes. Navigation, embeds, and unrelated page chrome are not part of the
 * source document and are therefore excluded.
 */
export function parseEyesmagOrderedContent(html: string): OrderedEditorialContentBlock[] | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match?.[1]) return null;

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return null;
  }

  const content = (data as { props?: { pageProps?: { initialPost?: { content?: unknown } } } })?.props?.pageProps?.initialPost?.content;
  if (typeof content !== "string" || !content.trim()) return null;

  let documentNode: unknown;
  try {
    documentNode = JSON.parse(content);
  } catch {
    return null;
  }

  const blocks: OrderedEditorialContentBlock[] = [];
  appendTipTapBlocks(documentNode, blocks);
  return blocks.length > 0 ? blocks : null;
}

function appendTipTapBlocks(node: unknown, blocks: OrderedEditorialContentBlock[]): void {
  if (!node || typeof node !== "object") return;
  const record = node as TipTapRecord;

  if (record.type === "slider") {
    appendSliderImages(record.attrs, blocks);
    return;
  }

  if (isTextBlock(record.type)) {
    const text = collectTipTapText(record).replace(/\s+/g, " ").trim();
    if (text) {
      blocks.push({ blockIndex: blocks.length, blockType: "TEXT", text, imageUrl: null, caption: null });
    }
    return;
  }

  // Walk supported nested containers (for example listItem) without turning
  // arbitrary embeds or widgets into article content blocks.
  if (Array.isArray(record.content) && isContainer(record.type)) {
    for (const child of record.content) appendTipTapBlocks(child, blocks);
  }
}

function appendSliderImages(attrs: unknown, blocks: OrderedEditorialContentBlock[]): void {
  if (!attrs || typeof attrs !== "object") return;
  const images = (attrs as { images?: unknown }).images;
  if (!Array.isArray(images)) return;

  for (const image of images) {
    if (!image || typeof image !== "object") continue;
    const record = image as { url?: unknown; src?: unknown; caption?: unknown };
    const imageUrl = typeof record.url === "string" ? record.url.trim() : typeof record.src === "string" ? record.src.trim() : "";
    if (!imageUrl) continue;
    const caption = typeof record.caption === "string" && record.caption.trim() ? record.caption.trim() : null;
    blocks.push({ blockIndex: blocks.length, blockType: "IMAGE", text: null, imageUrl, caption });
  }
}

function collectTipTapText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const record = node as TipTapRecord;
  if (record.type === "text" && typeof record.text === "string") return record.text;
  if (!Array.isArray(record.content)) return "";
  return record.content.map(collectTipTapText).join("");
}

function isTextBlock(type: unknown): boolean {
  return type === "paragraph" || type === "heading" || type === "listItem" || type === "blockquote";
}

function isContainer(type: unknown): boolean {
  return type === "doc" || type === "bulletList" || type === "orderedList" || type === "listItem";
}
