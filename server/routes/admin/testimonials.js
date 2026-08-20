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
         c.type AS course_type,
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
    const currentResult = await query(`SELECT course_id, rating, content, applied_learning, improvement_feedback, is_featured FROM testimonials WHERE id = $1`, [req.params.id]);
    if (!currentResult.rowCount) return res.status(404).json({ error: "TESTIMONIAL_NOT_FOUND" });
    const current = currentResult.rows[0];
    const body = req.body || {};
    const result = await query(
      `UPDATE testimonials
       SET rating = $2,
           content = $3,
           applied_learning = $4,
           improvement_feedback = $5,
           is_featured = $6
       WHERE id = $1`,
      [
        req.params.id,
        body.rating === undefined ? current.rating : Math.max(1, Math.min(5, Number(body.rating || 0))),
        body.content === undefined ? current.content : (body.content || null),
        body.applied_learning === undefined ? current.applied_learning : (body.applied_learning || null),
        body.improvement_feedback === undefined ? current.improvement_feedback : (body.improvement_feedback || null),
        body.is_featured === undefined ? Boolean(current.is_featured) : Boolean(body.is_featured),
      ]
    );
    if (!result.rowCount) return res.status(404).json({ error: "TESTIMONIAL_NOT_FOUND" });
    await query(
      `UPDATE courses c
       SET rating = (SELECT ROUND(AVG(t.rating), 1) FROM testimonials t WHERE t.course_id = c.id)
       WHERE c.id = $1`,
      [current.course_id]
    );

    const updated = await query(
      `SELECT
         t.id,
         t.course_id,
         c.course_code,
         c.title AS course_title,
         c.type AS course_type,
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
