@AGENTS.md

# Confirmed project decisions

- `AGENTS.md` is the repository-level source of truth for agent instructions.
- `CLAUDE.md` must keep delegating to `AGENTS.md` and may add only confirmed Claude-specific working memory.
- Active workspace packages are `apps/*`, `packages/*`, `tools/*`, and `e2e`.
- The active web runtime is `apps/web`; do not restore or reference the removed `apps/nextjs` layout.
- Local development lifecycle commands must go through `pnpm tools-dev`; do not add root aliases such as `pnpm dev`, `pnpm start`, `pnpm daemon`, `pnpm preview`, or `pnpm dev:all`.
- Shared web/daemon contracts belong in `packages/contracts`, which must stay pure TypeScript and independent from Next.js, Express, Node filesystem/process APIs, browser APIs, SQLite, daemon internals, and sidecar control-plane dependencies.
- Sidecar process stamps must contain exactly five fields: `app`, `mode`, `namespace`, `ipc`, and `source`.
- New project-owned entrypoints, modules, scripts, tests, reporters, and configs should default to TypeScript.
- New `.js`, `.mjs`, or `.cjs` source files require an explicit generated, vendored, or compatibility reason and must pass `pnpm check:residual-js`.
- Git commits for this repository must not include `Co-authored-by` trailers or other co-author metadata.
