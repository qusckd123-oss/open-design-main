/**
 * NDJSON -> PostgreSQL (disposable Neon verification DB) importer.
 *
 * SAFETY CONTRACT:
 *  - Writes ONLY through the isolated PostgreSQL verification Prisma client
 *    generated from prisma/schema.postgres.prisma (node_modules/.prisma-postgres-verification/client).
 *    The normal SQLite client (`../src/db/client`) is never imported here.
 *  - Reads ONLY from an already-exported NDJSON snapshot directory
 *    (backups/sqlite-export/<timestamp>/). This script NEVER opens
 *    prisma/dev.db, never imports @prisma/client (the SQLite client), and
 *    never runs a SQLite query of any kind - SQLite is not a dependency of
 *    this file at all, by construction, not by convention.
 *  - Refuses to write anything until every guard in `checkVerificationUrlPolicy()`
 *    / `evaluateEmptyTargetGuard()` (Section A) and every check in
 *    `validateSnapshotIntegrity()` (Section B) passes. Any failure aborts
 *    before the first write.
 *  - No reset/truncate/delete/rollback logic exists anywhere in this file
 *    (Section F). A partially-imported disposable database is expected to
 *    be fixed by recreating the Neon database, not by this script.
 *
 * ENV: `POSTGRES_VERIFICATION_URL` must already be set in the process
 * environment before running (see the repo's established pattern: source
 * apps/trend-dashboard/.env.postgres-verification into a subshell). This
 * file deliberately does NOT parse any .env file itself - the smallest safe
 * wrapper lives at the shell-invocation layer, not inside the importer.
 *
 * Usage:
 *   tsx scripts/import-postgres-snapshot.ts <snapshot-dir>
 *   e.g. tsx scripts/import-postgres-snapshot.ts backups/sqlite-export/2026-09-15T10-12-29-321Z
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { countNdjsonLines, sha256Hex, validateNdjson } from "./export-sqlite-snapshot";
// Isolated PostgreSQL verification client ONLY - generated from
// prisma/schema.postgres.prisma into a path that can never collide with the
// application's normal SQLite client. Do not replace with "@prisma/client".
//
// Deliberately a TYPE-ONLY import (erased entirely at compile time - safe
// under this project's `isolatedModules: true`). The actual runtime client
// is loaded lazily inside main() via `await import(...)` instead. This
// means importing this file's PURE functions (as scripts/smoke-test.ts
// does, for fixture/unit testing) never requires the generated client at
// node_modules/.prisma-postgres-verification/client to exist on disk -
// `pnpm test` must keep working even before anyone has ever run
// `prisma generate --schema=prisma/schema.postgres.prisma`.
import type { PrismaClient as PostgresVerificationPrismaClient } from "../node_modules/.prisma-postgres-verification/client";

const SUPPORTED_FORMAT_VERSION = 1;

/**
 * Every persisted model, in the exact order this importer writes them:
 * GROUP 1 (rows 0-6) - independent parent models with no FK dependency on
 * any other model in this list, order-insensitive among themselves.
 * GROUP 2 (rows 7-15) - dependent child models, each placed strictly after
 * its own parent. Re-derived directly from prisma/schema.postgres.prisma's
 * @relation() fields (the only source of truth for FK dependency - NOT the
 * schema's plain declaration order, which is unrelated). Models whose only
 * "*RunId"-shaped field has no @relation() attribute (MarketRankingSnapshot.
 * importRunId, SalesSnapshot.importRunId) are correctly NOT treated as
 * dependents of ImportRun - see PARENT_OF_MODEL's comment and Section I.
 */
export const IMPORT_ORDER: string[] = [
  // GROUP 1 - independent parents
  "Product",
  "CollectionRun",
  "TrendKeyword",
  "InternalProduct",
  "MarketProduct",
  "EditorialPost",
  "ImportRun",
  // GROUP 2 - dependents (each after its own parent above)
  "RankingSnapshot", // -> Product
  "ProductTag", // -> Product
  "CollectionError", // -> CollectionRun
  "KeywordTrendSnapshot", // -> TrendKeyword
  "KeywordShoppingAgeSnapshot", // -> TrendKeyword
  "SalesSnapshot", // -> InternalProduct
  "MarketRankingSnapshot", // -> MarketProduct
  "EditorialMention", // -> EditorialPost
  "ImportError" // -> ImportRun
];

/**
 * Declared purely for self-documentation / a future consistency check - the
 * actual @relation() parent each dependent model in GROUP 2 requires to
 * already exist. Deliberately does NOT include MarketRankingSnapshot ->
 * ImportRun or SalesSnapshot -> ImportRun: those `importRunId` fields are
 * plain, unconstrained strings in prisma/schema.postgres.prisma (no
 * @relation()), so they carry no FK ordering requirement. See Section I.
 */
export const PARENT_OF_MODEL: Record<string, string | null> = {
  Product: null,
  CollectionRun: null,
  TrendKeyword: null,
  InternalProduct: null,
  MarketProduct: null,
  EditorialPost: null,
  ImportRun: null,
  RankingSnapshot: "Product",
  ProductTag: "Product",
  CollectionError: "CollectionRun",
  KeywordTrendSnapshot: "TrendKeyword",
  KeywordShoppingAgeSnapshot: "TrendKeyword",
  SalesSnapshot: "InternalProduct",
  MarketRankingSnapshot: "MarketProduct",
  EditorialMention: "EditorialPost",
  ImportError: "ImportRun"
};

/**
 * Every DateTime field for every model, exhaustively. `verifyImportOrderCoversAllModels`
 * (in the test suite) asserts this object's key set equals IMPORT_ORDER's
 * set exactly, so a model can never silently import with zero registered
 * DateTime fields just because someone forgot to list it here - the
 * generic converter (`convertRowDateTimeFields`) refuses to run for any
 * model name missing from this map.
 */
export const DATE_TIME_FIELDS_BY_MODEL: Record<string, string[]> = {
  Product: ["createdAt", "updatedAt"],
  RankingSnapshot: ["collectedAt"],
  CollectionRun: ["startedAt", "completedAt", "createdAt"],
  CollectionError: ["timestamp"],
  TrendKeyword: ["createdAt", "updatedAt"],
  KeywordTrendSnapshot: ["period", "collectedAt"],
  KeywordShoppingAgeSnapshot: ["period", "collectedAt"],
  ProductTag: ["createdAt", "updatedAt"],
  InternalProduct: ["createdAt", "updatedAt"],
  SalesSnapshot: ["periodDate", "createdAt"],
  MarketProduct: ["createdAt", "updatedAt"],
  MarketRankingSnapshot: ["periodDate", "createdAt"],
  EditorialPost: ["publishedAt", "collectedAt", "createdAt", "updatedAt"],
  EditorialMention: ["createdAt"],
  ImportRun: ["startedAt", "completedAt", "createdAt"],
  ImportError: ["createdAt"]
};

/**
 * Fields that are nullable DateTime columns in prisma/schema.postgres.prisma
 * (`DateTime?`) - a `null` value here is valid data, never an error, and
 * must never be coerced into `new Date(null)` (which would silently produce
 * the epoch instant instead of preserving the null).
 */
const NULLABLE_DATE_TIME_FIELDS = new Set([
  "CollectionRun.completedAt",
  "ImportRun.completedAt",
  "EditorialPost.publishedAt"
]);

export type ExportRow = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Section C (pure): DateTime string -> JS Date conversion, one model+row at
// a time. Every other field (id, FK strings, nulls, booleans, numbers, text,
// serialized JSON strings like MarketRankingSnapshot.rawData) is returned
// completely untouched via the initial spread - this function's only job is
// finding the declared DateTime keys and replacing their ISO string with a
// Date object of the identical instant, never touching anything else.
// ---------------------------------------------------------------------------
export function convertRowDateTimeFields(modelName: string, row: ExportRow): ExportRow {
  const dateFields = DATE_TIME_FIELDS_BY_MODEL[modelName];
  if (!dateFields) {
    throw new Error(`No DateTime field mapping registered for model "${modelName}" - refusing to import blind. Add it to DATE_TIME_FIELDS_BY_MODEL first.`);
  }

  const converted: ExportRow = { ...row };
  for (const field of dateFields) {
    const raw = converted[field];
    const nullable = NULLABLE_DATE_TIME_FIELDS.has(`${modelName}.${field}`);

    if (raw === null) {
      if (!nullable) {
        throw new Error(`Model "${modelName}" field "${field}" is null but is not a nullable DateTime field in the schema - source data is unexpectedly missing a required timestamp.`);
      }
      converted[field] = null;
      continue;
    }

    if (typeof raw !== "string") {
      throw new Error(`Model "${modelName}" field "${field}" expected an ISO-8601 string${nullable ? " or null" : ""}, got ${typeof raw}.`);
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Model "${modelName}" field "${field}" value "${raw}" is not a parseable Date.`);
    }
    // Exact millisecond round-trip proof: exporter always wrote this string
    // via Date.toJSON() (full ISO-8601 UTC, .000Z-style). If re-parsing it
    // and re-serializing it does not reproduce the identical string, the
    // instant would not survive the trip byte-for-byte - abort rather than
    // import a possibly-lossy timestamp. This is what "must retain
    // identical getTime()/toISOString() semantics" is enforced by.
    if (date.toISOString() !== raw) {
      throw new Error(
        `Model "${modelName}" field "${field}" value "${raw}" did not round-trip exactly through Date (re-serialized as "${date.toISOString()}") - refusing to import a possibly-lossy timestamp.`
      );
    }
    converted[field] = date;
  }
  return converted;
}

export function prepareRowForWrite(modelName: string, row: ExportRow): ExportRow {
  // DateTime conversion is the ONLY transformation ever applied. Explicit
  // `id` values, foreign-key strings (including the deliberately
  // unconstrained MarketRankingSnapshot.importRunId / SalesSnapshot.importRunId -
  // see Section I), booleans, numbers, text, and serialized JSON strings
  // (e.g. MarketRankingSnapshot.rawData) all pass through byte-for-byte via
  // convertRowDateTimeFields's initial spread.
  return convertRowDateTimeFields(modelName, row);
}

// ---------------------------------------------------------------------------
// Section B (pure core + fs-backed wrapper): snapshot manifest + NDJSON
// integrity validation, entirely independent of any DB connection.
// ---------------------------------------------------------------------------
export interface ManifestModelEntry {
  name: string;
  rowCount: number;
  fileName: string;
  sha256: string;
  bytes: number;
}

export interface SnapshotManifest {
  formatVersion: number;
  modelCount: number;
  expectedModelCount: number;
  models: ManifestModelEntry[];
  totalRows: number;
}

export interface ManifestShapeCheck {
  ok: boolean;
  errors: string[];
}

/** Pure: validates only the manifest's own internal shape/consistency - no filesystem access. */
export function validateManifestShape(manifest: unknown): ManifestShapeCheck {
  const errors: string[] = [];
  if (manifest === null || typeof manifest !== "object") {
    return { ok: false, errors: ["manifest.json did not parse to an object."] };
  }
  const m = manifest as Partial<SnapshotManifest>;

  if (m.formatVersion !== SUPPORTED_FORMAT_VERSION) {
    errors.push(`Unsupported manifest formatVersion: ${JSON.stringify(m.formatVersion)} (this importer only supports ${SUPPORTED_FORMAT_VERSION}).`);
    // formatVersion mismatch is a hard stop - the rest of the shape may not
    // even mean the same thing under a future format, so short-circuit here.
    return { ok: false, errors };
  }

  if (!Array.isArray(m.models)) {
    errors.push("manifest.models is missing or not an array.");
    return { ok: false, errors };
  }

  if (m.modelCount !== IMPORT_ORDER.length) {
    errors.push(`manifest.modelCount is ${m.modelCount}, expected ${IMPORT_ORDER.length}.`);
  }
  if (m.models.length !== IMPORT_ORDER.length) {
    errors.push(`manifest.models has ${m.models.length} entries, expected ${IMPORT_ORDER.length}.`);
  }

  const manifestModelNames = new Set(m.models.map((entry) => entry?.name));
  for (const expectedName of IMPORT_ORDER) {
    if (!manifestModelNames.has(expectedName)) {
      errors.push(`manifest.models is missing an entry for expected model "${expectedName}".`);
    }
  }
  for (const entry of m.models) {
    if (!IMPORT_ORDER.includes(entry?.name as string)) {
      errors.push(`manifest.models has an unexpected entry for unknown model "${String(entry?.name)}".`);
    }
    if (typeof entry?.sha256 !== "string" || typeof entry?.fileName !== "string" || typeof entry?.rowCount !== "number") {
      errors.push(`manifest.models entry for "${String(entry?.name)}" is missing sha256/fileName/rowCount.`);
    }
  }

  const sumRowCounts = m.models.reduce((sum, entry) => sum + (typeof entry?.rowCount === "number" ? entry.rowCount : 0), 0);
  if (typeof m.totalRows === "number" && sumRowCounts !== m.totalRows) {
    errors.push(`manifest.totalRows (${m.totalRows}) does not equal the sum of per-model rowCount values (${sumRowCounts}).`);
  }

  return { ok: errors.length === 0, errors };
}

export interface NdjsonIntegrityCheck {
  ok: boolean;
  errors: string[];
}

/** Pure: checks one already-read NDJSON file's content against its manifest-declared expectations. */
export function verifyNdjsonFileIntegrity(modelName: string, content: string, expected: { sha256: string; rowCount: number }): NdjsonIntegrityCheck {
  const errors: string[] = [];

  const actualSha256 = sha256Hex(content);
  if (actualSha256 !== expected.sha256) {
    errors.push(`${modelName}: SHA-256 mismatch - manifest says ${expected.sha256}, file content hashes to ${actualSha256}.`);
  }

  const actualLineCount = countNdjsonLines(content);
  if (actualLineCount !== expected.rowCount) {
    errors.push(`${modelName}: line-count mismatch - manifest says ${expected.rowCount} rows, file has ${actualLineCount} lines.`);
  }

  const validation = validateNdjson(content);
  if (!validation.allValid) {
    errors.push(`${modelName}: NDJSON parse failure - ${validation.firstError ?? "unknown line"}.`);
  }

  return { ok: errors.length === 0, errors };
}

export interface SnapshotValidationResult {
  ok: boolean;
  errors: string[];
  manifest: SnapshotManifest | null;
  rowsByModel: Map<string, ExportRow[]>;
}

/**
 * fs-backed: reads manifest.json + all 16 NDJSON files from `snapshotDir`,
 * runs every Section B check, and (only if everything passes) parses every
 * line into an in-memory row array per model, ready for Section E to write.
 * Never touches the network or any database - this is read-only filesystem
 * access against the snapshot directory the caller passed in.
 */
export async function validateSnapshotIntegrity(snapshotDir: string): Promise<SnapshotValidationResult> {
  const errors: string[] = [];
  const manifestPath = join(snapshotDir, "manifest.json");

  if (!existsSync(manifestPath)) {
    return { ok: false, errors: [`manifest.json not found at ${manifestPath}.`], manifest: null, rowsByModel: new Map() };
  }

  let parsedManifest: unknown;
  try {
    parsedManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return { ok: false, errors: [`manifest.json failed to parse: ${error instanceof Error ? error.message : String(error)}`], manifest: null, rowsByModel: new Map() };
  }

  const shapeCheck = validateManifestShape(parsedManifest);
  if (!shapeCheck.ok) {
    return { ok: false, errors: shapeCheck.errors, manifest: null, rowsByModel: new Map() };
  }
  const manifest = parsedManifest as SnapshotManifest;

  const rowsByModel = new Map<string, ExportRow[]>();
  let sumRowCounts = 0;

  for (const modelName of IMPORT_ORDER) {
    const entry = manifest.models.find((m) => m.name === modelName);
    if (!entry) {
      // Already caught by validateManifestShape, but guard defensively so a
      // missing entry can never reach the file-read step below.
      errors.push(`${modelName}: no manifest entry found.`);
      continue;
    }

    const filePath = join(snapshotDir, entry.fileName);
    if (!existsSync(filePath)) {
      errors.push(`${modelName}: expected NDJSON file "${entry.fileName}" does not exist in ${snapshotDir}.`);
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    const integrity = verifyNdjsonFileIntegrity(modelName, content, { sha256: entry.sha256, rowCount: entry.rowCount });
    if (!integrity.ok) {
      errors.push(...integrity.errors);
      continue;
    }

    const rows: ExportRow[] = content.length === 0 ? [] : (content.endsWith("\n") ? content.slice(0, -1) : content).split("\n").map((line) => JSON.parse(line) as ExportRow);
    rowsByModel.set(modelName, rows);
    sumRowCounts += rows.length;
  }

  if (errors.length === 0 && sumRowCounts !== manifest.totalRows) {
    errors.push(`Sum of parsed rows (${sumRowCounts}) does not equal manifest.totalRows (${manifest.totalRows}).`);
  }

  return { ok: errors.length === 0, errors, manifest: errors.length === 0 ? manifest : null, rowsByModel };
}

// ---------------------------------------------------------------------------
// Section A (pure core + client-backed wrapper): pre-push safety guards.
// ---------------------------------------------------------------------------
export interface UrlProtocolCheck {
  set: boolean;
  protocolValid: boolean;
  differsFromDatabaseUrl: boolean;
  errors: string[];
}

/** Pure: checks 1-3 of Section A, given only the two raw env-var strings (never logged/returned). */
export function checkVerificationUrlPolicy(postgresVerificationUrl: string | undefined, databaseUrl: string | undefined): UrlProtocolCheck {
  const errors: string[] = [];
  const set = typeof postgresVerificationUrl === "string" && postgresVerificationUrl.length > 0;
  if (!set) {
    errors.push("POSTGRES_VERIFICATION_URL is not set.");
    return { set: false, protocolValid: false, differsFromDatabaseUrl: true, errors };
  }

  let protocolValid = false;
  try {
    const parsed = new URL(postgresVerificationUrl!);
    protocolValid = parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";
  } catch {
    protocolValid = false;
  }
  if (!protocolValid) {
    errors.push("POSTGRES_VERIFICATION_URL is not a valid postgres:// or postgresql:// URL.");
  }

  const differsFromDatabaseUrl = postgresVerificationUrl !== databaseUrl;
  if (!differsFromDatabaseUrl) {
    errors.push("POSTGRES_VERIFICATION_URL must not equal DATABASE_URL.");
  }

  return { set, protocolValid, differsFromDatabaseUrl, errors };
}

export interface EmptyTargetGuardResult {
  ok: boolean;
  missingTables: string[];
  nonEmptyTables: string[];
  errors: string[];
}

/** Pure: guards 4-5 of Section A, given already-fetched table names + counts. */
export function evaluateEmptyTargetGuard(existingTableNames: string[], countsByModel: Record<string, number>): EmptyTargetGuardResult {
  const errors: string[] = [];
  const existingSet = new Set(existingTableNames);
  const missingTables = IMPORT_ORDER.filter((model) => !existingSet.has(model));
  if (missingTables.length > 0) {
    errors.push(`Target database is missing expected tables: ${missingTables.join(", ")}.`);
  }

  const nonEmptyTables = IMPORT_ORDER.filter((model) => (countsByModel[model] ?? 0) > 0);
  if (nonEmptyTables.length > 0) {
    errors.push(`Target database already has rows in: ${nonEmptyTables.join(", ")}. ABORT - this importer never truncates/resets an existing target.`);
  }

  return { ok: missingTables.length === 0 && nonEmptyTables.length === 0, missingTables, nonEmptyTables, errors };
}

type PostgresVerificationClient = InstanceType<typeof PostgresVerificationPrismaClient>;

/** Client-backed: runs guards 4-5 for real against the live target (used only from main(), never from tests). */
async function fetchEmptyTargetGuardState(client: PostgresVerificationClient): Promise<{ existingTableNames: string[]; countsByModel: Record<string, number> }> {
  const tableRows = await client.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  const existingTableNames = tableRows.map((r) => r.table_name);

  const countsByModel: Record<string, number> = {};
  const existingSet = new Set(existingTableNames);
  for (const modelName of IMPORT_ORDER) {
    if (!existingSet.has(modelName)) continue; // counting a nonexistent table would throw - missing-table is already reported separately
    countsByModel[modelName] = await modelDelegate(client, modelName).count();
  }
  return { existingTableNames, countsByModel };
}

/** Maps a model name string to its typed Prisma delegate on the generated client - the single place model-name -> client-accessor happens. */
function modelDelegate(client: PostgresVerificationClient, modelName: string) {
  const key = (modelName.charAt(0).toLowerCase() + modelName.slice(1)) as keyof PostgresVerificationClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client[key] as any;
}

// ---------------------------------------------------------------------------
// Section E/F: sequential, per-model batched createMany() writes. On any
// batch failure, stop immediately - no fallback write path of any kind.
// ---------------------------------------------------------------------------

/**
 * Rows per createMany() call. PostgreSQL has a hard 65535-parameter limit
 * per statement; this project's widest model (MarketRankingSnapshot) has 20
 * columns, so 500 rows x 20 columns = 10,000 parameters - comfortably under
 * the limit for every model in this schema, including any future one with
 * up to ~130 columns. Batching does not change write semantics (still
 * createMany, still no skipDuplicates, still no dedup) - it only keeps each
 * statement within Postgres's own hard limit. Batches are sent strictly
 * sequentially (never in parallel) for auditability, per the task's own
 * "sequential import is preferred" instruction.
 */
export const CREATE_MANY_BATCH_SIZE = 500;

/**
 * Redacts any embedded connection-string-shaped substring from an error
 * message before it is ever logged/returned - defense in depth. Prisma/pg
 * error messages do not normally embed full connection strings/credentials,
 * but this guarantees one can never leak through a failure report either way.
 */
export function sanitizeErrorMessage(message: string): string {
  return message.replace(/postgres(ql)?:\/\/[^\s"']+/gi, "postgres[ql]://[REDACTED]");
}

export interface ModelImportOutcome {
  model: string;
  sourceRowCount: number;
  importedRowCount: number;
  elapsedMs: number;
  status: "PASS" | "FAIL";
  failureDetail?: {
    /** 1-based createMany() batch number within this model's import. -1 for a post-import count mismatch (no specific batch is at fault). */
    batchNumber: number;
    /** 1-based, inclusive, within this model's own NDJSON row order. -1 when not batch-specific. */
    sourceRowRangeStart: number;
    sourceRowRangeEnd: number;
    firstSourceId: unknown;
    lastSourceId: unknown;
    /** Always passed through sanitizeErrorMessage() before being set here. */
    message: string;
  };
}

/**
 * Imports exactly one model's already-validated, already-DateTime-converted
 * rows via batched createMany(), strictly sequentially.
 *
 * SAFETY: on ANY batch failure, this function STOPS IMMEDIATELY and issues
 * NO further writes of any kind - no per-row create() replay, no retry, no
 * partial-batch write attempt. A failed createMany already means the target
 * is in a state that must be reasoned about as-is; a previous version of
 * this function automatically replayed the failed batch row-by-row via
 * create() to identify the exact bad row, but that mutated the rehearsal
 * target further (a batch failure does not guarantee every row in it was
 * bad - a per-row replay could silently insert most of the batch) and mixed
 * diagnosis with migration behavior. Removed per explicit review. If
 * row-level diagnosis is ever needed, that is a separate, explicitly-
 * approved task against a freshly-empty disposable DB - never an automatic
 * fallback inside this importer. The only call made after a batch failure
 * below is a read-only count() (a SELECT, never a write) purely for
 * accurate reporting of the target's current state.
 *
 * The caller (main()) stops the whole run and never proceeds to a later
 * model after a FAIL outcome here - see Section F.
 */
export async function importModel(
  client: PostgresVerificationClient,
  modelName: string,
  preparedRows: ExportRow[]
): Promise<ModelImportOutcome> {
  const startedAt = Date.now();
  const delegate = modelDelegate(client, modelName);

  let batchNumber = 0;
  for (let batchStart = 0; batchStart < preparedRows.length; batchStart += CREATE_MANY_BATCH_SIZE) {
    batchNumber += 1;
    const batch = preparedRows.slice(batchStart, batchStart + CREATE_MANY_BATCH_SIZE);
    try {
      await delegate.createMany({ data: batch });
    } catch (batchError) {
      // STOP IMMEDIATELY. No per-row replay, no further writes. The only
      // call below is a read-only count() for the report - never a write.
      const importedSoFar = await delegate.count();
      return {
        model: modelName,
        sourceRowCount: preparedRows.length,
        importedRowCount: importedSoFar,
        elapsedMs: Date.now() - startedAt,
        status: "FAIL",
        failureDetail: {
          batchNumber,
          sourceRowRangeStart: batchStart + 1,
          sourceRowRangeEnd: batchStart + batch.length,
          firstSourceId: batch[0]?.id ?? null,
          lastSourceId: batch[batch.length - 1]?.id ?? null,
          message: sanitizeErrorMessage(batchError instanceof Error ? batchError.message : String(batchError))
        }
      };
    }
  }

  const importedRowCount = await delegate.count();
  return {
    model: modelName,
    sourceRowCount: preparedRows.length,
    importedRowCount,
    elapsedMs: Date.now() - startedAt,
    status: importedRowCount === preparedRows.length ? "PASS" : "FAIL",
    failureDetail:
      importedRowCount === preparedRows.length
        ? undefined
        : {
            batchNumber: -1,
            sourceRowRangeStart: -1,
            sourceRowRangeEnd: -1,
            firstSourceId: null,
            lastSourceId: null,
            message: `Post-import count (${importedRowCount}) does not equal source row count (${preparedRows.length}) even though every batch's createMany() reported success.`
          }
  };
}

// ---------------------------------------------------------------------------
// main() - orchestration only. Never called by the test suite.
// ---------------------------------------------------------------------------
async function main() {
  const snapshotDir = process.argv[2];
  if (!snapshotDir) {
    console.error("Usage: tsx scripts/import-postgres-snapshot.ts <snapshot-dir>");
    process.exitCode = 1;
    return;
  }

  console.log(`Snapshot: ${snapshotDir}`);
  console.log("");

  // ---- Section A, guards 1-3 (no DB connection needed yet) ----
  const urlPolicy = checkVerificationUrlPolicy(process.env.POSTGRES_VERIFICATION_URL, process.env.DATABASE_URL);
  console.log(`Guard 1-3 (env/protocol/distinct-from-DATABASE_URL): ${urlPolicy.errors.length === 0 ? "PASS" : "FAIL"}`);
  if (urlPolicy.errors.length > 0) {
    for (const err of urlPolicy.errors) console.error(`  - ${err}`);
    console.error("ABORT before writing anything.");
    process.exitCode = 1;
    return;
  }

  // ---- Section B: snapshot integrity (no DB connection needed) ----
  const snapshot = await validateSnapshotIntegrity(snapshotDir);
  console.log(`Snapshot integrity check: ${snapshot.ok ? "PASS" : "FAIL"}`);
  if (!snapshot.ok) {
    for (const err of snapshot.errors) console.error(`  - ${err}`);
    console.error("ABORT before writing anything.");
    process.exitCode = 1;
    return;
  }
  console.log(`  manifest models=${snapshot.manifest!.modelCount} totalRows=${snapshot.manifest!.totalRows}`);
  console.log("");

  // Lazy runtime load - see the top-of-file comment on the type-only import
  // above for why this must not be a static/eager import.
  const { PrismaClient: PostgresVerificationPrismaClient } = await import("../node_modules/.prisma-postgres-verification/client");
  const client: PostgresVerificationClient = new PostgresVerificationPrismaClient();
  try {
    // ---- Section A, guards 4-5 (needs a connection) ----
    const { existingTableNames, countsByModel } = await fetchEmptyTargetGuardState(client);
    const emptyGuard = evaluateEmptyTargetGuard(existingTableNames, countsByModel);
    console.log(`Guard 4-5 (all 16 tables exist, all empty): ${emptyGuard.ok ? "PASS" : "FAIL"}`);
    if (!emptyGuard.ok) {
      for (const err of emptyGuard.errors) console.error(`  - ${err}`);
      console.error("ABORT before writing anything.");
      process.exitCode = 1;
      return;
    }
    console.log("");

    // ---- Section D/E: sequential per-model import in dependency order ----
    const outcomes: ModelImportOutcome[] = [];
    const overallStart = Date.now();

    for (const modelName of IMPORT_ORDER) {
      const rawRows = snapshot.rowsByModel.get(modelName) ?? [];
      const preparedRows = rawRows.map((row) => prepareRowForWrite(modelName, row));
      const outcome = await importModel(client, modelName, preparedRows);
      outcomes.push(outcome);

      console.log(
        `  ${modelName.padEnd(28)} source=${String(outcome.sourceRowCount).padStart(6)} imported=${String(outcome.importedRowCount).padStart(6)} ${outcome.elapsedMs}ms  ${outcome.status}`
      );

      if (outcome.status === "FAIL") {
        console.error("");
        console.error(`FAIL at model "${modelName}": ${outcome.failureDetail?.message}`);
        if (outcome.failureDetail && outcome.failureDetail.batchNumber > 0) {
          console.error(`  batch number: ${outcome.failureDetail.batchNumber}`);
          console.error(`  source row range (1-based, within this model's NDJSON): [${outcome.failureDetail.sourceRowRangeStart}, ${outcome.failureDetail.sourceRowRangeEnd}]`);
          console.error(`  first id in batch: ${String(outcome.failureDetail.firstSourceId)}`);
          console.error(`  last id in batch: ${String(outcome.failureDetail.lastSourceId)}`);
        }
        console.error("Stopping immediately. No per-row write replay was attempted. Earlier successfully-imported models are left as-is - no automatic cleanup/rollback.");
        process.exitCode = 1;
        return;
      }
    }

    const totalDurationMs = Date.now() - overallStart;
    const totalImported = outcomes.reduce((sum, o) => sum + o.importedRowCount, 0);

    console.log("");
    console.log(`Total imported rows: ${totalImported}`);
    console.log(`Total duration: ${totalDurationMs}ms`);
    console.log("Per-model counts:");
    for (const o of outcomes) console.log(`  ${o.model.padEnd(28)} ${o.importedRowCount}`);
    console.log("");
    console.log("RESULT: PASS");
  } finally {
    await client.$disconnect();
  }
}

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error("Import failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
