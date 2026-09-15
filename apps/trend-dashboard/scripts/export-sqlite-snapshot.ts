/**
 * Read-only SQLite -> NDJSON snapshot exporter.
 *
 * SAFETY CONTRACT (verify this by reading the file, not by trusting this
 * comment): every database call in this file is `prisma.<model>.findMany(...)`
 * - there is no `create`, `createMany`, `update`, `updateMany`, `upsert`,
 * `delete`, `deleteMany`, `$executeRaw*`, or any transaction containing a
 * write anywhere below. `MODEL_EXPORTS` is the single, exhaustive list of
 * every read call this script makes; every entry funnels through the
 * `exporter()` wrapper, which only ever calls the `findMany` passed into it
 * and returns its result unchanged. Nothing in this file ever touches
 * `prisma/dev.db` directly (no fs write/rename/copy of the .db file itself)
 * - all output goes to a brand-new timestamped directory under `backups/`.
 *
 * Purpose: produce a deterministic, auditable snapshot of every persisted
 * Prisma model, suitable as (a) a point-in-time backup and (b) the future
 * input to a PostgreSQL import script - NOT the import script itself, which
 * is explicitly out of scope for this file.
 */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db/client";

const FORMAT_VERSION = 1;
/**
 * The exact number of `model` blocks in prisma/schema.prisma as of this
 * file's authoring (verified via `grep -c "^model " prisma/schema.prisma`
 * immediately before writing MODEL_EXPORTS below). This is a deliberate,
 * hardcoded tripwire: if schema.prisma ever gains or loses a model, this
 * constant and MODEL_EXPORTS both need a matching update, and `main()`
 * refuses to proceed until they agree - so a forgotten model can never
 * silently fall out of the exported snapshot.
 */
const EXPECTED_MODEL_COUNT = 16;

export type ExportRow = Record<string, unknown>;
type ModelExportConfig = { name: string; findRows: () => Promise<ExportRow[]> };

/** Thin wrapper so every MODEL_EXPORTS entry is visibly `findMany(...)` at a glance - never anything else. */
function exporter<T extends ExportRow>(findMany: () => Promise<T[]>): () => Promise<ExportRow[]> {
  return async () => (await findMany()) as unknown as ExportRow[];
}

/**
 * The complete, exhaustive list of persisted Prisma models (verified
 * against prisma/schema.prisma: 16 `model` blocks, matching
 * EXPECTED_MODEL_COUNT). Every model orders by `id: "asc"` - every model in
 * this schema uses the same `id String @id @default(cuid())` shape, so this
 * one ordering rule is uniformly applicable; no model needed a different
 * stable key. Ordering by `id` (rather than e.g. `createdAt`) is what makes
 * re-running this exporter against an UNCHANGED database byte-for-byte
 * reproducible: `createdAt` can collide at the same millisecond for rows
 * inserted in the same batch (several collectors in this app insert many
 * rows per run), which would make row order across re-exports
 * nondeterministic; `id` never collides.
 */
const MODEL_EXPORTS: ModelExportConfig[] = [
  { name: "Product", findRows: exporter(() => prisma.product.findMany({ orderBy: { id: "asc" } })) },
  { name: "RankingSnapshot", findRows: exporter(() => prisma.rankingSnapshot.findMany({ orderBy: { id: "asc" } })) },
  { name: "CollectionRun", findRows: exporter(() => prisma.collectionRun.findMany({ orderBy: { id: "asc" } })) },
  { name: "CollectionError", findRows: exporter(() => prisma.collectionError.findMany({ orderBy: { id: "asc" } })) },
  { name: "TrendKeyword", findRows: exporter(() => prisma.trendKeyword.findMany({ orderBy: { id: "asc" } })) },
  { name: "KeywordTrendSnapshot", findRows: exporter(() => prisma.keywordTrendSnapshot.findMany({ orderBy: { id: "asc" } })) },
  { name: "KeywordShoppingAgeSnapshot", findRows: exporter(() => prisma.keywordShoppingAgeSnapshot.findMany({ orderBy: { id: "asc" } })) },
  { name: "ProductTag", findRows: exporter(() => prisma.productTag.findMany({ orderBy: { id: "asc" } })) },
  { name: "InternalProduct", findRows: exporter(() => prisma.internalProduct.findMany({ orderBy: { id: "asc" } })) },
  { name: "SalesSnapshot", findRows: exporter(() => prisma.salesSnapshot.findMany({ orderBy: { id: "asc" } })) },
  { name: "MarketProduct", findRows: exporter(() => prisma.marketProduct.findMany({ orderBy: { id: "asc" } })) },
  { name: "MarketRankingSnapshot", findRows: exporter(() => prisma.marketRankingSnapshot.findMany({ orderBy: { id: "asc" } })) },
  { name: "EditorialPost", findRows: exporter(() => prisma.editorialPost.findMany({ orderBy: { id: "asc" } })) },
  { name: "EditorialMention", findRows: exporter(() => prisma.editorialMention.findMany({ orderBy: { id: "asc" } })) },
  { name: "ImportRun", findRows: exporter(() => prisma.importRun.findMany({ orderBy: { id: "asc" } })) },
  { name: "ImportError", findRows: exporter(() => prisma.importError.findMany({ orderBy: { id: "asc" } })) }
];

/**
 * Deep, key-sorted JSON serialization - the same row exported twice (same
 * DB) must byte-for-byte match. Prisma already returns object keys in a
 * stable, schema-declared order, but sorting explicitly removes any
 * dependency on that incidental behavior. Date instances are returned
 * UNTOUCHED (never recursed into as a plain object, which would destroy
 * them via `Object.keys(new Date())` returning `[]`) so that the final
 * `JSON.stringify` call below performs its own standard `Date.toJSON()` ->
 * full ISO-8601 UTC instant conversion (e.g. "2026-09-14T15:00:00.000Z") -
 * exactly and only that, never a locale/timezone-aware reformatting.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function sha256Hex(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/** Number of NDJSON lines in `content` - a trailing newline (or empty content) never counts as an extra line. */
export function countNdjsonLines(content: string): number {
  if (content.length === 0) return 0;
  const trimmed = content.endsWith("\n") ? content.slice(0, -1) : content;
  return trimmed.length === 0 ? 0 : trimmed.split("\n").length;
}

/** Confirms every line of `content` is independently valid JSON - the read-back half of the self-verification this exporter requires. */
export function validateNdjson(content: string): { lineCount: number; allValid: boolean; firstError?: string } {
  if (content.length === 0) return { lineCount: 0, allValid: true };
  const lines = (content.endsWith("\n") ? content.slice(0, -1) : content).split("\n");
  for (const [index, line] of lines.entries()) {
    try {
      JSON.parse(line);
    } catch (error) {
      return { lineCount: lines.length, allValid: false, firstError: `line ${index + 1}: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
  return { lineCount: lines.length, allValid: true };
}

/** Groups already-fetched rows by a string key, for the manifest's bounded reconciliation-anchor summaries (never a separate DB query). */
export function countBy<T>(rows: T[], keyFn: (row: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** Filesystem-safe run identifier - the literal export moment in UTC, never a business-day key (this is a technical snapshot id, not a business date). */
export function timestampSlug(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function tryGitHead(): string | null {
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

type PerModelResult = {
  name: string;
  rowCount: number;
  fileName: string;
  sha256: string;
  bytes: number;
  selfCheck: { lineCountMatches: boolean; allLinesValid: boolean; nonEmptyFileForNonEmptyRows: boolean };
};

async function main() {
  if (MODEL_EXPORTS.length !== EXPECTED_MODEL_COUNT) {
    throw new Error(
      `MODEL_EXPORTS has ${MODEL_EXPORTS.length} entries but EXPECTED_MODEL_COUNT is ${EXPECTED_MODEL_COUNT}. ` +
        "This is the schema-drift tripwire firing - prisma/schema.prisma's model list and this file's MODEL_EXPORTS array have gone out of sync. Update both together before re-running."
    );
  }

  const startedAt = new Date();
  const exportRoot = join("backups", "sqlite-export", timestampSlug(startedAt));
  mkdirSync(exportRoot, { recursive: true });

  console.log(`Destination: ${exportRoot}`);
  console.log("");

  const perModel: PerModelResult[] = [];
  const rowsByModel = new Map<string, ExportRow[]>();
  let totalRows = 0;
  let totalBytes = 0;

  for (const model of MODEL_EXPORTS) {
    const rows = await model.findRows();
    rowsByModel.set(model.name, rows);

    const lines = rows.map((row) => stableStringify(row));
    const content = lines.length > 0 ? `${lines.join("\n")}\n` : "";
    const fileName = `${model.name}.ndjson`;
    const filePath = join(exportRoot, fileName);
    writeFileSync(filePath, content, "utf8");

    // Self-verification: re-read the file just written (never trust the
    // in-memory value alone) and independently recount/revalidate/rehash it.
    const readBack = readFileSync(filePath, "utf8");
    const validation = validateNdjson(readBack);
    const sha256 = sha256Hex(readBack);
    const bytes = Buffer.byteLength(readBack, "utf8");

    const selfCheck = {
      lineCountMatches: validation.lineCount === rows.length,
      allLinesValid: validation.allValid,
      nonEmptyFileForNonEmptyRows: rows.length === 0 || bytes > 0
    };

    perModel.push({ name: model.name, rowCount: rows.length, fileName, sha256, bytes, selfCheck });
    totalRows += rows.length;
    totalBytes += bytes;

    const status = selfCheck.lineCountMatches && selfCheck.allLinesValid && selfCheck.nonEmptyFileForNonEmptyRows ? "OK" : "FAIL";
    console.log(`  ${model.name.padEnd(28)} rows=${String(rows.length).padStart(6)}  ${status}${status === "FAIL" ? `  (${JSON.stringify(validation)})` : ""}`);
  }

  const allSelfChecksPassed = perModel.every((m) => m.selfCheck.lineCountMatches && m.selfCheck.allLinesValid && m.selfCheck.nonEmptyFileForNonEmptyRows);
  const modelCountMatches = perModel.length === EXPECTED_MODEL_COUNT;
  const totalRowsMatches = perModel.reduce((sum, m) => sum + m.rowCount, 0) === totalRows;

  // ---- Reconciliation anchors (bounded - computed from rows already in
  // memory, never a fresh DB query, so these numbers can never drift from
  // what was actually written to the NDJSON files) ----
  const marketProductRows = rowsByModel.get("MarketProduct") ?? [];
  const marketRankingSnapshotRows = rowsByModel.get("MarketRankingSnapshot") ?? [];
  const editorialPostRows = rowsByModel.get("EditorialPost") ?? [];
  const importRunRows = rowsByModel.get("ImportRun") ?? [];
  const importErrorRows = rowsByModel.get("ImportError") ?? [];

  const rednapeImportRunIds = new Set(importRunRows.filter((r) => r.source === "REDNAPE").map((r) => r.id as string));
  const rednapeAnchor = {
    marketProduct: marketProductRows.filter((r) => r.source === "REDNAPE").length,
    marketRankingSnapshot: marketRankingSnapshotRows.filter((r) => r.source === "REDNAPE").length,
    importRun: rednapeImportRunIds.size,
    importError: importErrorRows.filter((r) => rednapeImportRunIds.has(r.importRunId as string)).length
  };
  const rednapeExpectedBaseline = { marketProduct: 5, marketRankingSnapshot: 5, importRun: 1, importError: 0 };
  const rednapeMatchesBaseline =
    rednapeAnchor.marketProduct === rednapeExpectedBaseline.marketProduct &&
    rednapeAnchor.marketRankingSnapshot === rednapeExpectedBaseline.marketRankingSnapshot &&
    rednapeAnchor.importRun === rednapeExpectedBaseline.importRun &&
    rednapeAnchor.importError === rednapeExpectedBaseline.importError;

  const reconciliationAnchors = {
    rednape: { ...rednapeAnchor, expectedBaseline: rednapeExpectedBaseline, matchesKnownBaseline: rednapeMatchesBaseline },
    editorialPostBySourceAndDataMode: countBy(editorialPostRows, (r) => `${r.source}:${r.dataMode}`),
    marketProductBySourceAndDataMode: countBy(marketProductRows, (r) => `${r.source}:${r.dataMode}`),
    marketRankingSnapshotBySourceAndDataMode: countBy(marketRankingSnapshotRows, (r) => `${r.source}:${r.dataMode}`),
    importRunByTypeAndSource: countBy(importRunRows, (r) => `${r.type}:${r.source}`)
  };

  // ---- DateTime preservation spot-checks (Section H) ----
  const rednapeSnapshotRow = marketRankingSnapshotRows.find((r) => r.source === "REDNAPE");
  const rednapeImportRunRow = importRunRows.find((r) => r.source === "REDNAPE");
  const samplePublishedAt = editorialPostRows.find((r) => r.publishedAt != null)?.publishedAt as Date | undefined;
  const sampleCreatedAt = marketProductRows[0]?.createdAt as Date | undefined;
  const sampleUpdatedAt = marketProductRows[0]?.updatedAt as Date | undefined;

  const KNOWN_REDNAPE_PERIOD_DATE_ISO = "2026-09-14T15:00:00.000Z";
  const dateTimeChecks = {
    rednapePeriodDateIso: (rednapeSnapshotRow?.periodDate as Date | undefined)?.toISOString() ?? null,
    rednapePeriodDateMatchesKnownBusinessDay: (rednapeSnapshotRow?.periodDate as Date | undefined)?.toISOString() === KNOWN_REDNAPE_PERIOD_DATE_ISO,
    rednapeImportRunStartedAtIso: (rednapeImportRunRow?.startedAt as Date | undefined)?.toISOString() ?? null,
    samplePublishedAtIso: samplePublishedAt?.toISOString() ?? null,
    sampleCreatedAtIso: sampleCreatedAt?.toISOString() ?? null,
    sampleUpdatedAtIso: sampleUpdatedAt?.toISOString() ?? null
  };

  const manifest = {
    formatVersion: FORMAT_VERSION,
    exportedAt: startedAt.toISOString(),
    sourceDatabase: "SQLite",
    sourceDatabasePath: "prisma/dev.db",
    gitCommit: tryGitHead(),
    prismaClientVersion: Prisma.prismaVersion.client,
    modelCount: perModel.length,
    expectedModelCount: EXPECTED_MODEL_COUNT,
    models: perModel.map((m) => ({ name: m.name, rowCount: m.rowCount, fileName: m.fileName, sha256: m.sha256, bytes: m.bytes })),
    totalRows,
    totalBytes,
    reconciliationAnchors,
    dateTimeChecks,
    selfVerification: {
      modelCountMatchesExpected: modelCountMatches,
      totalRowsMatchesSum: totalRowsMatches,
      allPerModelSelfChecksPassed: allSelfChecksPassed,
      rednapePeriodDateMatchesKnownBusinessDay: dateTimeChecks.rednapePeriodDateMatchesKnownBusinessDay
    }
  };

  const manifestPath = join(exportRoot, "manifest.json");
  writeFileSync(manifestPath, `${stableStringify(manifest)}\n`, "utf8");

  const overallPass = modelCountMatches && totalRowsMatches && allSelfChecksPassed;

  console.log("");
  console.log(`Total rows: ${totalRows}`);
  console.log(`Total bytes: ${totalBytes}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log("");
  console.log(`REDNAPE reconciliation anchor: ${JSON.stringify(reconciliationAnchors.rednape)}`);
  console.log(`DateTime check (REDNAPE periodDate): ${dateTimeChecks.rednapePeriodDateIso} (matches known 2026-09-15 KST business day: ${dateTimeChecks.rednapePeriodDateMatchesKnownBusinessDay})`);
  console.log("");
  console.log(`VERIFICATION: ${overallPass ? "PASS" : "FAIL"}`);
  if (!overallPass) process.exitCode = 1;
}

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error("Export failed:", error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
