# Trend Dashboard — Agent Instructions

This file is the durable, always-needed operating context for this repo. It does not duplicate state or history — see the control docs it links to for that.

## 1. Repo boundary

- Trend Dashboard (this repo): `C:/Users/bcave/dev/open-design-trend-dashboard`
- Separate Product Planning Dashboard repo: `C:/Users/bcave/OneDrive - (주)비케이브/open-design-main-1`
- **Never modify the Product Planning repo, or terminate/interfere with its processes (e.g. `codex.js --yolo`), during Trend Dashboard work.** A concurrent Codex process for that repo running on this machine is expected and legitimate — do not treat it as an anomaly.
- Do not attribute any change in this repo's data/files to another agent/process without direct evidence (actual command line / working directory) that it targets *this* repo. Process name alone is not evidence.

## 2. Active branch / local drift

- Primary branch: `feature/trend-dashboard`
- App: `apps/trend-dashboard` (dev port `3001`; never touch port 3000, reserved)
- Package manager: `corepack pnpm`
- Known unrelated generated local artifact: `apps/trend-dashboard/next-env.d.ts` — never stage, reset, discard, or commit it unless explicitly requested.

## 3. Git safety

- Explicit file staging only (`git add <path>`). Never `git add -A` / `git add .`.
- Never force-push. Never `git reset --hard` / `git clean` / any discard-uncommitted-work command without first running `git status` and understanding what would be lost.
- Never rewrite history on shared work (amend an already-pushed commit, interactive rebase) unless explicitly asked.
- Do not merge to `main` unless explicitly instructed.

## 4. Control doc order

Before any substantial Trend Dashboard work, read in this order:
1. `apps/trend-dashboard/docs/WORK_START_HERE.md`
2. `apps/trend-dashboard/docs/AGENT_OPERATING_RULES.md`
3. `apps/trend-dashboard/docs/CURRENT_STATE.md`
4. `apps/trend-dashboard/docs/NEXT_PRIORITIES.md`

Verify live git/DB/scheduler state yourself — do not trust prose in these docs at face value; `CURRENT_STATE.md` can be minutes-to-weeks stale.

## 5. Product / watchlist principles

- Watchlist ordering is **evidence-based bundle ordering**, not a sales/growth/opportunity rank. A persistent "관측 근거 기준 정렬 · 성장·판매 순위 아님" line must stay visible wherever this could be misread.
- Interpretation is split into **FACT / UNKNOWN / PLANNING QUESTION** — facts use only existing bundle fields, unknowns are honest gaps, and the question is explicitly framed as human-review, never a recommendation.
- DIRECT/ADJACENT evidence outranks editorial hero imagery; article/hero images are supporting context only, never proof.
- HYPE/visual-diffusion signal is kept structurally separate from verified item trend/editorial-direct signal — do not let one silently become the other.
- The Home Watchlist's data source is `getAttributeBundles(...)` + `buildSignalInterpretation(...)`. **`getItemTrendRows()` is NOT the Home Watchlist source** — do not substitute it.
- Current product direction (2026-09-11+) is **visual-first**: `ITEM + DIRECT ATTRIBUTE(S) + MOOD/STYLE CONTEXT + VISUAL EVIDENCE`, not broad category counts.
- **UI layout is frozen.** No CSS/component/layout redesign unless the user explicitly reopens this in-session.
- Frozen/do-not-redesign without explicit reopening: direct attribute relation semantics, independent evidence clustering, publisher-family spread, current bundle ranking order, taxonomy vocabulary, Product Reference (closed/frozen research — do not resume), Market `dataMode="real"` semantics.

## 6. Production architecture (concise)

- Railway = web app hosting only, Serverless enabled.
- Neon = production PostgreSQL database (`DATABASE_URL`, canonical runtime schema per `prisma/schema.prisma`).
- GitHub Actions = scheduled collectors (`.github/workflows/trend-editorial-refresh.yml`, `.github/workflows/trend-verified-market.yml`).
- Shared access-code auth (`DASHBOARD_ACCESS_CODE` + `SESSION_SECRET`, fail-closed) protects the dashboard; `src/app/api/health/route.ts` is the public, unauthenticated `/api/health` endpoint used as the Railway healthcheck (must stay free of auth/DB/network calls).
- Full deployment history/incidents belong in `apps/trend-dashboard/docs/` audit files, not here.

## 7. Database / migration safety

- Canonical runtime DB is **PostgreSQL** (Neon), per `prisma/schema.prisma`.
- `apps/trend-dashboard/prisma/dev.db` (SQLite) is a local-only, gitignored rollback/export source artifact — **never mutate it during normal production work.**
- Production/rehearsal migrations use the explicit `POSTGRES_MIGRATION_URL` via `pnpm db:migrate:target` (`scripts/migrate-postgres-target.ts`) — **never** a bare `prisma migrate deploy`, which would silently target `DATABASE_URL` instead.
- Never silently fall back to `DATABASE_URL` for a migration/import/reconcile script.
- No `prisma db push` / `prisma migrate reset` / truncation without explicit user approval.
- Watchlist snapshot history is append-only.
- `SMOKE_TEST_CORPUS_MODE` must be set explicitly (`full` vs `development`) — never inferred from row count.

## 8. Automation

- Editorial refresh (`scripts/refresh-editorial.ts`, `pnpm refresh:editorial`) runs on schedule via GitHub Actions (`trend-editorial-refresh.yml`). **Never run a real (non-dry-run, non-scheduled) invocation just to test something** — use `--help` or `--dry-run` (real network, zero DB writes), or the unit tests.
- Verified Market collection runs via GitHub Actions (`trend-verified-market.yml`).
- Watchlist snapshot foundation exists; append-only (see §7).
- Category B (human-reviewed only, never automate): taxonomy/extraction-boundary edits, bundle ranking/sort logic, new source additions, full-corpus reparse, any Product Reference work, any taxonomy expansion, any Prisma schema/migration change, any UI change.
- Volatile schedules, run status, and counts belong in `CURRENT_STATE.md`, not here.

## 9. Source safety

- No unofficial Instagram API use, no cookie extraction, no bypass or mass scraping.
- Instagram access only via bounded/manual or semi-automated logged-in browser use where permitted by the platform; current Instagram integration is docs-only `MANUAL_CURATION` registry entries — no automated Instagram collection exists or is proposed.
- Public web/RSS/store sources may be automated only where the source's own terms/`robots.txt` allow it (e.g. `mmm-mag.co.kr` explicitly disallows `ClaudeBot` and must not be revisited for automated collection).
- Never fabricate or invent metrics (Instagram or otherwise) to fill an evidence gap — document the gap honestly instead.

## 10. Stop conditions

Stop and ask the user rather than guessing or self-remediating if you hit: an unrecognized dirty working tree, an unexpected Market (`dataMode: "real"`) count change, canonical/mention duplicates where gates previously reported 0, signs of parser/taxonomy collapse, an unexplained DB mutation, an access restriction blocking a planned step, or evidence another process is actually writing to *this* repo/DB concurrently (verified by command line/working directory, not process name).

## 11. Pointers, not copies

For anything volatile — current data counts, run history, in-progress work, priority queue — read the control docs in §4 rather than trusting a cached summary. Detailed audits and one-off investigation writeups live under `apps/trend-dashboard/docs/*.md`; do not duplicate their contents here.
