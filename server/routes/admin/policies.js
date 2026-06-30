import express from "express";
import { createRequire } from "node:module";
import { query } from "../../db.js";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");
let pdf = null;
try { pdf = require("pdf-parse"); } catch {}

export const adminPoliciesRouter = express.Router();

// Helper to convert simple HTML to Markdown
function htmlToMarkdown(html) {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n");
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1");
  md = md.replace(/<ul[^>]*>/gi, "");
  md = md.replace(/<\/ul>/gi, "\n");
  md = md.replace(/<ol[^>]*>/gi, "");
  md = md.replace(/<\/ol>/gi, "\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

// GET /admin/api/policies -> List all policies
adminPoliciesRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM policies ORDER BY category ASC, order_index ASC");
    res.json({ policies: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/policies -> Create a policy
adminPoliciesRouter.post("/", async (req, res, next) => {
  try {
    const { category, title, content, source_file, order_index, is_active } = req.body;

    if (!category || !title || !content) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    await query(
      `INSERT INTO policies
         (category, title, content, source_file, order_index, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        category,
        title,
        content,
        source_file || null,
        order_index || 0,
        is_active === undefined ? true : is_active,
      ]
    );

    // Fetch the newly created policy
    const result = await query(
      `SELECT * FROM policies
       WHERE category = $1 AND title = $2
       ORDER BY updated_at DESC LIMIT 1`,
      [category, title]
    );

    res.status(201).json({ policy: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/api/policies/:id -> Update a policy
adminPoliciesRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, title, content, source_file, order_index, is_active } = req.body;

    if (!category || !title || !content) {
      return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
    }

    const check = await query("SELECT id FROM policies WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "POLICY_NOT_FOUND" });

    await query(
      `UPDATE policies
       SET category = $2,
           title = $3,
           content = $4,
           source_file = $5,
           order_index = $6,
           is_active = $7
       WHERE id = $1`,
      [id, category, title, content, source_file || null, order_index || 0, is_active === undefined ? true : is_active]
    );

    const result = await query("SELECT * FROM policies WHERE id = $1", [id]);
    res.json({ policy: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /admin/api/policies/:id -> Delete a policy
adminPoliciesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await query("SELECT id FROM policies WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "POLICY_NOT_FOUND" });

    await query("DELETE FROM policies WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/policies/import -> Import docx/pdf to preview markdown
adminPoliciesRouter.post("/import", async (req, res, next) => {
  try {
    const { fileBase64, fileName } = req.body;

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: "FILE_AND_NAME_REQUIRED" });
    }

    const buffer = Buffer.from(fileBase64, "base64");
    let markdown = "";

    if (fileName.toLowerCase().endsWith(".docx")) {
      const result = await mammoth.convertToHtml({ buffer });
      markdown = htmlToMarkdown(result.value);
    } else if (fileName.toLowerCase().endsWith(".pdf")) {
      const result = await pdf(buffer);
      markdown = result.text;
    } else {
      return res.status(400).json({ error: "UNSUPPORTED_FILE_TYPE_MUST_BE_DOCX_OR_PDF" });
    }

    res.json({
      fileName,
      previewMarkdown: markdown,
    });
  } catch (error) {
    next(error);
  }
});
