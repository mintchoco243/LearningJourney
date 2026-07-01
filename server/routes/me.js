import express from "express";
import { query } from "../db.js";

export const meRouter = express.Router();

meRouter.get("/", async (req, res) => {
  const profile = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  const enrollments = await query(
    `SELECT e.*, c.title, c.trainer, c.format
     FROM enrollments e
     JOIN courses c ON c.course_code = e.course_code AND c.session_date IS NULL
     WHERE e.user_id = $1
     ORDER BY e.completed_at DESC`,
    [req.user.id]
  );
  const reservations = await query(
    `SELECT r.*, s.session_date, s.session_time, s.title
     FROM reservations r
     JOIN courses s ON s.id = r.session_id
     WHERE r.user_id = $1
     ORDER BY s.session_date ASC`,
    [req.user.id]
  );
  res.json({ user: profile.rows[0], enrollments: enrollments.rows, reservations: reservations.rows });
});

meRouter.put("/", async (req, res) => {
  const { learning_formats, weekly_hours, preferred_trainers, learning_goals } = req.body;
  await query(
    `UPDATE users
     SET learning_formats = COALESCE($2, learning_formats),
         weekly_hours = COALESCE($3, weekly_hours),
         preferred_trainers = COALESCE($4, preferred_trainers),
         learning_goals = COALESCE($5, learning_goals),
         updated_at = NOW()
     WHERE id = $1`,
    [req.user.id, learning_formats, weekly_hours, preferred_trainers, learning_goals]
  );
  const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  res.json({ user: result.rows[0] });
});

meRouter.post("/onboarding", async (req, res) => {
  const { learning_formats, weekly_hours, preferred_trainers } = req.body;

  await query(
    `UPDATE users
     SET learning_formats = COALESCE($2, '{}'),
         weekly_hours = $3,
         preferred_trainers = COALESCE($4, '{}'),
         onboarding_done = TRUE,
         xp_total = GREATEST(xp_total, 50),
         updated_at = NOW()
     WHERE id = $1`,
    [req.user.id, learning_formats, weekly_hours, preferred_trainers]
  );
  const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  res.json({ user: result.rows[0], xp_earned: 50 });
});
