/**
 * PURE argv parsing for the editorial refresh runner
 * (scripts/refresh-editorial.ts) - no prisma, no network, no filesystem, no
 * process.exit. Deliberately separated from the runner's I/O so it can be
 * unit-tested with plain string-array fixtures, same rationale as
 * editorial-refresh-policy.ts.
 *
 * Exists because of a real incident: an unrecognized flag (`--help`, typed
 * while checking usage) was silently ignored by the old ad-hoc argv scan and
 * fell through to a full LIVE collection run. This parser makes "unknown
 * flag" a first-class, fail-fast outcome the caller must handle BEFORE any
 * database read, network call, or collector invocation - see
 * docs/EDITORIAL_REFRESH_OPERATIONS.md.
 */

export type RefreshCliParseResult =
  | { action: "help" }
  | { action: "error"; message: string }
  | {
      action: "run";
      dryRun: boolean;
      sourceArg?: string;
      days?: number;
      limitPerSource: number;
      writeJson: boolean;
    };

const KNOWN_BOOLEAN_FLAGS = new Set(["--dry-run", "--json", "--help", "-h"]);
const KNOWN_VALUE_FLAG_PREFIXES = ["--source=", "--days=", "--limit-per-source="];

function valueOf(argv: string[], prefix: string): string | undefined {
  const token = argv.find((value) => value.startsWith(prefix));
  return token?.slice(prefix.length);
}

/**
 * Parses CLI args (pass `process.argv.slice(2)`, not the full process.argv).
 * `--help`/`-h` always wins over everything else, including an otherwise-
 * unknown flag present alongside it, matching common CLI convention (help
 * should always be reachable). Any other unrecognized token is a fail-fast
 * error - this CLI takes no positional arguments.
 */
export function parseRefreshCliArgs(argv: string[]): RefreshCliParseResult {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { action: "help" };
  }

  for (const token of argv) {
    const isKnownBoolean = KNOWN_BOOLEAN_FLAGS.has(token);
    const isKnownValueFlag = KNOWN_VALUE_FLAG_PREFIXES.some((prefix) => token.startsWith(prefix));
    if (!isKnownBoolean && !isKnownValueFlag) {
      return { action: "error", message: `Unknown argument: ${token}` };
    }
  }

  const daysRaw = valueOf(argv, "--days=");
  const days = daysRaw !== undefined ? Number(daysRaw) : undefined;
  if (daysRaw !== undefined && Number.isNaN(days)) {
    return { action: "error", message: `Invalid --days value: ${daysRaw}` };
  }

  const limitRaw = valueOf(argv, "--limit-per-source=");
  const limitPerSource = limitRaw !== undefined ? Number(limitRaw) : 30;
  if (limitRaw !== undefined && Number.isNaN(limitPerSource)) {
    return { action: "error", message: `Invalid --limit-per-source value: ${limitRaw}` };
  }

  return {
    action: "run",
    dryRun: argv.includes("--dry-run"),
    sourceArg: valueOf(argv, "--source="),
    days,
    limitPerSource,
    writeJson: argv.includes("--json")
  };
}

export const REFRESH_CLI_USAGE = `Usage:
  npx tsx scripts/refresh-editorial.ts [--dry-run] [--source=NAME] [--days=90] [--limit-per-source=30] [--json]

Options:
  --dry-run              Real network discovery/fetch/parse per source, but zero DB writes.
  --source=NAME          Refresh only one source (recovery/testing). Omit to refresh every configured source.
  --days=N               Override the collection window (default: each collector's own default, currently 90).
  --limit-per-source=N   Override the per-source article cap (default 30).
  --json                 Also write a machine-readable report to logs/editorial-refresh-report.json.
  --help, -h             Show this help and exit.

This is a DATA-ONLY refresh. It never touches taxonomy, ranking, or Product Reference.
Any unrecognized argument fails immediately with a non-zero exit code, before any
network request, collector run, or database write.`;
