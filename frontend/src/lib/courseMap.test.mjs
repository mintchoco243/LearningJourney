// Run: node src/lib/courseMap.test.mjs   (from frontend/)
import assert from "node:assert/strict";
import { normalizeFormat, daysUntil, mapSessionToUpcoming, mapSessionToEvent, mapCourseToCard, pickUpcoming, pickRecommended } from "./courseMap.mjs";

const TODAY = new Date(2026, 6, 1); // 2026-07-01 (local)

// format collapses to the 3 buckets the cards style
assert.equal(normalizeFormat("Workshop"), "offline");
assert.equal(normalizeFormat("Coaching"), "offline");
assert.equal(normalizeFormat("Video"), "elearning");
assert.equal(normalizeFormat("Online"), "online");
assert.equal(normalizeFormat(undefined), "online");

// countdown
assert.equal(daysUntil("2026-07-08", TODAY), 7);
assert.equal(daysUntil("2026-07-01", TODAY), 0);
assert.equal(daysUntil("2026-06-30", TODAY), -1);

// session -> upcoming item (pg-style ISO date + "HH:MM:SS")
const up = mapSessionToUpcoming(
  { course_id: "LC-001", title: "Foundations", format: "Workshop", location: "HQ", description: "d", session_date: "2026-07-08T00:00:00.000Z", session_time: "10:00:00", status: "open" },
  TODAY
);
assert.equal(up.course_id, "LC-001");
assert.equal(up.format, "offline");
assert.equal(up.start_date, "2026-07-08");
assert.equal(up.start_time, "10:00");
assert.equal(up.course_status, "upcoming_open");
assert.equal(up.countdown_days, 7);

// full session -> closed CTA
assert.equal(mapSessionToUpcoming({ session_date: "2026-07-08", status: "full" }, TODAY).course_status, "upcoming_closed");

// time range string keeps both ends
const range = mapSessionToUpcoming({ session_date: "2026-07-08", session_time: "10:00 - 12:00", status: "open" }, TODAY);
assert.equal(range.start_time, "10:00");
assert.equal(range.end_time, "12:00");

// session -> calendar event
const ev = mapSessionToEvent({ id: "s1", title: "Onboarding", type: "workshop", skill_tags: ["foundations"], session_date: "2026-07-08T00:00:00.000Z", session_time: "09:00:00", location: "HQ", trainer: "L&D Team", registration_url: null });
assert.equal(ev.event_id, "s1");
assert.equal(ev.start_date, "2026-07-08");
assert.equal(ev.time, "09:00");
assert.equal(ev.host, "L&D Team");
assert.equal(ev.url, "#");

// course -> card (duration_hours -> minutes)
const card = mapCourseToCard({ id: "LC-002", title: "Data", trainer: "Data Guild", format: "Video", duration_hours: 1.5, xp_reward: 80, skill_tags: ["Data Analysis"], registration_url: null, fit_tag: "best_fit" });
assert.equal(card.course_id, "LC-002");
assert.equal(card.format, "elearning");
assert.equal(card.duration_minutes, 90);
assert.equal(card.url, "#");

// pickUpcoming: drops past + cancelled, soonest first, caps at 5
const upcoming = pickUpcoming([
  { course_id: "A", session_date: "2026-06-01", session_time: "09:00", status: "open" }, // past -> drop
  { course_id: "B", session_date: "2026-07-20", session_time: "09:00", status: "open" },
  { course_id: "C", session_date: "2026-07-05", session_time: "09:00", status: "open" },
  { course_id: "D", session_date: "2026-07-10", session_time: "09:00", status: "cancelled" }, // drop
], TODAY);
assert.deepEqual(upcoming.map((c) => c.course_id), ["C", "B"]);

// pickRecommended: best_fit first, cap 6
const rec = pickRecommended([
  { id: "x", fit_tag: null }, { id: "y", fit_tag: "best_fit" }, { id: "z", fit_tag: "for_your_level" },
]);
assert.deepEqual(rec.map((c) => c.course_id), ["y", "z", "x"]);

console.log("courseMap.test.mjs: all assertions passed");
