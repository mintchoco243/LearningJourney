import express from "express";
import { query } from "../../db.js";

export const adminSiteFeedbackRouter = express.Router();

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
