// Run: node server/routes/admin/dataPrep.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseCsv, csvToRows, toJsonArray } from "./dataPrep.js";

// quoted field with embedded comma stays one field
assert.deepEqual(parseCsv('a,"b, c",d\n')[0], ["a", "b, c", "d"]);

// doubled quotes inside a quoted field unescape to one quote
assert.deepEqual(parseCsv('a,"say ""hi""",c\n')[0], ["a", 'say "hi"', "c"]);

// CRLF and bare LF both terminate rows
assert.equal(parseCsv("a,b\r\nc,d\n").length, 2);

// header row maps cells to named columns
const rows = csvToRows('course_id,title\nLC-001,"Comma, in title"\n');
assert.deepEqual(rows, [{ course_id: "LC-001", title: "Comma, in title" }]);

// multi-value sheet cell -> JSON array text (trimmed, empty entries dropped)
assert.equal(toJsonArray("Associate, Senior Associate"), JSON.stringify(["Associate", "Senior Associate"]));
assert.equal(toJsonArray(""), JSON.stringify([]));

const catalogRows = csvToRows(fs.readFileSync("sample-data/data-prep/catalog-full-cases.csv", "utf8"));
assert.equal(catalogRows[0].course_code, "LC-CAT-001");
assert.equal(catalogRows[0].session_date, "2026-07-20");
assert.equal(catalogRows[1].session_date, "2026-07-27");
assert.equal(catalogRows[3].session_date, "2026-08-15");
assert.equal(catalogRows[7].session_date, "2026-09-01");

console.log("dataPrep.test.mjs: all assertions passed");
