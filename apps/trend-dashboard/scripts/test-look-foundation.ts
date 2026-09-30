import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { imageIndexOf, optionalPublishedDate, postIdentity, publicLookClusters, type LookClusterCandidate, type LookObservationCandidate } from "../src/lib/look-observation";

const post = "https://www.instagram.com/p/ABC123/?igsh=share";
assert.equal(postIdentity(post, "INSTAGRAM"), postIdentity("https://instagram.com/p/ABC123/", "INSTAGRAM"));
assert.notEqual(`${postIdentity(post, "INSTAGRAM")}:0`, `${postIdentity(post, "INSTAGRAM")}:1`, "one post supports multiple images");
assert.equal(`${postIdentity(post, "INSTAGRAM")}:0`, `${postIdentity("https://instagram.com/p/ABC123/", "INSTAGRAM")}:0`, "same permalink and image index collide");
assert.equal(imageIndexOf("0"), 0);
assert.throws(() => imageIndexOf("-1"));
assert.throws(() => postIdentity("https://instagram.com/accounts/login/", "INSTAGRAM"));
assert.equal(optionalPublishedDate(""), null);
assert.equal(optionalPublishedDate("2026-09-29")?.toISOString(), "2026-09-28T15:00:00.000Z");
assert.throws(() => optionalPublishedDate("2026-02-31"));

function observation(id: string, account: string, status: LookObservationCandidate["reviewStatus"], gender: LookObservationCandidate["genderCandidate"], day: number): LookObservationCandidate {
  return { id, sourceAccountId: account, platform: "INSTAGRAM", postIdentity: id, observationType: "REAL_WEAR", imageUrl: `https://example.com/${id}.jpg`, postUrl: `https://example.com/${id}`, observedAt: new Date(`2026-09-${String(day).padStart(2, "0")}T00:00:00Z`), reviewStatus: status, genderCandidate: gender };
}
function cluster(id: string, status: LookClusterCandidate["status"], gender: LookClusterCandidate["gender"], rows: LookObservationCandidate[]): LookClusterCandidate {
  return { id, status, gender, title: id, summary: "사람 검토", tags: [], observations: rows.map((row) => ({ observation: row })) };
}
const candidates = [
  cluster("draft", "DRAFT", "MEN", [observation("a", "one", "APPROVED", "MEN", 29), observation("b", "two", "APPROVED", "MEN", 28)]),
  cluster("pending", "APPROVED", "MEN", [observation("c", "one", "PENDING", "MEN", 29), observation("d", "two", "APPROVED", "MEN", 27)]),
  cluster("rejected", "APPROVED", "MEN", [observation("e", "one", "REJECTED", "MEN", 29), observation("f", "two", "APPROVED", "MEN", 27)]),
  cluster("single-account", "APPROVED", "MEN", [observation("g", "one", "APPROVED", "MEN", 29), observation("h", "one", "APPROVED", "MEN", 28)]),
  cluster("men", "APPROVED", "MEN", [observation("m1", "one", "APPROVED", "MEN", 28), observation("m2", "one", "APPROVED", "MEN", 29), observation("m3", "two", "APPROVED", "MEN", 27), observation("wrong-gender", "three", "APPROVED", "WOMEN", 30)]),
  cluster("women", "APPROVED", "WOMEN", [observation("w1", "three", "APPROVED", "WOMEN", 26), observation("w2", "four", "APPROVED", "WOMEN", 25)])
];
const publicRows = publicLookClusters(candidates);
assert.deepEqual(publicRows.map((row) => row.id), ["men", "women"]);
assert.equal(publicRows[0]?.accountCount, 2);
assert.equal(publicRows[0]?.observationCount, 3);
assert.equal(publicRows[0]?.latestObservedAt.toISOString(), "2026-09-29T00:00:00.000Z");
assert.deepEqual(publicRows.map((row) => row.gender), ["MEN", "WOMEN"]);
assert.equal(publicLookClusters([cluster("orphan", "APPROVED", "MEN", [])]).length, 0);

const appRoot = resolve(import.meta.dirname, "..");
const schema = readFileSync(resolve(appRoot, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(resolve(appRoot, "prisma/migrations/20260929120000_add_look_observation_foundation/migration.sql"), "utf8");
assert.match(schema, /@@unique\(\[platform, postIdentity, imageIndex\]\)/);
assert.match(migration, /CREATE UNIQUE INDEX "LookObservation_platform_postIdentity_imageIndex_key"/);
assert.match(migration, /ReviewedLookTag_one_parent/);
assert.doesNotMatch(migration, /^\s*(?:DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+|INSERT\s+INTO)\b/im);
assert.match(readFileSync(resolve(appRoot, "src/app/page.tsx"), "utf8"), /getPublicLooks/);
assert.doesNotMatch(readFileSync(resolve(appRoot, "src/app/page.tsx"), "utf8"), /EditorialPost|MarketProduct|generated filler/i);
assert.doesNotMatch(readFileSync(resolve(appRoot, "scripts/seed.ts"), "utf8"), /LookObservation|LookCluster|LookSourceAccount/);
console.log("LOOK foundation tests passed.");
