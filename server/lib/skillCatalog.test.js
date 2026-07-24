import assert from "node:assert/strict";
import test from "node:test";
import {
  SKILL_OPTIONS,
  canonicalSkill,
  canonicalizeFocusSkills,
} from "./skillCatalog.js";
import { SKILL_OPTIONS as FRONTEND_SKILL_OPTIONS } from "../../frontend/src/lib/skillCatalog.js";

test("canonical skill catalog contains the approved eleven skills", () => {
  assert.deepEqual(SKILL_OPTIONS, [
    "Product",
    "Marketing",
    "Planning & Strategy",
    "Problem Solving and Decision Making",
    "Task Management",
    "Communication and Collaboration",
    "Analysis",
    "Creativity",
    "Game Understanding",
    "Team and Talent Management",
    "AI Adoption",
  ]);
  assert.deepEqual(SKILL_OPTIONS, FRONTEND_SKILL_OPTIONS);
});

test("legacy onboarding ids and database casing map to canonical skills", () => {
  assert.equal(canonicalSkill("analytics"), "Analysis");
  assert.equal(canonicalSkill("Analytics"), "Analysis");
  assert.equal(canonicalSkill("strategy"), "Planning & Strategy");
  assert.equal(canonicalSkill("ops_excellence"), "Task Management");
  assert.equal(canonicalSkill("ai"), "AI Adoption");
});

test("focus skills are canonicalized and deduplicated", () => {
  assert.deepEqual(
    canonicalizeFocusSkills(["analytics", "Analysis", "strategy"]),
    ["Analysis", "Planning & Strategy"],
  );
  assert.deepEqual(canonicalizeFocusSkills(["not-a-skill"]), []);
});
