import express from "express";
import { query } from "../../db.js";
import { bucketWeekly, bucketWeeklyDistinct } from "../../lib/weeklyBucket.js";

export const adminReportRouter = express.Router();

function toSqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function resolveRange(req) {
  const now = new Date();
  const endDate = req.query.endDate ? new Date(`${req.query.endDate}T23:59:59Z`) : now;
  const startDate = req.query.startDate
    ? new Date(`${req.query.startDate}T00:00:00Z`)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const spanMs = Math.max(endDate.getTime() - startDate.getTime(), 24 * 60 * 60 * 1000);
  const prevEnd = new Date(startDate.getTime());
  const prevStart = new Date(startDate.getTime() - spanMs);
  return { startDate, endDate, prevStart, prevEnd };
}

async function fetchPeriod(start, end) {
  const s = toSqlDateTime(start);
  const e = toSqlDateTime(end);

  const [onboarding, completions, reservations, favorites, feedback, minigame, testimonials, topCourses] =
    await Promise.all([
      query(
        "SELECT COUNT(*) created, SUM(onboarding_done = 1) completed FROM users WHERE created_at >= $1 AND created_at < $2",
        [s, e]
      ),
      query("SELECT COUNT(*) c FROM enrollments WHERE completed_at >= $1 AND completed_at < $2", [s, e]),
      query("SELECT COUNT(*) c FROM reservations WHERE reserved_at >= $1 AND reserved_at < $2", [s, e]),
      query("SELECT COUNT(*) c FROM course_favorites WHERE created_at >= $1 AND created_at < $2", [s, e]),
      query(
        "SELECT COUNT(*) c, AVG(overall_rating) avg_rating FROM site_feedback WHERE created_at >= $1 AND created_at < $2",
        [s, e]
      ),
      query(
        "SELECT COUNT(*) runs, COUNT(DISTINCT user_id) players FROM minigame_runs WHERE created_at >= $1 AND created_at < $2",
        [s, e]
      ),
      query("SELECT COUNT(*) c FROM testimonials WHERE created_at >= $1 AND created_at < $2", [s, e]),
      // Each course row doubles as its own session, so reservations.session_id joins
      // straight to courses.id for "registrations"; enrollments.course_id gives completions.
      query(
        `SELECT
           c.title,
           COUNT(DISTINCT CASE WHEN r.reserved_at >= $1 AND r.reserved_at < $2 THEN r.id END) registrations,
           COUNT(DISTINCT CASE WHEN e.completed_at >= $3 AND e.completed_at < $4 THEN e.id END) completions,
           COUNT(DISTINCT CASE WHEN t.created_at >= $5 AND t.created_at < $6 THEN t.id END) testimonial_count,
           c.rating
         FROM courses c
         LEFT JOIN reservations r ON r.session_id = c.id
         LEFT JOIN enrollments e ON e.course_id = c.id
         LEFT JOIN testimonials t ON t.course_id = c.id
         GROUP BY c.id, c.title, c.rating
         HAVING registrations > 0 OR completions > 0
         ORDER BY registrations DESC
         LIMIT 5`,
        [s, e, s, e, s, e]
      ),
    ]);

  return {
    onboarding: {
      created: Number(onboarding.rows[0]?.created || 0),
      completed: Number(onboarding.rows[0]?.completed || 0),
    },
    course_completions: Number(completions.rows[0]?.c || 0),
    reservations: Number(reservations.rows[0]?.c || 0),
    favorites: Number(favorites.rows[0]?.c || 0),
    feedback: {
      count: Number(feedback.rows[0]?.c || 0),
      avg_rating: feedback.rows[0]?.avg_rating != null ? Number(feedback.rows[0].avg_rating) : null,
    },
    minigame: {
      runs: Number(minigame.rows[0]?.runs || 0),
      players: Number(minigame.rows[0]?.players || 0),
    },
    testimonials: Number(testimonials.rows[0]?.c || 0),
    top_courses: topCourses.rows.map((row) => ({
      title: row.title,
      registrations: Number(row.registrations || 0),
      completions: Number(row.completions || 0),
      testimonials: Number(row.testimonial_count || 0),
      rating: row.rating != null ? Number(row.rating) : null,
    })),
  };
}

async function fetchTimeline(start, end) {
  const s = toSqlDateTime(start);
  const e = toSqlDateTime(end);

  const [completions, reservations, activeUserRows] = await Promise.all([
    query(
      "SELECT DATE(completed_at) d, COUNT(*) c FROM enrollments WHERE completed_at >= $1 AND completed_at < $2 GROUP BY DATE(completed_at)",
      [s, e]
    ),
    query(
      "SELECT DATE(reserved_at) d, COUNT(*) c FROM reservations WHERE reserved_at >= $1 AND reserved_at < $2 GROUP BY DATE(reserved_at)",
      [s, e]
    ),
    // "Active user" here = distinct user_id with any real action that week
    // (completed a course, reserved a session, left feedback, or played the minigame).
    query(
      `SELECT user_id, DATE(activity_at) d FROM (
         SELECT user_id, completed_at activity_at FROM enrollments WHERE completed_at >= $1 AND completed_at < $2
         UNION ALL
         SELECT user_id, reserved_at FROM reservations WHERE reserved_at >= $3 AND reserved_at < $4
         UNION ALL
         SELECT user_id, created_at FROM site_feedback WHERE created_at >= $5 AND created_at < $6
         UNION ALL
         SELECT user_id, created_at FROM minigame_runs WHERE created_at >= $7 AND created_at < $8
       ) activity`,
      [s, e, s, e, s, e, s, e]
    ),
  ]);

  const dailyByDate = {};
  const merge = (rows, field) => {
    for (const row of rows) {
      const day = String(row.d).slice(0, 10);
      if (!dailyByDate[day]) dailyByDate[day] = {};
      dailyByDate[day][field] = Number(row.c || 0);
    }
  };
  merge(completions.rows, "course_completions");
  merge(reservations.rows, "reservations");

  const sums = bucketWeekly(toDateStr(start), toDateStr(end), dailyByDate, ["course_completions", "reservations"]);
  const activeUsers = bucketWeeklyDistinct(toDateStr(start), toDateStr(end), activeUserRows.rows, "d", "user_id", "active_users");

  return sums.map((week, i) => ({ ...week, active_users: activeUsers[i]?.active_users || 0 }));
}

function pctDelta(current, previous) {
  // A baseline under 3 (e.g. the pre-launch period) makes the percentage swing
  // wildly on tiny counts, so treat it as "not enough data" instead of showing it.
  if (previous < 3) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

adminReportRouter.get("/", async (req, res) => {
  try {
    const { startDate, endDate, prevStart, prevEnd } = resolveRange(req);
    const [current, previous, timeline] = await Promise.all([
      fetchPeriod(startDate, endDate),
      fetchPeriod(prevStart, prevEnd),
      fetchTimeline(startDate, endDate),
    ]);

    res.json({
      date_range: {
        start: toSqlDateTime(startDate).slice(0, 10),
        end: toSqlDateTime(endDate).slice(0, 10),
      },
      current,
      timeline,
      deltas: {
        onboarding_completed: pctDelta(current.onboarding.completed, previous.onboarding.completed),
        course_completions: pctDelta(current.course_completions, previous.course_completions),
        reservations: pctDelta(current.reservations, previous.reservations),
        minigame_runs: pctDelta(current.minigame.runs, previous.minigame.runs),
      },
    });
  } catch (error) {
    console.error("[admin/report] query failed", error);
    res.status(500).json({ error: error.message });
  }
});
