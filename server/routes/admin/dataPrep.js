import express from "express";
import crypto from "node:crypto";
import { query, withTransaction } from "../../db.js";

export const adminDataPrepRouter = express.Router();

// Legacy CSV/data-prep area. Runtime course management is row-level in
// /admin/api/courses. Do not use this file to recreate a master course/session
// data model; keep it only as a compatibility import path while needed.
const specs = {
  courses: {
    table: "staging_courses",
    columns: [
      "course_id",
      "title",
      "description",
      "trainer",
      "trainer_type",
      "format",
      "duration_hours",
      "rating",
      "skill_tags",
      "rank_targets",
      "role_targets",
      "type",
      "min_participants",
      "registration_url",
      "xp_reward",
      "is_active",
      "status",
      "material_url",
    ],
  },
  catalog: {
    table: "staging_catalog",
    columns: [
      "course_code",
      "title",
      "description",
      "trainer",
      "trainer_type",
      "format",
      "duration_hours",
      "rating",
      "skill_tags",
      "rank_targets",
      "role_targets",
      "type",
      "min_participants",
      "registration_url",
      "xp_reward",
      "is_active",
      "status",
      "material_url",
      "session_date",
      "session_time",
      "location",
      "max_participants",
    ],
  },
  sessions: {
    table: "staging_sessions",
    columns: [
      "course_id",
      "session_date",
      "session_time",
      "location",
      "trainer",
      "min_participants",
      "max_participants",
      "status",
    ],
  },
  policies: {
    table: "staging_policies",
    columns: ["category", "title", "content", "is_active", "order_index"],
  },
  "admin-accounts": {
    table: "staging_admin_accounts",
    columns: ["email", "full_name", "role", "is_active"],
  },
  users: {
    table: "staging_users",
    columns: [
      "email",
      "full_name",
      "rank",
      "role",
      "team",
      "learning_formats",
      "weekly_hours",
      "preferred_trainers",
      "learning_goals",
    ],
  },
};

const validAdminRoles = new Set(["super_admin", "admin", "editor"]);
const validFormats = new Set(["online", "offline", "elearning", "webinar", "workshop", "bootcamp", "talk"]);
const validTypes = new Set(["scheduled", "interest", "elearning", "external", "material_only"]);
const validCourseStatuses = new Set(["draft", "open", "full", "ended", "cancelled"]);

function getSpec(type) {
  const spec = specs[type];
  if (!spec) {
    const error = new Error("UNKNOWN_DATA_TYPE");
    error.status = 404;
    throw error;
  }
  return spec;
}

function clean(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function boolValue(value) {
  const text = clean(value).toLowerCase();
  if (["", "true", "1", "yes", "y"].includes(text)) return true;
  if (["false", "0", "no", "n"].includes(text)) return false;
  return null;
}

function numberValue(value) {
  const text = clean(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function isDateText(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(clean(value));
}

// RFC4180 CSV parser: handles quoted fields with embedded commas/quotes/newlines.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") pushField();
    else if (c === "\r") continue;
    else if (c === "\n") pushRow();
    else field += c;
  }
  if (field.length || row.length) pushRow();
  return rows;
}

// CSV text -> array of { column: value } objects keyed by header row.
export function csvToRows(csvText) {
  const grid = parseCsv(csvText).filter((r) => r.length > 1 || r[0] !== "");
  const [header, ...dataRows] = grid;
  if (!header) return [];
  const normalizedHeaders = header.map((h) => normalizeHeaderName(h));
  return dataRows.map((cells) => {
    const obj = {};
    normalizedHeaders.forEach((h, i) => { obj[h] = cells[i]; });
    return obj;
  });
}

function normalizeHeaderName(header) {
  const normalized = clean(header)
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const aliases = {
    learning_format: "learning_formats",
    learning_formats: "learning_formats",
    preferred_trainer: "preferred_trainers",
    preferred_trainers: "preferred_trainers",
    prefferd_trainer: "preferred_trainers",
    prefferd_trainers: "preferred_trainers",
  };
  return aliases[normalized] || normalized;
}

// Sheet multi-value cell ("A, B, C") -> JSON array text for MySQL JSON columns.
export function toJsonArray(text) {
  return JSON.stringify(String(text || "").split(",").map((s) => s.trim()).filter(Boolean));
}

async function knownCourseIds() {
  const [live, staged] = await Promise.all([
    query("SELECT DISTINCT course_code AS course_id FROM courses"),
    query("SELECT DISTINCT course_id FROM staging_courses"),
  ]);
  return new Set([...live.rows, ...staged.rows].map((row) => clean(row.course_id)));
}

async function validateRows(type, inputRows) {
  const spec = getSpec(type);
  const rows = Array.isArray(inputRows) ? inputRows : [];
  const seenCourseIds = new Set();
  const courses = type === "sessions" ? await knownCourseIds() : null;

  return rows.map((input, index) => {
    const row = {};
    for (const column of spec.columns) row[column] = clean(input[column]);
    const errors = [];

    if (type === "courses") {
      if (!row.course_id) errors.push("course_id is required");
      if (seenCourseIds.has(row.course_id)) errors.push("course_id is duplicated in this import");
      seenCourseIds.add(row.course_id);
      if (!row.title) errors.push("title is required");
      if (!row.trainer) errors.push("trainer is required");
      if (!row.format) errors.push("format is required");
      if (row.format && !validFormats.has(row.format)) errors.push("format must be online/offline/elearning/webinar/workshop/bootcamp/talk");
      if (!row.type) errors.push("type is required");
      if (row.type && !validTypes.has(row.type)) errors.push("type must be scheduled/interest/elearning/external/material_only");
      if (!row.duration_hours) errors.push("duration_hours is required");
      if (row.duration_hours && numberValue(row.duration_hours) === null) errors.push("duration_hours must be a number");
      if (row.rating && (numberValue(row.rating) === null || numberValue(row.rating) < 0 || numberValue(row.rating) > 5)) errors.push("rating must be a number from 0 to 5");
      if (row.min_participants && numberValue(row.min_participants) === null) errors.push("min_participants must be a number");
      if (!row.xp_reward) errors.push("xp_reward is required");
      if (row.xp_reward && numberValue(row.xp_reward) === null) errors.push("xp_reward must be a number");
      if (boolValue(row.is_active) === null) errors.push("is_active must be true/false");
      if (row.status && !validCourseStatuses.has(row.status)) errors.push("status must be draft/open/full/ended/cancelled");
    }

    if (type === "sessions") {
      if (!row.course_id) errors.push("course_id is required");
      if (row.course_id && !courses.has(row.course_id)) errors.push("course_id does not exist in draft or live courses");
      if (!row.session_date) errors.push("session_date is required");
      if (row.session_date && !isDateText(row.session_date)) errors.push("session_date must be YYYY-MM-DD");
      if (row.min_participants && numberValue(row.min_participants) === null) errors.push("min_participants must be a number");
      if (row.max_participants && numberValue(row.max_participants) === null) errors.push("max_participants must be a number");
    }

    if (type === "catalog") {
      // course_code repeats across rows on purpose (one course, many sessions) — no duplicate check.
      if (!row.course_code) errors.push("course_code is required");
      if (!row.title) errors.push("title is required");
      if (!row.trainer) errors.push("trainer is required");
      if (!row.format) errors.push("format is required");
      if (row.format && !validFormats.has(row.format)) errors.push("format must be online/offline/elearning/webinar/workshop/bootcamp/talk");
      if (!row.type) errors.push("type is required");
      if (row.type && !validTypes.has(row.type)) errors.push("type must be scheduled/interest/elearning/external/material_only");
      if (!row.duration_hours) errors.push("duration_hours is required");
      if (row.duration_hours && numberValue(row.duration_hours) === null) errors.push("duration_hours must be a number");
      if (row.rating && (numberValue(row.rating) === null || numberValue(row.rating) < 0 || numberValue(row.rating) > 5)) errors.push("rating must be a number from 0 to 5");
      if (row.min_participants && numberValue(row.min_participants) === null) errors.push("min_participants must be a number");
      if (!row.xp_reward) errors.push("xp_reward is required");
      if (row.xp_reward && numberValue(row.xp_reward) === null) errors.push("xp_reward must be a number");
      if (boolValue(row.is_active) === null) errors.push("is_active must be true/false");
      if (row.status && !validCourseStatuses.has(row.status)) errors.push("status must be draft/open/full/ended/cancelled");
      if (row.session_date && !isDateText(row.session_date)) errors.push("session_date must be YYYY-MM-DD");
      if (row.max_participants && numberValue(row.max_participants) === null) errors.push("max_participants must be a number");
    }

    if (type === "policies") {
      if (!row.category) errors.push("category is required");
      if (!row.title) errors.push("title is required");
      if (!row.content) errors.push("content is required");
      if (boolValue(row.is_active) === null) errors.push("is_active must be true/false");
      if (row.order_index && numberValue(row.order_index) === null) errors.push("order_index must be a number");
    }

    if (type === "admin-accounts") {
      if (!row.email) errors.push("email is required");
      if (row.email && !row.email.toLowerCase().endsWith("@garena.vn")) errors.push("email must use @garena.vn");
      if (!validAdminRoles.has(row.role)) errors.push("role must be super_admin/admin/editor");
      if (boolValue(row.is_active) === null) errors.push("is_active must be true/false");
    }

    if (type === "users") {
      if (!row.email) errors.push("email is required");
      if (!row.full_name) errors.push("full_name is required");
    }

    return { index, row, errors };
  });
}

function toStoredValue(column, value) {
  if (["is_active"].includes(column)) return boolValue(value);
  if (["duration_hours", "rating", "min_participants", "max_participants", "xp_reward", "order_index"].includes(column)) {
    return numberValue(value);
  }
  return clean(value) || null;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(columns, rows) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
}

async function latestRows(type) {
  const spec = getSpec(type);
  const result = await query(
    `SELECT ${spec.columns.map((column) => `s.${column}`).join(", ")}, s.created_at, b.source, b.created_by
     FROM ${spec.table} s
     JOIN data_batches b ON b.id = s.batch_id
     WHERE b.id = (
       SELECT id FROM data_batches
       WHERE entity_type = $1
       ORDER BY created_at DESC
       LIMIT 1
     )
     ORDER BY s.created_at ASC`,
    [type]
  );
  return result.rows;
}

adminDataPrepRouter.get("/templates/:type", (req, res, next) => {
  try {
    const spec = getSpec(req.params.type);
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename="${req.params.type}-template.csv"`);
    res.send(toCsv(spec.columns, []));
  } catch (error) {
    next(error);
  }
});

adminDataPrepRouter.get("/:type", async (req, res, next) => {
  try {
    const spec = getSpec(req.params.type);
    const rows = await latestRows(req.params.type);
    res.json({ type: req.params.type, columns: spec.columns, rows });
  } catch (error) {
    next(error);
  }
});

adminDataPrepRouter.get("/:type/export", async (req, res, next) => {
  try {
    const spec = getSpec(req.params.type);
    const rows = await latestRows(req.params.type);
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename="${req.params.type}-draft.csv"`);
    res.send(toCsv(spec.columns, rows));
  } catch (error) {
    next(error);
  }
});

adminDataPrepRouter.post("/:type/validate", async (req, res, next) => {
  try {
    const results = await validateRows(req.params.type, req.body?.rows);
    res.json({
      ok: results.every((item) => item.errors.length === 0),
      results,
    });
  } catch (error) {
    next(error);
  }
});

async function saveBatch(type, results, source, createdBy) {
  const spec = getSpec(type);
  return withTransaction(async (client) => {
    const id = crypto.randomUUID();
    await client.query(
      `INSERT INTO data_batches (id, entity_type, source, row_count, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, type, source, results.length, createdBy]
    );

    for (const item of results) {
      const columns = ["batch_id", ...spec.columns];
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
      const values = [id, ...spec.columns.map((column) => toStoredValue(column, item.row[column]))];
      await client.query(`INSERT INTO ${spec.table} (${columns.join(", ")}) VALUES (${placeholders})`, values);
    }

    return id;
  });
}

// POST /admin/api/data-prep/:type/import-csv -> Parse raw CSV text, validate, save as draft batch.
adminDataPrepRouter.post("/:type/import-csv", async (req, res, next) => {
  try {
    const type = req.params.type;
    const spec = getSpec(type);
    const csvText = req.body?.csvText;
    if (!csvText || typeof csvText !== "string") return res.status(400).json({ error: "CSV_TEXT_REQUIRED" });

    const parsedRows = csvToRows(csvText).map((r) => {
      const row = {};
      for (const column of spec.columns) row[column] = r[column] ?? "";
      return row;
    });

    const results = await validateRows(type, parsedRows);
    const hasErrors = results.some((item) => item.errors.length > 0);
    if (hasErrors) return res.status(400).json({ ok: false, results });

    const source = clean(req.body?.source) || "csv import";
    const batchId = await saveBatch(type, results, source, req.user.email);
    res.json({ ok: true, batchId, savedRows: results.length });
  } catch (error) {
    next(error);
  }
});

adminDataPrepRouter.post("/:type/save", async (req, res, next) => {
  try {
    const type = req.params.type;
    const results = await validateRows(type, req.body?.rows);
    const hasErrors = results.some((item) => item.errors.length > 0);
    if (hasErrors) return res.status(400).json({ ok: false, results });

    const source = clean(req.body?.source) || "manual import";
    const batchId = await saveBatch(type, results, source, req.user.email);
    res.json({ ok: true, batchId, savedRows: results.length });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/data-prep/:type/promote -> Promote staging draft batch to live tables
adminDataPrepRouter.post("/:type/promote", async (req, res, next) => {
  try {
    const type = req.params.type;
    const spec = getSpec(type);

    // Permission check: super_admin for admin-accounts, ld_admin or super_admin for others
    if (type === "admin-accounts" && req.adminRole !== "super_admin") {
      return res.status(403).json({ error: "SUPER_ADMIN_REQUIRED_FOR_ADMIN_ACCOUNTS" });
    }

    const { batchId } = req.body;
    let batch;

    if (batchId) {
      const result = await query("SELECT * FROM data_batches WHERE id = $1 AND entity_type = $2", [batchId, type]);
      if (!result.rowCount) return res.status(404).json({ error: "BATCH_NOT_FOUND" });
      batch = result.rows[0];
    } else {
      const result = await query(
        `SELECT * FROM data_batches
         WHERE entity_type = $1
         ORDER BY created_at DESC LIMIT 1`,
        [type]
      );
      if (!result.rowCount) return res.status(404).json({ error: "NO_BATCHES_FOUND" });
      batch = result.rows[0];
    }

    if (batch.promoted_at) {
      return res.status(400).json({ error: "BATCH_ALREADY_PROMOTED" });
    }

    const stagingRowsResult = await query(`SELECT * FROM ${spec.table} WHERE batch_id = $1`, [batch.id]);
    const stagingRows = stagingRowsResult.rows;

    if (!stagingRows.length) {
      return res.status(400).json({ error: "BATCH_HAS_NO_ROWS" });
    }

    const promotedAt = new Date();

    await withTransaction(async (client) => {
      let snapshotData = {};

      if (type === "courses") {
        const courseIds = stagingRows.map((r) => r.course_id);
        const placeholders = courseIds.map((_, i) => `$${i + 1}`).join(", ");

        // Snapshot existing master rows
        const existingCourses = await client.query(
          `SELECT * FROM courses WHERE course_code IN (${placeholders}) AND session_date IS NULL`,
          courseIds
        );
        snapshotData = { existing: existingCourses.rows, promotedIds: courseIds };

        // Promote (upsert master row per course_code)
        for (const row of stagingRows) {
          const existing = await client.query(
            "SELECT id FROM courses WHERE course_code = $1 AND session_date IS NULL LIMIT 1",
            [row.course_id]
          );
          if (existing.rowCount) {
            // Update all rows with this course_code to keep session rows in sync
            await client.query(
              `UPDATE courses
               SET title = $2, trainer = $3, trainer_type = $4, format = $5, duration_hours = $6,
                   rating = $7, skill_tags = $8, rank_targets = $9, role_targets = $10, type = $11,
                   min_participants = $12, registration_url = $13, description = $14,
                   xp_reward = $15, is_active = $16, status = $17, material_url = $18, updated_at = NOW()
               WHERE course_code = $1`,
              [
                row.course_id, row.title, row.trainer, row.trainer_type || "internal",
                row.format, row.duration_hours, row.rating || 0, toJsonArray(row.skill_tags),
                toJsonArray(row.rank_targets), toJsonArray(row.role_targets), row.type,
                row.min_participants, row.registration_url, row.description, row.xp_reward,
                row.is_active, row.status || "open", row.material_url || null,
              ]
            );
          } else {
            await client.query(
              `INSERT INTO courses
                 (id, course_code, title, trainer, trainer_type, format, duration_hours,
                  rating, skill_tags, rank_targets, role_targets, type, min_participants,
                  registration_url, description, xp_reward, is_active, status, material_url, session_date)
               VALUES (UUID(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NULL)`,
              [
                row.course_id, row.title, row.trainer, row.trainer_type || "internal",
                row.format, row.duration_hours, row.rating || 0, toJsonArray(row.skill_tags),
                toJsonArray(row.rank_targets), toJsonArray(row.role_targets), row.type,
                row.min_participants, row.registration_url, row.description, row.xp_reward,
                row.is_active, row.status || "open", row.material_url || null,
              ]
            );
          }
        }
      }

      else if (type === "sessions") {
        const createdSessionIds = [];
        for (const row of stagingRows) {
          const sessionId = crypto.randomUUID();
          createdSessionIds.push(sessionId);
          // Copy course info from master row into session row
          await client.query(
            `INSERT INTO courses
               (id, course_code, title, trainer, trainer_type, format, duration_hours,
                rating, skill_tags, rank_targets, role_targets, type, min_participants, registration_url,
                description, xp_reward, is_active, status, material_url,
                session_date, session_time, location, max_participants, current_count, session_status)
             SELECT $1, course_code, title, trainer, trainer_type, format, duration_hours,
                rating, skill_tags, rank_targets, role_targets, type, min_participants, registration_url,
                description, xp_reward, is_active, status, material_url,
                $3, $4, $5, $6, 0, 'open'
             FROM courses WHERE course_code = $2 AND session_date IS NULL LIMIT 1`,
            [
              sessionId, row.course_id, row.session_date,
              row.session_time || null, row.location || null, row.max_participants || null,
            ]
          );
        }
        snapshotData = { createdSessionIds };
      }

      else if (type === "catalog") {
        const createdCourseIds = [];
        for (const row of stagingRows) {
          const courseId = crypto.randomUUID();
          createdCourseIds.push(courseId);
          await client.query(
            `INSERT INTO courses
               (id, course_code, title, trainer, trainer_type, format, duration_hours,
                rating, skill_tags, rank_targets, role_targets, type, min_participants, registration_url,
                description, xp_reward, is_active, status, material_url,
                session_date, session_time, location, max_participants, current_count, session_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, 0, $24)`,
            [
              courseId, row.course_code, row.title, row.trainer, row.trainer_type || "internal",
              row.format, row.duration_hours, row.rating || 0, toJsonArray(row.skill_tags),
              toJsonArray(row.rank_targets), toJsonArray(row.role_targets), row.type,
              row.min_participants, row.registration_url, row.description, row.xp_reward,
              row.is_active, row.status || "open", row.material_url || null,
              row.session_date || null, row.session_time || null, row.location || null,
              row.max_participants || null,
              row.session_date ? (row.status || "open") : null,
            ]
          );
        }

        snapshotData = { createdCourseIds };
      }

      else if (type === "policies") {
        const createdPolicyIds = [];
        for (const row of stagingRows) {
          const policyId = crypto.randomUUID();
          createdPolicyIds.push(policyId);
          await client.query(
            `INSERT INTO policies
               (id, category, title, content, is_active, order_index)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              policyId,
              row.category,
              row.title,
              row.content,
              row.is_active,
              row.order_index || 0,
            ]
          );
        }
        snapshotData = { createdPolicyIds };
      }

      else if (type === "users") {
        const createdUserIds = [];
        for (const row of stagingRows) {
          const userId = crypto.randomUUID();
          createdUserIds.push(userId);
          await client.query(
            `INSERT INTO users
               (id, email, full_name, rank, role, team, learning_formats, weekly_hours, preferred_trainers, learning_goals)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON DUPLICATE KEY UPDATE
               full_name = VALUES(full_name),
               rank = VALUES(rank),
               role = VALUES(role),
               team = VALUES(team),
               learning_formats = VALUES(learning_formats),
               weekly_hours = VALUES(weekly_hours),
               preferred_trainers = VALUES(preferred_trainers),
               learning_goals = VALUES(learning_goals),
               updated_at = NOW()`,
            [
              userId,
              row.email.toLowerCase(),
              row.full_name || null,
              row.rank || null,
              row.role || null,
              row.team || null,
              toJsonArray(row.learning_formats),
              row.weekly_hours || null,
              toJsonArray(row.preferred_trainers),
              row.learning_goals || null,
            ]
          );
        }
        snapshotData = { createdUserIds };
      }

      else if (type === "admin-accounts") {
        const emails = stagingRows.map((r) => r.email.toLowerCase());
        const placeholders = emails.map((_, i) => `$${i + 1}`).join(", ");

        // Snapshot existing admin accounts
        const existingAdmins = await client.query(
          `SELECT * FROM admin_accounts WHERE email IN (${placeholders})`,
          emails
        );
        snapshotData = { existing: existingAdmins.rows, promotedEmails: emails };

        // Promote (insert / upsert)
        for (const row of stagingRows) {
          await client.query(
            `INSERT INTO admin_accounts (email, full_name, \`role\`, is_active)
             VALUES ($1, $2, $3, $4)
             ON DUPLICATE KEY UPDATE
               full_name = VALUES(full_name),
               \`role\` = VALUES(\`role\`),
               is_active = VALUES(is_active)`,
            [
              row.email.toLowerCase(),
              row.full_name || null,
              row.role,
              row.is_active,
            ]
          );
        }
      }

      // Mark batch as promoted and store snapshot data
      await client.query(
        `UPDATE data_batches
         SET promoted_at = $2, promoted_by = $3, snapshot_data = $4
         WHERE id = $1`,
        [batch.id, promotedAt, req.user.email, JSON.stringify(snapshotData)]
      );
    });

    res.json({
      ok: true,
      batchId: batch.id,
      type,
      promoted: stagingRows.length,
      promoted_at: promotedAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/data-prep/:type/rollback -> Rollback a promoted batch (within 24 hours)
adminDataPrepRouter.post("/:type/rollback", async (req, res, next) => {
  try {
    const type = req.params.type;
    const { batchId } = req.body;

    if (type === "admin-accounts" && req.adminRole !== "super_admin") {
      return res.status(403).json({ error: "SUPER_ADMIN_REQUIRED_FOR_ADMIN_ACCOUNTS" });
    }

    let batch;
    if (batchId) {
      const result = await query("SELECT * FROM data_batches WHERE id = $1 AND entity_type = $2", [batchId, type]);
      if (!result.rowCount) return res.status(404).json({ error: "BATCH_NOT_FOUND" });
      batch = result.rows[0];
    } else {
      // No batchId given -> roll back whichever promoted batch of this type happened most recently.
      const result = await query(
        `SELECT * FROM data_batches
         WHERE entity_type = $1 AND promoted_at IS NOT NULL
         ORDER BY promoted_at DESC LIMIT 1`,
        [type]
      );
      if (!result.rowCount) return res.status(404).json({ error: "NO_PROMOTED_BATCH_FOUND" });
      batch = result.rows[0];
    }

    // Check if 24 hours have passed
    const promotedTime = new Date(batch.promoted_at).getTime();
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;
    if (now - promotedTime > hours24) {
      return res.status(400).json({ error: "ROLLBACK_EXPIRED_24H" });
    }

    let snapshot = {};
    try {
      snapshot = typeof batch.snapshot_data === "string" ? JSON.parse(batch.snapshot_data) : batch.snapshot_data || {};
    } catch (e) {
      snapshot = {};
    }

    await withTransaction(async (client) => {
      if (type === "courses" || type === "catalog") {
        if (type === "catalog") {
          const { createdCourseIds = [] } = snapshot;
          if (createdCourseIds.length) {
            const placeholders = createdCourseIds.map((_, i) => `$${i + 1}`).join(", ");
            await client.query(`DELETE FROM courses WHERE id IN (${placeholders})`, createdCourseIds);
          }
          return;
        }
        const { existing = [], promotedIds = [], promotedCodes = [], createdSessionIds = [] } = snapshot;
        const codesToCheck = type === "catalog" ? promotedCodes : promotedIds;

        // Delete newly created master rows (course_codes not in snapshot)
        const existingCodes = new Set(existing.map((c) => c.course_code));
        const newCodes = codesToCheck.filter((code) => !existingCodes.has(code));

        if (newCodes.length) {
          const placeholders = newCodes.map((_, i) => `$${i + 1}`).join(", ");
          await client.query(`DELETE FROM courses WHERE course_code IN (${placeholders})`, newCodes);
        }

        // catalog also created session rows alongside master rows — remove those too.
        if (createdSessionIds.length) {
          const sPlaceholders = createdSessionIds.map((_, i) => `$${i + 1}`).join(", ");
          await client.query(`DELETE FROM courses WHERE id IN (${sPlaceholders}) AND session_date IS NOT NULL`, createdSessionIds);
        }

        // Restore existing courses
        for (const c of existing) {
          await client.query(
            `UPDATE courses
             SET title = $2, trainer = $3, trainer_type = $4, format = $5, duration_hours = $6,
                 rating = $7, skill_tags = $8, rank_targets = $9, role_targets = $10, type = $11,
                 min_participants = $12, registration_url = $13, description = $14,
                 xp_reward = $15, is_active = $16, status = $17, material_url = $18, updated_at = NOW()
             WHERE course_code = $1`,
            [
              c.course_code,
              c.title, c.trainer, c.trainer_type ?? null, c.format, c.duration_hours,
              c.rating ?? 0,
              JSON.stringify(c.skill_tags ?? []), JSON.stringify(c.rank_targets ?? []),
              JSON.stringify(c.role_targets ?? []), c.type, c.min_participants ?? null,
              c.registration_url ?? null, c.description ?? null, c.xp_reward,
              c.is_active, c.status ?? null, c.material_url ?? null,
            ]
          );
        }
      }

      else if (type === "users") {
        const { createdUserIds = [] } = snapshot;
        if (createdUserIds.length) {
          const placeholders = createdUserIds.map((_, i) => `$${i + 1}`).join(", ");
          await client.query(`DELETE FROM users WHERE id IN (${placeholders})`, createdUserIds);
        }
      }

      else if (type === "sessions") {
        const { createdSessionIds = [] } = snapshot;
        if (createdSessionIds.length) {
          const placeholders = createdSessionIds.map((_, i) => `$${i + 1}`).join(", ");
          await client.query(`DELETE FROM courses WHERE id IN (${placeholders}) AND session_date IS NOT NULL`, createdSessionIds);
        }
      }

      else if (type === "policies") {
        const { createdPolicyIds = [] } = snapshot;
        if (createdPolicyIds.length) {
          const placeholders = createdPolicyIds.map((_, i) => `$${i + 1}`).join(", ");
          await client.query(`DELETE FROM policies WHERE id IN (${placeholders})`, createdPolicyIds);
        }
      }

      else if (type === "admin-accounts") {
        const { existing = [], promotedEmails = [] } = snapshot;

        const existingEmails = new Set(existing.map((a) => a.email.toLowerCase()));
        const newEmails = promotedEmails.filter((email) => !existingEmails.has(email.toLowerCase()));

        // Delete newly created admin accounts
        if (newEmails.length) {
          const placeholders = newEmails.map((_, i) => `$${i + 1}`).join(", ");
          await client.query(`DELETE FROM admin_accounts WHERE email IN (${placeholders})`, newEmails);
        }

        // Restore existing accounts
        for (const a of existing) {
          await client.query(
            `UPDATE admin_accounts
             SET full_name = $2, \`role\` = $3, is_active = $4
             WHERE id = $1`,
            [a.id, a.full_name, a.role, a.is_active]
          );
        }
      }

      // Reset promotion markers
      await client.query(
        `UPDATE data_batches
         SET promoted_at = NULL, promoted_by = NULL, snapshot_data = NULL
         WHERE id = $1`,
        [batch.id]
      );
    });

    res.json({
      ok: true,
      batchId,
      rolledBack: true,
    });
  } catch (error) {
    next(error);
  }
});

