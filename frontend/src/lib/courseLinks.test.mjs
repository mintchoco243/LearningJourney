import assert from "node:assert/strict";
import { buildCourseDeepLink } from "./courseLinks.mjs";

assert.equal(
  buildCourseDeepLink("LC-001", "https://sample-deploy.example"),
  "https://sample-deploy.example/library?courseId=LC-001",
);
assert.equal(
  buildCourseDeepLink("LC-001", "https://learningcompass.garena.vn"),
  "https://learningcompass.garena.vn/library?courseId=LC-001",
);
assert.equal(
  buildCourseDeepLink("LC 001/2026", "https://learningcompass.garena.vn"),
  "https://learningcompass.garena.vn/library?courseId=LC+001%2F2026",
);

console.log("courseLinks tests passed");
