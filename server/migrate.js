import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import { isMysqlUrl } from "./db-mysql.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "migrations");

const files = (await fs.readdir(dir))
  .filter((file) => file.endsWith(".sql"))
  .filter((file) => (isMysqlUrl() ? file.includes("mysql") : !file.includes("mysql")))
  .sort();

for (const file of files) {
  const sql = await fs.readFile(path.join(dir, file), "utf8");
  process.stdout.write(`Running ${file}... `);
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
  process.stdout.write("done\n");
}

await pool.end();
