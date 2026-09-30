import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { instagramProfileUrl, manualLookImageRows, normalizeInstagramHandle, postIdentity, publicLookClusters, type LookObservationCandidate, type LookClusterCandidate } from "../src/lib/look-observation";

assert.equal(normalizeInstagramHandle(" @My.Look_ "), "my.look_");
assert.equal(normalizeInstagramHandle("my.look_"), "my.look_");
assert.equal(instagramProfileUrl("@My.Look_"), "https://www.instagram.com/my.look_/");
assert.throws(() => normalizeInstagramHandle("bad/name"));

const urls = ["https://images.example/a.jpg", "https://images.example/b.jpg", "https://images.example/c.jpg"];
assert.deepEqual(manualLookImageRows(urls), urls.map((imageUrl, imageIndex) => ({ imageUrl, imageIndex })));
assert.throws(() => manualLookImageRows([urls[0]!, urls[0]!]));
assert.throws(() => manualLookImageRows([]));
assert.equal(postIdentity("https://www.musinsa.com/content/1531948406752475462?contentCategoryCode=001001", "MUSINSA_STYLE"), "musinsa.com/content/1531948406752475462");
assert.equal(postIdentity("https://www.musinsa.com/content/1531948406752475462", "MUSINSA_STYLE"), "musinsa.com/content/1531948406752475462");
assert.throws(() => postIdentity("https://www.musinsa.com/main/musinsa/ranking", "MUSINSA_STYLE"));

function row(id: string, account: string, type: LookObservationCandidate["observationType"], platform: LookObservationCandidate["platform"], post: string, status: LookObservationCandidate["reviewStatus"] = "APPROVED"): LookObservationCandidate {
  return { id, sourceAccountId: account, platform, postIdentity: post, observationType: type, imageUrl: `https://images.example/${id}.jpg`, postUrl: `https://example.com/${post}`, observedAt: new Date("2026-09-30T00:00:00Z"), reviewStatus: status, genderCandidate: "MEN" };
}
const rows = [
  row("real-0", "ig-a", "REAL_WEAR", "INSTAGRAM", "ig-post-1"),
  row("real-1", "ig-a", "REAL_WEAR", "INSTAGRAM", "ig-post-1"),
  row("real-2", "ig-b", "REAL_WEAR", "INSTAGRAM", "ig-post-2"),
  row("curation-0", "ig-c", "CURATED_LOOK", "INSTAGRAM", "curated-post"),
  row("curation-1", "ig-c", "CURATED_LOOK", "INSTAGRAM", "curated-post"),
  row("style", "web-1", "STYLE_MEDIA", "MUSINSA_STYLE", "musinsa-post"),
  row("legacy", "ig-a", null, "INSTAGRAM", "old-post"),
  row("pending", "ig-z", "REAL_WEAR", "INSTAGRAM", "pending-post", "PENDING"),
  row("rejected", "ig-z", "REAL_WEAR", "INSTAGRAM", "rejected-post", "REJECTED")
];
const cluster: LookClusterCandidate = { id: "approved", gender: "MEN", title: "reviewed", summary: "human", status: "APPROVED", tags: [], observations: rows.map((observation) => ({ observation })) };
const [publicRow] = publicLookClusters([cluster]);
assert.ok(publicRow);
assert.deepEqual(publicRow.realWear, { observations: 3, instagramAccounts: 2, posts: 2 });
assert.deepEqual(publicRow.curatedLook, { observations: 2, posts: 1 });
assert.deepEqual(publicRow.styleMedia, { observations: 1, posts: 1 });
assert.equal(publicRow.unclassified, 1);
assert.equal(publicRow.observationCount, 7);
assert.equal(publicLookClusters([{ ...cluster, status: "DRAFT" }]).length, 0);
assert.equal(publicLookClusters([{ ...cluster, observations: [rows[0]!, rows[1]!].map((observation) => ({ observation })) }]).length, 0);

const appRoot = resolve(import.meta.dirname, "..");
const migration = readFileSync(resolve(appRoot, "prisma/migrations/20260930120000_add_look_observation_types/migration.sql"), "utf8");
assert.match(migration, /ADD COLUMN "observationType" "LookObservationType";/);
assert.doesNotMatch(migration, /^\s*(?:DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+|INSERT\s+INTO)\b/im);
const service = readFileSync(resolve(appRoot, "src/services/look-service.ts"), "utf8");
assert.match(service, /\$transaction\(\(tx\) => tx\.lookObservation\.createMany/);
const page = readFileSync(resolve(appRoot, "src/app/page.tsx"), "utf8");
assert.doesNotMatch(page, /trendScore|popularityScore|salesRank/);
assert.doesNotMatch(readFileSync(resolve(appRoot, "scripts/seed.ts"), "utf8"), /LookObservation|LookCluster|LookSourceAccount/);
console.log("LOOK ingestion V2 tests passed.");
