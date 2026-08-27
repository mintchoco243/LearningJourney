import express from "express";
import { query } from "../../db.js";

export const adminStatsRouter = express.Router();

const SOURCE_LABELS = {
  self_marked: "User tự đánh dấu",
  self_reported: "User tự đánh dấu",
  admin_import: "Import CSV/Admin",
};

adminStatsRouter.get("/", async (req, res, next) => {
  try {
    const [users, enrollments, lastMonthEnrollments, sources, topCourses, requests, activeCourses] = await Promise.all([
      query("SELECT COUNT(*) AS total_users, SUM(onboarding_done) AS onboarded_users FROM users"),
      query("SELECT COUNT(*) AS enrollments_this_month FROM enrollments WHERE completed_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"),
      query(
        `SELECT COUNT(*) AS c FROM enrollments
         WHERE completed_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
           AND completed_at < DATE_FORMAT(NOW(), '%Y-%m-01')`
      ),
      query("SELECT source, COUNT(*) AS count FROM enrollments GROUP BY source"),
      query("SELECT id, course_code, title, enrolled_count FROM courses ORDER BY enrolled_count DESC, title ASC LIMIT 5"),
      query("SELECT COUNT(*) AS pending_ld_requests FROM ld_requests WHERE status IN ('pending', 'new', 'in_review')"),
      query("SELECT COUNT(*) AS c FROM courses WHERE is_active = 1"),
    ]);

    const userRow = users.rows[0] || {};
    const enrollmentRow = enrollments.rows[0] || {};
    const requestRow = requests.rows[0] || {};
    const enrollmentsBySource = Object.fromEntries(
      (sources.rows || []).map((row) => [row.source, Number(row.count)]),
    );
    const thisMonthCount = Number(enrollmentRow.enrollments_this_month || 0);
    const lastMonthCount = Number(lastMonthEnrollments.rows[0]?.c || 0);
    const enrollmentsDelta = lastMonthCount >= 3
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 1000) / 10
      : null;

    res.json({
      total_users: Number(userRow.total_users || 0),
      onboarded_users: Number(userRow.onboarded_users || 0),
      enrollments_this_month: thisMonthCount,
      enrollments_last_month: lastMonthCount,
      enrollments_delta: enrollmentsDelta,
      enrollments_by_source: enrollmentsBySource,
      enrollments_breakdown: Object.entries(enrollmentsBySource).map(([source, count]) => ({
        source: SOURCE_LABELS[source] || source,
        count,
      })),
      top_courses: topCourses.rows || [],
      pending_ld_requests: Number(requestRow.pending_ld_requests || 0),
      active_courses: Number(activeCourses.rows[0]?.c || 0),
    });
  } catch (error) {
    next(error);
  }
});
