import fs from "node:fs/promises";
import { Workbook } from "@oai/artifact-tool";

const inputPath =
  "G:\\My Drive\\MN04. L&D & Other HR Tasks\\2026\\Learning Journey & Calendar\\users-full-cases - users-full-cases.csv.csv";
const workbook = await Workbook.fromCSV(await fs.readFile(inputPath, "utf8"), { sheetName: "Users" });
const rows = workbook.worksheets.getItem("Users").getUsedRange(true).values;
const headers = rows[0].map((v) => String(v ?? "").trim());
const records = rows.slice(1).map((row) =>
  Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()])),
);

const techRoles = new Set([
  "Backend",
  "Frontend",
  "DBA",
  "Infrastructure",
  "Game Development",
  "Game Design",
]);
const proposedGroup = (record) => {
  if (record.role === "Corporate IT") return "CORP_IT";
  if (techRoles.has(record.role)) return "TECH_GAME";
  if (record.role === "PM" && record.rank.startsWith("Senior Product Management")) return "PRODUCT_MANAGEMENT";
  return "GENERAL";
};

const grouped = {};
for (const record of records) {
  const group = proposedGroup(record);
  grouped[group] ??= { count: 0, ranks: {}, roles: {} };
  grouped[group].count += 1;
  grouped[group].ranks[record.rank] = (grouped[group].ranks[record.rank] || 0) + 1;
  grouped[group].roles[record.role] = (grouped[group].roles[record.role] || 0) + 1;
}

const ambiguities = records
  .filter(
    (record) =>
      (techRoles.has(record.role) && ["Associate", "Senior Associate", "Assistant Manager", "Manager", "Senior Manager", "Director"].includes(record.rank)) ||
      (record.role === "Corporate IT" && !["Senior Associate", "Senior Associate I", "Senior Associate II"].includes(record.rank)) ||
      record.rank.startsWith("Senior Product Management"),
  )
  .map(({ email, full_name, rank, role, team }) => ({ email, full_name, rank, role, team }));

console.log(JSON.stringify({ grouped, ambiguities }, null, 2));
process.exit(0);
