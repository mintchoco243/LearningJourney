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

function normalizeMysqlSql(sql) {
  return sql.replace(/\$(\d+)/g, "?");
}

export async function mysqlQuery(sql, params = []) {
  const [rows] = await mysqlPool().execute(normalizeMysqlSql(sql), params);
  return { rows, rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows || 0 };
}

export async function mysqlTransaction(fn) {
  const conn = await mysqlPool().getConnection();
  try {
    await conn.beginTransaction();
    const client = {
      query: async (sql, params = []) => {
        const [rows] = await conn.execute(normalizeMysqlSql(sql), params);
        return { rows, rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows || 0, insertId: rows.insertId };
      },
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
