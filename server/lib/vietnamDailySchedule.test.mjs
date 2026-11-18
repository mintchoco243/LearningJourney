import test from "node:test";
import assert from "node:assert/strict";
import { hasPassedNineAm, nextNineAmDelay, vietnamDateKey, wasCheckedToday } from "./vietnamDailySchedule.js";

test("daily integration jobs target 09:00 in Vietnam, including a new year", () => {
  assert.equal(vietnamDateKey("2026-11-18T02:00:00Z"), "2026-11-18");
  assert.equal(nextNineAmDelay(new Date("2026-11-18T01:59:00Z")), 60_000);
  assert.equal(nextNineAmDelay(new Date("2026-11-18T02:00:00Z")), 24 * 60 * 60 * 1000);
  assert.equal(nextNineAmDelay(new Date("2026-12-31T03:00:00Z")), 23 * 60 * 60 * 1000);
  assert.equal(hasPassedNineAm(new Date("2026-11-18T01:59:00Z")), false);
  assert.equal(hasPassedNineAm(new Date("2026-11-18T02:00:00Z")), true);
});

test("a daily check is based on Vietnam calendar day, not elapsed hours", () => {
  assert.equal(wasCheckedToday("2026-11-17T02:05:00Z", new Date("2026-11-18T02:00:00Z")), false);
  assert.equal(wasCheckedToday("2026-11-18T01:00:00Z", new Date("2026-11-18T03:00:00Z")), true);
});
