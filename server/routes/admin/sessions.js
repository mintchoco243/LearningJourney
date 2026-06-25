import express from "express";
import { query, withTransaction } from "../../db.js";
import { sendMail } from "../../services/mail.js";

export const adminSessionsRouter = express.Router();

// GET /admin/api/sessions -> List all sessions
adminSessionsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, c.title AS course_title
       FROM course_sessions s
       JOIN courses c ON s.course_id = c.id
       ORDER BY s.session_date DESC, s.session_time DESC`
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/sessions -> Create session
adminSessionsRouter.post("/", async (req, res, next) => {
  try {
    const { course_id, session_date, session_time, location, max_participants } = req.body;

    if (!course_id || !session_date) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const checkCourse = await query("SELECT id FROM courses WHERE id = $1", [course_id]);
    if (!checkCourse.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });

    await query(
      `INSERT INTO course_sessions
         (course_id, session_date, session_time, location, max_participants, current_count, status)
       VALUES ($1, $2, $3, $4, $5, 0, 'open')`,
      [course_id, session_date, session_time || null, location || null, max_participants || null]
    );

    // Get the newly created session. Since MySQL doesn't support RETURNING, we query by date/time/course
    const result = await query(
      `SELECT * FROM course_sessions
       WHERE course_id = $1 AND session_date = $2
       ORDER BY created_at DESC LIMIT 1`,
      [course_id, session_date]
    );

    res.status(201).json({ session: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/api/sessions/:id -> Update session
adminSessionsRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { course_id, session_date, session_time, location, max_participants, status } = req.body;

    if (!course_id || !session_date) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const check = await query("SELECT id FROM course_sessions WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    await query(
      `UPDATE course_sessions
       SET course_id = $2,
           session_date = $3,
           session_time = $4,
           location = $5,
           max_participants = $6,
           status = $7
       WHERE id = $1`,
      [id, course_id, session_date, session_time || null, location || null, max_participants || null, status || "open"]
    );

    const result = await query("SELECT * FROM course_sessions WHERE id = $1", [id]);
    res.json({ session: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/api/sessions/:id -> Delete session
adminSessionsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM course_sessions WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    await query("DELETE FROM course_sessions WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/sessions/:id/reservations -> Get reservations list for a session
adminSessionsRouter.get("/:id/reservations", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM course_sessions WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    const result = await query(
      `SELECT r.*, u.full_name, u.email
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.session_id = $1
       ORDER BY r.reserved_at ASC`,
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
      `SELECT s.*, c.title AS course_title
       FROM course_sessions s
       JOIN courses c ON s.course_id = c.id
       WHERE s.id = $1`,
      [id]
    );
    if (!sessionRes.rowCount) return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    const session = sessionRes.rows[0];

    await withTransaction(async (client) => {
      // Update session status to confirmed
      await client.query("UPDATE course_sessions SET status = 'confirmed' WHERE id = $1", [id]);

      // Update reservations status to confirmed
      await client.query("UPDATE reservations SET status = 'confirmed' WHERE session_id = $1", [id]);

      // Fetch all reservation holders
      const usersRes = await client.query(
        `SELECT u.email, u.full_name
         FROM reservations r
         JOIN users u ON r.user_id = u.id
         WHERE r.session_id = $1`,
        [id]
      );

      // Trigger email notifications
      for (const user of usersRes.rows) {
        await sendMail({
          to: user.email,
          subject: `Xác nhận: Lớp [${session.course_title}] chính thức mở!`,
          html: `<p>Chào ${user.full_name},</p><p>Khóa học <strong>${session.course_title}</strong> mà bạn đã đăng ký đặt chỗ vào ngày <strong>${session.session_date}</strong> đã được Ban L&D xác nhận mở lớp chính thức.</p><p>Địa điểm: <strong>${session.location || "Online"}</strong>.</p>`,
        });
      }
    });

    res.json({ ok: true, status: "confirmed" });
  } catch (error) {
    next(error);
  }
});
