import path from "node:path";
import type { NextConfig } from "next";

// Cloudflare Workers build (cf:build): swap the native-engine Prisma client for
// the Rust-free workerd client and use the native R2 binding for LOOK images.
// Scripts, collectors, tests, and a normal Next build keep the Node variants.
const isWorkerBuild = process.env.CF_WORKER_BUILD === "1";

const nextConfig: NextConfig = {
  output: "standalone",
  // This app is a pnpm workspace member (apps/trend-dashboard); the repo
  // root (two levels up) is where the workspace's hoisted node_modules and
  // lockfile live, so file tracing for the standalone output must include
  // everything above this directory, not just this package's own folder.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Only the LOOK image recovery upload (<= 15 MB) passes through proxy.ts with a body; keep the buffered limit minimal.
  experimental: { proxyClientMaxBodySize: "16mb" },
  // pg only require()s pg-cloudflare conditionally (inside the workerd socket
  // path), so static tracing never copies its dist/ into the OpenNext bundle.
  outputFileTracingIncludes: {
    "/*": ["../../node_modules/.pnpm/pg-cloudflare@*/node_modules/pg-cloudflare/{dist,esm}/**"]
  },
  ...(isWorkerBuild
    ? {
        turbopack: {
          resolveAlias: {
            "@/db/client": "./src/db/client.worker.ts",
            "@/lib/look-image-storage": "./src/lib/look-image-storage.worker.ts"
          }
        },
        webpack: (config: { resolve: { alias: Record<string, string> } }) => {
          config.resolve.alias["@/db/client"] = path.join(__dirname, "src/db/client.worker.ts");
          config.resolve.alias["@/lib/look-image-storage"] = path.join(__dirname, "src/lib/look-image-storage.worker.ts");
          return config;
        }
      }
    : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
