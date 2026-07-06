import mysql from "mysql2/promise";
import { config } from "./config.js";

let pool;

export function mysqlPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: config.databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false,
      dateStrings: true,
    });
  }
  return pool;
}

/**
 * Prepare SQL query for MySQL execution.
 * Handles: $N → ? with correct param reordering, backtick quoting for reserved
 * keywords ('rank', 'role'), and inlining LIMIT/OFFSET parameters.
 */
export function prepareMysqlQuery(sql, params = []) {
  let s = sql;

  // Wrap reserved keywords 'rank' and 'role' in backticks, avoiding string literals and existing backticks
  s = s.replace(/'[^']*'|"[^"]*"|`[^`]*`|\b(rank|role)\b/gi, (match, p1) => {
    return p1 ? `\`${p1}\`` : match;
  });

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
