import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

for (const file of walk(path.join(root, "server"))) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status);
}

const migrateSource = fs.readFileSync(path.join(root, "server", "migrate.js"), "utf8");
const reservationCleanupIndex = migrateSource.indexOf("DELETE r FROM reservations r");
const reservationFkIndex = migrateSource.indexOf("ALTER TABLE reservations ADD CONSTRAINT fk_res_session");
if (
  reservationCleanupIndex === -1 ||
  reservationFkIndex === -1 ||
  reservationCleanupIndex > reservationFkIndex
) {
  console.error(
    "Migration guard missing: delete orphan reservations before adding fk_res_session.",
  );
  process.exit(1);
}

const adminCoursesSource = fs.readFileSync(path.join(root, "server", "routes", "admin", "courses.js"), "utf8");
const userCoursesSource = fs.readFileSync(path.join(root, "server", "routes", "courses.js"), "utf8");
if (/\b(WHERE|AND)\s+c?\.?session_date\s+IS\s+NULL/i.test(adminCoursesSource) || /\b(WHERE|AND)\s+c?\.?session_date\s+IS\s+NULL/i.test(userCoursesSource)) {
  console.error("Course routes must not use session_date IS NULL as a course/session split.");
  process.exit(1);
}
if (/master course rows|Session rows live/i.test(adminCoursesSource + userCoursesSource)) {
  console.error("Runtime course routes must not reintroduce master course/session wording.");
  process.exit(1);
}

console.log("Syntax check passed");
