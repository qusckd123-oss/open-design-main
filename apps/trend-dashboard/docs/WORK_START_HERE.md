# Work Start Here - Trend Dashboard

Use this file when starting a fresh ChatGPT Work session for the Trend Dashboard.

## 1. Project identity
- Repo/worktree: `C:/Users/bcave/dev/open-design-trend-dashboard`
- Branch: `feature/trend-dashboard`
- App: `apps/trend-dashboard`
- Dev port: `3001`
- Package manager: `corepack pnpm`
- This project is separate from the Product Planning Dashboard in the OneDrive repo. Never touch that repo or its Codex processes from this task.

## 2. Read first, in this order
1. `docs/AGENT_OPERATING_RULES.md`
2. `docs/CURRENT_STATE.md`
3. `docs/NEXT_PRIORITIES.md`
4. This file

Verify live git/DB/scheduler state before acting. Do not assume numbers in docs are still current.

## 3. Product goal
The dashboard must answer one practical planner question first:

> 요즘 뜨는 아이템이 뭐냐?

The answer unit is not a broad category. It should be a planning-ready combination of:
`ITEM + DIRECT ATTRIBUTE(S) + MOOD/STYLE CONTEXT + VISUAL EVIDENCE`.

Good output examples:
- 빈티지 무드의 워싱/다잉 후가공 스웻 셔츠
- 컬러 배색이 강조된 토트백
- 90년대 빈티지 무드의 폰트 중심 타이포 아트웍 반팔티

## 4. New product-direction decision (2026-09-11)
The next major P2 direction is **visual-first trend discovery**.

Priority evidence layers:
- Editorial text: verifies what fashion media explicitly describes.
- Editorial / magazine Instagram visuals: gives repeated visual references and styling context.
- Instagram outfit posts / real-wear imagery: useful as a visual diffusion signal for what people are actually wearing and how they style it. Do not equate post frequency with verified sales volume.
- Store ranking/assortment: separate commercial reference; never fabricate sales meaning from assortment.

The planner should be able to understand the signal from images before reading a long explanation. Prefer representative outfit/product images, then concise signal copy, then supporting counts/evidence.

## 5. Trust boundaries that remain frozen
Do not casually redesign or reinterpret:
- direct attribute relation semantics
- independent evidence clustering
- publisher-family spread
- current bundle ranking order
- taxonomy vocabulary
- Product Reference (closed/frozen)
- Market `dataMode="real"` semantics

Images and Instagram-derived observations must not silently become direct attribute claims unless their relation to the item is structurally proven. Keep visual evidence and text-direct evidence distinguishable.

## 6. Current operating constraints
- P0 natural scheduler observation is still pending for 2026-09-14 08:30 KST.
- Safe read-only research and UI/product-design preparation may continue before P0 completes.
- Do not run a live editorial refresh just to test.
- UI changes should be validated with real rendered screens, not code review alone.
- Use explicit git staging; no `git add .` / `git add -A`; push normally to `origin/feature/trend-dashboard`.

## 7. Work-session execution loop
For each substantial task:
1. Verify branch, clean/known tree, current docs, and relevant live state.
2. Inspect the actual rendered UI at `http://localhost:3001` when UI judgment matters.
3. Execute one coherent task at a time.
4. Run `corepack pnpm typecheck`, relevant safe tests, and `corepack pnpm build` for UI/code changes.
5. Run read-only quality audit when signal/data-facing code is touched.
6. Confirm Canonical Duplicates = 0, Mention Duplicates = 0, and Market(real) remains 667 unless a legitimate later collection changes the documented baseline.
7. Update `CURRENT_STATE.md` / `NEXT_PRIORITIES.md` when state or priority materially changes.
8. Explicitly stage changed files, commit, and push.

## 8. Immediate Work objective
Before implementing a large redesign, audit the current rendered planner experience against the new visual-first goal and produce a concrete implementation plan covering:
- how the home screen should answer “요즘 뭐가 뜨는가” visually,
- how `ITEM + ATTRIBUTE + MOOD` should be represented without weakening current trust semantics,
- which existing article images can safely be reused,
- what Instagram/editorial-Instagram collection is technically and legally feasible,
- how to separate visual diffusion evidence from verified editorial direct relations and store evidence,
- what can be implemented safely before the 2026-09-14 P0 scheduler observation.

Do not manufacture Instagram metrics or scrape around access restrictions. Prefer official/publicly accessible evidence and document gaps honestly.

## 9. Short bootstrap prompt
`Open this repo at C:/Users/bcave/dev/open-design-trend-dashboard, read apps/trend-dashboard/docs/WORK_START_HERE.md and the three control docs it references, verify live state, then continue the highest-priority safe Trend Dashboard task. Treat the 2026-09-11 visual-first ITEM + ATTRIBUTE + MOOD + VISUAL EVIDENCE direction as the current product goal. Do not touch the separate OneDrive Product Planning repo.`
