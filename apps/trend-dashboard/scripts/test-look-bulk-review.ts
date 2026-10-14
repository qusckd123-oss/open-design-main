import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyBulkLookReview, parseBulkReviewRequest, type BulkReviewRequest } from "../src/lib/look-bulk-review";
import { publicLookClusters, type LookClusterCandidate, type LookObservationCandidate } from "../src/lib/look-observation";

type State = { id: string; reviewStatus: "PENDING" | "APPROVED" | "REJECTED"; genderCandidate: "MEN" | "WOMEN" | "UNKNOWN"; reviewedBy: string | null; reviewedAt: Date | null };
const initial: State[] = [
  { id: "a", reviewStatus: "PENDING", genderCandidate: "UNKNOWN", reviewedBy: null, reviewedAt: null },
  { id: "b", reviewStatus: "PENDING", genderCandidate: "UNKNOWN", reviewedBy: null, reviewedAt: null },
  { id: "c", reviewStatus: "PENDING", genderCandidate: "UNKNOWN", reviewedBy: null, reviewedAt: null },
  { id: "approved", reviewStatus: "APPROVED", genderCandidate: "MEN", reviewedBy: "기존 검토자", reviewedAt: new Date("2026-09-01") },
  { id: "rejected", reviewStatus: "REJECTED", genderCandidate: "UNKNOWN", reviewedBy: "기존 검토자", reviewedAt: new Date("2026-09-01") }
];

async function transaction(current: State[], request: BulkReviewRequest, concurrentId?: string): Promise<State[]> {
  const working = current.map((row) => ({ ...row }));
  await applyBulkLookReview({ lookObservation: {
    findMany: async ({ where }) => working.filter((row) => where.id.in.includes(row.id)).map(({ id, reviewStatus }) => ({ id, reviewStatus })),
    updateMany: async ({ where, data }) => {
      if (where.id === concurrentId) working.find((row) => row.id === concurrentId)!.reviewStatus = "REJECTED";
      const row = working.find((value) => value.id === where.id && value.reviewStatus === where.reviewStatus);
      if (!row) return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    }
  } }, request, new Date("2026-10-02T00:00:00Z"));
  return working; // Commits only after every update succeeds; a throw discards this copy.
}

const approve = parseBulkReviewRequest({ status: "APPROVED", reviewerName: "  한 명의 검토자  ", reviewRows: JSON.stringify([{ id: "a", gender: "MEN" }, { id: "b", gender: "WOMEN" }]) });
const approved = await transaction(initial, approve);
assert.deepEqual(approved.slice(0, 2).map((row) => [row.reviewStatus, row.genderCandidate, row.reviewedBy, row.reviewedAt?.toISOString()]), [
  ["APPROVED", "MEN", "한 명의 검토자", "2026-10-02T00:00:00.000Z"],
  ["APPROVED", "WOMEN", "한 명의 검토자", "2026-10-02T00:00:00.000Z"]
]);
assert.deepEqual(approved.slice(2), initial.slice(2), "unselected rows stay unchanged");
assert.throws(() => parseBulkReviewRequest({ status: "APPROVED", reviewerName: "검토자", reviewRows: JSON.stringify([{ id: "a", gender: "UNKNOWN" }]) }), /MEN 또는 WOMEN/);
assert.throws(() => parseBulkReviewRequest({ status: "APPROVED", reviewerName: "검토자", reviewRows: JSON.stringify([{ id: "a", gender: "MEN" }, { id: "a", gender: "MEN" }]) }), /중복/);
assert.throws(() => parseBulkReviewRequest({ status: "REJECTED", reviewerName: " ", reviewRows: JSON.stringify([{ id: "a", gender: "UNKNOWN" }]) }), /검토자 이름/);

const reject = parseBulkReviewRequest({ status: "REJECTED", reviewerName: "반려 검토자", reviewRows: JSON.stringify([{ id: "c", gender: "UNKNOWN" }]) });
const rejected = await transaction(initial, reject);
assert.equal(rejected[2]?.reviewStatus, "REJECTED");
assert.equal(rejected[2]?.genderCandidate, "UNKNOWN", "rejection does not require or change gender");
assert.deepEqual(rejected.filter((row) => row.id !== "c"), initial.filter((row) => row.id !== "c"));

for (const invalid of ["missing", "approved", "rejected"]) {
  const request = parseBulkReviewRequest({ status: "APPROVED", reviewerName: "검토자", reviewRows: JSON.stringify([{ id: "a", gender: "MEN" }, { id: invalid, gender: "WOMEN" }]) });
  await assert.rejects(transaction(initial, request), /없거나 이미 검토된/);
  assert.equal(initial[0]?.reviewStatus, "PENDING", "failed transaction cannot mutate original rows");
}
await assert.rejects(transaction(initial, approve, "b"), /상태가 변경/);
assert.equal(initial[0]?.reviewStatus, "PENDING", "concurrent failure rolls back earlier updates");

function candidate(row: State, account: string): LookObservationCandidate {
  return { id: row.id, sourceAccountId: account, platform: "INSTAGRAM", postIdentity: row.id, observationType: "REAL_WEAR", imageUrl: `https://example.com/${row.id}.jpg`, postUrl: `https://instagram.com/p/${row.id}/`, observedAt: new Date("2026-10-02"), reviewStatus: row.reviewStatus, genderCandidate: row.genderCandidate };
}
const draft: LookClusterCandidate = { id: "draft", gender: "MEN", status: "DRAFT", title: "검토 중", summary: "", tags: [], observations: [candidate(approved[0]!, "one"), candidate(initial[3]!, "two")].map((observation) => ({ observation })) };
assert.equal(publicLookClusters([draft]).length, 0, "standalone approved observations do not publish a draft cluster");
assert.equal(publicLookClusters([{ ...draft, status: "APPROVED" }]).length, 1, "an approved cluster with distinct approved sources can publish");
assert.equal(publicLookClusters([{ ...draft, status: "APPROVED", observations: [candidate(initial[0]!, "one"), candidate(initial[3]!, "two")].map((observation) => ({ observation })) }]).length, 0, "pending observations remain hidden");
assert.equal(publicLookClusters([{ ...draft, status: "APPROVED", observations: [candidate(rejected[2]!, "one"), candidate(initial[3]!, "two")].map((observation) => ({ observation })) }]).length, 0, "rejected observations remain hidden");

const appRoot = resolve(import.meta.dirname, "..");
const service = readFileSync(resolve(appRoot, "src/services/look-service.ts"), "utf8");
assert.match(service, /prisma\.\$transaction\([\s\S]*applyBulkLookReview\(tx, request\)/);
assert.match(service, /TransactionIsolationLevel\.Serializable/);
assert.doesNotMatch(service, /MarketProduct|WatchlistSnapshot/);
const page = readFileSync(resolve(appRoot, "src/app/page.tsx"), "utf8");
assert.match(page, /getPublicLooks/);
assert.doesNotMatch(page, /lookObservation\.findMany/);
console.log("LOOK bulk review tests passed.");
