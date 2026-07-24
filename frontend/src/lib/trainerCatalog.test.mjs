import assert from "node:assert/strict";
import {
  TRAINER_TYPE_OPTIONS,
  courseTrainerType,
  normalizeTrainerType,
  trainerTypeLabel,
} from "./trainerCatalog.mjs";

assert.deepEqual(TRAINER_TYPE_OPTIONS.map((option) => option.id), ["internal", "regional", "external"]);
assert.equal(normalizeTrainerType("Internal Garena VN"), "internal");
assert.equal(normalizeTrainerType("regional"), "regional");
assert.equal(normalizeTrainerType("External"), "external");
assert.equal(normalizeTrainerType(""), "internal");
assert.equal(trainerTypeLabel("internal"), "Internal Garena VN");
assert.equal(courseTrainerType({ trainer_type: "regional" }), "regional");

console.log("trainerCatalog tests passed");
