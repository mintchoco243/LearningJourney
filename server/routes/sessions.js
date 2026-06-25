import express from "express";
import { query, withTransaction } from "../db.js";

export const sessionsRouter = express.Router();

sessionsRouter.get("/", async (req, res) => {
  const params = [];
  const filters = ["c.is_active = TRUE"];
  if (req.query.month) {
    params.push(`${req.query.month}-01`);
    filters.push(`s.session_date >= $${params.length}::date`);
    params.push(`${req.query.month}-01`);
    filters.push(`s.session_date < ($${params.length}::date + INTERVAL '1 month')`);
  }
  if (req.query.course_id) {
    params.push(req.query.course_id);
    filters.push(`s.course_id = $${params.length}`);
  }

  const result = await query(
    `SELECT s.*, c.title, c.trainer, c.format, c.type, c.registration_url, c.description
     FROM course_sessions s
     JOIN courses c ON c.id = s.course_id
     WHERE ${filters.join(" AND ")}
     ORDER BY s.session_date ASC, s.session_time ASC`,
    params
  );
  res.json({ sessions: result.rows });
});

sessionsRouter.post("/:id/reserve", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const session = await client.query(
        `SELECT s.*, c.min_participants
         FROM course_sessions s
         JOIN courses c ON c.id = s.course_id
         WHERE s.id = $1 FOR UPDATE`,
        [req.params.id]
      );
      if (!session.rowCount) return null;
      if (session.rows[0].status === "cancelled") {
        const error = new Error("SESSION_CANCELLED");
        error.status = 409;
        throw error;
      }
      const reservation = await client.query(
        `INSERT INTO reservations (user_id, session_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, session_id) DO NOTHING
         RETURNING *`,
        [req.user.id, req.params.id]
      );
      if (!reservation.rowCount) {
        const error = new Error("ALREADY_RESERVED");
        error.status = 409;
        throw error;
      }
      const updated = await client.query(
        `UPDATE course_sessions
         SET current_count = current_count + 1,
             status = CASE
               WHEN max_participants IS NOT NULL AND current_count + 1 >= max_participants THEN 'full'
               ELSE status
             END
         WHERE id = $1
         RETURNING *`,
        [req.params.id]
      );
      return { reservation: reservation.rows[0], session: updated.rows[0] };
    });
    if (!result) return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

sessionsRouter.delete("/:id/reserve", async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      const deleted = await client.query(
        `UPDATE reservations
         SET status = 'cancelled'
         WHERE user_id = $1 AND session_id = $2 AND status <> 'cancelled'
         RETURNING *`,
        [req.user.id, req.params.id]
      );
      if (!deleted.rowCount) return null;
      await client.query(
        `UPDATE course_sessions
         SET current_count = GREATEST(current_count - 1, 0),
             status = CASE WHEN status = 'full' THEN 'open' ELSE status END
         WHERE id = $1`,
        [req.params.id]
      );
      return deleted.rows[0];
    });
    if (!result) return res.status(404).json({ error: "RESERVATION_NOT_FOUND" });
    res.json({ reservation: result });
  } catch (error) {
    next(error);
  }
});
