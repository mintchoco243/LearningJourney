import express from "express";
import crypto from "node:crypto";
import { query, withTransaction } from "../../db.js";

export const adminDataPrepRouter = express.Router();

const specs = {
  courses: {
    table: "staging_courses",
    columns: [
      "course_id",
      "title",
      "description",
      "trainer",
      "format",
      "duration_hours",
      "skill_tags",
      "rank_targets",
      "role_targets",
      "type",
      "min_participants",
      "registration_url",
      "xp_reward",
      "is_active",
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
};

const validAdminRoles = new Set(["super_admin", "admin", "editor"]);
const validFormats = new Set(["online", "offline", "elearning", "webinar", "workshop", "bootcamp", "talk"]);
const validTypes = new Set(["open", "scheduled", "waitlist"]);

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

async function knownCourseIds() {
  const [live, staged] = await Promise.all([
    query("SELECT id AS course_id FROM courses"),
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
      if (row.format && !validFormats.has(row.format)) errors.push("format must be online/offline/elearning/webinar/workshop/bootcamp/talk");
      if (row.type && !validTypes.has(row.type)) errors.push("type must be open/scheduled/waitlist");
      if (row.duration_hours && numberValue(row.duration_hours) === null) errors.push("duration_hours must be a number");
      if (row.min_participants && numberValue(row.min_participants) === null) errors.push("min_participants must be a number");
      if (row.xp_reward && numberValue(row.xp_reward) === null) errors.push("xp_reward must be a number");
      if (boolValue(row.is_active) === null) errors.push("is_active must be true/false");
    }

    if (type === "sessions") {
      if (!row.course_id) errors.push("course_id is required");
      if (row.course_id && !courses.has(row.course_id)) errors.push("course_id does not exist in draft or live courses");
      if (!row.session_date) errors.push("session_date is required");
      if (row.session_date && !isDateText(row.session_date)) errors.push("session_date must be YYYY-MM-DD");
      if (row.min_participants && numberValue(row.min_participants) === null) errors.push("min_participants must be a number");
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

    return { index, row, errors };
  });
}

function toStoredValue(column, value) {
  if (["is_active"].includes(column)) return boolValue(value);
  if (["duration_hours", "min_participants", "max_participants", "xp_reward", "order_index"].includes(column)) {
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

adminDataPrepRouter.post("/:type/save", async (req, res, next) => {
  try {
    const type = req.params.type;
    const spec = getSpec(type);
    const results = await validateRows(type, req.body?.rows);
    const hasErrors = results.some((item) => item.errors.length > 0);
    if (hasErrors) return res.status(400).json({ ok: false, results });

    const source = clean(req.body?.source) || "manual import";
    const batchId = await withTransaction(async (client) => {
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO data_batches (id, entity_type, source, row_count, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, type, source, results.length, req.user.email]
      );

      for (const item of results) {
        const columns = ["batch_id", ...spec.columns];
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        const values = [id, ...spec.columns.map((column) => toStoredValue(column, item.row[column]))];
        await client.query(`INSERT INTO ${spec.table} (${columns.join(", ")}) VALUES (${placeholders})`, values);
      }

      return id;
    });

    res.json({ ok: true, batchId, savedRows: results.length });
  } catch (error) {
    next(error);
  }
});
