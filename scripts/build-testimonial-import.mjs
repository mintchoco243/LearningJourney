import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

import { mysqlPool, mysqlQuery } from "../server/db-mysql.js";
import { csvToRows } from "../server/routes/admin/dataPrep.js";

dotenv.config();

const sourcePath = "G:/My Drive/MN04. L&D & Other HR Tasks/2026/Learning Journey & Calendar/testimonials-imported-from-excel.csv";
const reviewPath = "C:/Users/minhngoc.pham/Downloads/testimonials-mapping-review - testimonials-mapping-review.csv";
const outputDir = path.resolve("outputs");
const importPath = path.join(outputDir, "testimonials-import-ready.csv");
const pendingPath = path.join(outputDir, "testimonials-pending-user-review.csv");

const explicitCourseIds = {
  "khóa là analyzing data with powerbi": "d122ef74-da52-40f5-8ac9-d1d1fc84632b",
  "khóa là tiếng anh giao tiếp công sở với trainer là wall street english": "cbc13de0-1d49-43e2-949c-357fe5984cf1",
  "ok chuẩn tên khóa, nhưng khớp đúng với trainer là tiếng trung thầy hưng": "2fe224d4-b549-499e-a4b0-77165013051c",
  "tên khóa chính xác là: khóa học ba được thiết kế dành riêng cho garena vn": "77faf8c0-16df-4c18-a1e0-36b569dc0576",
};

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function writeCsv(headers, rows) {
  return `\uFEFF${[headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\r\n")}`;
}

const [sourceRaw, reviewRaw] = await Promise.all([
  fs.readFile(sourcePath, "utf8"),
  fs.readFile(reviewPath, "utf8"),
]);
const sourceById = new Map(csvToRows(sourceRaw).map((row) => [row.id, row]));
const reviewRows = csvToRows(reviewRaw);

const ready = [];
const pending = [];
for (const review of reviewRows) {
  const source = sourceById.get(review.source_testimonial_id);
  if (!source) throw new Error(`Source testimonial not found: ${review.source_testimonial_id}`);
  const decision = String(review.review_decision || "").trim();
  if (/^bỏ dòng này$/i.test(decision)) continue;

  const decisionKey = decision.toLowerCase();
  const courseId = explicitCourseIds[decisionKey]
    || review.mapped_course_id
    || review.course_candidate_id;
  const userExplicitlyApproved = /chuẩn user/i.test(decision);
  const userId = review.mapped_user_id || (userExplicitlyApproved ? review.user_candidate_id : "");

  if (!courseId || !userId) {
    pending.push({
      row_number: review.row_number,
      source_testimonial_id: source.id,
      source_course: review.source_course,
      resolved_course_id: courseId,
      source_user: review.source_user,
      user_candidate_id: review.user_candidate_id,
      user_candidate_name: review.user_candidate_name,
      user_candidate_email: review.user_candidate_email,
      review_decision: decision,
      blocking_reason: !courseId ? "Course chưa được resolve." : "User candidate chưa được xác nhận trong feedback.",
    });
    continue;
  }

  ready.push({
    id: source.id,
    course_id: courseId,
    user_id: userId,
    rating: source.rating,
    content: source.content,
    is_featured: source.is_featured,
    created_at: source.created_at,
    aspect_ratings: source.aspect_ratings,
    applied_learning: source.applied_learning,
    improvement_feedback: source.improvement_feedback,
  });
}

const [courseResult, userResult, testimonialResult] = await Promise.all([
  mysqlQuery("SELECT id FROM courses"),
  mysqlQuery("SELECT id FROM users"),
  mysqlQuery("SELECT id FROM testimonials"),
]);
const courseIds = new Set(courseResult.rows.map((row) => row.id));
const userIds = new Set(userResult.rows.map((row) => row.id));
const testimonialIds = new Set(testimonialResult.rows.map((row) => row.id));
const invalid = ready.filter((row) => !courseIds.has(row.course_id) || !userIds.has(row.user_id) || testimonialIds.has(row.id));
if (invalid.length) throw new Error(`Validation failed for ${invalid.length} ready row(s).`);

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(importPath, writeCsv(Object.keys(ready[0] || {}), ready), "utf8");
await fs.writeFile(pendingPath, writeCsv(Object.keys(pending[0] || {}), pending), "utf8");
console.log(JSON.stringify({ ready: ready.length, pending: pending.length, dropped: reviewRows.length - ready.length - pending.length, importPath, pendingPath }, null, 2));
await mysqlPool().end();
