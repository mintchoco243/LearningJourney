import express from "express";
import { query } from "../db.js";
import { attachPublicCourseRatings } from "../services/publicCourseRatings.js";

export const meRouter = express.Router();

const onboardingSkillCatalog = [
  ["foundations", "Foundations", 10],
  ["data", "Data", 20],
  ["communication", "Communication", 30],
  ["product", "Product", 40],
  ["ai", "AI", 50],
  ["analytics", "Analytics", 60],
  ["leadership", "Leadership", 70],
  ["facilitation", "Facilitation", 80],
  ["strategy", "Strategy", 90],
  ["ops_excellence", "Operations Excellence", 100],
  ["mentoring", "Mentoring", 110],
];

async function ensureOnboardingSkillCatalog() {
  for (const [id, label, displayOrder] of onboardingSkillCatalog) {
    await query(
      `INSERT INTO skill_catalog (id, label, display_order, is_active)
       VALUES ($1, $2, $3, TRUE)
       ON DUPLICATE KEY UPDATE is_active = TRUE`,
      [id, label, displayOrder],
    );
  }
}

meRouter.get("/", async (req, res) => {
  const profile = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  const enrollments = await query(
    `SELECT e.id AS enrollment_id, e.user_id, e.course_id, e.completed_at,
            e.source, e.xp_earned, e.hours_earned,
            c.id, c.course_code, c.title, c.description, c.trainer,
            c.trainer_type, c.format, c.duration_hours, c.xp_reward, c.rating,
            c.skill_tags, c.rank_targets, c.role_targets, c.type,
            c.registration_url, c.status, c.material_url, c.session_date,
            c.session_time, c.location, c.min_participants, c.max_participants,
            c.current_count
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1
     ORDER BY e.completed_at DESC`,
    [req.user.id]
  );
  const reservations = await query(
    `SELECT r.id AS reservation_id, r.user_id, r.session_id, r.reserved_at, r.status AS reservation_status,
            s.id AS course_id, s.course_code, s.title, s.description, s.trainer,
            s.trainer_type, s.format, s.duration_hours, s.xp_reward, s.rating,
            s.skill_tags, s.rank_targets, s.role_targets, s.type, s.registration_url,
            s.status, s.material_url, s.location, s.min_participants,
            s.max_participants, s.current_count, s.session_date, s.session_time
     FROM reservations r
     JOIN courses s ON s.id = r.session_id
     WHERE r.user_id = $1
     ORDER BY s.session_date ASC`,
    [req.user.id]
  );
  const publicEnrollments = await attachPublicCourseRatings(enrollments.rows, (row) => row.id || row.course_id);
  const favorites = await query(
    `SELECT f.created_at AS favorited_at,
            c.*
     FROM course_favorites f
     JOIN courses c ON c.id = f.course_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id],
  );
  const publicFavorites = await attachPublicCourseRatings(favorites.rows, (row) => row.id);
  res.json({ user: profile.rows[0], enrollments: publicEnrollments, reservations: reservations.rows, favorites: publicFavorites });
});

meRouter.put("/", async (req, res) => {
  const { learning_formats, weekly_hours, preferred_trainers, learning_goals, character } = req.body;
  const charJson = character !== undefined ? JSON.stringify(character) : null;
  await query(
    "UPDATE users SET learning_formats = COALESCE($2, learning_formats), weekly_hours = COALESCE($3, weekly_hours), preferred_trainers = COALESCE($4, preferred_trainers), learning_goals = COALESCE($5, learning_goals), `character` = COALESCE($6, `character`), updated_at = NOW() WHERE id = $1",
    [req.user.id, learning_formats ?? null, weekly_hours ?? null, preferred_trainers ?? null, learning_goals ?? null, charJson]
  );
  const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  res.json({ user: result.rows[0] });
});

meRouter.post("/onboarding", async (req, res) => {
  const { learning_formats, weekly_hours, preferred_trainers, focus_skills = [], rank, role } = req.body;
  const requestedSkills = Array.isArray(focus_skills)
    ? [...new Set(focus_skills.map((skill) => String(skill || "").trim()).filter(Boolean))]
    : [];
  if (requestedSkills.length > 3) {
    return res.status(400).json({ error: "FOCUS_SKILLS_MAX_3" });
  }
  if (requestedSkills.length) {
    // The onboarding UI has a stable built-in taxonomy. Ensure older deployments
    // have it before validating, instead of rejecting valid user selections.
    await ensureOnboardingSkillCatalog();
    const skillRows = await query(
      "SELECT id FROM skill_catalog WHERE is_active = TRUE AND JSON_CONTAINS($1, JSON_QUOTE(id))",
      [requestedSkills],
    );
    const known = new Set(skillRows.rows.map((row) => String(row.id)));
    if (requestedSkills.some((skill) => !known.has(skill))) {
      return res.status(400).json({ error: "UNKNOWN_FOCUS_SKILL" });
    }
  }

  await query(
    `UPDATE users
     SET learning_formats = COALESCE($2, JSON_ARRAY()),
         weekly_hours = $3,
         preferred_trainers = COALESCE($4, JSON_ARRAY()),
         focus_skills = $5,
         rank = COALESCE($6, rank),
         role = COALESCE($7, role),
         onboarding_done = TRUE,
         xp_total = GREATEST(xp_total, 50),
         updated_at = NOW()
     WHERE id = $1`,
    [req.user.id, learning_formats, weekly_hours, preferred_trainers, requestedSkills, rank, role]
  );
  const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  res.json({ user: result.rows[0], xp_earned: 50 });
});

meRouter.delete("/onboarding", async (req, res) => {
  await query(
    `UPDATE users
     SET learning_formats = JSON_ARRAY(),
         weekly_hours = NULL,
         preferred_trainers = JSON_ARRAY(),
         focus_skills = JSON_ARRAY(),
         onboarding_done = FALSE,
         updated_at = NOW()
     WHERE id = $1`,
    [req.user.id],
  );
  const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  res.json({ user: result.rows[0] });
});
