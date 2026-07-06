import express from "express";
import { query, withTransaction } from "../../db.js";

export const adminUsersRouter = express.Router();

const USER_UPDATE_FIELDS = new Set(["team", "rank", "role", "notes", "is_active"]);
const RESERVATION_STATUSES = new Set(["pending", "confirmed", "cancelled"]);
const RECORD_STATUSES = new Set(["completed", "not_completed", "in_progress", "enrolled", "cancelled"]);

function normalizeIds(value) {
  return Array.isArray(value) ? value.map((id) => String(id || "").trim()).filter(Boolean) : [];
}

function isInactive(user) {
  return user?.is_active === false || user?.is_active === 0;
}

function dataStatus(user) {
  if (isInactive(user)) return "inactive";
  const missing = ["team", "rank", "role"].filter((key) => !String(user[key] || "").trim());
  return missing.length ? "missing_profile" : "ready";
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

function buildInClause(ids, startIndex = 1) {
  return ids.map((_, index) => `$${startIndex + index}`).join(",");
}

async function recalcUserLearningTotals(client, userId) {
  await client.query(
    `UPDATE users
     SET xp_total = COALESCE((SELECT SUM(xp_earned) FROM enrollments WHERE user_id = $1), 0),
         hours_total = COALESCE((SELECT SUM(hours_earned) FROM enrollments WHERE user_id = $1), 0),
         updated_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

async function refreshCourseCounts(client, courseId) {
  await client.query(
    `UPDATE courses
     SET current_count = (
           SELECT COUNT(*) FROM reservations
           WHERE session_id = $1 AND status <> 'cancelled'
         ),
         enrolled_count = (
           SELECT COUNT(*) FROM enrollments WHERE course_id = $1
         ),
         updated_at = NOW()
     WHERE id = $1`,
    [courseId],
  );
}

function mapUser(row) {
  const enrollments = Number(row.enrollments_count || 0);
  const completed = Number(row.completed_courses_count ?? row.enrollments_count ?? 0);
  return {
    ...row,
    is_active: row.is_active === undefined ? true : Boolean(row.is_active),
    enrollments_count: enrollments,
    completed_courses_count: completed,
    reservations_count: Number(row.reservations_count || 0),
    data_status: dataStatus(row),
  };
}

async function getUserDetail(id) {
  const userRes = await query("SELECT * FROM users WHERE id = $1", [id]);
  if (!userRes.rowCount) return null;

  const enrollmentsRes = await query(
    `SELECT e.*, c.course_code, c.title AS course_title, c.session_date, c.session_time, c.location
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1
     ORDER BY e.completed_at DESC`,
    [id],
  );

  const reservationsRes = await query(
    `SELECT r.*, s.course_code, s.session_date, s.session_time, s.location, s.title AS course_title
     FROM reservations r
     JOIN courses s ON r.session_id = s.id
     WHERE r.user_id = $1
     ORDER BY s.session_date DESC`,
    [id],
  );

  const reservationByCourse = new Map(reservationsRes.rows.map((row) => [row.session_id, row]));
  const completedCourseIds = new Set(enrollmentsRes.rows.map((row) => row.course_id));
  const learningHistory = [
    ...enrollmentsRes.rows.map((row) => {
      const reservation = reservationByCourse.get(row.course_id);
      return {
        id: `${row.course_id}:record`,
        course_id: row.course_id,
        course_code: row.course_code,
        course_title: row.course_title,
        session_date: row.session_date,
        session_time: row.session_time,
        location: row.location,
        reservation_id: reservation?.id || null,
        reservation_status: reservation?.status || null,
        reservation_reserved_at: reservation?.reserved_at || null,
        record_id: row.id,
        user_course_status: "completed",
        status: "completed",
        completed_at: row.completed_at,
        source: row.source,
        xp_earned: row.xp_earned,
        hours_earned: row.hours_earned,
      };
    }),
    ...reservationsRes.rows
      .filter((row) => !completedCourseIds.has(row.session_id))
      .map((row) => ({
        id: `${row.session_id}:reservation`,
        course_id: row.session_id,
        course_code: row.course_code,
        course_title: row.course_title,
        session_date: row.session_date,
        session_time: row.session_time,
        location: row.location,
        reservation_id: row.id,
        reservation_status: row.status || "pending",
        reservation_reserved_at: row.reserved_at,
        record_id: null,
        user_course_status: "not_completed",
        status: "not_completed",
        completed_at: null,
        source: "reservation",
        xp_earned: 0,
        hours_earned: 0,
      })),
  ].sort((a, b) => {
    const aDate = new Date(a.completed_at || a.reservation_reserved_at || a.session_date || 0).getTime();
    const bDate = new Date(b.completed_at || b.reservation_reserved_at || b.session_date || 0).getTime();
    return bDate - aDate;
  });

  return {
    user: mapUser(userRes.rows[0]),
    enrollments: enrollmentsRes.rows,
    reservations: reservationsRes.rows,
    learning_history: learningHistory,
  };
}

// GET /admin/api/users -> List all users + summary stats
adminUsersRouter.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrollments_count,
              (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS completed_courses_count,
              (SELECT COUNT(*) FROM reservations r WHERE r.user_id = u.id) AS reservations_count,
              NULLIF(GREATEST(
                COALESCE((SELECT MAX(e.completed_at) FROM enrollments e WHERE e.user_id = u.id), '1970-01-01'),
                COALESCE((SELECT MAX(r.reserved_at) FROM reservations r WHERE r.user_id = u.id), '1970-01-01')
              ), '1970-01-01') AS last_activity
       FROM users u
       ORDER BY u.xp_total DESC, u.full_name ASC`,
    );
    res.json({ users: result.rows.map(mapUser) });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.post("/bulk", async (req, res, next) => {
  try {
    const ids = normalizeIds(req.body?.ids);
    const updates = Object.fromEntries(
      Object.entries(req.body?.updates || {}).filter(([key]) => USER_UPDATE_FIELDS.has(key)),
    );
    if (!ids.length) return res.status(400).json({ error: "USER_IDS_REQUIRED" });
    if (!Object.keys(updates).length) return res.status(400).json({ error: "UPDATES_REQUIRED" });

    const setParts = [];
    const params = [];
    for (const [key, value] of Object.entries(updates)) {
      params.push(key === "is_active" ? Boolean(value) : value || null);
      setParts.push(`${key} = $${params.length}`);
    }
    const idsClause = buildInClause(ids, params.length + 1);
    await query(
      `UPDATE users SET ${setParts.join(", ")}, updated_at = NOW() WHERE id IN (${idsClause})`,
      [...params, ...ids],
    );

    const result = await query(
      `SELECT * FROM users WHERE id IN (${buildInClause(ids)}) ORDER BY full_name ASC`,
      ids,
    );
    res.json({ ok: true, updated: result.rowCount, users: result.rows.map(mapUser) });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.post("/export", async (req, res, next) => {
  try {
    const ids = normalizeIds(req.body?.ids);
    if (!ids.length) return res.status(400).json({ error: "USER_IDS_REQUIRED" });
    const result = await query(
      `SELECT u.email, u.full_name, u.team, u.rank, u.role, u.weekly_hours, u.preferred_trainers,
              u.is_active, u.notes,
              (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS completed_courses_count,
              (SELECT COUNT(*) FROM reservations r WHERE r.user_id = u.id) AS reservations_count
       FROM users u
       WHERE u.id IN (${buildInClause(ids)})
       ORDER BY u.full_name ASC`,
      ids,
    );
    sendCsv(
      res,
      "selected-users.csv",
      [
        { key: "full_name", label: "full_name" },
        { key: "email", label: "email" },
        { key: "team", label: "team" },
        { key: "rank", label: "rank" },
        { key: "role", label: "role" },
        { key: "weekly_hours", label: "weekly_hours" },
        { key: "preferred_trainers", label: "preferred_trainers" },
        { key: "completed_courses_count", label: "completed_courses_count" },
        { key: "reservations_count", label: "reservations_count" },
        { key: "is_active", label: "is_active" },
        { key: "notes", label: "notes" },
      ],
      result.rows,
    );
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/users/:id -> User detail + enrollments + reservations
adminUsersRouter.get("/:id", async (req, res, next) => {
  try {
    const detail = await getUserDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: "USER_NOT_FOUND" });
    res.json(detail);
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => USER_UPDATE_FIELDS.has(key)),
    );
    if (!Object.keys(updates).length) return res.status(400).json({ error: "UPDATES_REQUIRED" });

    const exists = await query("SELECT id FROM users WHERE id = $1", [id]);
    if (!exists.rowCount) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const setParts = [];
    const params = [id];
    for (const [key, value] of Object.entries(updates)) {
      params.push(key === "is_active" ? Boolean(value) : value || null);
      setParts.push(`${key} = $${params.length}`);
    }
    await query(`UPDATE users SET ${setParts.join(", ")}, updated_at = NOW() WHERE id = $1`, params);
    const detail = await getUserDetail(id);
    res.json({ ok: true, ...detail });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.put("/:id/reservations/:reservationId", async (req, res, next) => {
  try {
    const { id, reservationId } = req.params;
    const status = String(req.body?.status || "").trim();
    if (status && !RESERVATION_STATUSES.has(status)) {
      return res.status(400).json({ error: "INVALID_RESERVATION_STATUS" });
    }

    const current = await query(
      "SELECT * FROM reservations WHERE id = $1 AND user_id = $2",
      [reservationId, id],
    );
    if (!current.rowCount) return res.status(404).json({ error: "RESERVATION_NOT_FOUND" });

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE reservations
         SET status = $3,
             reserved_at = COALESCE($4, reserved_at),
             notified_at = $5
         WHERE id = $1 AND user_id = $2`,
        [
          reservationId,
          id,
          status || current.rows[0].status || "pending",
          req.body?.reserved_at || null,
          req.body?.notified_at || current.rows[0].notified_at || null,
        ],
      );
      await refreshCourseCounts(client, current.rows[0].session_id);
    });

    const detail = await getUserDetail(id);
    res.json({ ok: true, ...detail });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.put("/:id/records", async (req, res, next) => {
  try {
    const { id } = req.params;
    const courseId = String(req.body?.course_id || "").trim();
    const status = String(req.body?.status || "completed").trim();
    if (!courseId) return res.status(400).json({ error: "COURSE_ID_REQUIRED" });
    if (!RECORD_STATUSES.has(status)) return res.status(400).json({ error: "INVALID_RECORD_STATUS" });

    const courseRes = await query("SELECT id, xp_reward, duration_hours FROM courses WHERE id = $1", [courseId]);
    if (!courseRes.rowCount) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
    const course = courseRes.rows[0];

    await withTransaction(async (client) => {
      if (status !== "completed") {
        await client.query("DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2", [id, courseId]);
      } else {
        await client.query(
          `INSERT INTO enrollments (user_id, course_id, completed_at, source, xp_earned, hours_earned)
           VALUES ($1, $2, COALESCE($3, NOW()), $4, $5, $6)
           ON DUPLICATE KEY UPDATE
             completed_at = VALUES(completed_at),
             source = VALUES(source),
             xp_earned = VALUES(xp_earned),
             hours_earned = VALUES(hours_earned)`,
          [
            id,
            courseId,
            req.body?.completed_at || null,
            req.body?.source || "admin_edit",
            Number(req.body?.xp_earned ?? course.xp_reward ?? 0),
            Number(req.body?.hours_earned ?? course.duration_hours ?? 0),
          ],
        );
      }
      await recalcUserLearningTotals(client, id);
      await refreshCourseCounts(client, courseId);
    });

    const detail = await getUserDetail(id);
    res.json({ ok: true, ...detail });
  } catch (error) {
    next(error);
  }
});
