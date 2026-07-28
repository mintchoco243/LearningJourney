import express from "express";
import { query, withTransaction } from "../db.js";
import { attachPublicCourseRatings } from "../services/publicCourseRatings.js";
import { getRecommendationsForUser } from "../services/recommendations.js";
import { ranksForUser, rankGroupForUser } from "../services/rankGroups.js";
import { syncMinigameTasks } from "./minigame.js";

export const coursesRouter = express.Router();

// Runtime invariant: `courses` is the single source of truth. A row is one
// learning item; `courses.id` is the action id. `course_code` may repeat and is
// display/grouping only. Do not filter this list to no-date rows.

function fitTag(course, user) {
  const roleFit = course.role_targets?.includes("All") || course.role_targets?.includes(user.role);
  const rankFit = user.rank && (course.rank_targets?.includes("All") || course.rank_targets?.includes(user.rank));
  if (roleFit && rankFit) return "best_fit";
  if (rankFit) return "for_your_level";
  return null;
}

const REQUIRED_TESTIMONIAL_RATING_KEYS = ["overall", "content", "trainer", "organization_support"];

function normalizeIntegerRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function normalizeTestimonialRatings(body, fallbackRating) {
  const source = body?.aspect_ratings && typeof body.aspect_ratings === "object"
    ? body.aspect_ratings
    : {};
  const ratings = {};
  for (const key of REQUIRED_TESTIMONIAL_RATING_KEYS) {
    const normalized = normalizeIntegerRating(source[key] ?? (key === "overall" ? body?.overall_rating : undefined) ?? fallbackRating);
    if (!normalized) return null;
    ratings[key] = normalized;
  }
  return ratings;
}

function cleanOptionalText(value) {
  return String(value || "").trim() || null;
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return text.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function uniqueTargets(rows, column) {
  return [...new Set(rows
    .flatMap((row) => listValue(row[column]))
    .map((value) => String(value || "").trim())
    .filter((value) => value && value.toLowerCase() !== "all"))]
    .sort((a, b) => a.localeCompare(b));
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

    const joinMethod = String(req.query.join_method || "").trim();
    if (joinMethod === "upcoming_scheduled") {
      filters.push("c.type = 'scheduled'");
      filters.push("c.session_date IS NOT NULL");
      filters.push("c.session_date >= CURRENT_DATE");
      filters.push("c.status NOT IN ('cancelled', 'full')");
    } else if (joinMethod === "interest") {
      filters.push("c.type = 'interest'");
    } else if (joinMethod === "sponsor") {
      filters.push("(c.type = 'external' OR c.trainer_type = 'external')");
    } else if (joinMethod === "self_learning") {
      filters.push("c.type IN ('elearning', 'material_only')");
    } else if (joinMethod === "ended") {
      filters.push("(c.status = 'ended' OR (c.session_date IS NOT NULL AND c.session_date < CURRENT_DATE AND c.status <> 'cancelled'))");
    }

    const result = await query(
      `SELECT c.*,
              (e.id IS NOT NULL) AS is_enrolled,
              (r.id IS NOT NULL AND r.status <> 'cancelled') AS is_reserved,
              EXISTS (
                SELECT 1 FROM course_favorites f
                WHERE f.course_id = c.id AND f.user_id = $1
              ) AS is_favorite
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
       LEFT JOIN reservations r ON r.session_id = c.id AND r.user_id = $1
       WHERE ${filters.join(" AND ")}
       ORDER BY
         CASE WHEN c.session_date IS NOT NULL AND c.session_date >= CURRENT_DATE THEN 0
              WHEN c.session_date IS NULL THEN 1
              ELSE 2 END,
         c.session_date ASC,
         c.created_at DESC
       LIMIT $2 OFFSET $3`,
      params
    );

    const userResult = await query("SELECT role, rank, team FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0] || {};
    const courses = await attachPublicCourseRatings(result.rows);
    res.json({ courses: courses.map((course) => ({ ...course, fit_tag: fitTag(course, user) })), page, limit });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/options", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT trainer, location, rank_targets, role_targets, skill_tags
       FROM courses
       WHERE is_active = TRUE AND status <> 'draft'`
    );
    const skills = await query("SELECT id, label, icon, color, display_order FROM skill_catalog WHERE is_active = TRUE ORDER BY display_order, label");
    const listValue = (value) => {
      if (Array.isArray(value)) return value.filter(Boolean);
      if (!value) return [];
      try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.filter(Boolean); } catch {}
      return String(value).split(",").map((item) => item.trim()).filter(Boolean);
    };
    const unique = (values) => [...new Set(values.flatMap(listValue).map((item) => String(item).trim()).filter((item) => item && item.toLowerCase() !== "all"))].sort((a, b) => a.localeCompare(b));
    const userResult = await query("SELECT role, rank, team FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0] || {};
    res.json({
      rank_group: rankGroupForUser(user),
      // Return the complete ladder for the current user's group, including
      // ranks that do not yet have a course target (for example the newly
      // added Senior Product Management Associate III).
      ranks: ranksForUser(user),
      roles: uniqueTargets(result.rows, "role_targets"),
      trainers: unique(result.rows.map((row) => row.trainer)),
      locations: unique(result.rows.map((row) => row.location)),
      skills: skills.rows,
    });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/recommendations", async (req, res, next) => {
  try {
    res.json(await getRecommendationsForUser(req.user.id));
  } catch (err) {
    next(err);
  }
});

coursesRouter.post("/:id/favorite", async (req, res, next) => {
  try {
    const course = await query("SELECT id FROM courses WHERE id = $1 AND is_active = TRUE", [req.params.id]);
    if (!course.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    await query(
      "INSERT IGNORE INTO course_favorites (user_id, course_id) VALUES ($1, $2)",
      [req.user.id, req.params.id],
    );
    const favorite = await query(
      "SELECT * FROM course_favorites WHERE user_id = $1 AND course_id = $2",
      [req.user.id, req.params.id],
    );
    const minigame = await syncMinigameTasks(req.user.id);
    res.status(201).json({ favorite: favorite.rows[0], is_favorite: true, minigame: { claimed: minigame.claimed || [] } });
  } catch (err) {
    next(err);
  }
});

coursesRouter.delete("/:id/favorite", async (req, res, next) => {
  try {
    await query(
      "DELETE FROM course_favorites WHERE user_id = $1 AND course_id = $2",
      [req.user.id, req.params.id],
    );
    res.json({ is_favorite: false });
  } catch (err) {
    next(err);
  }
});

// :id here is the course row UUID.
coursesRouter.get("/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,
              (e.id IS NOT NULL) AS is_enrolled,
              (r.id IS NOT NULL AND r.status <> 'cancelled') AS is_reserved,
              EXISTS (
                SELECT 1 FROM course_favorites f
                WHERE f.course_id = c.id AND f.user_id = $2
              ) AS is_favorite
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $2
       LEFT JOIN reservations r ON r.session_id = c.id AND r.user_id = $2
       WHERE c.id = $1 AND c.is_active = TRUE`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    const [course] = await attachPublicCourseRatings(result.rows);
    res.json({ course });
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
        `INSERT IGNORE INTO enrollments (user_id, course_id, source, xp_earned, hours_earned)
         VALUES ($1, $2, 'self_marked', $3, $4)`,
        [req.user.id, c.id, c.xp_reward, c.duration_hours]
      );
      if (!enrollment.rowCount) {
        const user = await client.query("SELECT xp_total, hours_total FROM users WHERE id = $1", [req.user.id]);
        return { duplicate: true, course: c, user: user.rows[0] };
      }
      await client.query(
        `UPDATE users SET xp_total = xp_total + $2, hours_total = hours_total + $3, updated_at = NOW() WHERE id = $1`,
        [req.user.id, c.xp_reward, c.duration_hours]
      );
      const user = await client.query("SELECT xp_total, hours_total FROM users WHERE id = $1", [req.user.id]);
      await client.query(
        `UPDATE courses
         SET enrolled_count = (SELECT COUNT(*) FROM enrollments WHERE course_id = $1),
             updated_at = NOW()
         WHERE id = $1`,
        [c.id]
      );
      const savedEnrollment = await client.query(
        "SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2",
        [req.user.id, c.id]
      );
      const updatedCourse = await client.query("SELECT * FROM courses WHERE id = $1", [c.id]);
      return { duplicate: false, course: updatedCourse.rows[0] || c, user: user.rows[0], enrollment: savedEnrollment.rows[0] };
    });
    if (!result) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    if (result.duplicate) {
      const minigame = await syncMinigameTasks(req.user.id);
      return res.status(409).json({
        error: "ALREADY_COMPLETED",
        course_id: result.course.id,
        xp_earned: 0,
        hours_earned: 0,
        new_total_xp: result.user.xp_total,
        new_total_hours: result.user.hours_total,
        xp_total: result.user.xp_total,
        hours_total: result.user.hours_total,
        already_completed: true,
        minigame: { claimed: minigame.claimed || [] },
      });
    }
    const [course] = await attachPublicCourseRatings([result.course]);
    const minigame = await syncMinigameTasks(req.user.id);
    res.json({
      course_id: result.course.id,
      xp_earned: result.course.xp_reward,
      hours_earned: result.course.duration_hours,
      new_total_xp: result.user.xp_total,
      new_total_hours: result.user.hours_total,
      already_completed: false,
      course,
      enrollment: result.enrollment,
      minigame: { claimed: minigame.claimed || [] },
    });
  } catch (error) {
    next(error);
  }
});

coursesRouter.delete("/:id/complete", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const course = await client.query(
        "SELECT * FROM courses WHERE id = $1 AND is_active = TRUE",
        [req.params.id]
      );
      if (!course.rowCount) return null;
      const c = course.rows[0];
      const enrollment = await client.query(
        "SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2",
        [req.user.id, c.id]
      );
      if (!enrollment.rowCount) {
        const user = await client.query("SELECT xp_total, hours_total FROM users WHERE id = $1", [req.user.id]);
        return { missing: true, course: c, user: user.rows[0] };
      }

      const e = enrollment.rows[0];
      await client.query("DELETE FROM enrollments WHERE id = $1", [e.id]);
      await client.query(
        `UPDATE users
         SET xp_total = GREATEST(xp_total - $2, 0),
             hours_total = GREATEST(hours_total - $3, 0),
             updated_at = NOW()
         WHERE id = $1`,
        [req.user.id, Number(e.xp_earned || 0), Number(e.hours_earned || 0)]
      );
      await client.query(
        `UPDATE courses
         SET enrolled_count = (SELECT COUNT(*) FROM enrollments WHERE course_id = $1),
             updated_at = NOW()
         WHERE id = $1`,
        [c.id]
      );
      const user = await client.query("SELECT xp_total, hours_total FROM users WHERE id = $1", [req.user.id]);
      const updatedCourse = await client.query("SELECT * FROM courses WHERE id = $1", [c.id]);
      return { missing: false, course: updatedCourse.rows[0] || c, user: user.rows[0], enrollment: e };
    });
    if (!result) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    const [course] = await attachPublicCourseRatings([result.course]);
    res.json({
      course_id: result.course.id,
      xp_removed: result.missing ? 0 : Number(result.enrollment.xp_earned || 0),
      hours_removed: result.missing ? 0 : Number(result.enrollment.hours_earned || 0),
      new_total_xp: result.user.xp_total,
      new_total_hours: result.user.hours_total,
      already_not_completed: result.missing,
      course,
    });
  } catch (error) {
    next(error);
  }
});

coursesRouter.get("/:id/testimonials", async (req, res) => {
  const result = await query(
    `SELECT t.*, u.full_name, u.team AS user_team, u.role AS user_role, u.avatar_url
     FROM testimonials t
     JOIN users u ON u.id = t.user_id
     WHERE t.course_id = $1 AND t.is_featured = TRUE
     ORDER BY t.is_featured DESC, t.created_at DESC`,
    [req.params.id]
  );
  res.json({ testimonials: result.rows });
});

coursesRouter.post("/:id/testimonials", async (req, res, next) => {
  try {
    const rating = normalizeIntegerRating(req.body.overall_rating ?? req.body.rating);
    if (!rating) {
      return res.status(400).json({ error: "INVALID_RATING" });
    }
    const aspectRatings = normalizeTestimonialRatings(req.body, rating);
    if (!aspectRatings) return res.status(400).json({ error: "INVALID_ASPECT_RATINGS" });

    const completed = await query("SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2", [req.user.id, req.params.id]);
    if (!completed.rowCount) return res.status(403).json({ error: "COMPLETE_COURSE_FIRST" });

    const appliedLearning = cleanOptionalText(req.body.applied_learning);
    const improvementFeedback = cleanOptionalText(req.body.improvement_feedback);
    const content = cleanOptionalText(req.body.content) || improvementFeedback || appliedLearning;

    await query(
      `INSERT INTO testimonials (
         course_id, user_id, rating, content, aspect_ratings, applied_learning, improvement_feedback
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.params.id, req.user.id, rating, content, JSON.stringify(aspectRatings), appliedLearning, improvementFeedback]
    );
    await query(
      `UPDATE courses
       SET rating = (
         SELECT ROUND(AVG(rating), 1) FROM testimonials WHERE course_id = $1
       ),
       updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );
    const result = await query(
      `SELECT t.*, u.full_name, u.team AS user_team, u.role AS user_role, u.avatar_url FROM testimonials t
       JOIN users u ON u.id = t.user_id
       WHERE t.course_id = $1 AND t.user_id = $2
       ORDER BY t.created_at DESC LIMIT 1`,
      [req.params.id, req.user.id]
    );
    res.status(201).json({ testimonial: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
