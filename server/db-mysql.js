import mysql from "mysql2/promise";
import { config } from "./config.js";

let pool;

export function isMysqlUrl(url = config.databaseUrl || "") {
  return url.startsWith("mysql://") || url.startsWith("mysql2://");
}

export function mysqlPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: config.databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false,
    });
  }
  return pool;
}

/**
 * Translate PostgreSQL-style SQL to MySQL-compatible SQL.
 * Handles: $N → ? with correct param reordering, type casts,
 * ILIKE, ON CONFLICT DO NOTHING, RETURNING, interval literals,
 * array operators, and COALESCE defaults.
 */
export function prepareMysqlQuery(sql, params = []) {
  let s = sql;

  // Wrap reserved keywords 'rank' and 'role' in backticks, avoiding string literals and existing backticks
  s = s.replace(/'[^']*'|"[^"]*"|`[^`]*`|\b(rank|role)\b/gi, (match, p1) => {
    return p1 ? `\`${p1}\`` : match;
  });

  // ON CONFLICT (...) DO NOTHING → INSERT IGNORE
  if (/ON\s+CONFLICT\b[^;]*?\bDO\s+NOTHING\b/i.test(s)) {
    s = s.replace(/\s+ON\s+CONFLICT\b[^;]*?\bDO\s+NOTHING\b/gi, "");
    s = s.replace(/\bINSERT\b/i, "INSERT IGNORE");
  }

  // Strip RETURNING clause (MySQL does not support it)
  s = s.replace(/\s+RETURNING\s+.+$/im, "");

  // Remove PostgreSQL type casts (::int, ::date, ::numeric, etc.)
  s = s.replace(/::(?:int|integer|numeric|date|text|timestamptz)\b/gi, "");

  // ILIKE → LIKE (MySQL LIKE is case-insensitive with default collation)
  s = s.replace(/\bILIKE\b/gi, "LIKE");

  // PostgreSQL interval literals → MySQL interval syntax
  // e.g. INTERVAL '7 days' → INTERVAL 7 DAY
  s = s.replace(
    /INTERVAL\s+'(\d+)\s+(month|day|hour|minute|second)s?'/gi,
    "INTERVAL $1 $2",
  );

  // $N = ANY(column) → JSON_CONTAINS(column, JSON_QUOTE($N))
  s = s.replace(
    /\$(\d+)\s*=\s*ANY\(([^)]+)\)/gi,
    "JSON_CONTAINS($2, JSON_QUOTE($$1))",
  );

  // COALESCE($N, '{}') → COALESCE($N, JSON_ARRAY()) for array defaults
  s = s.replace(
    /COALESCE\((\$\d+),\s*'\{\}'\)/gi,
    "COALESCE($1, JSON_ARRAY())",
  );

  // MySQL2 prepared statements don't support ? for LIMIT/OFFSET (ER_WRONG_ARGUMENTS).
  // Inline LIMIT/OFFSET values directly before the general $N → ? substitution.
  s = s.replace(/\bLIMIT\s+\$(\d+)(?:\s+OFFSET\s+\$(\d+))?/gi, (_, limitN, offsetN) => {
    const limitVal = parseInt(params[Number(limitN) - 1]) || 20;
    if (offsetN === undefined) return `LIMIT ${limitVal}`;
    const offsetVal = parseInt(params[Number(offsetN) - 1]) || 0;
    return `LIMIT ${limitVal} OFFSET ${offsetVal}`;
  });

  // Collect param ordering and replace $N → ? (must be last)
  const paramOrder = [];
  s = s.replace(/\$(\d+)/g, (_, num) => {
    paramOrder.push(Number(num) - 1); // convert to 0-indexed
    return "?";
  });

  // Reorder params to match ? appearance order and serialize arrays to JSON
  const reorderedParams = paramOrder.map((i) => {
    const v = params[i];
    return Array.isArray(v) ? JSON.stringify(v) : v;
  });

  return { sql: s, params: reorderedParams };
}

/** Execute a query through the MySQL pool, applying PG→MySQL translation. */
async function exec(conn, sql, params) {
  const prepared = prepareMysqlQuery(sql, params);
  const [rows] = await conn.execute(prepared.sql, prepared.params);
  return {
    rows: Array.isArray(rows) ? rows : [],
    rowCount: Array.isArray(rows)
      ? rows.length
      : rows.affectedRows || 0,
  };
}

export async function mysqlQuery(sql, params = []) {
  return exec(mysqlPool(), sql, params);
}

export async function mysqlTransaction(fn) {
  const conn = await mysqlPool().getConnection();
  try {
    await conn.beginTransaction();
    const client = {
      query: (sql, params = []) => exec(conn, sql, params),
    };
    const result = await fn(client);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
