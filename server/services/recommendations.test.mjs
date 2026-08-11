import test from "node:test";
import assert from "node:assert/strict";
import { buildRecommendationsForUser, selectHRRecommendedCourses } from "./recommendations.js";

const base = {
  is_hr_recommended: true,
  is_active: true,
  status: "open",
  rating: 5,
  session_date: null,
};

test("prioritizes exact rank and role over All targets", () => {
  const courses = [
    { ...base, id: "all", skill_tags: ["Language"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "exact", skill_tags: ["People"], rank_targets: ["Senior Associate"], role_targets: ["HRBP"] },
  ];

  const result = selectHRRecommendedCourses(courses, "Senior Associate", ["HR", "HRBP"]);

  assert.deepEqual(result.map((course) => course.id), ["exact", "all"]);
});

test("prefers different skills before backfilling HR recommendations", () => {
  const courses = [
    { ...base, id: "people-1", skill_tags: ["People"], rank_targets: ["Senior Associate"], role_targets: ["HRBP"] },
    { ...base, id: "people-2", skill_tags: ["People"], rank_targets: ["Senior Associate"], role_targets: ["HRBP"] },
    { ...base, id: "language", rating: 4, skill_tags: ["Language"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "data", rating: 3, skill_tags: ["Analytics"], rank_targets: ["All"], role_targets: ["All"] },
  ];

  const result = selectHRRecommendedCourses(courses, "Senior Associate", ["HR", "HRBP"]);

  assert.deepEqual(result.map((course) => course.id), ["people-1", "data", "people-2"]);
});

test("does not cross-match ranks that only share part of their names", () => {
  const courses = [
    { ...base, id: "senior-manager", skill_tags: ["Management"], rank_targets: ["Senior Manager"], role_targets: ["All"] },
    { ...base, id: "assistant-manager", skill_tags: ["People"], rank_targets: ["Assistant Manager"], role_targets: ["All"] },
    { ...base, id: "associate", skill_tags: ["Data / BA"], rank_targets: ["Associate"], role_targets: ["All"] },
    { ...base, id: "exact", skill_tags: ["Communication"], rank_targets: ["Senior Associate"], role_targets: ["All"] },
    { ...base, id: "all", skill_tags: ["Language"], rank_targets: ["All"], role_targets: ["All"] },
  ];

  const result = selectHRRecommendedCourses(courses, "Senior Associate", ["HR", "HRBP"]);

  assert.deepEqual(result.map((course) => course.id), ["exact", "all"]);
});

test("matches canonical rank ids to their full rank labels", () => {
  const courses = [
    { ...base, id: "rank-id", skill_tags: ["People"], rank_targets: ["rank_02"], role_targets: ["All"] },
  ];

  const result = selectHRRecommendedCourses(courses, "Senior Associate", ["HR"]);

  assert.deepEqual(result.map((course) => course.id), ["rank-id"]);
});

test("prioritizes exact rank over All even when All has a higher rating", () => {
  const courses = [
    { ...base, id: "all-high-rating", rating: 5, skill_tags: ["Data / BA"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "exact-low-rating", is_hr_recommended: false, rating: 1, skill_tags: ["Data / BA"], rank_targets: ["Senior Associate"], role_targets: ["All"] },
  ];
  const user = { rank: "Senior Associate", role: "HR", team: "HRBP", focus_skills: ["Data / BA"] };

  const result = buildRecommendationsForUser(courses, user);

  assert.equal(result.quiz_skill_courses[0].id, "exact-low-rating");
  assert.equal(result.courses[0].id, "exact-low-rating");
});

test("deprioritizes Language and Other while keeping mixed-skill courses eligible", () => {
  const course = (id, skill_tags, rating) => ({
    ...base,
    id,
    rating,
    is_hr_recommended: false,
    skill_tags,
    rank_targets: ["Senior Associate"],
    role_targets: ["HRBP"],
  });
  const user = { rank: "Senior Associate", role: "HR", team: "HRBP", focus_skills: [] };
  const result = buildRecommendationsForUser([
    course("language", ["Language"], 5),
    course("other", ["Other"], 5),
    course("mixed", ["Data / BA", "Language"], 3),
    course("data", ["Data / BA"], 1),
  ], user);

  assert.deepEqual(result.fallback_courses.map((item) => item.id), ["mixed", "data", "language", "other"]);
});

test("backfills repeated skills instead of leaving valid HR slots empty", () => {
  const courses = [
    { ...base, id: "management-1", rating: 5, skill_tags: ["Management"], rank_targets: ["Senior Associate"], role_targets: ["All"] },
    { ...base, id: "management-2", rating: 4, skill_tags: ["Management"], rank_targets: ["Senior Associate"], role_targets: ["All"] },
    { ...base, id: "management-3", rating: 3, skill_tags: ["Management"], rank_targets: ["Senior Associate"], role_targets: ["All"] },
  ];

  const result = selectHRRecommendedCourses(courses, "Senior Associate", ["HR"]);

  assert.deepEqual(result.map((course) => course.id), ["management-1", "management-2", "management-3"]);
});

test("fills up to six recommendations with valid catalog fallbacks", () => {
  const course = (id, overrides = {}) => ({
    ...base,
    id,
    is_hr_recommended: false,
    skill_tags: [id],
    rank_targets: ["Senior Associate"],
    role_targets: ["HRBP"],
    ...overrides,
  });
  const courses = [
    course("people", { skill_tags: ["People"] }),
    course("data", { skill_tags: ["Data / BA"] }),
    course("ai", { skill_tags: ["AI Adoption"] }),
    course("communication", { skill_tags: ["Communication"] }),
    course("language", { skill_tags: ["Language"] }),
    course("management", { skill_tags: ["Management"] }),
    course("seventh", { skill_tags: ["Other"] }),
    course("wrong-rank", { rank_targets: ["Senior Manager"] }),
  ];
  const user = { rank: "Senior Associate", role: "HR", team: "HRBP", focus_skills: ["People", "Data / BA", "AI Adoption"] };

  const result = buildRecommendationsForUser(courses, user);

  assert.equal(result.courses.length, 6);
  assert.deepEqual(result.quiz_skill_courses.map((item) => item.id), ["people", "data", "ai"]);
  assert.deepEqual(result.fallback_courses.map((item) => item.id), ["communication", "management", "language"]);
  assert.ok(!result.courses.some((item) => item.id === "wrong-rank"));
});

test("never backfills completed, reserved, ended, cancelled, or duplicate courses", () => {
  const courses = [
    { ...base, id: "valid", is_hr_recommended: false, skill_tags: ["Language"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "completed", is_hr_recommended: false, skill_tags: ["People"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "reserved", is_hr_recommended: false, skill_tags: ["Data / BA"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "ended", is_hr_recommended: false, status: "ended", skill_tags: ["AI Adoption"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "cancelled", is_hr_recommended: false, status: "cancelled", skill_tags: ["Management"], rank_targets: ["All"], role_targets: ["All"] },
  ];
  const user = { rank: "Senior Associate", role: "HR", team: "HRBP", focus_skills: [] };

  const result = buildRecommendationsForUser(courses, user, new Set(["completed"]), new Set(["reserved"]));

  assert.deepEqual(result.courses.map((item) => item.id), ["valid"]);
});
