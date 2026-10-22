// Cloudflare Workers build: generates both Prisma clients, then runs the
// OpenNext build with CF_WORKER_BUILD=1 so next.config.ts swaps in the workerd
// Prisma client. Cross-platform stand-in for `cross-env`.
import { spawnSync } from "node:child_process";

const env = { ...process.env, CF_WORKER_BUILD: "1" };
for (const args of [["prisma", "generate"], ["opennextjs-cloudflare", "build"]]) {
  const r = spawnSync("pnpm", ["exec", ...args], { stdio: "inherit", env, shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
