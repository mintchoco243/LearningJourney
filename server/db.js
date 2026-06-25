import { config } from "./config.js";
import { isMysqlUrl, mysqlPool, mysqlQuery, mysqlTransaction } from "./db-mysql.js";

let pgPool;

async function getPgPool() {
  const pg = await import("pg");
  const { Pool } = pg.default || pg;
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return pgPool;
}

export const pool = {
  query: async (text, params = []) => query(text, params),
  end: async () => {
    if (isMysqlUrl()) return mysqlPool().end();
    if (pgPool) return pgPool.end();
  },
};

export async function query(text, params = []) {
  if (isMysqlUrl()) return mysqlQuery(text, params);
  const pgPool = await getPgPool();
  return pgPool.query(text, params);
}

export async function withTransaction(fn) {
  if (isMysqlUrl()) return mysqlTransaction(fn);
  const pgPool = await getPgPool();
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
