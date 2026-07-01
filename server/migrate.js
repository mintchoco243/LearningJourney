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

// One-shot migrations that DROP/RENAME tables can't be re-run safely (e.g. on
// container restart). Skip them once their target state already exists.
async function shouldSkip(file) {
  if (file.startsWith("008_merge_courses_sessions")) {
    const result = await pool.query("SHOW TABLES LIKE 'course_sessions'");
    return result.rowCount === 0; // already merged
  }
  return false;
}

for (const file of files) {
  if (await shouldSkip(file)) {
    console.log(`Skipping ${file} (already applied)`);
    continue;
  }
  const sql = await fs.readFile(path.join(dir, file), "utf8");
  process.stdout.write(`Running ${file}... `);
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME") {
        continue;
      }
      throw err;
    }
  }
  process.stdout.write("done\n");
}

await pool.end();
