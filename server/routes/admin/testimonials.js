import express from "express";
import { query } from "../../db.js";

export const adminTestimonialsRouter = express.Router();

adminTestimonialsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         t.id,
         t.course_id,
         c.course_code,
         c.title AS course_title,
         t.user_id,
         u.full_name AS user_name,
         u.role AS user_role,
         u.team AS user_team,
         t.rating,
         t.content,
         t.aspect_ratings,
         t.applied_learning,
         t.improvement_feedback,
         t.is_featured,
         t.created_at
       FROM testimonials t
       JOIN courses c ON c.id = t.course_id
       JOIN users u ON u.id = t.user_id
       ORDER BY t.is_featured DESC, t.created_at DESC`
    );
    res.json({ testimonials: result.rows });
  } catch (error) {
    next(error);
  }
});

adminTestimonialsRouter.put("/:id", async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE testimonials
       SET is_featured = $2
       WHERE id = $1`,
      [req.params.id, Boolean(req.body?.is_featured)]
    );
    if (!result.rowCount) return res.status(404).json({ error: "TESTIMONIAL_NOT_FOUND" });

    const updated = await query(
      `SELECT
         t.id,
         t.course_id,
         c.course_code,
         c.title AS course_title,
         t.user_id,
         u.full_name AS user_name,
         u.role AS user_role,
         u.team AS user_team,
         t.rating,
         t.content,
         t.aspect_ratings,
         t.applied_learning,
         t.improvement_feedback,
         t.is_featured,
         t.created_at
       FROM testimonials t
       JOIN courses c ON c.id = t.course_id
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    res.json({ testimonial: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});
