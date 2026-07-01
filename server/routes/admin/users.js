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
     `SELECT e.*, c.title AS course_title
      FROM enrollments e
       JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = $1
      ORDER BY e.completed_at DESC`,
      [id]
    );

    const reservationsRes = await query(
      `SELECT r.*, s.session_date, s.session_time, s.location, s.title AS course_title
       FROM reservations r
       JOIN courses s ON r.session_id = s.id
       WHERE r.user_id = $1
       ORDER BY s.session_date DESC`,
      [id]
    );

    res.json({
      user: userRes.rows[0],
      enrollments: enrollmentsRes.rows,
      reservations: reservationsRes.rows,
    });
  } catch (error) {
    next(error);
  }
});
