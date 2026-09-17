import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// next.config.ts's output: "standalone" traces only server code + required
// node_modules into .next/standalone - it does not copy public/ or
// .next/static/ (see https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
// Those are normally served by a platform CDN in front of a full Next.js
// deployment, but Railway just runs the standalone server.js directly, so
// this script places both next to it after every build.
const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneAppRoot = join(appRoot, ".next", "standalone", "apps", "trend-dashboard");

function copyIfExists(src: string, dest: string, label: string): void {
  if (!existsSync(src)) {
    console.log(`[copy-standalone-assets] skip ${label} (not found at ${src})`);
    return;
  }
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-standalone-assets] copied ${label} -> ${dest}`);
}

copyIfExists(join(appRoot, "public"), join(standaloneAppRoot, "public"), "public/");
copyIfExists(join(appRoot, ".next", "static"), join(standaloneAppRoot, ".next", "static"), ".next/static/");
