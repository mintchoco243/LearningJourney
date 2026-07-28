import test from "node:test";
import assert from "node:assert/strict";
import { selectHRRecommendedCourses } from "./recommendations.js";

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

test("returns at most three HR recommendations with different skills", () => {
  const courses = [
    { ...base, id: "people-1", skill_tags: ["People"], rank_targets: ["Senior Associate"], role_targets: ["HRBP"] },
    { ...base, id: "people-2", skill_tags: ["People"], rank_targets: ["Senior Associate"], role_targets: ["HRBP"] },
    { ...base, id: "language", rating: 4, skill_tags: ["Language"], rank_targets: ["All"], role_targets: ["All"] },
    { ...base, id: "data", rating: 3, skill_tags: ["Analytics"], rank_targets: ["All"], role_targets: ["All"] },
  ];

  const result = selectHRRecommendedCourses(courses, "Senior Associate", ["HR", "HRBP"]);

  assert.deepEqual(result.map((course) => course.id), ["people-1", "language", "data"]);
});
