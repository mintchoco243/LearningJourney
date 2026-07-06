/**
 * import-policy-html.mjs
 *
 * Parses "Gigi Garena.html" (article 146) and imports the L&D policy content
 * into the `policies` table as HTML entries (one per major section).
 *
 * Usage: node server/scripts/import-policy-html.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_FILE = path.join(__dirname, "../../Gigi Garena.html");

// ─── Load .env manually ───────────────────────────────────────────────────────

const envPath = path.join(__dirname, "../../.env");
const envText = await fs.readFile(envPath, "utf-8");
const envVars = Object.fromEntries(
  envText.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.split("=").map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf("=") + 1).trim()))
    .filter(([k]) => k)
);
const DATABASE_URL = envVars["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL not found in .env");
console.log(`🔗 Connecting to: ${DATABASE_URL.replace(/:([^:@]+)@/, ":***@")}`);

// ─── DB connection (direct MySQL, bypass mock) ────────────────────────────────

const pool = mysql.createPool({
  uri: DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 5,
});

async function dbQuery(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ─── 1. Read & extract article body ─────────────────────────────────────────

const raw = await fs.readFile(HTML_FILE, "utf-8");

function extractArticleBody(html) {
  const startMarker = "CHÍNH SÁCH ĐÀO TẠO VÀ PHÁT TRIỂN";
  const endMarker = "Bộ Phận Đào Tạo</span></p>";

  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error("Could not find article markers in HTML file. Check the HTML structure.");
  }

  // Walk back from startMarker to find opening tag
  let openIdx = startIdx;
  while (openIdx > 0 && html[openIdx] !== "<") openIdx--;

  return html.substring(openIdx, endIdx + endMarker.length);
}

// ─── 2. Fix image paths & clean browser extensions ──────────────────────────

function fixImagePaths(html) {
  // Fix local file references to web-accessible paths
  return html
    .replace(/src="\.\/Gigi Garena_files\/(.*?)"/g, 'src="/policy-images/$1"')
    .replace(/src="\.\/Gigi%20Garena_files\/(.*?)"/g, 'src="/policy-images/$1"');
}

function cleanHtml(html) {
  let h = html;
  // Remove style attributes that embed external fonts (just keep layout styles)
  // Remove padding-left that references px offsets — images will center naturally
  h = h.replace(/style="padding-left:\s*\d+px;?"/g, 'style="text-align:center"');
  // Normalize image alignment
  h = h.replace(/class="[^"]*aligncenter[^"]*"/g, 'class="policy-img-center"');
  return h;
}

// ─── 3. Split into logical sections ─────────────────────────────────────────

function extractSection(html, startText, endText) {
  const startIdx = html.indexOf(startText);
  if (startIdx === -1) {
    console.warn(`  ⚠ Section start not found: "${startText}"`);
    return null;
  }

  // Walk back to opening tag
  let start = startIdx;
  while (start > 0 && html[start] !== "<") start--;

  let end;
  if (endText) {
    end = html.indexOf(endText, startIdx);
    if (end === -1) {
      console.warn(`  ⚠ Section end not found: "${endText}" — using end of body`);
      end = html.length;
    } else {
      // Walk back to opening tag of endText's block
      while (end > startIdx && html[end] !== "<") end--;
    }
  } else {
    end = html.length;
  }

  return html.substring(start, end).trim();
}

// ─── 4. Main ─────────────────────────────────────────────────────────────────

console.log("📄 Reading HTML file...");
let body = extractArticleBody(raw);
body = fixImagePaths(body);
body = cleanHtml(body);
console.log(`  Extracted ${body.length} chars of article body`);

function wrap(content) {
  return `<div class="policy-html-content">${content}</div>`;
}

const CATEGORY = "Chính sách đào tạo";

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

// ─── 5. Insert into DB ───────────────────────────────────────────────────────

console.log(`\n🗑  Removing existing entries for category "${CATEGORY}"...`);
await dbQuery("DELETE FROM policies WHERE category = ?", [CATEGORY]);

let inserted = 0;
for (const section of sections) {
  if (!section.content) {
    console.warn(`  ⚠ Skipping "${section.title}" (no content extracted)`);
    continue;
  }

  const htmlContent = wrap(section.content);

  await dbQuery(
    `INSERT INTO policies (id, category, title, content, source_file, order_index, is_active)
     VALUES (UUID(), ?, ?, ?, ?, ?, TRUE)`,
    [CATEGORY, section.title, htmlContent, "Gigi Garena.html", section.order]
  );

  console.log(`  ✅ Inserted: "${section.title}" (${htmlContent.length} chars)`);
  inserted++;
}

await pool.end();
console.log(`\n🎉 Done! Inserted ${inserted} policy sections into DB.`);
