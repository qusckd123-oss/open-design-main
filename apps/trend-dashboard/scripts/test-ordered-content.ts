import assert from "node:assert/strict";
import { parseEyesmagOrderedContent } from "../src/collectors/editorial/ordered-content";
import { resolveOrderedEvidenceImage } from "../src/collectors/editorial/image-relation";
import { selectEditorialVisualContext } from "../src/lib/editorial-visual-context";
import { buildEditorialContentBlockRows } from "./collect-korea-editorial";

const documentNode = {
  type: "doc",
  content: [
    { type: "heading", content: [{ type: "text", text: "이번 주 편집" }] },
    { type: "slider", attrs: { images: [{ url: "https://cdn.example/one.jpg", caption: "화이트 스커트" }, { url: "https://cdn.example/two.jpg" }] } },
    { type: "paragraph", content: [{ type: "text", text: "화이트 스커트가 보인다." }] },
    { type: "embed", attrs: { url: "https://instagram.com/p/not-a-body-image" } }
  ]
};

const html = `<script id="__NEXT_DATA__">${JSON.stringify({
  props: { pageProps: { initialPost: { content: JSON.stringify(documentNode) } } }
})}</script>`;

const expected = [
  { blockIndex: 0, blockType: "TEXT", text: "이번 주 편집", imageUrl: null, caption: null },
  { blockIndex: 1, blockType: "IMAGE", text: null, imageUrl: "https://cdn.example/one.jpg", caption: "화이트 스커트" },
  { blockIndex: 2, blockType: "IMAGE", text: null, imageUrl: "https://cdn.example/two.jpg", caption: null },
  { blockIndex: 3, blockType: "TEXT", text: "화이트 스커트가 보인다.", imageUrl: null, caption: null }
];

const first = parseEyesmagOrderedContent(html);
const second = parseEyesmagOrderedContent(html);
assert.deepEqual(first, expected, "EYESMAG must preserve source order, explicit captions, and exclude embeds.");
assert.deepEqual(second, first, "Repeated parsing of identical source HTML must be deterministic.");
assert.deepEqual(
  resolveOrderedEvidenceImage(first!, "화이트 스커트가 보인다."),
  { kind: "ADJACENT_BLOCK", imageUrl: "https://cdn.example/two.jpg" },
  "An adjacent image must be derived from normalized source order."
);
assert.deepEqual(
  resolveOrderedEvidenceImage(first!, "화이트 스커트"),
  { kind: "DIRECT_BLOCK", imageUrl: "https://cdn.example/one.jpg" },
  "An explicit image caption must be treated as same-block direct evidence."
);
assert.equal(parseEyesmagOrderedContent("<html>no hydration payload</html>"), null, "Missing source structure must safely fall back to no ordered blocks.");
const replacementRows = buildEditorialContentBlockRows("post-1", first!);
assert.deepEqual(buildEditorialContentBlockRows("post-1", first!), replacementRows, "Repeated replacement preparation must be byte-stable for identical parsed blocks.");
assert.deepEqual([...new Set(replacementRows.map((row) => row.blockIndex))], [0, 1, 2, 3], "Replacement rows must keep one stable index per ordered block.");
assert.equal(
  selectEditorialVisualContext([
    { imageUrl: "https://cdn.example/one.jpg?size=large", url: "https://example.com/a" },
    { imageUrl: "https://cdn.example/one.jpg?size=small", url: "https://example.com/b" }
  ]).length,
  1,
  "Existing visual selection must continue deduplicating transformed image identities."
);

console.log("ordered editorial content tests passed");
