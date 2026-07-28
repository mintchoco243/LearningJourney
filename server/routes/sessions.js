import express from "express";
import { query, withTransaction } from "../db.js";
import { sendMail } from "../services/mail.js";
import { attachPublicCourseRatings } from "../services/publicCourseRatings.js";

export const sessionsRouter = express.Router();

// Compatibility calendar view over `courses`.
// `session_date IS NOT NULL` is allowed here only to render calendar/upcoming
// views. It must not become a separate session data model again.
sessionsRouter.get("/", async (req, res) => {
  const params = [];
  const filters = [
    "c.is_active = TRUE",
    "c.status <> 'draft'",
    "c.type IN ('scheduled', 'interest')",
    "c.session_date IS NOT NULL",
  ];
  if (req.query.month) {
    params.push(`${req.query.month}-01`);
    filters.push(`c.session_date >= $${params.length}`);
    params.push(`${req.query.month}-01`);
    filters.push(`c.session_date < DATE_ADD($${params.length}, INTERVAL 1 MONTH)`);
  }
  if (req.query.course_id) {
    params.push(req.query.course_id);
    filters.push(`(c.id = $${params.length} OR c.course_code = $${params.length})`);
  }

  const result = await query(
    `SELECT c.id, c.course_code, c.title, c.trainer, c.format, c.type, c.registration_url,
            c.description, c.duration_hours, c.xp_reward, c.rating, c.status AS course_status, c.material_url,
            c.skill_tags, c.min_participants, c.session_date, c.session_time, c.location,
            c.max_participants, c.current_count, c.session_status AS status
     FROM courses c
     WHERE ${filters.join(" AND ")}
     ORDER BY c.session_date ASC, c.session_time ASC`,
    params
  );
  const sessions = await attachPublicCourseRatings(result.rows);
  res.json({ sessions });
});

sessionsRouter.post("/:id/reserve", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const session = await client.query(
        `SELECT c.*, c.min_participants, c.title AS course_title
         FROM courses c
         WHERE c.id = $1 AND c.is_active = TRUE
           AND (c.type IN ('scheduled', 'interest') OR c.session_date IS NOT NULL)
         FOR UPDATE`,
        [req.params.id]
      );
      if (!session.rowCount) return null;
      if (session.rows[0].status === "cancelled" || session.rows[0].session_status === "cancelled") {
        const error = new Error("SESSION_CANCELLED");
        error.status = 409;
        throw error;
      }
      if (session.rows[0].status === "full" || session.rows[0].session_status === "full") {
        const error = new Error("SESSION_FULL");
        error.status = 409;
        throw error;
      }
      const insertResult = await client.query(
        `INSERT IGNORE INTO reservations (user_id, session_id)
         VALUES ($1, $2)`,
        [req.user.id, req.params.id]
      );
      if (!insertResult.rowCount) {
        const error = new Error("ALREADY_RESERVED");
        error.status = 409;
        throw error;
      }

      const minParticipants = session.rows[0].min_participants;
      const maxParticipants = session.rows[0].max_participants;
      const countRes = await client.query(
        "SELECT COUNT(*) AS count FROM reservations WHERE session_id = $1 AND status <> 'cancelled'",
        [req.params.id]
      );
      const newCount = Number(countRes.rows[0]?.count || 0);
      const oldCount = Math.max(newCount - 1, 0);
      const triggerSessionFull = minParticipants !== null && oldCount < minParticipants && newCount >= minParticipants;
      const triggerCapacityFull = maxParticipants !== null && newCount >= maxParticipants;

      await client.query(
        `UPDATE courses
         SET current_count = $2,
             status = CASE
               WHEN max_participants IS NOT NULL AND $2 >= max_participants THEN 'full'
               WHEN min_participants IS NOT NULL AND type = 'interest' AND $2 >= min_participants THEN 'full'
               ELSE status
             END,
             session_status = CASE
               WHEN max_participants IS NOT NULL AND $2 >= max_participants THEN 'full'
               ELSE session_status
             END,
             updated_at = NOW()
         WHERE id = $1`,
        [req.params.id, newCount]
      );
      const reservation = await client.query(
        "SELECT * FROM reservations WHERE user_id = $1 AND session_id = $2",
        [req.user.id, req.params.id]
      );
      const updated = await client.query("SELECT * FROM courses WHERE id = $1", [req.params.id]);
      return {
        reservation: reservation.rows[0],
        session: updated.rows[0],
        course_title: session.rows[0].title,
        session_date: session.rows[0].session_date,
        type: session.rows[0].type,
        triggerSessionFull,
        triggerCapacityFull,
      };
    });

    if (!result) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    await sendMail({
      to: req.user.email,
      subject: `Xác nhận đặt chỗ: ${result.course_title}`,
      html: result.session_date
        ? `<p>Chào bạn,</p><p>Bạn đã đăng ký thành công khóa học <strong>${result.course_title}</strong> diễn ra vào ngày <strong>${result.session_date}</strong>.</p>`
        : `<p>Chào bạn,</p><p>Bạn đã đặt chỗ thành công cho khóa học <strong>${result.course_title}</strong>. Ban L&D sẽ thông báo khi lớp đủ nhu cầu và có lịch tổ chức.</p>`,
    });

    if (result.triggerSessionFull || result.triggerCapacityFull) {
      const participants = await query(
        `SELECT u.email, u.full_name FROM reservations r JOIN users u ON r.user_id = u.id WHERE r.session_id = $1`,
        [req.params.id]
      );
      for (const p of participants.rows) {
        await sendMail({
          to: p.email,
          subject: `Lớp [${result.course_title}] đã đủ người!`,
          html: result.session_date
            ? `<p>Chào ${p.full_name},</p><p>Lớp học <strong>${result.course_title}</strong> vào ngày <strong>${result.session_date}</strong> đã đạt đủ số lượng.</p><p>Ban L&D sẽ sớm gửi xác nhận chính thức.</p>`
            : `<p>Chào ${p.full_name},</p><p>Khóa học <strong>${result.course_title}</strong> đã đạt đủ số lượng tối thiểu để L&D xem xét mở lớp.</p><p>Ban L&D sẽ cập nhật lịch tổ chức sau.</p>`,
        });
      }
      const admins = await query(
        `SELECT email, full_name FROM admin_accounts WHERE is_active = TRUE`
      );
      for (const admin of admins.rows) {
        await sendMail({
          to: admin.email,
          subject: `Khóa [${result.course_title}] đã đủ nhu cầu mở lớp`,
          html: `<p>Chào ${admin.full_name || "Admin"},</p><p>Khóa học <strong>${result.course_title}</strong> đã đạt ngưỡng ${result.triggerCapacityFull ? "sức chứa tối đa" : "số người tối thiểu"}.</p><p>Vui lòng vào Admin để kiểm tra danh sách đăng ký và cập nhật lịch tổ chức nếu cần.</p>`,
        });
      }
    }

    res.status(201).json({ reservation: result.reservation, session: result.session });
  } catch (error) {
    next(error);
  }
});

sessionsRouter.delete("/:id/reserve", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const updateResult = await client.query(
        `UPDATE reservations SET status = 'cancelled'
         WHERE user_id = $1 AND session_id = $2 AND status <> 'cancelled'`,
        [req.user.id, req.params.id]
      );
      if (!updateResult.rowCount) return null;
      const countRes = await client.query(
        "SELECT COUNT(*) AS count FROM reservations WHERE session_id = $1 AND status <> 'cancelled'",
        [req.params.id]
      );
      const activeCount = Number(countRes.rows[0]?.count || 0);
      await client.query(
        `UPDATE courses
         SET current_count = $2,
             status = CASE WHEN status = 'full' THEN 'open' ELSE status END,
             session_status = CASE WHEN session_status = 'full' THEN 'open' ELSE session_status END,
             updated_at = NOW()
         WHERE id = $1`,
        [req.params.id, activeCount]
      );
      const cancelled = await client.query(
        "SELECT * FROM reservations WHERE user_id = $1 AND session_id = $2",
        [req.user.id, req.params.id]
      );
      return cancelled.rows[0];
    });
    if (!result) return res.status(404).json({ error: "RESERVATION_NOT_FOUND" });
    res.json({ reservation: result });
  } catch (error) {
    next(error);
  }
});
