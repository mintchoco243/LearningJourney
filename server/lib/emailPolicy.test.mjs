import assert from "node:assert/strict";
import { isAllowedGarenaEmail } from "./emailPolicy.js";

assert.equal(isAllowedGarenaEmail("employee@garena.vn"), true);
assert.equal(isAllowedGarenaEmail("Employee@GARENA.VN"), true);
assert.equal(isAllowedGarenaEmail(" employee@garena.vn "), true);
assert.equal(isAllowedGarenaEmail("employee_ctv@garena.vn"), false);
assert.equal(isAllowedGarenaEmail("employee_ext@garena.vn"), false);
assert.equal(isAllowedGarenaEmail("employee_ctv2@garena.vn"), true);
assert.equal(isAllowedGarenaEmail("employee@gmail.com"), false);

console.log("emailPolicy tests passed");
