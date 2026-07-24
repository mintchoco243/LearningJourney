import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = process.cwd();
const outputDir = path.join(root, "sample-data", "course-admin");
const xlsxPath = path.join(outputDir, "courses-single-source-template.xlsx");
const csvPath = path.join(outputDir, "courses-single-source-template.csv");
const previewDir = path.join(root, "outputs", "course-admin");

const headers = [
  "course_code", "title", "description", "trainer", "trainer_type", "format",
  "duration_hours", "xp_reward", "rating", "skill_tags", "rank_targets", "role_targets",
  "type", "is_active", "status", "registration_url", "material_url", "session_date",
  "session_time", "location", "min_participants", "max_participants", "notes",
];

const rows = [
  ["LC-001", "Onboarding tai Garena", "Van hoa, cau truc to chuc va cach van hanh o Garena.", "L&D Team", "internal", "elearning", 0.75, 30, 4.5, "foundations", "Associate", "All", "elearning", true, "open", "https://learning.garena.vn/courses/LC-001", "https://learning.garena.vn/materials/LC-001", null, "", "", null, null, "E-learning: no booking needed; user can learn/complete this row."],
  ["LC-002", "Tu Duy Du Lieu Cho Nguoi Moi", "Doc hieu so lieu, dat cau hoi dung va tranh cac bay dien giai pho bien.", "Data Team", "internal", "online", 1.5, 50, 4.2, "data,analytics", "Associate,Senior Associate", "Marketing,Product", "scheduled", true, "open", "https://learning.garena.vn/courses/LC-002", "", "2026-08-10", "09:00-10:30", "Online - Zoom", 8, 30, "Scheduled row: this row is the actual class users reserve/complete."],
  ["LC-002", "Tu Duy Du Lieu Cho Nguoi Moi", "Second cohort for the same course_code; this is a separate learning row.", "Data Team", "internal", "offline", 1.5, 50, 4.2, "data,analytics", "Associate,Senior Associate", "Marketing,Product", "scheduled", true, "open", "https://learning.garena.vn/courses/LC-002", "", "2026-09-15", "14:00-15:30", "HCM Office - Training Room A", 8, 24, "Same course_code is okay; id will be different in DB."],
  ["LC-003", "Advanced Excel Gom Nhu Cau", "Dat cho de L&D mo lop khi du so luong toi thieu.", "Finance Academy", "internal", "workshop", 2, 80, 0, "excel,productivity", "Senior Associate,Assistant Manager", "All", "interest", true, "open", "", "", null, "", "", 10, null, "Interest row: leave date/time/location blank until admin schedules it."],
  ["LC-004", "External Product Conference", "Khoa ben ngoai; user dang ky qua vendor va co the duoc ghi nhan hoan thanh.", "External Vendor", "external", "online", 8, 100, 0, "product,strategy", "Assistant Manager,Manager", "Product,Marketing", "external", true, "open", "https://vendor.example.com/register", "", null, "", "", null, null, "External row: registration_url is required for user action."],
  ["LC-005", "Recording: Leadership Basics", "Tai lieu/recording de xem lai sau lop.", "Leadership Academy", "internal", "elearning", 1, 40, 4.7, "leadership,feedback", "Manager,Senior Manager", "All", "material_only", true, "ended", "", "https://learning.garena.vn/materials/LC-005", null, "", "", null, null, "Material-only row: material_url should be filled."],
];

const options = {
  trainer_type: ["internal", "regional", "external"],
  format: ["online", "offline", "elearning", "webinar", "workshop", "bootcamp", "talk"],
  type: ["scheduled", "interest", "elearning", "external", "material_only"],
  is_active: ["true", "false"],
  status: ["draft", "open", "full", "confirmed", "ended", "cancelled"],
  rank_targets: ["All", "Associate", "Senior Associate", "Assistant Manager", "Manager", "Senior Manager"],
  role_targets: ["All", "Marketing", "Product", "Engineering", "HR/L&D", "Operations", "Finance", "People Manager"],
  skill_tags: ["foundations", "data", "analytics", "ai", "communication", "product", "leadership", "feedback", "excel", "strategy", "ops_excellence", "mentoring"],
};

const wb = Workbook.create();
const courses = wb.worksheets.add("Courses");
const opt = wb.worksheets.add("Options");
const notes = wb.worksheets.add("Notes");

courses.showGridLines = false;
courses.getRangeByIndexes(0, 0, rows.length + 1, headers.length).values = [headers, ...rows];
courses.getRange("A1:W1").format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
};
courses.getRange("A1:W7").format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
courses.getRange("G2:I200").format.numberFormat = "#,##0.0";
courses.getRange("R2:R200").format.numberFormat = "yyyy-mm-dd";
courses.freezePanes.freezeRows(1);
courses.tables.add("A1:W7", true, "CoursesTemplate");
courses.getRange("A:W").format.autofitColumns();
courses.getRange("C:C").format.columnWidthPx = 260;
courses.getRange("W:W").format.columnWidthPx = 320;
courses.getRange("C:W").format.wrapText = true;

const optionRows = [["field", "allowed_values", "notes"]];
for (const [field, values] of Object.entries(options)) {
  optionRows.push([field, values.join(", "), field === "skill_tags" || field.endsWith("_targets") ? "Use comma-separated values in Courses." : "Use one value."]);
}
optionRows.push(["course_code", "free text", "May repeat. Display/grouping only; not an action identity."]);
optionRows.push(["session_date", "yyyy-mm-dd", "Blank is valid for interest/elearning/material/external rows."]);
optionRows.push(["current_count/enrolled_count", "not input", "Calculated by the app from reservations/enrollments."]);
opt.showGridLines = false;
opt.getRangeByIndexes(0, 0, optionRows.length, 3).values = optionRows;
opt.getRange("A1:C1").format = { fill: "#548235", font: { bold: true, color: "#FFFFFF" } };
opt.getRange("A:C").format.autofitColumns();
opt.getRange("B:B").format.columnWidthPx = 520;
opt.getRange("C:C").format.columnWidthPx = 360;
opt.getRange("A:C").format.wrapText = true;
opt.freezePanes.freezeRows(1);
opt.tables.add(`A1:C${optionRows.length}`, true, "CourseOptions");

notes.showGridLines = false;
notes.getRange("A1:B9").values = [
  ["Rule", "Meaning"],
  ["One row = one learning item", "A row can be scheduled, interest, elearning, external, or material_only."],
  ["courses.id is the action id", "Reserve, complete, review, import, and confirm all target the DB row id."],
  ["course_code may repeat", "Use it for display/grouping only. Repeated course_code rows are separate items."],
  ["session_date is optional", "It is a date field on the row, not a separate session entity."],
  ["Do not input counts", "current_count and enrolled_count are generated from user actions."],
  ["Interest flow", "Leave date blank while collecting demand; later edit the same row to add schedule details."],
  ["Completion flow", "A user can complete two different rows with the same course_code; duplicate completion of the same row must not add hours twice."],
  ["CSV import note", "This template prepares data only. Admin site remains the source of truth."],
];
notes.getRange("A1:B1").format = { fill: "#7030A0", font: { bold: true, color: "#FFFFFF" } };
notes.getRange("A:B").format.autofitColumns();
notes.getRange("B:B").format.columnWidthPx = 620;
notes.getRange("A:B").format.wrapText = true;

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });
const preview = await wb.render({ sheetName: "Courses", range: "A1:W7", scale: 1, format: "png" });
await fs.writeFile(path.join(previewDir, "courses-template-preview.png"), new Uint8Array(await preview.arrayBuffer()));

const csvCell = (value) => {
  if (value == null) return "";
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
await fs.writeFile(csvPath, [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n"));

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(xlsxPath);
console.log(xlsxPath);
