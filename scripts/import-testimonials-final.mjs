import fs from "node:fs/promises";
import dotenv from "dotenv";
import { csvToRows } from "../server/routes/admin/dataPrep.js";
import { mysqlPool, mysqlQuery, mysqlTransaction } from "../server/db-mysql.js";

dotenv.config();
const importPath = "outputs/testimonials-import-final.csv";
const rows = csvToRows(await fs.readFile(importPath, "utf8"));
if (rows.length !== 82) throw new Error(`Expected 82 rows, got ${rows.length}`);

const existing = await mysqlQuery("SELECT id FROM testimonials WHERE id IN (" + rows.map((_, i) => `$${i + 1}`).join(",") + ")", rows.map((row) => row.id));
if (existing.rows.length) throw new Error(`Refusing to insert existing testimonial IDs: ${existing.rows.map((row) => row.id).join(", ")}`);

const courseIds = [...new Set(rows.map((row) => row.course_id))];
const result = await mysqlTransaction(async (tx) => {
  for (const row of rows) {
    await tx.query(
      `INSERT INTO testimonials
       (id, course_id, user_id, rating, content, is_featured, created_at, aspect_ratings, applied_learning, improvement_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        row.id,
        row.course_id,
        row.user_id,
        Number(row.rating),
        row.content || null,
        row.is_featured === "1" ? 1 : 0,
        row.created_at,
        row.aspect_ratings || null,
        row.applied_learning || null,
        row.improvement_feedback || null,
      ],
    );
  }
  for (const courseId of courseIds) {
    await tx.query(
      `UPDATE courses c
       SET rating = (SELECT ROUND(AVG(t.rating), 1) FROM testimonials t WHERE t.course_id = c.id)
       WHERE c.id = $1`,
      [courseId],
    );
  }
  return { inserted: rows.length, coursesUpdated: courseIds.length };
});
const verify = await mysqlQuery(
  "SELECT COUNT(*) AS count FROM testimonials WHERE id IN (" + rows.map((_, i) => `$${i + 1}`).join(",") + ")",
  rows.map((row) => row.id),
);
console.log(JSON.stringify({ ...result, verified: Number(verify.rows[0].count) }, null, 2));
await mysqlPool().end();
