import { parseEyesmagOrderedContent, type OrderedEditorialContentBlock } from "../src/collectors/editorial/ordered-content";
import { prisma } from "../src/db/client";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DEFAULT_LIMIT = 25;

type BackfillPost = {
  id: string;
  url: string;
  canonicalUrl: string | null;
  title: string;
  publishedAt: Date | null;
};

function argValue(name: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function toRows(postId: string, blocks: readonly OrderedEditorialContentBlock[]) {
  return blocks.map((block) => ({
    postId,
    blockIndex: block.blockIndex,
    blockType: block.blockType,
    text: block.text,
    imageUrl: block.imageUrl,
    caption: block.caption
  }));
}

async function fetchArticleHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TrendSignalDashboard/0.1 (+bounded EYESMAG ordered-content backfill)",
      Accept: "text/html,application/xhtml+xml,*/*"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export async function previewEyesmagContentBlocks(limit = DEFAULT_LIMIT) {
  const posts = await selectPosts(limit);
  const rows = [];
  for (const post of posts) {
    try {
      const html = await fetchArticleHtml(post.canonicalUrl || post.url);
      const blocks = parseEyesmagOrderedContent(html);
      rows.push({
        id: post.id,
        title: post.title,
        url: post.canonicalUrl || post.url,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        status: blocks ? "PARSED" : "EMPTY",
        blockCount: blocks?.length ?? 0,
        textCount: blocks?.filter((block) => block.blockType === "TEXT").length ?? 0,
        imageCount: blocks?.filter((block) => block.blockType === "IMAGE").length ?? 0,
        captionCount: blocks?.filter((block) => Boolean(block.caption)).length ?? 0
      });
    } catch (error) {
      rows.push({
        id: post.id,
        title: post.title,
        url: post.canonicalUrl || post.url,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        status: "FAILED",
        blockCount: 0,
        textCount: 0,
        imageCount: 0,
        captionCount: 0,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return rows;
}

async function selectPosts(limit: number): Promise<BackfillPost[]> {
  return prisma.editorialPost.findMany({
    where: { source: "EYESMAG", dataMode: "real" },
    select: { id: true, url: true, canonicalUrl: true, title: true, publishedAt: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit
  });
}

async function applyRows(post: BackfillPost, blocks: readonly OrderedEditorialContentBlock[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.editorialContentBlock.deleteMany({ where: { postId: post.id } });
    const rows = toRows(post.id, blocks);
    if (rows.length > 0) await tx.editorialContentBlock.createMany({ data: rows });
  });
}

async function main() {
  const limit = Math.max(1, Math.min(30, Math.trunc(Number(argValue("limit") ?? DEFAULT_LIMIT))));
  const dryRun = hasFlag("dry-run");
  const preview = await previewEyesmagContentBlocks(limit);

  console.log(JSON.stringify({ source: "EYESMAG", limit, dryRun, posts: preview }, null, 2));
  if (dryRun) return;

  const postsById = new Map((await selectPosts(limit)).map((post) => [post.id, post]));
  const applied: string[] = [];
  for (const row of preview) {
    if (row.status !== "PARSED") continue;
    const post = postsById.get(row.id);
    if (!post) continue;
    const html = await fetchArticleHtml(post.canonicalUrl || post.url);
    const blocks = parseEyesmagOrderedContent(html);
    if (!blocks) continue;
    await applyRows(post, blocks);
    applied.push(post.id);
  }
  console.log(JSON.stringify({ appliedCount: applied.length, appliedPostIds: applied }));
}

const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href : false;
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
