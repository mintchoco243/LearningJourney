import express from "express";
import { query } from "../../db.js";

export const adminUsersRouter = express.Router();

// GET /admin/api/users -> List all users + summary stats
adminUsersRouter.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrollments_count,
              (SELECT COUNT(*) FROM reservations r WHERE r.user_id = u.id) AS reservations_count
       FROM users u
       ORDER BY u.xp_total DESC, u.full_name ASC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/users/:id -> User detail + enrollments + reservations
adminUsersRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const userRes = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (!userRes.rowCount) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const enrollmentsRes = await query(
     `SELECT e.*, c.course_code, c.title AS course_title, c.session_date, c.session_time, c.location
      FROM enrollments e
       JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = $1
      ORDER BY e.completed_at DESC`,
      [id]
    );

    const reservationsRes = await query(
      `SELECT r.*, s.course_code, s.session_date, s.session_time, s.location, s.title AS course_title
       FROM reservations r
       JOIN courses s ON r.session_id = s.id
       WHERE r.user_id = $1
       ORDER BY s.session_date DESC`,
      [id]
    );

    const reservationByCourse = new Map(reservationsRes.rows.map((row) => [row.session_id, row]));
    const completedCourseIds = new Set(enrollmentsRes.rows.map((row) => row.course_id));
    const learningHistory = [
      ...enrollmentsRes.rows.map((row) => {
        const reservation = reservationByCourse.get(row.course_id);
        return {
          id: row.id,
          course_id: row.course_id,
          course_code: row.course_code,
          course_title: row.course_title,
          session_date: row.session_date,
          session_time: row.session_time,
          location: row.location,
          status: "completed",
          registered_at: reservation?.reserved_at || null,
          completed_at: row.completed_at,
          source: row.source,
          xp_earned: row.xp_earned,
          hours_earned: row.hours_earned,
        };
      }),
      ...reservationsRes.rows
        .filter((row) => !completedCourseIds.has(row.session_id))
        .map((row) => ({
          id: row.id,
          course_id: row.session_id,
          course_code: row.course_code,
          course_title: row.course_title,
          session_date: row.session_date,
          session_time: row.session_time,
          location: row.location,
          status: row.status === "cancelled" ? "cancelled" : row.status === "confirmed" ? "confirmed" : "enrolled",
          registered_at: row.reserved_at,
          completed_at: null,
          source: "reservation",
          xp_earned: 0,
          hours_earned: 0,
        })),
    ].sort((a, b) => {
      const aDate = new Date(a.completed_at || a.registered_at || a.session_date || 0).getTime();
      const bDate = new Date(b.completed_at || b.registered_at || b.session_date || 0).getTime();
      return bDate - aDate;
    });

    res.json({
      user: userRes.rows[0],
      enrollments: enrollmentsRes.rows,
      reservations: reservationsRes.rows,
      learning_history: learningHistory,
    });
  } catch (error) {
    next(error);
  }
});
