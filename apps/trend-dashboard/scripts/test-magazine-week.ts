import assert from "node:assert/strict";
import { currentMagazineWeek } from "../src/lib/magazine-week";

const tuesdayKst = currentMagazineWeek(new Date("2026-09-22T03:00:00.000Z"));
assert.equal(tuesdayKst.start.toISOString(), "2026-09-20T15:00:00.000Z");
assert.equal(tuesdayKst.end.toISOString(), "2026-09-27T15:00:00.000Z");

const sundayLastMinuteKst = currentMagazineWeek(new Date("2026-09-27T14:59:59.999Z"));
assert.equal(sundayLastMinuteKst.start.getTime(), tuesdayKst.start.getTime());

const mondayMidnightKst = currentMagazineWeek(new Date("2026-09-27T15:00:00.000Z"));
assert.equal(mondayMidnightKst.start.toISOString(), "2026-09-27T15:00:00.000Z");
assert.equal(mondayMidnightKst.end.toISOString(), "2026-10-04T15:00:00.000Z");

console.log("Magazine week tests passed (Asia/Seoul Monday-Sunday boundaries).");
