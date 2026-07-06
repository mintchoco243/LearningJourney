import express from "express";
import { query } from "../../db.js";

export const adminSiteFeedbackRouter = express.Router();

const STATUSES = new Set(["open", "reviewed", "resolved"]);

adminSiteFeedbackRouter.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         id,
         is_anonymous,
         user_name,
         user_team,
         user_role,
         overall_rating,
         aspect_ratings,
         aspect_feedback,
         additional_feedback,
         status,
         created_at
       FROM site_feedback
       ORDER BY created_at DESC
       LIMIT 200`,
    );
    res.json({ feedback: result.rows });
  } catch (error) {
    next(error);
  }
});

adminSiteFeedbackRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = String(req.body?.status || "").trim();
    if (!STATUSES.has(status)) return res.status(400).json({ error: "INVALID_FEEDBACK_STATUS" });

    await query("UPDATE site_feedback SET status = $2 WHERE id = $1", [id, status]);
    const result = await query(
      `SELECT
         id,
         is_anonymous,
         user_name,
         user_team,
         user_role,
         overall_rating,
         aspect_ratings,
         aspect_feedback,
         additional_feedback,
         status,
         created_at
       FROM site_feedback
       WHERE id = $1`,
      [id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "FEEDBACK_NOT_FOUND" });
    res.json({ feedback: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
