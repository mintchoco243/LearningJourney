import { config } from "./config.js";
import { isMysqlUrl, mysqlPool, mysqlQuery, mysqlTransaction } from "./db-mysql.js";

let pgPool;
let useMockDb = false;

const mockDb = {
  users: [
    {
      id: 1,
      email: "demo@garena.vn",
      full_name: "Demo User",
      role: "super_admin",
      xp_total: 150,
      onboarding_done: 1,
      class_archetype: "explorer",
      learning_formats: JSON.stringify(["Workshop", "Video"]),
      weekly_hours: 4,
      preferred_trainers: JSON.stringify(["L&D Team", "Data Guild"]),
      learning_goals: "Develop general professional skills",
      character: JSON.stringify({ hair: "short", outfit: "red", accessory: "none", skin: "s1" })
    }
  ],
  admin_accounts: [
    { email: "demo@garena.vn", full_name: "Demo User", role: "super_admin", is_active: 1 }
  ]
};

function handleMockQuery(text, params) {
  const sql = text.replace(/\s+/g, " ").trim();

  if (/admin_accounts/i.test(sql)) {
    const email = params[0] || "demo@garena.vn";
    const found = mockDb.admin_accounts.filter(a => a.email.toLowerCase() === email.toLowerCase());
    return { rows: found, rowCount: found.length };
  }

  if (/INSERT\s+INTO\s+users/i.test(sql)) {
    const email = (params[0] || "demo@garena.vn").toLowerCase();
    const fullName = params[1] || email.split("@")[0];
    const avatarUrl = params[2] || null;
    let found = mockDb.users.find(u => u.email.toLowerCase() === email);
    if (!found) {
      found = {
        id: mockDb.users.length + 1,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: "super_admin",
        xp_total: 0,
        onboarding_done: 0,
        class_archetype: null,
        learning_formats: JSON.stringify([]),
        weekly_hours: 0,
        preferred_trainers: JSON.stringify([]),
        learning_goals: "",
        character: JSON.stringify({ hair: "short", outfit: "red", accessory: "none", skin: "s1" })
      };
      mockDb.users.push(found);
    } else {
      found.full_name = fullName;
      found.avatar_url = avatarUrl;
    }
    return { rows: [found], rowCount: 1 };
  }

  if (/SELECT.*FROM\s+users/i.test(sql)) {
    const emailOrId = params[0];
    const found = emailOrId
      ? mockDb.users.find(u => u.email.toLowerCase() === String(emailOrId).toLowerCase() || String(u.id) === String(emailOrId))
      : mockDb.users[0];
    return { rows: [found || mockDb.users[0]], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

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
    if (useMockDb) return;
    if (isMysqlUrl()) return mysqlPool().end();
    if (pgPool) return pgPool.end();
  },
};

export async function query(text, params = []) {
  if (useMockDb) {
    return handleMockQuery(text, params);
  }
  try {
    if (isMysqlUrl()) return await mysqlQuery(text, params);
    const pgPool = await getPgPool();
    return await pgPool.query(text, params);
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.message.includes("ECONNREFUSED") ||
        error.message.includes("Access denied") || error.message.includes("connect")) {
      console.warn("\n========================================================");
      console.warn("⚠️  DATABASE CONNECTION FAILED! Running in Local Mock Mode.");
      console.warn("========================================================\n");
      useMockDb = true;
      return handleMockQuery(text, params);
    }
    throw error;
  }
}

export async function withTransaction(fn) {
  if (useMockDb) {
    const client = {
      query: async (sql, params = []) => handleMockQuery(sql, params),
    };
    return fn(client);
  }
  try {
    if (isMysqlUrl()) return await mysqlTransaction(fn);
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
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.message.includes("ECONNREFUSED") ||
        error.message.includes("Access denied") || error.message.includes("connect")) {
      console.warn("\n========================================================");
      console.warn("⚠️  DATABASE CONNECTION FAILED! Running in Local Mock Mode.");
      console.warn("========================================================\n");
      useMockDb = true;
      const client = {
        query: async (sql, params = []) => handleMockQuery(sql, params),
      };
      return fn(client);
    }
    throw error;
  }
}
