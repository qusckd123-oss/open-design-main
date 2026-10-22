import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config: every dashboard route is dynamic and DB-backed, so no
// incremental/tag cache or queue bindings are configured.
export default defineCloudflareConfig();
