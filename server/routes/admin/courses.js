import express from "express";
import { query, withTransaction } from "../../db.js";
import { suggestXp } from "../../services/xpCalculator.js";
import { sendMail } from "../../services/mail.js";

export const adminCoursesRouter = express.Router();

// GET /admin/api/courses -> List all courses (master rows only)
adminCoursesRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM courses WHERE session_date IS NULL ORDER BY created_at DESC");
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

// POST /admin/api/courses -> Create course (master row, session_date IS NULL)
adminCoursesRouter.post("/", async (req, res, next) => {
  try {
    const {
      id: course_code,
      title, trainer, trainer_type, format, duration_hours,
      skill_tags, rank_targets, role_targets, type, min_participants,
      registration_url, description, xp_reward, is_active, status, material_url,
    } = req.body;

    if (!course_code || !title || !trainer || !format || !duration_hours || !type || xp_reward === undefined) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const existing = await query("SELECT id FROM courses WHERE course_code = $1 AND session_date IS NULL", [course_code]);
    if (existing.rowCount) return res.status(409).json({ error: "COURSE_CODE_ALREADY_EXISTS" });

    await query(
      `INSERT INTO courses
         (id, course_code, title, trainer, trainer_type, format, duration_hours,
          skill_tags, rank_targets, role_targets, type, min_participants,
          registration_url, description, xp_reward, is_active, status, material_url,
          session_date)
       VALUES (UUID(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NULL)`,
      [
        course_code, title, trainer, trainer_type || "internal", format, duration_hours,
        skill_tags, rank_targets, role_targets, type, min_participants,
        registration_url, description, xp_reward,
        is_active === undefined ? true : is_active,
        status || "open", material_url || null,
      ]
    );

    const result = await query("SELECT * FROM courses WHERE course_code = $1 AND session_date IS NULL", [course_code]);
    res.status(201).json({ course: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/api/courses/:id -> Update course (:id = course_code)
adminCoursesRouter.put("/:id", async (req, res, next) => {
  try {
    const { id: course_code } = req.params;
    const {
      title, trainer, trainer_type, format, duration_hours,
      skill_tags, rank_targets, role_targets, type, min_participants,
      registration_url, description, xp_reward, is_active, status, material_url,
    } = req.body;

    if (!title || !trainer || !format || !duration_hours || !type || xp_reward === undefined) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const check = await query("SELECT id FROM courses WHERE course_code = $1 AND session_date IS NULL", [course_code]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    // Update all rows with this course_code (master + session rows stay in sync)
    await query(
      `UPDATE courses
       SET title = $2, trainer = $3, trainer_type = $4, format = $5, duration_hours = $6,
           skill_tags = $7, rank_targets = $8, role_targets = $9, type = $10,
           min_participants = $11, registration_url = $12, description = $13,
           xp_reward = $14, is_active = $15, status = $16, material_url = $17, updated_at = NOW()
       WHERE course_code = $1`,
      [
        course_code, title, trainer, trainer_type || "internal", format, duration_hours,
        skill_tags, rank_targets, role_targets, type, min_participants,
        registration_url, description, xp_reward,
        is_active === undefined ? true : is_active,
        status || "open", material_url || null,
      ]
    );

    const result = await query("SELECT * FROM courses WHERE course_code = $1 AND session_date IS NULL", [course_code]);
    res.json({ course: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/api/courses/:id -> Delete course (:id = course_code)
adminCoursesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id: course_code } = req.params;
    const check = await query("SELECT id FROM courses WHERE course_code = $1 AND session_date IS NULL", [course_code]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    await withTransaction(async (client) => {
      await client.query("DELETE FROM enrollments WHERE course_code = $1", [course_code]);
      await client.query("DELETE FROM testimonials WHERE course_code = $1", [course_code]);
      // Reservations cascade-delete when courses rows are deleted (FK ON DELETE CASCADE)
      await client.query("DELETE FROM courses WHERE course_code = $1", [course_code]);
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/courses/:id/import-participants -> Import email participants (:id = course_code)
adminCoursesRouter.post("/:id/import-participants", async (req, res, next) => {
  try {
    const { id: course_code } = req.params;
    const { emails } = req.body;

    if (!Array.isArray(emails)) {
      return res.status(400).json({ error: "EMAILS_ARRAY_REQUIRED" });
    }

    const courseRes = await query("SELECT * FROM courses WHERE course_code = $1 AND session_date IS NULL", [course_code]);
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

        const enrollRes = await client.query("SELECT id FROM enrollments WHERE user_id = $1 AND course_code = $2", [user.id, course_code]);
        if (enrollRes.rowCount) {
          existed_count++;
          continue;
        }

        await client.query(
          `INSERT INTO enrollments (user_id, course_code, completed_at, source, xp_earned, hours_earned)
           VALUES ($1, $2, NOW(), 'admin_import', $3, $4)`,
          [user.id, course_code, course.xp_reward, course.duration_hours]
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
        `UPDATE courses SET enrolled_count = (SELECT COUNT(*) FROM enrollments WHERE course_code = $1)
         WHERE course_code = $1 AND session_date IS NULL`,
        [course_code]
      );
    });

    res.json({
      total_in_file: emails.length,
      matched_and_enrolled: matched_count,
      already_existed: existed_count,
      not_found_in_system: not_found_count,
      not_found_emails,
    });
  } catch (error) {
    next(error);
  }
});
