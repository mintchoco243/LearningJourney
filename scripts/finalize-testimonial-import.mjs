import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { csvToRows } from "../server/routes/admin/dataPrep.js";
import { mysqlPool, mysqlQuery } from "../server/db-mysql.js";

dotenv.config();
const sourcePath = "G:/My Drive/MN04. L&D & Other HR Tasks/2026/Learning Journey & Calendar/testimonials-imported-from-excel.csv";
const updatePath = "C:/Users/minhngoc.pham/Downloads/update.csv";
const priorImportPath = path.resolve("outputs/testimonials-import-ready.csv");
const finalPath = path.resolve("outputs/testimonials-import-final.csv");
const anonymousUserId = "990f3b10-72e8-11f1-b28a-d094661df05e";
const explicitCourseIds = {
  "khóa là analyzing data with powerbi": "d122ef74-da52-40f5-8ac9-d1d1fc84632b",
  "tên khóa chính xác là: khóa học ba được thiết kế dành riêng cho garena vn": "77faf8c0-16df-4c18-a1e0-36b569dc0576",
};
function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function writeCsv(headers, rows) { return `\uFEFF${[headers.join(","), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(","))].join("\r\n")}`; }
const [sourceRaw, updateRaw, priorRaw] = await Promise.all([
  fs.readFile(sourcePath, "utf8"), fs.readFile(updatePath, "utf8"), fs.readFile(priorImportPath, "utf8"),
]);
const sourceById = new Map(csvToRows(sourceRaw).map((row) => [row.id, row]));
const rows = csvToRows(updateRaw);
const prior = csvToRows(priorRaw);
const users = (await mysqlQuery("SELECT id, email, full_name FROM users")).rows;
const userByName = new Map(users.map((user) => [user.full_name.trim().toLowerCase(), user]));
const additions = [];
for (const row of rows) {
  const decision = String(row.review_decision || "").trim();
  if (/^bỏ dòng này$/i.test(decision)) continue;
  const source = sourceById.get(row.source_testimonial_id);
  if (!source) throw new Error(`Missing source row ${row.source_testimonial_id}`);
  const courseId = explicitCourseIds[decision.split("\r\n")[0].trim().toLowerCase()] || row.resolved_course_id;
  let userId = "";
  if (/user:\s*user ẩn danh/i.test(decision)) userId = anonymousUserId;
  else if (/user:\s*nguyễn viết hợp/i.test(decision)) userId = userByName.get("nguyễn viết hợp")?.id || "";
  else if (/đúng user rồi/i.test(decision)) userId = row.user_candidate_id;
  if (!courseId || !userId) throw new Error(`Unresolved row ${row.row_number}`);
  additions.push({ id: source.id, course_id: courseId, user_id: userId, rating: source.rating, content: source.content, is_featured: source.is_featured, created_at: source.created_at, aspect_ratings: source.aspect_ratings, applied_learning: source.applied_learning, improvement_feedback: source.improvement_feedback });
}
const finalRows = [...prior, ...additions];
const courseIds = new Set((await mysqlQuery("SELECT id FROM courses")).rows.map((row) => row.id));
const userIds = new Set(users.map((row) => row.id));
const existingIds = new Set((await mysqlQuery("SELECT id FROM testimonials")).rows.map((row) => row.id));
const duplicateIds = finalRows.filter((row, i) => finalRows.findIndex((candidate) => candidate.id === row.id) !== i);
const invalid = finalRows.filter((row) => !courseIds.has(row.course_id) || !userIds.has(row.user_id) || existingIds.has(row.id));
if (duplicateIds.length || invalid.length) throw new Error(`Validation failed: duplicate=${duplicateIds.length}, invalid=${invalid.length}`);
await fs.writeFile(finalPath, writeCsv(Object.keys(finalRows[0]), finalRows), "utf8");
console.log(JSON.stringify({ finalPath, rows: finalRows.length, priorRows: prior.length, addedRows: additions.length, droppedFromUpdate: rows.length - additions.length }, null, 2));
await mysqlPool().end();
