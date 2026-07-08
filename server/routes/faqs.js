import express from "express";
import { query } from "../db.js";

export const faqsRouter = express.Router();

// GET /api/faqs - Get published FAQs
faqsRouter.get("/", async (req, res) => {
  try {
    const { topic, q } = req.query;
    let sql = 'SELECT id, topic, question, answer, keywords, status, display_order, updated_at FROM faqs WHERE status = "Published"';
    const params = [];

    if (topic && topic !== "all") {
      params.push(topic);
      sql += ` AND topic = $${params.length}`;
    }

    if (q && q.trim()) {
      const keyword = `%${q.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
      const l = params.length;
      sql += ` AND (question LIKE $${l - 3} OR answer LIKE $${l - 2} OR topic LIKE $${l - 1} OR keywords LIKE $${l})`;
    }

    sql += " ORDER BY display_order ASC, created_at ASC";

    const result = await query(sql, params);
    res.json({ faqs: result.rows || [] });
  } catch (error) {
    console.error("GET /api/faqs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
