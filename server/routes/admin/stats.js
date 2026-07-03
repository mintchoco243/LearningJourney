import express from "express";
import { query } from "../../db.js";
import { isMysqlUrl } from "../../db-mysql.js";

export const adminStatsRouter = express.Router();

adminStatsRouter.get("/", async (req, res) => {
  const mysql = isMysqlUrl();

  const [users, enrollments, sources, topCourses, requests] = await Promise.all([
    query(
      mysql
        ? "SELECT COUNT(*) AS total_users, SUM(onboarding_done) AS onboarded_users FROM users"
        : "SELECT COUNT(*)::int AS total_users, COUNT(*) FILTER (WHERE onboarding_done)::int AS onboarded_users FROM users",
    ),
    query(
      mysql
        ? "SELECT COUNT(*) AS enrollments_this_month FROM enrollments WHERE completed_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
        : "SELECT COUNT(*)::int AS enrollments_this_month FROM enrollments WHERE completed_at >= date_trunc('month', NOW())",
    ),
    query(
      mysql
        ? "SELECT source, COUNT(*) AS count FROM enrollments GROUP BY source"
        : "SELECT source, COUNT(*)::int AS count FROM enrollments GROUP BY source",
    ),
    query(
      "SELECT id, course_code, title, enrolled_count FROM courses ORDER BY enrolled_count DESC, title ASC LIMIT 5",
    ),
    query(
      mysql
        ? "SELECT COUNT(*) AS pending_ld_requests FROM ld_requests WHERE status IN ('pending', 'new', 'in_review')"
        : "SELECT COUNT(*)::int AS pending_ld_requests FROM ld_requests WHERE status IN ('pending', 'new', 'in_review')",
    ),
  ]);

  res.json({
    total_users: Number(users.rows[0].total_users),
    onboarded_users: Number(users.rows[0].onboarded_users ?? 0),
    enrollments_this_month: Number(enrollments.rows[0].enrollments_this_month),
    enrollments_by_source: Object.fromEntries(
      sources.rows.map((row) => [row.source, Number(row.count)]),
    ),
    top_courses: topCourses.rows,
    pending_ld_requests: Number(requests.rows[0].pending_ld_requests),
  });
});
