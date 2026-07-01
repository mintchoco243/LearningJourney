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

function quoteIdent(name) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe SQL identifier: ${name}`);
  }
  return `\`${name}\``;
}

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function tableExists(tableName) {
  const result = await pool.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = $1`,
    [tableName],
  );
  return result.rowCount > 0;
}

async function columnExists(tableName, columnName) {
  const result = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = $1
       AND COLUMN_NAME = $2`,
    [tableName, columnName],
  );
  return result.rowCount > 0;
}

async function foreignKeysForColumn(tableName, columnName) {
  const result = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = $1
       AND COLUMN_NAME = $2
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [tableName, columnName],
  );
  return result.rows.map((row) => row.CONSTRAINT_NAME || row.constraint_name);
}

async function foreignKeyExists(tableName, constraintName) {
  const result = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = $1
       AND CONSTRAINT_NAME = $2
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [tableName, constraintName],
  );
  return result.rowCount > 0;
}

async function dropForeignKeysForColumn(tableName, columnName) {
  for (const constraintName of await foreignKeysForColumn(tableName, columnName)) {
    await pool.query(
      `ALTER TABLE ${quoteIdent(tableName)} DROP FOREIGN KEY ${quoteIdent(constraintName)}`,
    );
  }
}

async function executeStatement(file, statement) {
  try {
    await pool.query(statement);
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME") {
      return;
    }
    console.error(`\nMigration failed in ${file}`);
    console.error(`MySQL error ${err.code || "UNKNOWN"}: ${err.message}`);
    console.error(`Statement:\n${statement.slice(0, 1000)}`);
    throw err;
  }
}

async function deleteOrphanReservationsForMergedSessions(file) {
  // Deployment regression guard: 2026-07-01 failed with ER_NO_REFERENCED_ROW_2
  // when old reservations pointed at sessions not copied into courses_new.
  await executeStatement(
    file,
    `DELETE r FROM reservations r
     LEFT JOIN courses_new c ON c.id = r.session_id
     WHERE c.id IS NULL`,
  );
}

async function runMergeCoursesSessionsMigration(file, sql) {
  const coursesMerged =
    (await columnExists("courses", "course_code")) &&
    (await columnExists("courses", "session_date"));
  const hasCourseSessions = await tableExists("course_sessions");
  const hasScratchCourses = await tableExists("courses_new");

  if (coursesMerged && !hasCourseSessions) {
    console.log(`Skipping ${file} (already applied)`);
    return;
  }

  const statements = splitStatements(sql);
  const findStatement = (text) => {
    const statement = statements.find((item) => item.includes(text));
    if (!statement) throw new Error(`Could not find migration statement: ${text}`);
    return statement;
  };

  // A previous failed deploy may have left reservations.session_id pointing at
  // courses_new. Drop that FK before recreating the scratch table.
  if (await tableExists("reservations")) {
    await dropForeignKeysForColumn("reservations", "session_id");
  }

  if (!coursesMerged && !hasCourseSessions && hasScratchCourses) {
    if (await tableExists("courses")) {
      await executeStatement(file, "DROP TABLE courses");
    }
    await executeStatement(file, "RENAME TABLE courses_new TO courses");
    await executeStatement(
      file,
      `ALTER TABLE reservations ADD CONSTRAINT fk_res_session
        FOREIGN KEY (session_id) REFERENCES courses(id) ON DELETE CASCADE`,
    );
    return;
  }

  if (hasScratchCourses) {
    await executeStatement(file, "DROP TABLE courses_new");
  }

  await executeStatement(file, findStatement("CREATE TABLE courses_new"));
  await executeStatement(file, findStatement("SELECT\n  UUID(), c.id"));
  await executeStatement(file, findStatement("FROM course_sessions s"));

  if (await columnExists("enrollments", "course_id")) {
    await dropForeignKeysForColumn("enrollments", "course_id");
    await executeStatement(
      file,
      "ALTER TABLE enrollments CHANGE course_id course_code VARCHAR(20) NOT NULL",
    );
  }

  if (await columnExists("testimonials", "course_id")) {
    await dropForeignKeysForColumn("testimonials", "course_id");
    await executeStatement(
      file,
      "ALTER TABLE testimonials CHANGE course_id course_code VARCHAR(20) NOT NULL",
    );
  }

  await deleteOrphanReservationsForMergedSessions(file);
  await executeStatement(
    file,
    `ALTER TABLE reservations ADD CONSTRAINT fk_res_session
      FOREIGN KEY (session_id) REFERENCES courses_new(id) ON DELETE CASCADE`,
  );

  if (await tableExists("course_sessions")) {
    await executeStatement(file, "DROP TABLE course_sessions");
  }
  if (await tableExists("courses")) {
    await executeStatement(file, "DROP TABLE courses");
  }
  await executeStatement(file, "RENAME TABLE courses_new TO courses");
}

async function runCourseRowIdentityMigration(file) {
  if (await columnExists("enrollments", "course_code")) {
    await dropForeignKeysForColumn("enrollments", "course_code");
    await executeStatement(
      file,
      "ALTER TABLE enrollments CHANGE course_code course_id CHAR(36) NOT NULL",
    );
  }

  if (await columnExists("testimonials", "course_code")) {
    await dropForeignKeysForColumn("testimonials", "course_code");
    await executeStatement(
      file,
      "ALTER TABLE testimonials CHANGE course_code course_id CHAR(36) NOT NULL",
    );
  }

  if (await columnExists("enrollments", "course_id")) {
    await executeStatement(
      file,
      `UPDATE enrollments e
       LEFT JOIN courses exact ON exact.id = e.course_id
       LEFT JOIN (
         SELECT course_code, MIN(id) AS id
         FROM courses
         GROUP BY course_code
       ) mapped ON mapped.course_code = e.course_id
       SET e.course_id = mapped.id
       WHERE exact.id IS NULL AND mapped.id IS NOT NULL`,
    );
    await executeStatement(
      file,
      `DELETE e FROM enrollments e
       LEFT JOIN courses c ON c.id = e.course_id
       WHERE c.id IS NULL`,
    );
    if (!(await foreignKeyExists("enrollments", "fk_enroll_course_row"))) {
      await executeStatement(
        file,
        `ALTER TABLE enrollments ADD CONSTRAINT fk_enroll_course_row
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE`,
      );
    }
  }

  if (await columnExists("testimonials", "course_id")) {
    await executeStatement(
      file,
      `UPDATE testimonials t
       LEFT JOIN courses exact ON exact.id = t.course_id
       LEFT JOIN (
         SELECT course_code, MIN(id) AS id
         FROM courses
         GROUP BY course_code
       ) mapped ON mapped.course_code = t.course_id
       SET t.course_id = mapped.id
       WHERE exact.id IS NULL AND mapped.id IS NOT NULL`,
    );
    await executeStatement(
      file,
      `DELETE t FROM testimonials t
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE c.id IS NULL`,
    );
    if (!(await foreignKeyExists("testimonials", "fk_test_course_row"))) {
      await executeStatement(
        file,
        `ALTER TABLE testimonials ADD CONSTRAINT fk_test_course_row
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE`,
      );
    }
  }
}

async function runCourseRatingMigration(file) {
  const targets = [
    { table: "courses", definition: "rating DECIMAL(3,1) DEFAULT 0" },
    { table: "staging_courses", definition: "rating DECIMAL(3,1) NULL" },
    { table: "staging_catalog", definition: "rating DECIMAL(3,1) NULL" },
  ];

  for (const target of targets) {
    if (!(await tableExists(target.table))) continue;
    if (await columnExists(target.table, "rating")) continue;
    await executeStatement(
      file,
      `ALTER TABLE ${quoteIdent(target.table)} ADD COLUMN ${target.definition}`,
    );
  }
}

// One-shot migrations that DROP/RENAME tables can't be re-run safely (e.g. on
// container restart). Skip them once their target state already exists.
async function shouldSkip(file) {
  if (file.startsWith("008_merge_courses_sessions")) {
    return (
      (await columnExists("courses", "course_code")) &&
      (await columnExists("courses", "session_date")) &&
      !(await tableExists("course_sessions"))
    );
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
  if (isMysqlUrl() && file.startsWith("008_merge_courses_sessions")) {
    await runMergeCoursesSessionsMigration(file, sql);
    process.stdout.write("done\n");
    continue;
  }
  if (isMysqlUrl() && file.startsWith("010_course_row_identity")) {
    await runCourseRowIdentityMigration(file);
    process.stdout.write("done\n");
    continue;
  }
  if (isMysqlUrl() && file.startsWith("011_course_rating")) {
    await runCourseRatingMigration(file);
    process.stdout.write("done\n");
    continue;
  }
  const statements = splitStatements(sql);
  for (const statement of statements) {
    await executeStatement(file, statement);
  }
  process.stdout.write("done\n");
}

await pool.end();
