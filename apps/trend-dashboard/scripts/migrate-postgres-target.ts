/**
 * Safe `prisma migrate deploy` wrapper for the EXPLICIT migration target.
 *
 * WHY THIS EXISTS: prisma/schema.prisma's datasource reads `env("DATABASE_URL")`
 * - that is fixed at the schema level and cannot be changed per-invocation.
 * A bare `POSTGRES_MIGRATION_URL=... prisma migrate deploy` does NOT make
 * Prisma use POSTGRES_MIGRATION_URL - Prisma CLI reads DATABASE_URL from the
 * schema/environment exactly as declared, so that command would silently
 * migrate whichever database the ambient DATABASE_URL happens to point at
 * (e.g. the Neon DEVELOPMENT database during local work) while looking, at
 * a glance, like it targeted the intended migration target. This script is
 * the smallest safe fix: it never touches prisma/schema.prisma, and instead
 * spawns the Prisma CLI as a CHILD PROCESS whose OWN environment has
 * DATABASE_URL explicitly set to POSTGRES_MIGRATION_URL - the parent
 * process's `process.env.DATABASE_URL` (and therefore every other script
 * running in this same process) is never mutated.
 *
 * SAFETY CONTRACT:
 *  - Requires POSTGRES_MIGRATION_URL; never falls back to DATABASE_URL if
 *    it is missing. Validates protocol (postgres/postgresql only) and that
 *    it differs from SQLITE_EXPORT_DATABASE_URL (same policy function the
 *    importer/reconciler already use - see checkMigrationUrlPolicy).
 *  - Never reads or treats SQLITE_EXPORT_DATABASE_URL as a migration
 *    target - it is consulted only for the "differs from" policy check.
 *  - Never prints the raw POSTGRES_MIGRATION_URL, DATABASE_URL, or
 *    SQLITE_EXPORT_DATABASE_URL value anywhere. Only booleans and a
 *    redacted host+pathname "target identity" (via normalizedTargetIdentity,
 *    imported from import-postgres-snapshot.ts - no credentials, no query
 *    string) are ever logged.
 *  - Runs ONLY `prisma migrate deploy` - never `db push`, never `migrate
 *    dev`, never any reset/truncate/delete operation. Prisma's own exit
 *    code is propagated unchanged as this process's exit code.
 *
 * Usage:
 *   POSTGRES_MIGRATION_URL=postgresql://... tsx scripts/migrate-postgres-target.ts
 *   (or: pnpm db:migrate:target, with POSTGRES_MIGRATION_URL set in the environment)
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { checkMigrationUrlPolicy, normalizedTargetIdentity } from "./import-postgres-snapshot";

/**
 * Pure: the child process's environment for the spawned `prisma migrate
 * deploy` invocation. Returns a NEW object - `baseEnv` (e.g. `process.env`)
 * is never mutated in place, so this process's own `DATABASE_URL` (and
 * anything else reading `process.env` in this same process) is completely
 * unaffected by what the spawned Prisma CLI sees.
 */
export function buildChildEnvForMigrationDeploy(baseEnv: NodeJS.ProcessEnv, postgresMigrationUrl: string): NodeJS.ProcessEnv {
  return { ...baseEnv, DATABASE_URL: postgresMigrationUrl };
}

/**
 * Pure: resolves the exact args this script must pass to Node to run the
 * Prisma CLI's `migrate deploy` command, given the already-resolved path to
 * Prisma's CLI entry script. Kept as its own tiny pure function purely so
 * "this only ever runs migrate deploy, nothing else" is independently
 * assertable without spawning a real process.
 */
export function buildMigrateDeployArgs(prismaCliEntryPath: string): string[] {
  return [prismaCliEntryPath, "migrate", "deploy"];
}

/**
 * Resolves Prisma's CLI entry script path via Node's own module resolution
 * (works identically across Windows/macOS/Linux and across pnpm's nested
 * node_modules layout - no `.cmd`/`.sh` shim distinction, no shell
 * involved). Spawning `process.execPath <this-path> migrate deploy`
 * directly (no `shell: true`) avoids both platform-specific binary shims
 * and any shell-quoting/injection surface entirely.
 */
function resolvePrismaCliEntryPath(): string {
  const require = createRequire(import.meta.url);
  return require.resolve("prisma/build/index.js");
}

async function main() {
  const urlPolicy = checkMigrationUrlPolicy(process.env.POSTGRES_MIGRATION_URL, process.env.SQLITE_EXPORT_DATABASE_URL, process.env.DATABASE_URL);
  console.log(`POSTGRES_MIGRATION_URL policy: ${urlPolicy.errors.length === 0 ? "PASS" : "FAIL"}`);
  if (urlPolicy.sameAsDatabaseUrl !== null) {
    console.log(`  Informational only (never a fallback): POSTGRES_MIGRATION_URL identifies the ${urlPolicy.sameAsDatabaseUrl ? "SAME" : "a DIFFERENT"} target as the app's current DATABASE_URL.`);
  }
  if (urlPolicy.errors.length > 0) {
    for (const err of urlPolicy.errors) console.error(`  - ${err}`);
    console.error("ABORT - refusing to run migrate deploy. POSTGRES_MIGRATION_URL is required and is never inferred from DATABASE_URL.");
    process.exitCode = 1;
    return;
  }

  // Sanitized target identity only - host + database pathname, never credentials/query string.
  const targetIdentity = normalizedTargetIdentity(process.env.POSTGRES_MIGRATION_URL!);
  console.log(`Migration target identity (sanitized, no credentials): ${targetIdentity ?? "(unparseable - should not be reachable, protocol check already passed)"}`);
  console.log("");
  console.log("Running: prisma migrate deploy (against POSTGRES_MIGRATION_URL only - DATABASE_URL is set for the spawned process alone, never mutated in this process)");
  console.log("");

  const prismaCliEntryPath = resolvePrismaCliEntryPath();
  const childEnv = buildChildEnvForMigrationDeploy(process.env, process.env.POSTGRES_MIGRATION_URL!);

  await new Promise<void>((resolve) => {
    const child = spawn(process.execPath, buildMigrateDeployArgs(prismaCliEntryPath), {
      env: childEnv,
      stdio: "inherit"
    });
    child.on("exit", (code) => {
      process.exitCode = code ?? 1;
      resolve();
    });
    child.on("error", (error) => {
      console.error("Failed to spawn prisma migrate deploy:", error.message);
      process.exitCode = 1;
      resolve();
    });
  });
}

const isDirectRun = process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error("migrate-postgres-target failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
