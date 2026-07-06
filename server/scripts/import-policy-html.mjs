/**
 * Import the full L&D policy article from "Gigi Garena.html" into the
 * `policies` table as one HTML entry per major section.
 *
 * Usage:
 *   node server/scripts/import-policy-html.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const HTML_FILE = process.env.POLICY_HTML_FILE
  ? path.resolve(process.env.POLICY_HTML_FILE)
  : path.join(ROOT, "Gigi Garena.html");
const CATEGORY = "Chính sách đào tạo";
const dryRun = process.argv.includes("--dry-run");
const writeSql = process.argv.includes("--write-sql");

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const eq = line.indexOf("=");
        return eq === -1 ? [line, ""] : [line.slice(0, eq).trim(), line.slice(eq + 1).trim()];
      })
      .filter(([key]) => key),
  );
}

async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(ROOT, ".env");
  const envText = await fs.readFile(envPath, "utf-8");
  return parseEnv(envText).DATABASE_URL;
}

function fixImagePaths(html) {
  return html
    .replace(/src="\.\/Gigi Garena_files\/(.*?)"/g, 'src="/policy-images/$1"')
    .replace(/src="\.\/Gigi%20Garena_files\/(.*?)"/g, 'src="/policy-images/$1"');
}

function cleanHtml(html) {
  return html
    .replace(/style="padding-left:\s*\d+px;?"/g, 'style="text-align:center"')
    .replace(/class="[^"]*aligncenter[^"]*"/g, 'class="policy-img-center"');
}

function extractArticleBody(html) {
  const startMarker = '<div class="body">';
  const endMarker = '<span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Bộ Phận Đào Tạo</span></p>';
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker, startIdx);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error("Could not find the policy article body in Gigi Garena.html");
  }

  return html.substring(startIdx + startMarker.length, endIdx + endMarker.length);
}

function extractSection(html, startText, endText) {
  const startIdx = html.indexOf(startText);
  if (startIdx === -1) {
    throw new Error(`Could not find policy section start: ${startText}`);
  }

  const blockTags = ["h1", "h2", "h3", "h4", "p", "table", "ul", "ol", "div"];
  const start = Math.max(
    ...blockTags.map((tag) => html.lastIndexOf(`<${tag}`, startIdx)),
  );

  let end = html.length;
  if (endText) {
    end = html.indexOf(endText, startIdx);
    if (end === -1) {
      throw new Error(`Could not find policy section end: ${endText}`);
    }
    end = Math.max(
      ...blockTags.map((tag) => html.lastIndexOf(`<${tag}`, end)),
    );
  }

  return html.substring(start, end).trim();
}

function wrap(content) {
  return `<div class="policy-html-content">${content}</div>`;
}

function sqlString(value) {
  return String(value).replace(/'/g, "''");
}

const databaseUrl = await loadDatabaseUrl();
if (!databaseUrl) throw new Error("DATABASE_URL not found in environment or .env");

console.log(`Connecting to: ${databaseUrl.replace(/:([^:@]+)@/, ":***@")}`);

const raw = await fs.readFile(HTML_FILE, "utf-8");
const body = cleanHtml(fixImagePaths(extractArticleBody(raw)));

const sections = [
  {
    title: "I. Khóa học nội bộ do công ty tổ chức",
    content: extractSection(body, "I. Khóa học nội bộ do công ty tổ chức", "II. Khóa học bên ngoài"),
    order: 1,
  },
  {
    title: "II. Khóa học bên ngoài được công ty hỗ trợ chi phí",
    content: extractSection(body, "II. Khóa học bên ngoài", "3. YÊU CẦU VỀ NHÂN VIÊN"),
    order: 2,
  },
  {
    title: "III. Yêu cầu nhân viên & Quy trình đăng ký",
    content: extractSection(body, "3. YÊU CẦU VỀ NHÂN VIÊN", "5. CÁC TRƯỜNG HỢP KHÔNG ÁP DỤNG"),
    order: 3,
  },
  {
    title: "IV. Các trường hợp không áp dụng & Liên hệ",
    content: extractSection(body, "5. CÁC TRƯỜNG HỢP KHÔNG ÁP DỤNG", null),
    order: 4,
  },
];

if (dryRun || writeSql) {
  sections.forEach((section) => {
    const htmlContent = wrap(section.content);
    console.log(`${section.order}. ${section.title}: ${htmlContent.length} chars`);
  });
}

if (writeSql) {
  const values = sections
    .map((section) => {
      const htmlContent = wrap(section.content);
      return `(UUID(), '${sqlString(CATEGORY)}', '${sqlString(section.title)}', '${sqlString(htmlContent)}', 'Gigi Garena.html', ${section.order}, TRUE)`;
    })
    .join(",\n");
  const legacyCategory = "ChÃ­nh sÃ¡ch Ä‘Ã o táº¡o";
  const migration = `-- Import full L&D policy content from Gigi Garena article 146.\nDELETE FROM policies\nWHERE source_file = 'Gigi Garena.html'\n   OR category IN ('${sqlString(CATEGORY)}', '${sqlString(legacyCategory)}');\n\nINSERT INTO policies (id, category, title, content, source_file, order_index, is_active) VALUES\n${values};\n`;
  await fs.writeFile(
    path.join(ROOT, "server", "migrations", "016_policy_content_mysql.sql"),
    migration,
    "utf-8",
  );
  await fs.writeFile(
    path.join(ROOT, "server", "scripts", "import-policy.sql"),
    `-- ============================================================\n-- import-policy.sql\n-- Import full L&D policy content into DB.\n-- Usage: mysql -u root -p learning_journey < server/scripts/import-policy.sql\n-- ============================================================\n\n${migration}\nSELECT id, title, order_index, LENGTH(content) AS content_size\nFROM policies\nWHERE category = '${sqlString(CATEGORY)}'\nORDER BY order_index;\n`,
    "utf-8",
  );
  console.log("Wrote server/migrations/016_policy_content_mysql.sql");
  console.log("Wrote server/scripts/import-policy.sql");
  process.exit(0);
}

if (dryRun) {
  console.log("Dry run complete. No database changes were made.");
  process.exit(0);
}

const pool = mysql.createPool({
  uri: databaseUrl,
  waitForConnections: true,
  connectionLimit: 5,
});

try {
  await pool.execute("DELETE FROM policies WHERE category = ?", [CATEGORY]);

  for (const section of sections) {
    const htmlContent = wrap(section.content);
    await pool.execute(
      `INSERT INTO policies (id, category, title, content, source_file, order_index, is_active)
       VALUES (UUID(), ?, ?, ?, ?, ?, TRUE)`,
      [CATEGORY, section.title, htmlContent, "Gigi Garena.html", section.order],
    );
    console.log(`Inserted ${section.title} (${htmlContent.length} chars)`);
  }

  console.log(`Done. Imported ${sections.length} policy sections.`);
} finally {
  await pool.end();
}
