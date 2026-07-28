import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const sourcePath =
  "G:\\My Drive\\MN04. L&D & Other HR Tasks\\2026\\Learning Journey & Calendar\\Data\\courses.csv";
const outputDir =
  "D:\\Downloads\\KV lam viec\\LearningJourney\\outputs\\019fa16d-50ef-7123-835b-cd3f20d11b0a";
const outputPath = path.join(outputDir, "courses_admin_clean.xlsx");
const previewDir = path.join(outputDir, "work", "previews");

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const csvText = await fs.readFile(sourcePath, "utf8");
const imported = await Workbook.fromCSV(csvText, { sheetName: "Imported" });
const importedSheet = imported.worksheets.getItem("Imported");
const importedValues = importedSheet.getUsedRange(true).values;

if (!importedValues || importedValues.length < 2) {
  throw new Error("courses.csv does not contain a usable header and data rows.");
}

const headers = importedValues[0].map((value) => String(value ?? "").trim());
const sourceRows = importedValues.slice(1);
const headerIndex = Object.fromEntries(headers.map((name, index) => [name, index]));

const numberFields = new Set([
  "duration_hours",
  "rating",
  "enrolled_count",
  "min_participants",
  "xp_reward",
  "is_active",
  "max_participants",
  "current_count",
  "is_hr_recommended",
  "total_learners",
]);
const dateFields = new Set(["session_date"]);
const dateTimeFields = new Set(["created_at", "updated_at"]);
const jsonArrayFields = new Set(["skill_tags", "rank_targets", "role_targets"]);

function cleanValue(header, value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const text = String(value).trim();
  if (numberFields.has(header)) {
    const numeric = Number(text);
    return Number.isFinite(numeric) ? numeric : text;
  }
  if (dateFields.has(header)) {
    const parsed = new Date(`${text}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? text : parsed;
  }
  if (dateTimeFields.has(header)) {
    const parsed = new Date(text.replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? text : parsed;
  }
  if (jsonArrayFields.has(header)) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? JSON.stringify(parsed) : text;
    } catch {
      return text;
    }
  }
  return text;
}

const cleanRows = sourceRows.map((row) =>
  headers.map((header, columnIndex) => cleanValue(header, row[columnIndex])),
);

function uniqueSorted(field) {
  const index = headerIndex[field];
  return [...new Set(cleanRows.map((row) => row[index]).filter((value) => value !== null))]
    .map(String)
    .sort((a, b) => a.localeCompare(b, "en"));
}

function uniqueArrayMembers(field) {
  const index = headerIndex[field];
  const values = [];
  for (const row of cleanRows) {
    const raw = row[index];
    if (!raw) continue;
    try {
      const parsed = JSON.parse(String(raw));
      if (Array.isArray(parsed)) values.push(...parsed.map(String));
    } catch {
      // Invalid JSON is preserved in Courses and will be caught in the review checks.
    }
  }
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en"));
}

const workbook = Workbook.create();
const guide = workbook.worksheets.add("Guide");
const courses = workbook.worksheets.add("Courses");
const options = workbook.worksheets.add("Options");
const review = workbook.worksheets.add("Data Review");
const raw = workbook.worksheets.add("Raw Data");

const darkBlue = "#17365D";
const blue = "#4472C4";
const paleBlue = "#D9EAF7";
const paleYellow = "#FFF2CC";
const paleGreen = "#E2F0D9";
const paleRed = "#FCE4D6";
const softGray = "#F2F2F2";
const borderGray = "#D9E2F3";

// Guide
guide.showGridLines = false;
guide.mergeCells("A1:B2");
guide.getRange("A1").values = [["COURSES DATA ADMINISTRATION"]];
guide.getRange("A1:B2").format = {
  fill: darkBlue,
  font: { bold: true, color: "#FFFFFF", size: 18 },
  verticalAlignment: "center",
  horizontalAlignment: "left",
};
guide.getRange("A4:B4").values = [["Workbook structure", "Purpose"]];
guide.getRange("A5:B8").values = [
  ["Courses", "Bảng quản trị chính, giữ nguyên 30 cột để tương thích với CSV importer."],
  ["Options", "Danh mục dùng cho dropdown và tham chiếu các trường nhiều lựa chọn."],
  ["Data Review", "Các mã course bị lặp cần kiểm tra; chưa tự động xóa hoặc gộp."],
  ["Raw Data", "Dữ liệu được nhập nguyên trạng từ courses.csv để đối chiếu."],
];
guide.getRange("A10:B10").values = [["How to use", "Guidance"]];
guide.getRange("A11:B15").values = [
  ["1", "Chỉnh dữ liệu trong sheet Courses; không chỉnh Raw Data."],
  ["2", "Các cột có dropdown: trainer_type, format, type, is_active, status, session_status, is_hr_recommended."],
  ["3", "skill_tags, rank_targets và role_targets là danh sách nhiều giá trị ở dạng JSON; Excel chuẩn không hỗ trợ multi-select an toàn."],
  ["4", "Khi thêm course mới, sao chép một dòng trong bảng Courses để giữ dropdown và định dạng."],
  ["5", "Trước khi import, xuất riêng sheet Courses thành CSV UTF-8 và giữ đúng tên/header cột."],
];
guide.getRange("A17:B17").values = [["Cleaning applied", "Result"]];
guide.getRange("A18:B22").values = [
  ["Rows retained", `${cleanRows.length} / ${cleanRows.length}; không xóa dòng.`],
  ["Whitespace", "Đã bỏ khoảng trắng thừa ở đầu và cuối giá trị."],
  ["Data types", "Số và ngày được chuyển về kiểu dữ liệu Excel phù hợp."],
  ["JSON arrays", "Đã chuẩn hóa thành JSON hợp lệ, dạng gọn."],
  ["Business values", "Không tự đổi option, không tự hợp nhất course code trùng."],
];
for (const headerRange of ["A4:B4", "A10:B10", "A17:B17"]) {
  guide.getRange(headerRange).format = {
    fill: blue,
    font: { bold: true, color: "#FFFFFF" },
    borders: { preset: "outside", style: "thin", color: borderGray },
  };
}
guide.getRange("A5:B8").format.borders = { preset: "inside", style: "thin", color: borderGray };
guide.getRange("A11:B15").format.borders = { preset: "inside", style: "thin", color: borderGray };
guide.getRange("A18:B22").format.borders = { preset: "inside", style: "thin", color: borderGray };
guide.getRange("A1:H22").format.font = { name: "Aptos", size: 11 };
guide.getRange("A1:H2").format.font = { name: "Aptos Display", bold: true, color: "#FFFFFF", size: 18 };
guide.getRange("A1:H22").format.verticalAlignment = "top";
guide.getRange("B5:B22").format.wrapText = true;
guide.getRange("A1:A22").format.columnWidth = 22;
guide.getRange("B1:B22").format.columnWidth = 86;
guide.getRange("A1:B2").format.rowHeight = 30;
guide.getRange("A13:B13").format.rowHeight = 42;
guide.freezePanes.freezeRows(2);

// Courses
const courseMatrix = [headers, ...cleanRows];
courses.getRangeByIndexes(0, 0, courseMatrix.length, headers.length).values = courseMatrix;
courses.showGridLines = false;
courses.freezePanes.freezeRows(1);
courses.freezePanes.freezeColumns(2);
const courseTable = courses.tables.add(
  courses.getRangeByIndexes(0, 0, courseMatrix.length, headers.length),
  true,
  "CoursesTable",
);
courseTable.style = "TableStyleMedium2";
courseTable.showFilterButton = true;
courseTable.showBandedRows = true;

const dateRowCount = cleanRows.length;
courses.getRange(`U2:U${dateRowCount + 1}`).format.numberFormat = "yyyy-mm-dd";
courses.getRange(`AA2:AB${dateRowCount + 1}`).format.numberFormat = "yyyy-mm-dd hh:mm:ss";
courses.getRange(`G2:G${dateRowCount + 1}`).format.numberFormat = "0.0";
courses.getRange(`K2:K${dateRowCount + 1}`).format.numberFormat = "0.0";
for (const column of ["L", "N", "Q", "R", "X", "Y", "AC", "AD"]) {
  courses.getRange(`${column}2:${column}${dateRowCount + 1}`).format.numberFormat = "0";
}
courses.getRange(`C2:C${dateRowCount + 1}`).format.wrapText = true;
courses.getRange(`P2:P${dateRowCount + 1}`).format.wrapText = true;

const widths = [
  38, 12, 44, 24, 14, 12, 13, 34, 30, 30,
  10, 14, 16, 16, 34, 62, 10, 10, 12, 34,
  13, 12, 28, 16, 14, 16, 20, 20, 18, 15,
];
widths.forEach((width, columnIndex) => {
  courses
    .getRangeByIndexes(0, columnIndex, courseMatrix.length, 1)
    .format.columnWidth = width;
});

// Options
const optionColumns = [
  ["trainer_type", ...uniqueSorted("trainer_type")],
  ["format", ...uniqueSorted("format")],
  ["type", ...uniqueSorted("type")],
  ["is_active", 1, 0],
  ["status", ...uniqueSorted("status")],
  ["session_status", ...uniqueSorted("session_status")],
  ["is_hr_recommended", 1, 0],
  ["skill_tags (multi)", ...uniqueArrayMembers("skill_tags")],
  ["rank_targets (multi)", ...uniqueArrayMembers("rank_targets")],
  ["role_targets (multi)", ...uniqueArrayMembers("role_targets")],
];
const maxOptionRows = Math.max(...optionColumns.map((column) => column.length));
const optionMatrix = Array.from({ length: maxOptionRows }, (_, rowIndex) =>
  optionColumns.map((column) => column[rowIndex] ?? null),
);
options.getRangeByIndexes(0, 0, optionMatrix.length, optionColumns.length).values = optionMatrix;
options.showGridLines = false;
options.freezePanes.freezeRows(1);
options.getRange(`A1:J1`).format = {
  fill: blue,
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: borderGray },
};
options.getRange(`A2:G${maxOptionRows}`).format.fill = paleGreen;
options.getRange(`H2:J${maxOptionRows}`).format.fill = paleYellow;
options.getRange(`A1:J${maxOptionRows}`).format.borders = {
  insideHorizontal: { style: "thin", color: "#E7E6E6" },
  insideVertical: { style: "thin", color: "#E7E6E6" },
};
[18, 18, 18, 14, 16, 18, 20, 32, 24, 26].forEach((width, columnIndex) => {
  options
    .getRangeByIndexes(0, columnIndex, maxOptionRows, 1)
    .format.columnWidth = width;
});
options.getRange("A1:J1").format.rowHeight = 32;

function applyListValidation(columnLetter, optionColumnLetter, optionCount) {
  courses.getRange(`${columnLetter}2:${columnLetter}${dateRowCount + 1}`).dataValidation = {
    rule: {
      type: "list",
      formula1: `Options!$${optionColumnLetter}$2:$${optionColumnLetter}$${optionCount + 1}`,
    },
  };
}
applyListValidation("E", "A", uniqueSorted("trainer_type").length);
applyListValidation("F", "B", uniqueSorted("format").length);
applyListValidation("M", "C", uniqueSorted("type").length);
applyListValidation("R", "D", 2);
applyListValidation("S", "E", uniqueSorted("status").length);
applyListValidation("Z", "F", uniqueSorted("session_status").length);
applyListValidation("AC", "G", 2);

// Review repeated course codes without changing source data.
const codeIndex = headerIndex.course_code;
const titleIndex = headerIndex.title;
const typeIndex = headerIndex.type;
const sessionDateIndex = headerIndex.session_date;
const locationIndex = headerIndex.location;
const idIndex = headerIndex.id;
const groups = new Map();
for (const row of cleanRows) {
  const code = row[codeIndex];
  if (!groups.has(code)) groups.set(code, []);
  groups.get(code).push(row);
}
const reviewRows = [];
function localDateText(value) {
  if (!(value instanceof Date)) return value ?? "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
for (const [code, rows] of groups.entries()) {
  if (rows.length < 2) continue;
  const signatures = new Set(
    rows.map((row) =>
      JSON.stringify([
        row[titleIndex],
        row[typeIndex],
        localDateText(row[sessionDateIndex]),
        row[locationIndex],
      ]),
    ),
  );
  const titleDateSignatures = new Set(
    rows.map((row) =>
      JSON.stringify([row[titleIndex], localDateText(row[sessionDateIndex])]),
    ),
  );
  const potentialDuplicate = titleDateSignatures.size === 1;
  reviewRows.push([
    potentialDuplicate ? "Potential duplicate" : "Repeated course code",
    code,
    rows.length,
    rows.map((row) => row[titleIndex]).join(" | "),
    rows.map((row) => localDateText(row[sessionDateIndex])).join(" | "),
    rows.map((row) => row[locationIndex] ?? "").join(" | "),
    rows.map((row) => row[idIndex]).join(" | "),
    potentialDuplicate
      ? "Kiểm tra và chỉ xóa nếu đây thực sự là bản ghi trùng."
      : "Có thể là nhiều session dùng chung course code; cần xác nhận nghiệp vụ.",
  ]);
}
reviewRows.sort((a, b) => String(a[1]).localeCompare(String(b[1])));
const reviewHeaders = [
  "issue",
  "course_code",
  "record_count",
  "titles",
  "session_dates",
  "locations",
  "record_ids",
  "recommended_action",
];
const reviewMatrix = [reviewHeaders, ...reviewRows];
review.getRangeByIndexes(0, 0, reviewMatrix.length, reviewHeaders.length).values = reviewMatrix;
review.showGridLines = false;
review.freezePanes.freezeRows(1);
const reviewTable = review.tables.add(
  review.getRangeByIndexes(0, 0, reviewMatrix.length, reviewHeaders.length),
  true,
  "DataReviewTable",
);
reviewTable.style = "TableStyleMedium9";
reviewTable.showFilterButton = true;
review.getRange(`A2:A${reviewRows.length + 1}`).conditionalFormats.add("containsText", {
  text: "Potential duplicate",
  format: { fill: paleRed, font: { color: "#9C0006", bold: true } },
});
review.getRange(`A2:H${reviewRows.length + 1}`).format.wrapText = true;
[22, 14, 14, 56, 26, 34, 74, 56].forEach((width, columnIndex) => {
  review
    .getRangeByIndexes(0, columnIndex, reviewMatrix.length, 1)
    .format.columnWidth = width;
});

// Highlight repeated codes in the admin table.
courses.getRange(`B2:B${dateRowCount + 1}`).conditionalFormats.add("duplicateValues", {
  format: { fill: paleYellow, font: { color: "#9C6500", bold: true } },
});

// Raw Data
raw.getRangeByIndexes(0, 0, importedValues.length, headers.length).values = importedValues;
raw.showGridLines = false;
raw.freezePanes.freezeRows(1);
raw.freezePanes.freezeColumns(2);
const rawTable = raw.tables.add(
  raw.getRangeByIndexes(0, 0, importedValues.length, headers.length),
  true,
  "RawCoursesTable",
);
rawTable.style = "TableStyleMedium15";
rawTable.showFilterButton = true;
raw.getRangeByIndexes(0, 0, importedValues.length, headers.length).format.font = {
  name: "Aptos",
  size: 10,
};
widths.forEach((width, columnIndex) => {
  raw
    .getRangeByIndexes(0, columnIndex, importedValues.length, 1)
    .format.columnWidth = Math.min(width, 36);
});

// General typography and row heights.
for (const sheet of [courses, options, review, raw]) {
  const used = sheet.getUsedRange();
  used.format.font = { name: "Aptos", size: 10 };
  used.format.verticalAlignment = "top";
}
courses.getRange("A1:AD1").format.rowHeight = 30;
raw.getRange("A1:AD1").format.rowHeight = 30;
courses.getRange(`A2:AD${dateRowCount + 1}`).format.rowHeight = 40;
raw.getRange(`A2:AD${sourceRows.length + 1}`).format.rowHeight = 22;

const check = await workbook.inspect({
  kind: "table",
  range: `Courses!A1:J10`,
  include: "values,formulas",
  tableMaxRows: 10,
  tableMaxCols: 10,
  maxChars: 6000,
});
console.log("COURSES_CHECK");
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log("ERROR_SCAN");
console.log(errors.ndjson);

const previewSpecs = [
  ["Guide", "A1:B22", "guide.png"],
  ["Courses", "A1:J12", "courses_1.png"],
  ["Courses", "K1:T12", "courses_2.png"],
  ["Courses", "U1:AD12", "courses_3.png"],
  ["Options", `A1:J${Math.min(maxOptionRows, 28)}`, "options.png"],
  ["Data Review", `A1:H${reviewRows.length + 1}`, "review.png"],
  ["Raw Data", "A1:J10", "raw.png"],
];
for (const [sheetName, range, fileName] of previewSpecs) {
  const preview = await workbook.render({
    sheetName,
    range,
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(previewDir, fileName),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, previewDir, rows: cleanRows.length, reviewRows: reviewRows.length }));
