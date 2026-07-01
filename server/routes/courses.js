import express from "express";
import { query, withTransaction } from "../db.js";

export const coursesRouter = express.Router();

function fitTag(course, user) {
  const roleFit = course.role_targets?.includes("All") || course.role_targets?.includes(user.role);
  const rankFit = user.rank && (course.rank_targets?.includes("All") || course.rank_targets?.includes(user.rank));
  if (roleFit && rankFit) return "best_fit";
  if (rankFit) return "for_your_level";
  return null;
}

coursesRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;
    const params = [req.user.id, limit, offset];
    const filters = ["c.is_active = TRUE", "c.status <> 'draft'"];

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      filters.push(`(c.title LIKE $${params.length} OR c.trainer LIKE $${params.length} OR c.description LIKE $${params.length})`);
    }
    for (const [queryKey, column] of [["rank", "rank_targets"], ["role", "role_targets"], ["format", "format"], ["skill_tag", "skill_tags"], ["type", "type"]]) {
      if (!req.query[queryKey]) continue;
      params.push(req.query[queryKey]);
      if (queryKey === "rank") {
        filters.push(`(JSON_CONTAINS(c.rank_targets, JSON_QUOTE($${params.length})) OR JSON_CONTAINS(c.rank_targets, JSON_QUOTE('All')))`);
        continue;
      }
      filters.push(column.endsWith("_targets") || column === "skill_tags"
        ? `JSON_CONTAINS(c.${column}, JSON_QUOTE($${params.length}))`
        : `c.${column} = $${params.length}`);
    }

    const result = await query(
      `SELECT c.*, (e.id IS NOT NULL) AS is_enrolled
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
       WHERE ${filters.join(" AND ")}
       ORDER BY COALESCE(c.session_date, c.created_at) DESC, c.created_at DESC
       LIMIT $2 OFFSET $3`,
      params
    );

    const userResult = await query("SELECT role, rank, team FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0] || {};
    res.json({ courses: result.rows.map((course) => ({ ...course, fit_tag: fitTag(course, user) })), page, limit });
  } catch (err) {
    next(err);
  }
});

// :id here is the course row UUID.
coursesRouter.get("/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, (e.id IS NOT NULL) AS is_enrolled
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $2
       WHERE c.id = $1 AND c.is_active = TRUE`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    res.json({ course: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

coursesRouter.post("/:id/complete", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const course = await client.query(
        "SELECT * FROM courses WHERE id = $1 AND is_active = TRUE",
        [req.params.id]
      );
      if (!course.rowCount) return null;
      const c = course.rows[0];
      const enrollment = await client.query(
        `INSERT INTO enrollments (user_id, course_id, source, xp_earned, hours_earned)
         VALUES ($1, $2, 'self_reported', $3, $4)
         ON CONFLICT (user_id, course_id) DO NOTHING
         RETURNING *`,
        [req.user.id, c.id, c.xp_reward, c.duration_hours]
      );
      if (!enrollment.rowCount) {
        const user = await client.query("SELECT xp_total, hours_total FROM users WHERE id = $1", [req.user.id]);
        return { duplicate: true, user: user.rows[0] };
      }
      await client.query(
        `UPDATE users SET xp_total = xp_total + $2, hours_total = hours_total + $3, updated_at = NOW() WHERE id = $1`,
        [req.user.id, c.xp_reward, c.duration_hours]
      );
      const user = await client.query("SELECT xp_total, hours_total FROM users WHERE id = $1", [req.user.id]);
      await client.query(
        "UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = $1",
        [c.id]
      );
      return { duplicate: false, course: c, user: user.rows[0] };
    });
    if (!result) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    if (result.duplicate) return res.status(409).json({ error: "ALREADY_COMPLETED", ...result.user });
    res.json({
      xp_earned: result.course.xp_reward,
      new_total_xp: result.user.xp_total,
      new_total_hours: result.user.hours_total,
    });
  } catch (error) {
    next(error);
  }
});

coursesRouter.get("/:id/testimonials", async (req, res) => {
  const result = await query(
    `SELECT t.*, u.full_name, u.avatar_url
     FROM testimonials t
     JOIN users u ON u.id = t.user_id
     WHERE t.course_id = $1
     ORDER BY t.is_featured DESC, t.created_at DESC`,
    [req.params.id]
  );
  res.json({ testimonials: result.rows });
});

coursesRouter.post("/:id/testimonials", async (req, res) => {
  const completed = await query("SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2", [req.user.id, req.params.id]);
  if (!completed.rowCount) return res.status(403).json({ error: "COMPLETE_COURSE_FIRST" });
  await query(
    `INSERT INTO testimonials (course_id, user_id, rating, content) VALUES ($1, $2, $3, $4)`,
    [req.params.id, req.user.id, req.body.rating, req.body.content || null]
  );
  await query(
    `UPDATE courses SET rating = (
       SELECT ROUND(AVG(rating), 1) FROM testimonials WHERE course_id = $1
     ) WHERE id = $1`,
    [req.params.id]
  );
  const result = await query(
    `SELECT t.*, u.full_name, u.avatar_url FROM testimonials t
     JOIN users u ON u.id = t.user_id
     WHERE t.course_id = $1 AND t.user_id = $2
     ORDER BY t.created_at DESC LIMIT 1`,
    [req.params.id, req.user.id]
  );
  res.status(201).json({ testimonial: result.rows[0] });
});
