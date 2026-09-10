import { editorialSources, type EditorialSource } from "../src/config/editorial-sources";
import { collectAndUpsertSource } from "./collect-korea-editorial";
import { getEditorialRefreshSnapshot, type EditorialRefreshSnapshot } from "../src/services/editorial-refresh-snapshot";
import { classifySourceOutcome, checkZeroResultGuard, evaluateQualityGates, worstGateLevel, type SourceCollectionOutcome } from "../src/services/editorial-refresh-policy";
import { parseRefreshCliArgs, REFRESH_CLI_USAGE } from "../src/services/editorial-refresh-cli";
import { prisma } from "../src/db/client";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * SAFE EDITORIAL REFRESH RUNNER
 *
 * One command that performs a complete, safe, observable Editorial data
 * refresh - discover -> collect -> upsert -> (mentions refreshed inline,
 * same as every collector already does) -> integrity audit -> signal
 * recompute -> quality gates -> report. Orchestrates the EXISTING collection
 * logic (`collectAndUpsertSource` in collect-korea-editorial.ts, itself
 * unchanged behavior from before this pass) rather than reimplementing any
 * collector/parser code - see docs/EDITORIAL_REFRESH_OPERATIONS.md.
 *
 * This is a DATA-ONLY refresh. It NEVER touches taxonomy
 * (mentions.ts/attribute-relations.ts), ranking (attribute-bundle-service.ts
 * sort), or Product Reference. Those are Category B, human-reviewed
 * maintenance - see docs/EDITORIAL_REFRESH_OPERATIONS.md "Code vs Data
 * Refresh" - and this script has no code path that can touch them.
 *
 * Usage: see REFRESH_CLI_USAGE in ../src/services/editorial-refresh-cli.ts
 * (single source of truth - also what `--help` prints). Argv parsing itself
 * is in that module too: pure, fail-fast on any unrecognized flag, tested in
 * scripts/test-refresh-editorial.ts. This runner never inspects process.argv
 * directly.
 *
 * Exit code is non-zero if any quality gate FAILs, or if argv parsing fails.
 * WARN never fails the run. `--help`/`-h` always exits 0 and does nothing
 * else - no preflight, no network, no DB read or write.
 */

function formatDelta(before: number, after: number): string {
  const sign = after > before ? "+" : after < before ? "" : "";
  return `${before} -> ${after} (${sign}${after - before})`;
}

async function main() {
  // Argv parsing is the FIRST thing this runner does, before any console
  // output, DB preflight, or collector call - this is the fail-fast
  // boundary the 2026-09-10 incident (an unrecognized `--help` silently
  // falling through to a full LIVE run) required. See
  // docs/EDITORIAL_REFRESH_OPERATIONS.md.
  const parsed = parseRefreshCliArgs(process.argv.slice(2));

  if (parsed.action === "help") {
    console.log(REFRESH_CLI_USAGE);
    console.log(`\nKnown sources: ${editorialSources.join(", ")}`);
    return;
  }
  if (parsed.action === "error") {
    console.error(`${parsed.message}\n`);
    console.error(REFRESH_CLI_USAGE);
    process.exitCode = 1;
    return;
  }

  const { dryRun, sourceArg, days, limitPerSource, writeJson } = parsed;

  if (sourceArg && !editorialSources.includes(sourceArg as EditorialSource)) {
    console.error(`Unknown --source=${sourceArg}. Known sources: ${editorialSources.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const sources = sourceArg ? [sourceArg as EditorialSource] : [...editorialSources];

  console.log("=== EDITORIAL REFRESH ===");
  console.log(`Mode: ${dryRun ? "DRY RUN (no DB writes)" : "LIVE"}`);
  console.log(`Sources: ${sources.join(", ")}`);
  console.log(`Window: ${days ? `${days} days` : "collector default"} | Limit per source: ${limitPerSource}\n`);

  // PHASE 1 - PREFLIGHT
  let before: EditorialRefreshSnapshot;
  try {
    before = await getEditorialRefreshSnapshot();
  } catch (error) {
    console.error("PREFLIGHT FAILED - could not read the database. Stopping the entire run (this is an orchestration-level failure, not a per-source one).");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  console.log("--- PREFLIGHT (before) ---");
  console.log(
    `EditorialPost=${before.totalPosts} EditorialMention=${before.totalMentions} Bundles=${before.bundles} IndependentRepeated=${before.independentRepeated} MultiSource=${before.multiSourceIndependent} FamilyDiverse=${before.publisherFamilyDiverse} Market=${before.marketSnapshots} Primary=${before.currentPrimary ?? "-"}\n`
  );

  // PHASE 2 - COLLECT SOURCE-BY-SOURCE (with failure isolation - one
  // source's outcome never affects whether the loop continues to the next).
  const outcomes: SourceCollectionOutcome[] = [];
  const zeroResultWarnings: string[] = [];
  for (const source of sources) {
    process.stdout.write(`${source}... `);
    const outcome = await collectAndUpsertSource(source, { days, limitPerSource, dryRun });
    outcomes.push(outcome);
    const classification = classifySourceOutcome(outcome);
    if (outcome.status === "SUCCESS") {
      console.log(`OK posts=${outcome.posts} new=${outcome.newPosts} updated=${outcome.updatedPosts} mentions=${outcome.mentions}`);
    } else {
      console.log(`${outcome.status} (${classification.action}) - ${classification.reason}`);
    }
    if (!dryRun) {
      const guard = checkZeroResultGuard(source, before.perSource[source] ?? { postCount: 0, mostRecentPublishedAt: null }, outcome);
      if (guard.warn) {
        console.log(`  WARN: ${guard.reason}`);
        zeroResultWarnings.push(guard.reason);
      }
    }
  }

  // PHASE 5/6 - INTEGRITY AUDIT + SIGNAL RECOMPUTE
  const after = dryRun ? before : await getEditorialRefreshSnapshot();
  console.log("\n--- AFTER ---");
  console.log(
    `EditorialPost=${after.totalPosts} EditorialMention=${after.totalMentions} Bundles=${after.bundles} IndependentRepeated=${after.independentRepeated} MultiSource=${after.multiSourceIndependent} FamilyDiverse=${after.publisherFamilyDiverse} Market=${after.marketSnapshots} Primary=${after.currentPrimary ?? "-"}\n`
  );

  // PHASE 7 - QUALITY GATES + REPORT
  const gates = dryRun ? [] : evaluateQualityGates(before, after, outcomes);
  const worst = worstGateLevel(gates);

  console.log("=== EDITORIAL REFRESH COMPLETE ===\n");
  const succeeded = outcomes.filter((o) => o.status === "SUCCESS").length;
  console.log(`Sources:\n${succeeded}/${outcomes.length} success\n`);
  console.log(`New Posts:\n${outcomes.reduce((sum, o) => sum + o.newPosts, 0)}\n`);
  console.log(`Updated:\n${outcomes.reduce((sum, o) => sum + o.updatedPosts, 0)}\n`);
  console.log(`Mentions:\n${formatDelta(before.totalMentions, after.totalMentions)}\n`);
  console.log(`Bundles:\n${formatDelta(before.bundles, after.bundles)}\n`);
  console.log(`Independent Repeated:\n${formatDelta(before.independentRepeated, after.independentRepeated)}\n`);
  console.log(`Multi-source:\n${formatDelta(before.multiSourceIndependent, after.multiSourceIndependent)}\n`);
  console.log(`Family-diverse:\n${formatDelta(before.publisherFamilyDiverse, after.publisherFamilyDiverse)}\n`);

  const failures = outcomes.filter((o) => o.status !== "SUCCESS");
  console.log("Failures:");
  if (failures.length === 0) console.log("  none");
  else for (const f of failures) console.log(`  ${f.source} ${f.status} - ${f.error ?? "no detail"}`);
  console.log();

  if (zeroResultWarnings.length > 0) {
    console.log("Zero-result warnings:");
    for (const w of zeroResultWarnings) console.log(`  ${w}`);
    console.log();
  }

  console.log(`Current Signal:\n${after.currentPrimary ?? "-"}\n`);

  if (!dryRun) {
    console.log("Quality gates:");
    for (const gate of gates) console.log(`  [${gate.level}] ${gate.name}: ${gate.detail}`);
    console.log();
  }

  if (writeJson) {
    const report = { generatedAt: new Date().toISOString(), dryRun, sources, days, limitPerSource, before, after, outcomes, gates, worstGateLevel: worst };
    // process.cwd(), not __dirname (unavailable under this project's ESM
    // module setup) - matches every other script in this repo, all of which
    // assume invocation from the app root (`npx tsx scripts/...` /
    // `pnpm --filter ... run ...`), never a different working directory.
    const outDir = path.resolve(process.cwd(), "logs");
    await mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, "editorial-refresh-report.json");
    await writeFile(outPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`Machine-readable report written to ${outPath} (gitignored, never committed).`);
  }

  if (worst === "FAIL") process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Editorial refresh failed at the orchestration level:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
