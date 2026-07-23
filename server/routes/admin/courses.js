import express from "express";
import { query, withTransaction } from "../../db.js";
import { suggestXp } from "../../services/xpCalculator.js";
import { sendMail } from "../../services/mail.js";

export const adminCoursesRouter = express.Router();

// Single-source course model invariant:
// - Every row in `courses` is one learning item (scheduled class, interest pool,
//   e-learning, external course, or material).
// - `courses.id` is the only action identity for reserve/complete/import/review.
// - `course_code` is display/grouping only and may repeat.
// - `session_date` is just a schedule field on the row, not a separate entity
//   boundary. Do not recreate a master-course/session split here.

function normalizeRating(value) {
  if (value === undefined || value === null || value === "") return 0;
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : null;
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function normalizeStringArray(value, fieldName) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} must be an array of strings`);
    error.status = 400;
    error.code = `INVALID_${fieldName.toUpperCase()}`;
    throw error;
  }
  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

async function nextCourseCode() {
  const result = await query("SELECT course_code FROM courses");
  const max = result.rows.reduce((current, row) => {
    const match = String(row.course_code || "").match(/^LC-(\d+)$/i);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `LC-${String(max + 1).padStart(3, "0")}`;
}

async function refreshCourseCounts(client, id) {
  await client.query(
    `UPDATE courses
     SET current_count = (
           SELECT COUNT(*) FROM reservations
           WHERE session_id = $1 AND status <> 'cancelled'
         ),
         enrolled_count = (
           SELECT COUNT(*) FROM enrollments WHERE course_id = $1
         )
     WHERE id = $1`,
    [id]
  );
}

function csvEscape(value) {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sendCsv(res, filename, columns, rows) {
  const csv = [
    columns.map((column) => csvEscape(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column.key])).join(",")),
  ].join("\n");

  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
}

// GET /admin/api/courses -> List every learning row. Calendar is a view, not a data model.
adminCoursesRouter.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM reservations r WHERE r.session_id = c.id AND r.status <> 'cancelled') AS active_reservation_count,
              (SELECT COUNT(*) FROM reservations r WHERE r.session_id = c.id) AS reservation_count,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrollment_count
       FROM courses c
       ORDER BY
         CASE WHEN c.session_date IS NOT NULL AND c.session_date >= CURRENT_DATE THEN 0
              WHEN c.session_date IS NULL THEN 1
              ELSE 2 END,
         c.session_date ASC,
         c.updated_at DESC,
         c.created_at DESC`
    );
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
      id,
      course_code: bodyCourseCode,
      title, trainer, trainer_type, format, duration_hours,
      skill_tags, rank_targets, role_targets, type, min_participants,
      registration_url, description, xp_reward, rating, is_active, status, material_url,
      session_date, session_time, location, max_participants, is_hr_recommended,
    } = req.body;
    const course_code = String(id || bodyCourseCode || await nextCourseCode()).trim().toUpperCase();

    if (!course_code || !title || !trainer || !format || !duration_hours || !type || xp_reward === undefined) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }
    const normalizedRating = normalizeRating(rating);
    if (normalizedRating === null) return res.status(400).json({ error: "INVALID_RATING" });

    const cleanMin = (min_participants === "" || min_participants === undefined || min_participants === null) ? null : Number(min_participants);
    const cleanMax = (max_participants === "" || max_participants === undefined || max_participants === null) ? null : Number(max_participants);
    const normalizedSkillTags = normalizeStringArray(skill_tags, "skill_tags");
    const normalizedRankTargets = normalizeStringArray(rank_targets, "rank_targets");
    const normalizedRoleTargets = normalizeStringArray(role_targets, "role_targets");

    await query(
      `INSERT INTO courses
         (id, course_code, title, trainer, trainer_type, format, duration_hours,
          rating, skill_tags, rank_targets, role_targets, type, min_participants,
          registration_url, description, xp_reward, is_active, status, material_url,
          session_date, session_time, location, max_participants, current_count, session_status, is_hr_recommended)
       VALUES (UUID(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, 0, $17, $23)`,
      [
        course_code, title, trainer, trainer_type || "internal", format, duration_hours,
        normalizedRating, normalizedSkillTags, normalizedRankTargets, normalizedRoleTargets, type, cleanMin,
        registration_url, description, xp_reward,
        normalizeBoolean(is_active, true),
        status || "open", material_url || null,
        session_date || null, session_time || null, location || null, cleanMax,
        normalizeBoolean(is_hr_recommended),
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
      session_date, session_time, location, max_participants, is_hr_recommended,
    } = req.body;

    if (!title || !trainer || !format || !duration_hours || !type || xp_reward === undefined) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }
    const normalizedRating = normalizeRating(rating);
    if (normalizedRating === null) return res.status(400).json({ error: "INVALID_RATING" });

    const check = await query("SELECT id FROM courses WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    const cleanMin = (min_participants === "" || min_participants === undefined || min_participants === null) ? null : Number(min_participants);
    const cleanMax = (max_participants === "" || max_participants === undefined || max_participants === null) ? null : Number(max_participants);
    const normalizedSkillTags = normalizeStringArray(skill_tags, "skill_tags");
    const normalizedRankTargets = normalizeStringArray(rank_targets, "rank_targets");
    const normalizedRoleTargets = normalizeStringArray(role_targets, "role_targets");

    await query(
      `UPDATE courses
       SET course_code = $2, title = $3, trainer = $4, trainer_type = $5, format = $6, duration_hours = $7,
           rating = $8, skill_tags = $9, rank_targets = $10, role_targets = $11, type = $12,
           min_participants = $13, registration_url = $14, description = $15,
           xp_reward = $16, is_active = $17, status = $18, material_url = $19,
           session_date = $20, session_time = $21, location = $22, max_participants = $23,
           session_status = $18, is_hr_recommended = $24,
           updated_at = NOW()
       WHERE id = $1`,
      [
        id, course_code || id, title, trainer, trainer_type || "internal", format, duration_hours,
        normalizedRating, normalizedSkillTags, normalizedRankTargets, normalizedRoleTargets, type, cleanMin,
        registration_url, description, xp_reward,
        normalizeBoolean(is_active, true),
        status || "open", material_url || null,
        session_date || null, session_time || null, location || null, cleanMax,
        normalizeBoolean(is_hr_recommended),
      ]
    );

    const result = await query("SELECT * FROM courses WHERE id = $1", [id]);
    res.json({ course: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/api/courses/:id -> Hard-delete only unused rows; otherwise preserve history by cancelling/hiding.
adminCoursesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM courses WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    const result = await withTransaction(async (client) => {
      const activity = await client.query(
        `SELECT
           (SELECT COUNT(*) FROM enrollments WHERE course_id = $1) AS enrollments,
           (SELECT COUNT(*) FROM testimonials WHERE course_id = $1) AS testimonials,
           (SELECT COUNT(*) FROM reservations WHERE session_id = $1) AS reservations`,
        [id]
      );
      const row = activity.rows[0] || {};
      const hasActivity = Number(row.enrollments || 0) + Number(row.testimonials || 0) + Number(row.reservations || 0) > 0;
      if (!hasActivity) {
        await client.query("DELETE FROM courses WHERE id = $1", [id]);
        return { ok: true, mode: "deleted" };
      }
      await client.query(
        `UPDATE courses
         SET is_active = FALSE, status = 'cancelled', session_status = 'cancelled', updated_at = NOW()
         WHERE id = $1`,
        [id]
      );
      return { ok: true, mode: "cancelled" };
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/courses/:id/reservations -> Attendees/bookings for this row.
adminCoursesRouter.get("/:id/reservations", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM courses WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    const result = await query(
      `SELECT r.*, u.full_name, u.email
       FROM reservations r JOIN users u ON r.user_id = u.id
       WHERE r.session_id = $1 ORDER BY r.reserved_at ASC`,
      [id]
    );
    res.json({ reservations: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/courses/:id/reservations/export -> CSV of attendees/bookings for this row.
adminCoursesRouter.get("/:id/reservations/export", async (req, res, next) => {
  try {
    const { id } = req.params;
    const courseRes = await query("SELECT course_code, title FROM courses WHERE id = $1", [id]);
    if (!courseRes.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    const result = await query(
      `SELECT c.course_code, c.title AS course_title, c.session_date, c.session_time,
              r.status, r.reserved_at,
              u.full_name, u.email, u.role, u.rank
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN courses c ON c.id = r.session_id
       WHERE r.session_id = $1
       ORDER BY r.reserved_at ASC`,
      [id]
    );

    sendCsv(
      res,
      `${courseRes.rows[0].course_code || "course"}-reservations.csv`,
      [
        { key: "course_code", label: "course_code" },
        { key: "course_title", label: "course_title" },
        { key: "session_date", label: "session_date" },
        { key: "session_time", label: "session_time" },
        { key: "full_name", label: "full_name" },
        { key: "email", label: "email" },
        { key: "role", label: "role" },
        { key: "rank", label: "rank" },
        { key: "status", label: "booking_status" },
        { key: "reserved_at", label: "reserved_at" },
      ],
      result.rows
    );
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/courses/:id/completions -> Users marked as completed for this row.
adminCoursesRouter.get("/:id/completions", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM courses WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    const result = await query(
      `SELECT e.*, u.full_name, u.email
       FROM enrollments e JOIN users u ON e.user_id = u.id
       WHERE e.course_id = $1 ORDER BY e.completed_at ASC`,
      [id]
    );
    res.json({ completions: result.rows });
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/courses/:id/completions/export -> CSV of completed users for this row.
adminCoursesRouter.get("/:id/completions/export", async (req, res, next) => {
  try {
    const { id } = req.params;
    const courseRes = await query("SELECT course_code, title FROM courses WHERE id = $1", [id]);
    if (!courseRes.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    const result = await query(
      `SELECT c.course_code, c.title AS course_title, e.completed_at, e.source,
              e.xp_earned, e.hours_earned,
              u.full_name, u.email, u.role, u.rank
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON c.id = e.course_id
       WHERE e.course_id = $1
       ORDER BY e.completed_at ASC`,
      [id]
    );

    sendCsv(
      res,
      `${courseRes.rows[0].course_code || "course"}-completions.csv`,
      [
        { key: "course_code", label: "course_code" },
        { key: "course_title", label: "course_title" },
        { key: "full_name", label: "full_name" },
        { key: "email", label: "email" },
        { key: "role", label: "role" },
        { key: "rank", label: "rank" },
        { key: "completed_at", label: "completed_at" },
        { key: "source", label: "completion_source" },
        { key: "xp_earned", label: "xp_earned" },
        { key: "hours_earned", label: "hours_earned" },
      ],
      result.rows
    );
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/courses/:id/confirm -> Confirm this learning row and notify booked users.
adminCoursesRouter.post("/:id/confirm", async (req, res, next) => {
  try {
    const { id } = req.params;

    const courseRes = await query("SELECT * FROM courses WHERE id = $1", [id]);
    if (!courseRes.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    const course = courseRes.rows[0];

    await withTransaction(async (client) => {
      await client.query(
        "UPDATE courses SET status = 'confirmed', session_status = 'confirmed', updated_at = NOW() WHERE id = $1",
        [id]
      );
      await client.query("UPDATE reservations SET status = 'confirmed' WHERE session_id = $1 AND status <> 'cancelled'", [id]);
      await refreshCourseCounts(client, id);

      const usersRes = await client.query(
        `SELECT u.email, u.full_name FROM reservations r JOIN users u ON r.user_id = u.id
         WHERE r.session_id = $1 AND r.status = 'confirmed'`,
        [id]
      );

      for (const user of usersRes.rows) {
        await sendMail({
          to: user.email,
          subject: `Xác nhận: Lớp [${course.title}] chính thức mở!`,
          html: `<p>Chào ${user.full_name},</p><p>Khóa học <strong>${course.title}</strong>${course.session_date ? ` vào ngày <strong>${course.session_date}</strong>` : ""} đã được Ban L&D xác nhận mở lớp chính thức.</p><p>Địa điểm: <strong>${course.location || "Online"}</strong>.</p>`,
        });
      }
    });

    res.json({ ok: true, status: "confirmed" });
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

      await refreshCourseCounts(client, id);
    });

    res.json({
      total_in_file: emails.length,
      matched_and_enrolled: matched_count,
      already_completed: existed_count,
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
