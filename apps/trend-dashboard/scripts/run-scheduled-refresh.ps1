<#
.SYNOPSIS
  Windows Task Scheduler entry point for the weekly Editorial refresh.

.DESCRIPTION
  Pure orchestration glue - working-directory handling, timestamped
  stdout/stderr logging, and exit-code preservation. Contains NO refresh
  logic of its own: the actual refresh is exactly
  `corepack pnpm refresh:editorial --json`, the same command documented in
  docs/EDITORIAL_REFRESH_OPERATIONS.md and runnable by hand. This script
  exists only because native Task Scheduler actions have no built-in way to
  redirect output to a timestamped log file per run.

  Logs are written under logs/editorial-refresh/ (the existing, already-
  gitignored `logs/` convention - see .gitignore - reused rather than
  inventing a new tmp/ directory, per this repo's own documented
  preference). Never committed.
#>

$ErrorActionPreference = "Stop"

# Windows PowerShell 5.1 quirk found during this pass's own live test run:
# without this, a piped native child process's stdout (corepack/pnpm/node)
# is decoded using the console's active codepage (not UTF-8 on this Korean
# Windows machine), so every Korean bundle/title string in the log came out
# as mojibake - "체크 SHIRT" became unreadable garbage. The underlying data
# was never affected (the refresh runner writes its own JSON report via
# Node's `fs.writeFile(..., "utf8")`, entirely independent of this script's
# console/pipe encoding - verified byte-for-byte correct after the incident
# that exposed this). Forcing both interpreter encodings to UTF-8 before
# invoking the native command fixes the log for good; also switched from
# Tee-Object (whose own default write encoding differs from Out-File's in
# Windows PowerShell 5.1 - the second, compounding half of the same
# incident) to a single capture-then-Out-File write path so there is only
# ever one encoding decision in this whole script, not two disagreeing ones.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Resolve the app root relative to this script's own location, not the
# caller's current directory - Task Scheduler's own "Start in" setting also
# sets this, but resolving it here too makes the script correct even if
# invoked manually from an unrelated directory.
$appRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -Path $appRoot

$logDir = Join-Path $appRoot "logs\editorial-refresh"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logDir "refresh-$timestamp.log"
$jsonReportSource = Join-Path $appRoot "logs\editorial-refresh-report.json"
$jsonReportCopy = Join-Path $logDir "refresh-$timestamp.json"

"=== Editorial Refresh started at $(Get-Date -Format o) ===" | Out-File -FilePath $logFile -Encoding utf8
"Working directory: $appRoot" | Out-File -FilePath $logFile -Append -Encoding utf8
"Command: corepack pnpm refresh:editorial --json" | Out-File -FilePath $logFile -Append -Encoding utf8
"" | Out-File -FilePath $logFile -Append -Encoding utf8

$exitCode = 1
try {
    # The refresh runner itself is the ONLY thing that touches the database
    # or the network - this script never calls collectors/prisma directly.
    # Captured as an array first, then written with the SAME -Encoding utf8
    # as every other write in this script (see the encoding note above).
    $output = & corepack pnpm refresh:editorial --json 2>&1
    $exitCode = $LASTEXITCODE
    $output | Out-File -FilePath $logFile -Append -Encoding utf8
    $output | Out-Host
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath $logFile -Append -Encoding utf8
    $exitCode = 1
}

if (Test-Path $jsonReportSource) {
    Copy-Item -Path $jsonReportSource -Destination $jsonReportCopy -Force
    "JSON report copied to: $jsonReportCopy" | Out-File -FilePath $logFile -Append -Encoding utf8
}

"" | Out-File -FilePath $logFile -Append -Encoding utf8
"=== Editorial Refresh finished at $(Get-Date -Format o) with exit code $exitCode ===" | Out-File -FilePath $logFile -Append -Encoding utf8

exit $exitCode
