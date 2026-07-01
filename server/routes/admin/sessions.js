import express from "express";
import { query, withTransaction } from "../../db.js";
import { sendMail } from "../../services/mail.js";

export const adminSessionsRouter = express.Router();

// GET /admin/api/sessions -> List all sessions
adminSessionsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, course_code, title AS course_title, session_date, session_time,
              location, max_participants, current_count, session_status AS status, created_at
       FROM courses
       WHERE session_date IS NOT NULL
       ORDER BY session_date DESC, session_time DESC`
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/sessions -> Create session (copies course info from master row)
adminSessionsRouter.post("/", async (req, res, next) => {
  try {
    const { course_id, session_date, session_time, location, max_participants } = req.body;

    if (!course_id || !session_date) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const master = await query(
      "SELECT * FROM courses WHERE course_code = $1 AND session_date IS NULL",
      [course_id]
    );
    if (!master.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    // Insert session row by copying course info from master
    await query(
      `INSERT INTO courses
         (id, course_code, title, trainer, trainer_type, format, duration_hours,
          skill_tags, rank_targets, role_targets, type, min_participants, registration_url,
          description, xp_reward, is_active, status, material_url,
          session_date, session_time, location, max_participants, current_count, session_status)
       SELECT UUID(), course_code, title, trainer, trainer_type, format, duration_hours,
          skill_tags, rank_targets, role_targets, type, min_participants, registration_url,
          description, xp_reward, is_active, status, material_url,
          $2, $3, $4, $5, 0, 'open'
       FROM courses WHERE course_code = $1 AND session_date IS NULL LIMIT 1`,
      [course_id, session_date, session_time || null, location || null, max_participants || null]
    );

    const result = await query(
      `SELECT * FROM courses WHERE course_code = $1 AND session_date = $2 ORDER BY created_at DESC LIMIT 1`,
      [course_id, session_date]
    );

    res.status(201).json({ session: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/api/sessions/:id -> Update session (:id = session UUID)
adminSessionsRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { course_id, session_date, session_time, location, max_participants, status } = req.body;

    if (!course_id || !session_date) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const check = await query("SELECT id FROM courses WHERE id = $1 AND session_date IS NOT NULL", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    await query(
      `UPDATE courses
       SET course_code = $2, session_date = $3, session_time = $4,
           location = $5, max_participants = $6, session_status = $7
       WHERE id = $1`,
      [id, course_id, session_date, session_time || null, location || null, max_participants || null, status || "open"]
    );

    const result = await query("SELECT * FROM courses WHERE id = $1", [id]);
    res.json({ session: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/api/sessions/:id -> Delete session (:id = session UUID)
adminSessionsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM courses WHERE id = $1 AND session_date IS NOT NULL", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    await query("DELETE FROM courses WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/sessions/:id/reservations
adminSessionsRouter.get("/:id/reservations", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM courses WHERE id = $1 AND session_date IS NOT NULL", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

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

// POST /admin/api/sessions/:id/confirm -> Confirm session and notify participants
adminSessionsRouter.post("/:id/confirm", async (req, res, next) => {
  try {
    const { id } = req.params;

    const sessionRes = await query(
      "SELECT * FROM courses WHERE id = $1 AND session_date IS NOT NULL",
      [id]
    );
    if (!sessionRes.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    const session = sessionRes.rows[0];

    await withTransaction(async (client) => {
      await client.query("UPDATE courses SET session_status = 'confirmed' WHERE id = $1", [id]);
      await client.query("UPDATE reservations SET status = 'confirmed' WHERE session_id = $1", [id]);

      const usersRes = await client.query(
        `SELECT u.email, u.full_name FROM reservations r JOIN users u ON r.user_id = u.id WHERE r.session_id = $1`,
        [id]
      );

      for (const user of usersRes.rows) {
        await sendMail({
          to: user.email,
          subject: `Xác nhận: Lớp [${session.title}] chính thức mở!`,
          html: `<p>Chào ${user.full_name},</p><p>Khóa học <strong>${session.title}</strong> mà bạn đã đăng ký đặt chỗ vào ngày <strong>${session.session_date}</strong> đã được Ban L&D xác nhận mở lớp chính thức.</p><p>Địa điểm: <strong>${session.location || "Online"}</strong>.</p>`,
        });
      }
    });

    res.json({ ok: true, status: "confirmed" });
  } catch (error) {
    next(error);
  }
});
