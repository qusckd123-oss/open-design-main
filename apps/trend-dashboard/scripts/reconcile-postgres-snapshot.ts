/**
 * Read-only SQLite-snapshot <-> PostgreSQL (Neon verification DB) reconciler.
 *
 * SAFETY CONTRACT:
 *  - Every database call this file makes is `findMany()` (a SELECT) against
 *    the isolated PostgreSQL verification Prisma client generated from
 *    prisma/schema.postgres.prisma (node_modules/.prisma-postgres-verification/client).
 *    There is no create/createMany/update/updateMany/upsert/delete/deleteMany/
 *    $executeRaw (any variant)/truncate/reset call anywhere in this file. This
 *    is a read-only comparison tool - full stop.
 *  - The migration source of truth is the NDJSON snapshot directory
 *    (manifest.json + the per-model .ndjson files), read via the same
 *    `validateSnapshotIntegrity()` used by the importer. This file never
 *    opens prisma/dev.db and never imports the SQLite `@prisma/client`
 *    (`../src/db/client`) for the raw-row reconciliation path (Section A-F).
 *    Section G's Watchlist sanity check is the one deliberate exception -
 *    see its own comment for why and what it does NOT do.
 *  - `POSTGRES_VERIFICATION_URL` must already be set in the process
 *    environment before running (see the repo's established pattern: source
 *    apps/trend-dashboard/.env.postgres-verification into a subshell).
 *
 * Usage:
 *   tsx scripts/reconcile-postgres-snapshot.ts <snapshot-dir>
 *   e.g. tsx scripts/reconcile-postgres-snapshot.ts backups/sqlite-export/2026-09-15T10-12-29-321Z
 */
import { pathToFileURL } from "node:url";
import { countBy, sha256Hex } from "./export-sqlite-snapshot";
import {
  checkVerificationUrlPolicy,
  DATE_TIME_FIELDS_BY_MODEL,
  IMPORT_ORDER,
  PARENT_OF_MODEL,
  sanitizeErrorMessage,
  validateSnapshotIntegrity,
  type ExportRow
} from "./import-postgres-snapshot";
// Isolated PostgreSQL verification client ONLY - see the safety contract
// above. Type-only import (erased at compile time, matches the importer's
// own pattern) so this file's pure functions never require the generated
// client to exist on disk just to be imported/tested.
import type { PrismaClient as PostgresVerificationPrismaClient } from "../node_modules/.prisma-postgres-verification/client";

type PostgresVerificationClient = InstanceType<typeof PostgresVerificationPrismaClient>;

/** Maximum number of individual field/value mismatches ever printed in one run - a bounded report, never a full dataset dump. */
const MAX_REPORTED_MISMATCHES = 20;

// ---------------------------------------------------------------------------
// Section E (pure): declared-relation map + deterministic canonicalization/
// fingerprinting. Every function below is pure - no I/O, no DB, no fs.
// ---------------------------------------------------------------------------

/**
 * Every declared Prisma @relation() foreign-key field, child model -> FK
 * field name (the parent model comes from `PARENT_OF_MODEL`, re-exported
 * from the importer so both files agree on dependency order). Deliberately
 * does NOT include MarketRankingSnapshot.importRunId or SalesSnapshot.importRunId -
 * both are plain, unconstrained strings in prisma/schema.postgres.prisma
 * (no @relation()), so they carry no FK/relation integrity requirement and
 * must be compared only as ordinary string fields (see `checkRelationIntegrity`
 * and the field-equality path, which both leave them alone accordingly).
 * Every relation in this schema is required (no `String?` FK field exists),
 * so there is no "optional relation" branch to special-case.
 */
export const RELATION_FK_FIELD: Record<string, string> = {
  RankingSnapshot: "productId",
  ProductTag: "productId",
  CollectionError: "collectionRunId",
  KeywordTrendSnapshot: "keywordId",
  KeywordShoppingAgeSnapshot: "keywordId",
  SalesSnapshot: "productId",
  MarketRankingSnapshot: "marketProductId",
  EditorialMention: "postId",
  ImportError: "importRunId"
};

/**
 * Normalizes one field's value for comparison/hashing. The ONLY special case
 * is a declared DateTime field (per `DATE_TIME_FIELDS_BY_MODEL`): a Date
 * instance (what Postgres/Prisma returns) or an ISO-8601 string (what the
 * NDJSON snapshot holds) are both reduced to the same canonical
 * `toISOString()` form so the two sides can be compared by exact instant,
 * "never reinterpreted through local timezone" per the task's own
 * instruction - `toISOString()` is always UTC by definition. `undefined`
 * (a field entirely absent from one side's row) is returned as-is so the
 * caller can report a genuine missing-field mismatch instead of crashing.
 * Every other field (id, FK strings, dangling importRunId, booleans,
 * numbers, null, JSON-payload strings like rawData) passes through
 * byte-for-byte untouched.
 */
export function canonicalFieldValue(modelName: string, field: string, value: unknown): unknown {
  if (value === undefined) return undefined;
  const dateFields = DATE_TIME_FIELDS_BY_MODEL[modelName];
  if (!dateFields || !dateFields.includes(field)) return value;
  if (value === null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error(`${modelName}.${field}: Date instance is Invalid Date.`);
    return value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error(`${modelName}.${field}: unparseable DateTime string "${value}".`);
    return parsed.toISOString();
  }
  throw new Error(`${modelName}.${field}: unexpected DateTime value type "${typeof value}".`);
}

/** Two canonicalized scalar values are equal iff `===`, with NaN treated as equal to NaN (never equal to anything else). */
function canonicalValuesEqual(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number" && Number.isNaN(a) && Number.isNaN(b)) return true;
  return a === b;
}

export interface FieldMismatch {
  model: string;
  id: string;
  field: string;
  isDateTimeField: boolean;
  sourceValue: unknown;
  targetValue: unknown;
}

/** Compares every field present on either side of one id's row pair (a field present on only one side is itself a mismatch, not a crash). */
export function compareRowFields(modelName: string, id: string, sourceRow: ExportRow, targetRow: ExportRow): FieldMismatch[] {
  const dateFields = new Set(DATE_TIME_FIELDS_BY_MODEL[modelName] ?? []);
  const fields = new Set([...Object.keys(sourceRow), ...Object.keys(targetRow)]);
  const mismatches: FieldMismatch[] = [];
  for (const field of fields) {
    const sourceValue = canonicalFieldValue(modelName, field, sourceRow[field]);
    const targetValue = canonicalFieldValue(modelName, field, targetRow[field]);
    if (!canonicalValuesEqual(sourceValue, targetValue)) {
      mismatches.push({ model: modelName, id, field, isDateTimeField: dateFields.has(field), sourceValue, targetValue });
    }
  }
  return mismatches;
}

/** Sorted-key-order, DateTime-canonicalized JSON serialization of one row - the unit `computeModelFingerprint` hashes, one line per row. */
export function canonicalizeRowForFingerprint(modelName: string, row: ExportRow): string {
  const sortedFields = Object.keys(row).sort();
  const normalized: Record<string, unknown> = {};
  for (const field of sortedFields) {
    normalized[field] = canonicalFieldValue(modelName, field, row[field]);
  }
  return JSON.stringify(normalized);
}

/**
 * SHA-256 over every row of `rows`, sorted by `id`, each canonicalized and
 * newline-joined (empty input hashes to `sha256("")`, matching
 * export-sqlite-snapshot.ts's own empty-file convention). Computed
 * identically for the snapshot side (ISO-string dates) and the Neon side
 * (Date-instance dates) via the same `canonicalFieldValue` normalization, so
 * a match here is an independent whole-table equality proof beyond the
 * count/ID/field checks above - not a hash of raw Postgres wire output.
 */
export function computeModelFingerprint(modelName: string, rows: ExportRow[]): string {
  const sorted = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const lines = sorted.map((row) => canonicalizeRowForFingerprint(modelName, row));
  const content = lines.length > 0 ? `${lines.join("\n")}\n` : "";
  return sha256Hex(content);
}

export interface IdSetComparison {
  ok: boolean;
  missingInTarget: string[];
  extraInTarget: string[];
}

/** Pure Set-equality check between source (snapshot) ids and target (Neon) ids. */
export function compareIdSets(sourceIds: ReadonlySet<string>, targetIds: ReadonlySet<string>): IdSetComparison {
  const missingInTarget = [...sourceIds].filter((id) => !targetIds.has(id)).sort();
  const extraInTarget = [...targetIds].filter((id) => !sourceIds.has(id)).sort();
  return { ok: missingInTarget.length === 0 && extraInTarget.length === 0, missingInTarget, extraInTarget };
}

export interface RelationIntegrityResult {
  ok: boolean;
  danglingIds: string[];
}

/**
 * For a declared-relation child model, confirms every row's FK value
 * resolves to an id already present in `parentIds`. Returns `ok: true,
 * danglingIds: []` for any model with no entry in `RELATION_FK_FIELD` (i.e.
 * not a declared Prisma relation at all - e.g. MarketRankingSnapshot,
 * SalesSnapshot) rather than silently no-op'ing without saying so.
 */
export function checkRelationIntegrity(childModel: string, childRows: ExportRow[], parentIds: ReadonlySet<string>): RelationIntegrityResult {
  const fkField = RELATION_FK_FIELD[childModel];
  if (!fkField) return { ok: true, danglingIds: [] };
  const dangling: string[] = [];
  for (const row of childRows) {
    const fkValue = row[fkField];
    if (typeof fkValue !== "string" || !parentIds.has(fkValue)) dangling.push(String(row.id));
  }
  return { ok: dangling.length === 0, danglingIds: dangling.sort() };
}

export interface AggregateComparison {
  label: string;
  ok: boolean;
  sourceCounts: Record<string, number>;
  targetCounts: Record<string, number>;
  diffKeys: string[];
}

/** Compares a `countBy(rows, keyFn)` grouping between source and target - both computed from already-loaded rows, never a fresh DB groupBy query. */
export function compareAggregate(label: string, sourceRows: ExportRow[], targetRows: ExportRow[], keyFn: (row: ExportRow) => string): AggregateComparison {
  const sourceCounts = countBy(sourceRows, keyFn);
  const targetCounts = countBy(targetRows, keyFn);
  const allKeys = new Set([...Object.keys(sourceCounts), ...Object.keys(targetCounts)]);
  const diffKeys = [...allKeys].filter((key) => (sourceCounts[key] ?? 0) !== (targetCounts[key] ?? 0)).sort();
  return { label, ok: diffKeys.length === 0, sourceCounts, targetCounts, diffKeys };
}

// ---------------------------------------------------------------------------
// Per-model reconciliation (Sections B, C, E combined) - one model at a time,
// read-only (`findMany` only) against the target.
// ---------------------------------------------------------------------------

export interface ModelReconciliationResult {
  model: string;
  sourceCount: number;
  targetCount: number;
  rowCountOk: boolean;
  idSet: IdSetComparison;
  fieldEqualityOk: boolean;
  fieldMismatchCount: number;
  dateTimeEqualityOk: boolean;
  dateTimeMismatchCount: number;
  fingerprint: { source: string; target: string; ok: boolean };
  relationSource: RelationIntegrityResult | null;
  relationTarget: RelationIntegrityResult | null;
}

/** Maps a model name string to its typed Prisma delegate on the generated client - mirrors import-postgres-snapshot.ts's own `modelDelegate`. */
function modelDelegate(client: PostgresVerificationClient, modelName: string) {
  const key = (modelName.charAt(0).toLowerCase() + modelName.slice(1)) as keyof PostgresVerificationClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client[key] as any;
}

/**
 * Reconciles exactly one model: fetches its full row set from Neon
 * (read-only `findMany`, no filters, no writes), compares it against the
 * already-parsed snapshot rows for the same model, and records mismatches
 * (capped, via `mismatchSink`) plus every check in the task's Section B/E.
 * `sourceIdsByModel`/`targetIdsByModel` accumulate as models are processed
 * in `IMPORT_ORDER` (parents before children) so relation checks against an
 * already-visited parent never need a second query.
 */
async function reconcileModel(
  client: PostgresVerificationClient,
  modelName: string,
  sourceRows: ExportRow[],
  sourceIdsByModel: Map<string, Set<string>>,
  targetIdsByModel: Map<string, Set<string>>,
  mismatchSink: FieldMismatch[]
): Promise<{ result: ModelReconciliationResult; targetRows: ExportRow[] }> {
  const targetRows = (await modelDelegate(client, modelName).findMany({ orderBy: { id: "asc" } })) as ExportRow[];

  const sourceById = new Map(sourceRows.map((row) => [String(row.id), row]));
  const targetById = new Map(targetRows.map((row) => [String(row.id), row]));
  const sourceIds = new Set(sourceById.keys());
  const targetIds = new Set(targetById.keys());
  sourceIdsByModel.set(modelName, sourceIds);
  targetIdsByModel.set(modelName, targetIds);

  const idSet = compareIdSets(sourceIds, targetIds);

  let fieldMismatchCount = 0;
  let dateTimeMismatchCount = 0;
  const commonIds = [...sourceIds].filter((id) => targetIds.has(id)).sort();
  for (const id of commonIds) {
    const mismatches = compareRowFields(modelName, id, sourceById.get(id)!, targetById.get(id)!);
    for (const mismatch of mismatches) {
      fieldMismatchCount += 1;
      if (mismatch.isDateTimeField) dateTimeMismatchCount += 1;
      if (mismatchSink.length < MAX_REPORTED_MISMATCHES) mismatchSink.push(mismatch);
    }
  }

  const fingerprintSource = computeModelFingerprint(modelName, sourceRows);
  const fingerprintTarget = computeModelFingerprint(modelName, targetRows);

  const parentModel = PARENT_OF_MODEL[modelName] ?? null;
  const relationSource = parentModel ? checkRelationIntegrity(modelName, sourceRows, sourceIdsByModel.get(parentModel) ?? new Set()) : null;
  const relationTarget = parentModel ? checkRelationIntegrity(modelName, targetRows, targetIdsByModel.get(parentModel) ?? new Set()) : null;

  const result: ModelReconciliationResult = {
    model: modelName,
    sourceCount: sourceRows.length,
    targetCount: targetRows.length,
    rowCountOk: sourceRows.length === targetRows.length,
    idSet,
    fieldEqualityOk: fieldMismatchCount === 0 && idSet.ok,
    fieldMismatchCount,
    dateTimeEqualityOk: dateTimeMismatchCount === 0,
    dateTimeMismatchCount,
    fingerprint: { source: fingerprintSource, target: fingerprintTarget, ok: fingerprintSource === fingerprintTarget },
    relationSource,
    relationTarget
  };
  return { result, targetRows };
}

// ---------------------------------------------------------------------------
// Section C (special known checks): REDNAPE anchors.
// ---------------------------------------------------------------------------

export interface RednapeAnchorReport {
  marketProductCount: { source: number; target: number; ok: boolean };
  marketRankingSnapshotCount: { source: number; target: number; ok: boolean };
  importRunCount: { source: number; target: number; ok: boolean };
  importErrorCount: { source: number; target: number; ok: boolean };
  externalProductIds: { source: string[]; target: string[]; ok: boolean };
  periodDateAndFlags: { ok: boolean; details: string[] };
  ok: boolean;
}

// Lexicographic (default Array.sort()) order of {"593","586","509","440","45"} - NOT numeric order. Verified: "440" < "45" < "509" < "586" < "593" as strings.
const EXPECTED_REDNAPE_EXTERNAL_PRODUCT_IDS = ["440", "45", "509", "586", "593"];
const EXPECTED_REDNAPE_PERIOD_DATE_ISO = "2026-09-14T15:00:00.000Z";

/** Pure: everything the task's "Section C" REDNAPE anchor checks require, given already-loaded rows for both sides. */
export function checkRednapeAnchors(
  sourceRows: { marketProduct: ExportRow[]; marketRankingSnapshot: ExportRow[]; importRun: ExportRow[]; importError: ExportRow[] },
  targetRows: { marketProduct: ExportRow[]; marketRankingSnapshot: ExportRow[]; importRun: ExportRow[]; importError: ExportRow[] }
): RednapeAnchorReport {
  const isRednape = (row: ExportRow) => row.source === "REDNAPE";

  const sourceMarketProduct = sourceRows.marketProduct.filter(isRednape);
  const targetMarketProduct = targetRows.marketProduct.filter(isRednape);
  const sourceMarketRanking = sourceRows.marketRankingSnapshot.filter(isRednape);
  const targetMarketRanking = targetRows.marketRankingSnapshot.filter(isRednape);
  const sourceImportRun = sourceRows.importRun.filter(isRednape);
  const targetImportRun = targetRows.importRun.filter(isRednape);
  const sourceRednapeImportRunIds = new Set(sourceImportRun.map((r) => String(r.id)));
  const targetRednapeImportRunIds = new Set(targetImportRun.map((r) => String(r.id)));
  const sourceImportError = sourceRows.importError.filter((r) => sourceRednapeImportRunIds.has(String(r.importRunId)));
  const targetImportError = targetRows.importError.filter((r) => targetRednapeImportRunIds.has(String(r.importRunId)));

  const marketProductCount = { source: sourceMarketProduct.length, target: targetMarketProduct.length, ok: sourceMarketProduct.length === 5 && targetMarketProduct.length === 5 };
  const marketRankingSnapshotCount = { source: sourceMarketRanking.length, target: targetMarketRanking.length, ok: sourceMarketRanking.length === 5 && targetMarketRanking.length === 5 };
  const importRunCount = { source: sourceImportRun.length, target: targetImportRun.length, ok: sourceImportRun.length === 1 && targetImportRun.length === 1 };
  const importErrorCount = { source: sourceImportError.length, target: targetImportError.length, ok: sourceImportError.length === 0 && targetImportError.length === 0 };

  const sourceExternalIds = [...sourceMarketProduct.map((r) => String(r.externalProductId))].sort();
  const targetExternalIds = [...targetMarketProduct.map((r) => String(r.externalProductId))].sort();
  const externalProductIds = {
    source: sourceExternalIds,
    target: targetExternalIds,
    ok: JSON.stringify(sourceExternalIds) === JSON.stringify(EXPECTED_REDNAPE_EXTERNAL_PRODUCT_IDS) && JSON.stringify(targetExternalIds) === JSON.stringify(EXPECTED_REDNAPE_EXTERNAL_PRODUCT_IDS)
  };

  const details: string[] = [];
  let periodDateAndFlagsOk = true;
  for (const [side, rows] of [
    ["source", sourceMarketRanking],
    ["target", targetMarketRanking]
  ] as const) {
    for (const row of rows) {
      const periodDateIso = canonicalFieldValue("MarketRankingSnapshot", "periodDate", row.periodDate);
      const ok = periodDateIso === EXPECTED_REDNAPE_PERIOD_DATE_ISO && row.rank === null && row.rankingVerified === false && row.rankingScope === "CATEGORY";
      if (!ok) {
        periodDateAndFlagsOk = false;
        details.push(
          `${side} id=${String(row.id)}: periodDate=${String(periodDateIso)} rank=${JSON.stringify(row.rank)} rankingVerified=${JSON.stringify(row.rankingVerified)} rankingScope=${String(row.rankingScope)}`
        );
      }
    }
  }

  const ok = marketProductCount.ok && marketRankingSnapshotCount.ok && importRunCount.ok && importErrorCount.ok && externalProductIds.ok && periodDateAndFlagsOk;
  return { marketProductCount, marketRankingSnapshotCount, importRunCount, importErrorCount, externalProductIds, periodDateAndFlags: { ok: periodDateAndFlagsOk, details }, ok };
}

// ---------------------------------------------------------------------------
// Section G: derived business sanity checks (read-only, best-effort).
// ---------------------------------------------------------------------------

export interface MarketRankingSnapshotDataModeReport {
  source: { real: number; sample: number; total: number };
  target: { real: number; sample: number; total: number };
  ok: boolean;
}

/** Pure: the task's "Market real row count = 672 / sample = 2592 / total = 3264" checks, from already-loaded MarketRankingSnapshot rows. */
export function checkMarketRankingSnapshotDataModeCounts(sourceRows: ExportRow[], targetRows: ExportRow[]): MarketRankingSnapshotDataModeReport {
  const summarize = (rows: ExportRow[]) => ({
    real: rows.filter((r) => r.dataMode === "real").length,
    sample: rows.filter((r) => r.dataMode === "sample").length,
    total: rows.length
  });
  const source = summarize(sourceRows);
  const target = summarize(targetRows);
  const ok = source.real === 672 && source.sample === 2592 && source.total === 3264 && target.real === 672 && target.sample === 2592 && target.total === 3264;
  return { source, target, ok };
}

const EXPECTED_WATCHLIST_ORDER = ["스트라이프 셔츠", "화이트 스커트", "체크 셔츠", "데님 쇼츠", "니트 가디건"];

export interface WatchlistSanityReport {
  attempted: boolean;
  matchesExpectedOrder: boolean | null;
  actualTop5: string[] | null;
  note: string;
  error?: string;
}

/**
 * READ-ONLY, current-code, SQLite-only sanity check for the task's Section G
 * "known Watchlist computation" item. Deliberately imports the app's
 * existing `getItemTrendRows()` (which reads through the singleton SQLite
 * `prisma` client) rather than reimplementing/duplicating its logic - this
 * is the one place this file touches SQLite at all, and it is a read
 * (`findMany`) exactly like everywhere else in the app's normal runtime path.
 *
 * This function CANNOT compare against Neon: `business-analytics-service.ts`
 * imports `prisma` directly from `@/db/client` (no constructor/DI parameter
 * to swap in the Postgres verification client), so running this same
 * computation against Postgres would require an application-code refactor -
 * explicitly out of scope for this read-only reconciliation task per the
 * task's own Section G instruction ("Do NOT rewrite application services
 * just to force a Postgres comparison... report that limitation, do not
 * introduce architectural refactors"). The `note`/`limitation` field below
 * is how that is surfaced in the final report.
 */
async function checkWatchlistSanity(): Promise<WatchlistSanityReport> {
  const note =
    "Evaluated ONLY against the current SQLite dev.db via the app's existing getItemTrendRows() (a read-only findMany path) - " +
    "business-analytics-service.ts imports the SQLite `prisma` singleton directly with no DI seam for the Postgres verification client, " +
    "so this sanity check cannot be run against Neon without an application-code refactor, which is out of scope for this read-only reconciliation task.";
  try {
    const { getItemTrendRows } = await import("../src/services/business-analytics-service");
    const items = await getItemTrendRows();
    const actualTop5 = items.slice(0, 5).map((item) => item.label);
    return { attempted: true, matchesExpectedOrder: JSON.stringify(actualTop5) === JSON.stringify(EXPECTED_WATCHLIST_ORDER), actualTop5, note };
  } catch (error) {
    return { attempted: true, matchesExpectedOrder: null, actualTop5: null, note, error: error instanceof Error ? error.message : String(error) };
  }
}

// ---------------------------------------------------------------------------
// main() - orchestration only. Never called by the test suite.
// ---------------------------------------------------------------------------
async function main() {
  const snapshotDir = process.argv[2];
  if (!snapshotDir) {
    console.error("Usage: tsx scripts/reconcile-postgres-snapshot.ts <snapshot-dir>");
    process.exitCode = 1;
    return;
  }

  console.log("READ-ONLY RECONCILIATION - no writes to SQLite or Postgres will be made.");
  console.log(`Snapshot: ${snapshotDir}`);
  console.log("");

  // ---- reconfirm POSTGRES_VERIFICATION_URL policy ----
  const urlPolicy = checkVerificationUrlPolicy(process.env.POSTGRES_VERIFICATION_URL, process.env.DATABASE_URL);
  console.log(`POSTGRES_VERIFICATION_URL policy: ${urlPolicy.errors.length === 0 ? "PASS" : "FAIL"}`);
  if (urlPolicy.errors.length > 0) {
    for (const err of urlPolicy.errors) console.error(`  - ${err}`);
    console.error("ABORT - refusing to connect.");
    process.exitCode = 1;
    return;
  }

  // ---- load + validate the snapshot (source of truth, fs-only) ----
  const snapshot = await validateSnapshotIntegrity(snapshotDir);
  console.log(`Snapshot integrity check: ${snapshot.ok ? "PASS" : "FAIL"}`);
  if (!snapshot.ok) {
    for (const err of snapshot.errors) console.error(`  - ${err}`);
    console.error("ABORT - snapshot itself is not internally consistent.");
    process.exitCode = 1;
    return;
  }
  console.log(`  manifest models=${snapshot.manifest!.modelCount} totalRows=${snapshot.manifest!.totalRows}`);
  console.log("");

  const { PrismaClient: PostgresVerificationPrismaClient } = await import("../node_modules/.prisma-postgres-verification/client");
  const client: PostgresVerificationClient = new PostgresVerificationPrismaClient();

  try {
    const sourceIdsByModel = new Map<string, Set<string>>();
    const targetIdsByModel = new Map<string, Set<string>>();
    const sourceRowsByModel = new Map<string, ExportRow[]>();
    const targetRowsByModel = new Map<string, ExportRow[]>();
    const mismatches: FieldMismatch[] = [];
    let totalMismatchCount = 0;
    const results: ModelReconciliationResult[] = [];

    console.log("=== Per-model reconciliation ===");
    for (const modelName of IMPORT_ORDER) {
      const sourceRows = snapshot.rowsByModel.get(modelName) ?? [];
      const { result, targetRows } = await reconcileModel(client, modelName, sourceRows, sourceIdsByModel, targetIdsByModel, mismatches);
      sourceRowsByModel.set(modelName, sourceRows);
      targetRowsByModel.set(modelName, targetRows);
      totalMismatchCount += result.fieldMismatchCount;
      results.push(result);

      console.log("");
      console.log(modelName);
      console.log(`  source count: ${result.sourceCount}`);
      console.log(`  target count: ${result.targetCount}`);
      console.log(`  ID set: ${result.idSet.ok ? "PASS" : "FAIL"}${result.idSet.ok ? "" : ` (missingInTarget=${result.idSet.missingInTarget.length} extraInTarget=${result.idSet.extraInTarget.length})`}`);
      console.log(`  field equality: ${result.fieldEqualityOk ? "PASS" : `FAIL (${result.fieldMismatchCount} mismatches)`}`);
      console.log(`  DateTime equality: ${result.dateTimeEqualityOk ? "PASS" : `FAIL (${result.dateTimeMismatchCount} mismatches)`}`);
      console.log(`  fingerprint: ${result.fingerprint.ok ? "PASS" : "FAIL"} (source=${result.fingerprint.source.slice(0, 12)}... target=${result.fingerprint.target.slice(0, 12)}...)`);
      if (result.relationSource && result.relationTarget) {
        console.log(
          `  relation integrity (-> ${PARENT_OF_MODEL[modelName]}): source ${result.relationSource.ok ? "PASS" : `FAIL (${result.relationSource.danglingIds.length} dangling)`}, target ${
            result.relationTarget.ok ? "PASS" : `FAIL (${result.relationTarget.danglingIds.length} dangling)`
          }`
        );
      }
    }

    if (mismatches.length > 0) {
      console.log("");
      console.log(`=== Field mismatches (showing ${mismatches.length} of ${totalMismatchCount} total, capped at ${MAX_REPORTED_MISMATCHES}) ===`);
      for (const m of mismatches) {
        console.log(`  ${m.model} id=${m.id} field=${m.field}: source=${JSON.stringify(m.sourceValue)} target=${JSON.stringify(m.targetValue)}`);
      }
    }

    // ---- Section D: source/category/etc aggregate comparisons ----
    console.log("");
    console.log("=== Aggregate comparisons ===");
    const aggregateChecks: AggregateComparison[] = [
      compareAggregate("MarketProduct by source", sourceRowsByModel.get("MarketProduct")!, targetRowsByModel.get("MarketProduct")!, (r) => String(r.source)),
      compareAggregate("MarketProduct by category", sourceRowsByModel.get("MarketProduct")!, targetRowsByModel.get("MarketProduct")!, (r) => String(r.category ?? "NULL")),
      compareAggregate("MarketRankingSnapshot by source", sourceRowsByModel.get("MarketRankingSnapshot")!, targetRowsByModel.get("MarketRankingSnapshot")!, (r) => String(r.source)),
      compareAggregate("MarketRankingSnapshot by rankingCategory", sourceRowsByModel.get("MarketRankingSnapshot")!, targetRowsByModel.get("MarketRankingSnapshot")!, (r) => String(r.rankingCategory)),
      compareAggregate("MarketRankingSnapshot by metricType", sourceRowsByModel.get("MarketRankingSnapshot")!, targetRowsByModel.get("MarketRankingSnapshot")!, (r) => String(r.metricType)),
      compareAggregate("EditorialPost by source", sourceRowsByModel.get("EditorialPost")!, targetRowsByModel.get("EditorialPost")!, (r) => String(r.source)),
      compareAggregate("ImportRun by source", sourceRowsByModel.get("ImportRun")!, targetRowsByModel.get("ImportRun")!, (r) => String(r.source)),
      compareAggregate("ImportRun by status", sourceRowsByModel.get("ImportRun")!, targetRowsByModel.get("ImportRun")!, (r) => String(r.status))
    ];
    for (const check of aggregateChecks) {
      console.log(`  ${check.label}: ${check.ok ? "PASS" : `FAIL (diffKeys=${check.diffKeys.join(", ")})`}`);
    }
    console.log("  EditorialMention by source: N/A - EditorialMention has no direct `source` field in the schema (only its parent EditorialPost does).");
    console.log("  ImportError by source: N/A - ImportError has no direct `source` field in the schema (only its parent ImportRun does).");
    console.log(`  Product total: source=${sourceRowsByModel.get("Product")!.length} target=${targetRowsByModel.get("Product")!.length}`);
    console.log(`  TrendKeyword total: source=${sourceRowsByModel.get("TrendKeyword")!.length} target=${targetRowsByModel.get("TrendKeyword")!.length}`);
    console.log(`  InternalProduct total: source=${sourceRowsByModel.get("InternalProduct")!.length} target=${targetRowsByModel.get("InternalProduct")!.length}`);

    // ---- Section C special known checks: REDNAPE anchors ----
    console.log("");
    console.log("=== REDNAPE anchor verification ===");
    const rednapeReport = checkRednapeAnchors(
      {
        marketProduct: sourceRowsByModel.get("MarketProduct")!,
        marketRankingSnapshot: sourceRowsByModel.get("MarketRankingSnapshot")!,
        importRun: sourceRowsByModel.get("ImportRun")!,
        importError: sourceRowsByModel.get("ImportError")!
      },
      {
        marketProduct: targetRowsByModel.get("MarketProduct")!,
        marketRankingSnapshot: targetRowsByModel.get("MarketRankingSnapshot")!,
        importRun: targetRowsByModel.get("ImportRun")!,
        importError: targetRowsByModel.get("ImportError")!
      }
    );
    console.log(`  MarketProduct REDNAPE count: source=${rednapeReport.marketProductCount.source} target=${rednapeReport.marketProductCount.target} expected=5 -> ${rednapeReport.marketProductCount.ok ? "PASS" : "FAIL"}`);
    console.log(
      `  MarketRankingSnapshot REDNAPE count: source=${rednapeReport.marketRankingSnapshotCount.source} target=${rednapeReport.marketRankingSnapshotCount.target} expected=5 -> ${
        rednapeReport.marketRankingSnapshotCount.ok ? "PASS" : "FAIL"
      }`
    );
    console.log(`  ImportRun REDNAPE count: source=${rednapeReport.importRunCount.source} target=${rednapeReport.importRunCount.target} expected=1 -> ${rednapeReport.importRunCount.ok ? "PASS" : "FAIL"}`);
    console.log(`  ImportError REDNAPE count: source=${rednapeReport.importErrorCount.source} target=${rednapeReport.importErrorCount.target} expected=0 -> ${rednapeReport.importErrorCount.ok ? "PASS" : "FAIL"}`);
    console.log(`  externalProductId set: ${rednapeReport.externalProductIds.ok ? "PASS" : "FAIL"} (expected=${JSON.stringify(EXPECTED_REDNAPE_EXTERNAL_PRODUCT_IDS)})`);
    console.log(`  periodDate/rank/rankingVerified/rankingScope on all 5 rows (both sides): ${rednapeReport.periodDateAndFlags.ok ? "PASS" : "FAIL"}`);
    if (!rednapeReport.periodDateAndFlags.ok) {
      for (const d of rednapeReport.periodDateAndFlags.details) console.log(`    - ${d}`);
    }

    // ---- Section G: derived business sanity checks (read-only, best-effort) ----
    console.log("");
    console.log("=== Derived business sanity checks (Section G) ===");
    const marketRankingDataModeReport = checkMarketRankingSnapshotDataModeCounts(sourceRowsByModel.get("MarketRankingSnapshot")!, targetRowsByModel.get("MarketRankingSnapshot")!);
    console.log(
      `  MarketRankingSnapshot dataMode counts (real=672, sample=2592, total=3264): source=${JSON.stringify(marketRankingDataModeReport.source)} target=${JSON.stringify(
        marketRankingDataModeReport.target
      )} -> ${marketRankingDataModeReport.ok ? "PASS" : "FAIL"}`
    );
    console.log(`  REDNAPE adds exactly 5 real MarketRankingSnapshot rows: ${rednapeReport.marketRankingSnapshotCount.ok ? "PASS" : "FAIL"} (see REDNAPE anchor section above)`);

    const watchlistReport = await checkWatchlistSanity();
    console.log(`  Watchlist frozen-order sanity check: attempted=${watchlistReport.attempted} matches=${watchlistReport.matchesExpectedOrder}`);
    console.log(`    expected: ${JSON.stringify(EXPECTED_WATCHLIST_ORDER)}`);
    console.log(`    actual:   ${JSON.stringify(watchlistReport.actualTop5)}`);
    if (watchlistReport.error) console.log(`    error:    ${sanitizeErrorMessage(watchlistReport.error)}`);
    console.log(`    LIMITATION: ${watchlistReport.note}`);

    // ---- final verdict: raw-row reconciliation is the gating requirement ----
    const rawReconciliationPass =
      results.every((r) => r.rowCountOk && r.idSet.ok && r.fieldEqualityOk && r.dateTimeEqualityOk && r.fingerprint.ok && (r.relationSource?.ok ?? true) && (r.relationTarget?.ok ?? true)) &&
      aggregateChecks.every((c) => c.ok) &&
      rednapeReport.ok;

    console.log("");
    console.log(`FINAL VERDICT: ${rawReconciliationPass ? "RECONCILIATION PASS" : "RECONCILIATION FAIL"}`);
    if (!rawReconciliationPass) process.exitCode = 1;
  } finally {
    await client.$disconnect();
  }
}

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error("Reconciliation failed:", error instanceof Error ? sanitizeErrorMessage(error.message) : error);
    process.exitCode = 1;
  });
}
