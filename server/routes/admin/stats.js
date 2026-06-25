import express from "express";
import { query } from "../../db.js";

export const adminStatsRouter = express.Router();

adminStatsRouter.get("/", async (req, res) => {
  const [users, enrollments, sources, topCourses, requests] = await Promise.all([
    query("SELECT COUNT(*)::int AS total_users, COUNT(*) FILTER (WHERE onboarding_done)::int AS onboarded_users FROM users"),
    query("SELECT COUNT(*)::int AS enrollments_this_month FROM enrollments WHERE completed_at >= date_trunc('month', NOW())"),
    query("SELECT source, COUNT(*)::int AS count FROM enrollments GROUP BY source"),
    query("SELECT id, title, enrolled_count FROM courses ORDER BY enrolled_count DESC, title ASC LIMIT 5"),
    query("SELECT COUNT(*)::int AS pending_ld_requests FROM ld_requests WHERE status IN ('new', 'in_review')"),
  ]);
  res.json({
    total_users: users.rows[0].total_users,
    onboarded_users: users.rows[0].onboarded_users,
    enrollments_this_month: enrollments.rows[0].enrollments_this_month,
    enrollments_by_source: Object.fromEntries(sources.rows.map((row) => [row.source, row.count])),
    top_courses: topCourses.rows,
    pending_ld_requests: requests.rows[0].pending_ld_requests,
  });
});
