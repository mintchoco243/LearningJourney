import { config } from "./config.js";
import { mysqlPool, mysqlQuery, mysqlTransaction } from "./db-mysql.js";

function requireDatabaseUrl() {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required. Configure the MySQL database before starting the app.");
  }
}

export const pool = {
  query: async (text, params = []) => query(text, params),
  end: async () => {
    requireDatabaseUrl();
    return mysqlPool().end();
  },
};

export async function query(text, params = []) {
  requireDatabaseUrl();
  return mysqlQuery(text, params);
}

export async function withTransaction(fn) {
  requireDatabaseUrl();
  return mysqlTransaction(fn);
}
