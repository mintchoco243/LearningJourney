import express from "express";
import { query } from "../db.js";

export const siteFeedbackRouter = express.Router();

const ASPECTS = ["visual", "content", "usability", "usefulness"];

function normalizeRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function pickAspectMap(input, fallback = null) {
  const out = {};
  for (const key of ASPECTS) {
    const val = fallback === null ? normalizeRating(input?.[key]) : String(input?.[key] || "").trim();
    if (fallback === null) {
      if (val !== null) out[key] = val;
    } else if (val) {
      out[key] = val;
    }
  }
  return out;
}

siteFeedbackRouter.post("/", async (req, res, next) => {
  try {
    const overall = normalizeRating(req.body?.overall_rating);
    if (!overall) return res.status(400).json({ error: "INVALID_OVERALL_RATING" });

    const aspectRatings = pickAspectMap(req.body?.aspect_ratings);
    for (const key of ASPECTS) {
      if (!aspectRatings[key]) return res.status(400).json({ error: "MISSING_ASPECT_RATING", aspect: key });
    }

    const aspectFeedback = pickAspectMap(req.body?.aspect_feedback, "");
    const isAnonymous = Boolean(req.body?.is_anonymous);
    const userResult = await query(
      "SELECT id, full_name, team, role FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0] || req.user;

    const result = await query(
      `INSERT INTO site_feedback (
         user_id, is_anonymous, user_name, user_team, user_role,
         overall_rating, aspect_ratings, aspect_feedback, additional_feedback
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, created_at`,
      [
        isAnonymous ? null : req.user.id,
        isAnonymous,
        isAnonymous ? null : (user.full_name || null),
        isAnonymous ? null : (user.team || null),
        isAnonymous ? null : (user.role || null),
        overall,
        JSON.stringify(aspectRatings),
        JSON.stringify(aspectFeedback),
        String(req.body?.additional_feedback || "").trim() || null,
      ],
    );

    res.status(201).json({ feedback: result.rows[0] || { ok: true } });
  } catch (error) {
    next(error);
  }
});
