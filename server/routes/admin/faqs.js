import express from "express";
import { query } from "../../db.js";
import { randomUUID } from "node:crypto";

export const adminFaqsRouter = express.Router();

// GET /admin/api/faqs - list all faqs
adminFaqsRouter.get("/", async (req, res) => {
  try {
    const result = await query("SELECT id, topic, question, answer, keywords, status, display_order, last_updated_by, updated_at FROM faqs ORDER BY display_order ASC, created_at ASC");
    res.json({ faqs: result.rows || [] });
  } catch (error) {
    console.error("GET /admin/api/faqs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/api/faqs - create a new faq
adminFaqsRouter.post("/", async (req, res) => {
  try {
    const { topic, question, answer, keywords = "", status = "Published", display_order = 0 } = req.body;
    if (!topic || !question || !answer) {
      return res.status(400).json({ error: "Missing required fields: topic, question, answer" });
    }
    const id = randomUUID();
    const updater = req.user?.email || req.user?.full_name || "Admin";

    await query(
      "INSERT INTO faqs (id, topic, question, answer, keywords, status, display_order, last_updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, topic, question, answer, keywords, status, Number(display_order) || 0, updater]
    );

    const created = await query("SELECT * FROM faqs WHERE id = $1", [id]);
    res.status(201).json({ faq: created.rows?.[0] });
  } catch (error) {
    console.error("POST /admin/api/faqs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/api/faqs/:id - update an existing faq
adminFaqsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, question, answer, keywords = "", status = "Published", display_order = 0 } = req.body;
    const updater = req.user?.email || req.user?.full_name || "Admin";

    await query(
      "UPDATE faqs SET topic = $1, question = $2, answer = $3, keywords = $4, status = $5, display_order = $6, last_updated_by = $7 WHERE id = $8",
      [topic, question, answer, keywords, status, Number(display_order) || 0, updater, id]
    );

    const updated = await query("SELECT * FROM faqs WHERE id = $1", [id]);
    if (!updated.rows?.length) return res.status(404).json({ error: "FAQ not found" });
    res.json({ faq: updated.rows[0] });
  } catch (error) {
    console.error("PUT /admin/api/faqs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/api/faqs/:id - delete a faq
adminFaqsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM faqs WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /admin/api/faqs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
