import express from "express";
import { query, withTransaction } from "../../db.js";
import { suggestXp } from "../../services/xpCalculator.js";
import { sendMail } from "../../services/mail.js";

export const adminCoursesRouter = express.Router();

function normalizeRating(value) {
  if (value === undefined || value === null || value === "") return 0;
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null;
}

// GET /admin/api/courses -> List all course rows. One row is one manageable offering.
adminCoursesRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM courses ORDER BY created_at DESC");
    res.json({ courses: result.rows });
  } catch (error) {
    next(error);
  }
});

adminCoursesRouter.post("/suggest-xp", (req, res) => {
  const { rank_targets } = req.body;
  const result = suggestXp(rank_targets);
  res.json(result);
});

// POST /admin/api/courses -> Create one course row. Duplicate course_code is allowed.
adminCoursesRouter.post("/", async (req, res, next) => {
  try {
    const {
      id: course_code,
      title, trainer, trainer_type, format, duration_hours,
      skill_tags, rank_targets, role_targets, type, min_participants,
      registration_url, description, xp_reward, rating, is_active, status, material_url,
      session_date, session_time, location, max_participants,
    } = req.body;

    if (!course_code || !title || !trainer || !format || !duration_hours || !type || xp_reward === undefined) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }
    const normalizedRating = normalizeRating(rating);
    if (normalizedRating === null) return res.status(400).json({ error: "INVALID_RATING" });

    await query(
      `INSERT INTO courses
         (id, course_code, title, trainer, trainer_type, format, duration_hours,
          rating, skill_tags, rank_targets, role_targets, type, min_participants,
          registration_url, description, xp_reward, is_active, status, material_url,
          session_date, session_time, location, max_participants, current_count, session_status)
       VALUES (UUID(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, 0, 'open')`,
      [
        course_code, title, trainer, trainer_type || "internal", format, duration_hours,
        normalizedRating, skill_tags, rank_targets, role_targets, type, min_participants,
        registration_url, description, xp_reward,
        is_active === undefined ? true : is_active,
        status || "open", material_url || null,
        session_date || null, session_time || null, location || null, max_participants || null,
      ]
    );

    const result = await query("SELECT * FROM courses WHERE course_code = $1 ORDER BY created_at DESC LIMIT 1", [course_code]);
    res.status(201).json({ course: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/api/courses/:id -> Update one course row (:id = UUID)
adminCoursesRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      course_code,
      title, trainer, trainer_type, format, duration_hours,
      skill_tags, rank_targets, role_targets, type, min_participants,
      registration_url, description, xp_reward, rating, is_active, status, material_url,
      session_date, session_time, location, max_participants,
    } = req.body;

    if (!title || !trainer || !format || !duration_hours || !type || xp_reward === undefined) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }
    const normalizedRating = normalizeRating(rating);
    if (normalizedRating === null) return res.status(400).json({ error: "INVALID_RATING" });

    const check = await query("SELECT id FROM courses WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    await query(
      `UPDATE courses
       SET course_code = $2, title = $3, trainer = $4, trainer_type = $5, format = $6, duration_hours = $7,
           rating = $8, skill_tags = $9, rank_targets = $10, role_targets = $11, type = $12,
           min_participants = $13, registration_url = $14, description = $15,
           xp_reward = $16, is_active = $17, status = $18, material_url = $19,
           session_date = $20, session_time = $21, location = $22, max_participants = $23,
           updated_at = NOW()
       WHERE id = $1`,
      [
        id, course_code || id, title, trainer, trainer_type || "internal", format, duration_hours,
        normalizedRating, skill_tags, rank_targets, role_targets, type, min_participants,
        registration_url, description, xp_reward,
        is_active === undefined ? true : is_active,
        status || "open", material_url || null,
        session_date || null, session_time || null, location || null, max_participants || null,
      ]
    );

    const result = await query("SELECT * FROM courses WHERE id = $1", [id]);
    res.json({ course: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/api/courses/:id -> Delete one course row (:id = UUID)
adminCoursesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM courses WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    await withTransaction(async (client) => {
      await client.query("DELETE FROM enrollments WHERE course_id = $1", [id]);
      await client.query("DELETE FROM testimonials WHERE course_id = $1", [id]);
      await client.query("DELETE FROM reservations WHERE session_id = $1", [id]);
      await client.query("DELETE FROM courses WHERE id = $1", [id]);
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/courses/:id/import-participants -> Import email participants (:id = UUID)
adminCoursesRouter.post("/:id/import-participants", async (req, res, next) => {
  try {
    const { id } = req.params;
    const emails = Array.isArray(req.body?.emails)
      ? req.body.emails
      : String(req.body?.csv || req.body?.csvText || "")
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
          .filter((item) => item.toLowerCase() !== "email");

    if (!Array.isArray(emails)) {
      return res.status(400).json({ error: "EMAILS_ARRAY_REQUIRED" });
    }

    const courseRes = await query("SELECT * FROM courses WHERE id = $1", [id]);
    if (!courseRes.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    const course = courseRes.rows[0];

    let matched_count = 0;
    let existed_count = 0;
    let not_found_count = 0;
    const not_found_emails = [];

    await withTransaction(async (client) => {
      for (const email of emails) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (!cleanEmail) continue;

        const userRes = await client.query("SELECT id, xp_total, hours_total FROM users WHERE email = $1", [cleanEmail]);
        if (!userRes.rowCount) {
          not_found_count++;
          not_found_emails.push(cleanEmail);
          continue;
        }
        const user = userRes.rows[0];

        const enrollRes = await client.query("SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2", [user.id, id]);
        if (enrollRes.rowCount) {
          existed_count++;
          continue;
        }

        await client.query(
          `INSERT INTO enrollments (user_id, course_id, completed_at, source, xp_earned, hours_earned)
           VALUES ($1, $2, NOW(), 'admin_import', $3, $4)`,
          [user.id, id, course.xp_reward, course.duration_hours]
        );
        await client.query(
          `UPDATE users SET xp_total = xp_total + $2, hours_total = hours_total + $3 WHERE id = $1`,
          [user.id, course.xp_reward, course.duration_hours]
        );

        matched_count++;

        await sendMail({
          to: cleanEmail,
          subject: `[${course.title}] đã được ghi nhận ✅`,
          html: `<p>Chào bạn,</p><p>Khóa học <strong>${course.title}</strong> đã được ghi nhận hoàn thành bởi admin. Bạn được cộng <strong>+${course.xp_reward} XP</strong> và <strong>+${course.duration_hours} giờ</strong> học tập.</p>`,
        });
      }

      await client.query(
        `UPDATE courses SET enrolled_count = (SELECT COUNT(*) FROM enrollments WHERE course_id = $1)
         WHERE id = $1`,
        [id]
      );
    });

    res.json({
      total_in_file: emails.length,
      matched_and_enrolled: matched_count,
      already_existed: existed_count,
      not_found_in_system: not_found_count,
      enrolled: matched_count,
      already_enrolled: existed_count,
      not_found: not_found_count,
      not_found_emails,
    });
  } catch (error) {
    next(error);
  }
});
