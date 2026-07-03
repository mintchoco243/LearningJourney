// Run: node src/lib/courseMap.test.mjs   (from frontend/)
import assert from "node:assert/strict";
import { normalizeFormat, daysUntil, mapSessionToUpcoming, mapSessionToCourse, mapCourseToCard, getCourseCta, pickUpcoming, pickRecommended } from "./courseMap.mjs";

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
  { id: "s1", course_code: "LC-001", title: "Foundations", format: "Workshop", location: "HQ", description: "d", duration_hours: 2, xp_reward: 100, rating: "4.8", session_date: "2026-07-08T00:00:00.000Z", session_time: "10:00:00", status: "open" },
  TODAY
);
assert.equal(up.session_id, "s1");
assert.equal(up.course_id, "s1");
assert.equal(up.course_code, "LC-001");
assert.equal(up._id, "s1");
assert.equal(up.format, "offline");
assert.equal(up.duration_minutes, 120);
assert.equal(up.xp_reward, 100);
assert.equal(up.rating, 4.8);
assert.equal(up.start_date, "2026-07-08");
assert.equal(up.start_time, "10:00");
assert.equal(up.course_status, "upcoming_open");
assert.equal(up.countdown_days, 7);

// full session -> closed CTA
assert.equal(mapSessionToUpcoming({ session_date: "2026-07-08", status: "full" }, TODAY).course_status, "upcoming_closed");
assert.equal(mapSessionToUpcoming({ session_date: "2026-06-08", status: "open", course_status: "ended" }, TODAY).course_status, "ended");
assert.equal(mapSessionToUpcoming({ session_date: "2026-07-08", status: "open", course_status: "ended" }, TODAY).course_status, "upcoming_open");

// time range string keeps both ends
const range = mapSessionToUpcoming({ session_date: "2026-07-08", session_time: "10:00 - 12:00", status: "open" }, TODAY);
assert.equal(range.start_time, "10:00");
assert.equal(range.end_time, "12:00");

// Array.map passes (item, index, array); mapper aliases must not treat index as a Date.
assert.doesNotThrow(() => [
  { id: "s-map", course_id: "LC-MAP", title: "Mapped", format: "Workshop", session_date: "2026-07-08", status: "open" },
].map(mapSessionToCourse));

// course -> card (duration_hours -> minutes)
const card = mapCourseToCard({ id: "row-002", course_code: "LC-002", title: "Data", trainer: "Data Guild", format: "Video", duration_hours: 1.5, xp_reward: 80, skill_tags: ["Data Analysis"], registration_url: null, fit_tag: "best_fit" });
assert.equal(card.course_id, "row-002");
assert.equal(card.course_code, "LC-002");
assert.equal(card._id, "row-002");
assert.equal(card.format, "elearning");
assert.equal(card.duration_minutes, 90);
assert.equal(card.url, "#");
assert.equal(card.course_status, "open");

// course -> card: ended status carries material_url through for the "Xem tài liệu" CTA
const endedCard = mapCourseToCard({ id: "LC-003", title: "Old", status: "ended", material_url: "https://docs.example/lc-003" });
assert.equal(endedCard.course_status, "ended");
assert.equal(endedCard.material_url, "https://docs.example/lc-003");
assert.equal(mapCourseToCard({ id: "LC-004", status: "Ended " }).course_status, "ended");
assert.equal(mapCourseToCard({ id: "LC-004", status: "ended", session_date: "2026-07-15", material_url: "https://docs.example" }, TODAY).course_status, "upcoming_open");

// shared CTA logic
assert.equal(getCourseCta({ course_id: "LC-001", format: "elearning", url: "https://learn.example" }).key, "learn");
assert.equal(getCourseCta({ course_id: "LC-002", type: "scheduled", session_id: "s2", course_status: "upcoming_open" }).key, "register");
assert.equal(getCourseCta({ course_id: "LC-003", type: "scheduled", session_id: "s3", course_status: "upcoming_closed" }).key, "full");
assert.equal(getCourseCta({ course_id: "LC-004", course_status: "ended", material_url: "https://docs.example" }).key, "material");
assert.equal(getCourseCta({ course_id: "LC-004", type: "scheduled", course_status: "ended", start_date: "2026-07-15", material_url: "https://docs.example", session_id: "LC-004" }).key, "register");
assert.equal(getCourseCta({ course_id: "LC-005" }, { completed_courses: ["LC-005"] }).key, "completed");
assert.equal(getCourseCta({ course_id: "LC-005", format: "elearning", url: "https://learn.example" }, { completed_courses: ["LC-005"] }).key, "review");
assert.equal(getCourseCta({ course_id: "LC-006", session_id: "s6" }, { registered_events: ["s6"] }).key, "reserved");
assert.equal(getCourseCta(mapCourseToCard({ id: "LC-007", type: "interest", status: "open" }, TODAY)).key, "interest");
assert.equal(getCourseCta(mapCourseToCard({ id: "LC-008", type: "interest", status: "full" }, TODAY)).key, "interest_full");
assert.equal(getCourseCta(mapCourseToCard({ id: "LC-009", type: "external", status: "ended", material_url: "https://docs.example" }, TODAY)).key, "material");
assert.equal(getCourseCta(mapCourseToCard({ id: "LC-009B", type: "external", status: "ended" }, TODAY)).key, "complete");
assert.equal(getCourseCta(mapCourseToCard({ id: "LC-009C", type: "elearning", format: "video", status: "ended", registration_url: "https://learn.example", material_url: "https://docs.example" }, TODAY)).key, "learn");
assert.equal(getCourseCta(mapCourseToCard({ id: "LC-010", type: "material_only", material_url: "https://docs.example" }, TODAY)).key, "material");

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

// Imported DB rows: id is the only action identity; course_code is display/grouping only.
const importedSession = mapSessionToUpcoming({
  id: "uuid-session-1",
  course_code: "LC-04",
  title: "ChatGPT",
  type: "scheduled",
  format: "online",
  session_date: "2026-07-15",
  status: "ended",
}, TODAY);
assert.equal(importedSession.course_id, "uuid-session-1");
assert.equal(importedSession.course_code, "LC-04");
assert.equal(importedSession._id, "uuid-session-1");
assert.equal(importedSession.session_id, "uuid-session-1");
assert.equal(importedSession.course_status, "upcoming_open");

const importedCourse = mapCourseToCard({
  id: "uuid-interest-1",
  course_code: "LC-04",
  title: "ChatGPT",
  type: "interest",
  format: "online",
  session_date: null,
  status: "open",
}, TODAY);
assert.equal(importedCourse.course_id, "uuid-interest-1");
assert.equal(importedCourse.course_code, "LC-04");
assert.equal(importedCourse._id, "uuid-interest-1");
assert.equal(importedCourse.session_id, "uuid-interest-1");

const jsonBackedCourse = mapCourseToCard({
  id: "uuid-master-json",
  course_code: "LC-JSON",
  skill_tags: '["data","ai"]',
  role_targets: '["General"]',
  rank_targets: "Associate, Senior Associate",
});
assert.deepEqual(jsonBackedCourse.skill_tags, ["data", "ai"]);
assert.deepEqual(jsonBackedCourse.class_ids, ["General"]);
assert.deepEqual(jsonBackedCourse.rank_ids, ["Associate", "Senior Associate"]);

const deduped = pickRecommended([
  { id: "uuid-session-2", course_code: "LC-20", title: "First row", session_date: "2026-07-20", fit_tag: "best_fit" },
  { id: "uuid-session-3", course_code: "LC-20", title: "Second row", session_date: "2026-07-27", fit_tag: "best_fit" },
]);
assert.equal(deduped.length, 2);
assert.deepEqual(deduped.map((c) => c.course_id), ["uuid-session-2", "uuid-session-3"]);

console.log("courseMap.test.mjs: all assertions passed");
