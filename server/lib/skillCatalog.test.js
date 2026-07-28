import assert from "node:assert/strict";
import test from "node:test";
import {
  SKILL_OPTIONS,
  canonicalSkill,
  canonicalizeFocusSkills,
} from "./skillCatalog.js";
import { SKILL_OPTIONS as FRONTEND_SKILL_OPTIONS } from "../../frontend/src/lib/skillCatalog.js";

test("canonical skill catalog contains the approved thirteen skills", () => {
  assert.deepEqual(SKILL_OPTIONS, [
    "IT / Dev",
    "Game Dev & Game Design",
    "People",
    "Product",
    "Marketing & Esports",
    "Creative",
    "Data / BA",
    "Management",
    "Communication",
    "Problem Solving",
    "Language",
    "AI Adoption",
    "Other",
  ]);
  assert.deepEqual(SKILL_OPTIONS, FRONTEND_SKILL_OPTIONS);
});

test("legacy onboarding ids and database casing map to canonical skills", () => {
  assert.equal(canonicalSkill("analytics"), "Data / BA");
  assert.equal(canonicalSkill("Analytics"), "Data / BA");
  assert.equal(canonicalSkill("strategy"), "Product");
  assert.equal(canonicalSkill("ops_excellence"), "Management");
  assert.equal(canonicalSkill("ai"), "AI Adoption");
});

test("focus skills are canonicalized and deduplicated", () => {
  assert.deepEqual(
    canonicalizeFocusSkills(["analytics", "Analysis", "strategy"]),
    ["Data / BA", "Product"],
  );
  assert.deepEqual(canonicalizeFocusSkills(["not-a-skill"]), []);
});
