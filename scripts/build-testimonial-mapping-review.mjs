import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

import { mysqlPool, mysqlQuery } from "../server/db-mysql.js";
import { csvToRows } from "../server/routes/admin/dataPrep.js";

dotenv.config();

const sourcePath = "G:/My Drive/MN04. L&D & Other HR Tasks/2026/Learning Journey & Calendar/testimonials-imported-from-excel.csv";
const outputPath = path.resolve("outputs/testimonials-mapping-review.csv");

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compact(value) {
  return normalize(value).replace(/\s/g, "");
}

function tokenize(value) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 1 || /^\d+$/.test(token)));
}

function tokenScore(left, right) {
  const a = tokenize(left);
  const b = tokenize(right);
  const shared = [...a].filter((token) => b.has(token)).length;
  return shared / (new Set([...a, ...b]).size || 1);
}

function scoreCourse(source, candidate) {
  const sourceCompact = compact(source);
  const candidateCompact = compact(candidate.title);
  if (sourceCompact === candidateCompact) return 1;
  if (sourceCompact.length >= 5 && candidateCompact.includes(sourceCompact)) return 0.93;
  if (candidateCompact.length >= 5 && sourceCompact.includes(candidateCompact)) return 0.88;
  return tokenScore(source, candidate.title);
}

function scoreUser(source, candidate) {
  const sourceCompact = compact(source);
  const nameCompact = compact(candidate.full_name);
  const emailLocal = compact((candidate.email || "").split("@")[0]);
  if (sourceCompact === nameCompact || sourceCompact === emailLocal) return 1;
  return Math.max(tokenScore(source, candidate.full_name), tokenScore(source, (candidate.email || "").split("@")[0]));
}

function indexBy(items, key) {
  const index = new Map();
  for (const item of items) {
    const value = key(item);
    if (!value) continue;
    index.set(value, [...(index.get(value) || []), item]);
  }
  return index;
}

function topCandidate(items, score) {
  return items
    .map((item) => ({ item, score: score(item) }))
    .sort((a, b) => b.score - a.score);
}

function csvCell(value) {
  let text = String(value ?? "");
  // This is a review file, so neutralize spreadsheet formulas in source values.
  if (/^\s*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

const raw = await fs.readFile(sourcePath, "utf8");
const rows = csvToRows(raw);
const [coursesResult, usersResult] = await Promise.all([
  mysqlQuery("SELECT id, title FROM courses"),
  mysqlQuery("SELECT id, email, full_name FROM users"),
]);
const courses = coursesResult.rows;
const users = usersResult.rows;
const coursesByTitle = indexBy(courses, (course) => normalize(course.title));
const usersByName = indexBy(users, (user) => normalize(user.full_name));
const usersByEmailLocal = indexBy(users, (user) => normalize((user.email || "").split("@")[0]));

const reviewRows = rows.map((source, rowIndex) => {
  const exactCourses = coursesByTitle.get(normalize(source.course_id)) || [];
  const courseRanked = topCandidate(courses, (course) => scoreCourse(source.course_id, course));
  const courseBest = courseRanked[0];
  const courseRunnerUp = courseRanked[1];
  const courseAuto = exactCourses.length === 1
    ? { item: exactCourses[0], status: "AUTO_EXACT", note: "Tên course trùng khớp." }
    : courseBest && courseBest.score >= 0.88 && courseBest.score - (courseRunnerUp?.score || 0) >= 0.12
      ? { item: courseBest.item, status: "AUTO_HIGH_CONFIDENCE", note: "Tên course khác nhẹ; cần kiểm tra trước import." }
      : { item: null, status: "REVIEW_REQUIRED", note: "Không có course khớp đủ chắc chắn." };

  const exactUsers = [...new Map([
    ...(usersByName.get(normalize(source.user_id)) || []),
    ...(usersByEmailLocal.get(normalize(source.user_id)) || []),
  ].map((user) => [user.id, user])).values()];
  const userRanked = topCandidate(users, (user) => scoreUser(source.user_id, user));
  const userBest = userRanked[0];
  const userAuto = exactUsers.length === 1
    ? { item: exactUsers[0], status: "AUTO_EXACT", note: "Username/họ tên trùng khớp." }
    : { item: null, status: "REVIEW_REQUIRED", note: "Không tự gán user theo tên gần đúng để tránh nhầm người." };

  const importReady = courseAuto.item && userAuto.item
    && courseAuto.status === "AUTO_EXACT" && userAuto.status === "AUTO_EXACT";
  return {
    row_number: rowIndex + 2,
    source_testimonial_id: source.id,
    source_course: source.course_id,
    mapped_course_id: courseAuto.item?.id || "",
    mapped_course_title: courseAuto.item?.title || "",
    course_mapping_status: courseAuto.status,
    course_candidate_id: courseBest?.item.id || "",
    course_candidate_title: courseBest?.item.title || "",
    course_candidate_score: courseBest ? courseBest.score.toFixed(2) : "",
    source_user: source.user_id,
    mapped_user_id: userAuto.item?.id || "",
    mapped_user_name: userAuto.item?.full_name || "",
    mapped_user_email: userAuto.item?.email || "",
    user_mapping_status: userAuto.status,
    user_candidate_id: userBest?.item.id || "",
    user_candidate_name: userBest?.item.full_name || "",
    user_candidate_email: userBest?.item.email || "",
    user_candidate_score: userBest ? userBest.score.toFixed(2) : "",
    import_status: importReady ? "READY_AFTER_REVIEW" : "BLOCKED_PENDING_REVIEW",
    review_decision: "",
    mapping_note: `${courseAuto.note} ${userAuto.note}`,
  };
});

const headers = Object.keys(reviewRows[0] || {});
const csv = [headers.join(","), ...reviewRows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\r\n");
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `\uFEFF${csv}`, "utf8");

const summary = reviewRows.reduce((acc, row) => {
  acc.total += 1;
  if (row.import_status === "READY_AFTER_REVIEW") acc.ready += 1;
  if (row.course_mapping_status === "AUTO_EXACT") acc.courseExact += 1;
  if (row.course_mapping_status === "AUTO_HIGH_CONFIDENCE") acc.courseHigh += 1;
  if (row.user_mapping_status === "AUTO_EXACT") acc.userExact += 1;
  return acc;
}, { total: 0, ready: 0, courseExact: 0, courseHigh: 0, userExact: 0 });
console.log(JSON.stringify({ outputPath, ...summary }, null, 2));
await mysqlPool().end();
