import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // This app is a pnpm workspace member (apps/trend-dashboard); the repo
  // root (two levels up) is where the workspace's hoisted node_modules and
  // lockfile live, so file tracing for the standalone output must include
  // everything above this directory, not just this package's own folder.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Only the LOOK image recovery upload (<= 15 MB) passes through proxy.ts with a body; keep the buffered limit minimal.
  experimental: { proxyClientMaxBodySize: "16mb" },
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
