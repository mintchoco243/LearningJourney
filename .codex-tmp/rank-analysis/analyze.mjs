import fs from "node:fs/promises";
import { Workbook } from "@oai/artifact-tool";

const inputPath =
  "G:\\My Drive\\MN04. L&D & Other HR Tasks\\2026\\Learning Journey & Calendar\\users-full-cases - users-full-cases.csv.csv";
const csvText = await fs.readFile(inputPath, "utf8");
const workbook = await Workbook.fromCSV(csvText, { sheetName: "Users" });
const sheet = workbook.worksheets.getItem("Users");
const used = sheet.getUsedRange(true);
const rows = used.values;
const headers = rows[0].map((v) => String(v ?? "").trim());
const records = rows.slice(1).map((row) =>
  Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()])),
);

const countBy = (field) => {
  const counts = new Map();
  for (const record of records) {
    const value = record[field] || "(blank)";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
};

const combos = new Map();
for (const record of records) {
  const key = JSON.stringify([record.team || "(blank)", record.role || "(blank)", record.rank || "(blank)"]);
  combos.set(key, (combos.get(key) || 0) + 1);
}

const roleRankSets = new Map();
for (const record of records) {
  const role = record.role || "(blank)";
  if (!roleRankSets.has(role)) roleRankSets.set(role, new Set());
  roleRankSets.get(role).add(record.rank || "(blank)");
}

const teamRankSets = new Map();
for (const record of records) {
  const team = record.team || "(blank)";
  if (!teamRankSets.has(team)) teamRankSets.set(team, new Set());
  teamRankSets.get(team).add(record.rank || "(blank)");
}

const summary = {
  rows: records.length,
  headers,
  blankCounts: Object.fromEntries(
    headers.map((header) => [header, records.filter((record) => !record[header]).length]),
  ),
  ranks: countBy("rank"),
  roles: countBy("role"),
  teams: countBy("team"),
  combinations: [...combos.entries()]
    .map(([key, count]) => {
      const [team, role, rank] = JSON.parse(key);
      return { team, role, rank, count };
    })
    .sort((a, b) =>
      a.team.localeCompare(b.team) ||
      a.role.localeCompare(b.role) ||
      a.rank.localeCompare(b.rank),
    ),
  roleRankSets: [...roleRankSets.entries()]
    .map(([role, ranks]) => ({ role, ranks: [...ranks].sort() }))
    .sort((a, b) => a.role.localeCompare(b.role)),
  teamRankSets: [...teamRankSets.entries()]
    .map(([team, ranks]) => ({ team, ranks: [...ranks].sort() }))
    .sort((a, b) => a.team.localeCompare(b.team)),
};

console.log(JSON.stringify(summary, null, 2));
