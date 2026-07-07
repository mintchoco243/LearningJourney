import express from "express";
import { query } from "../db.js";

export const ldRequestsRouter = express.Router();

ldRequestsRouter.post("/", async (req, res) => {
  const {
    skills_needed = [],
    description: legacyDescription,
    preferred_formats: legacyPreferredFormats = [],
    weekly_hours,
    preferred_trainers,
    other_notes: legacyOtherNotes,
    topic,
    goal,
    preferred_format,
    preferred_timing,
    scope,
    notes,
  } = req.body;

  const normalizedSkills = Array.isArray(skills_needed)
    ? skills_needed
    : skills_needed
      ? [skills_needed]
      : [];
  const requestTopic = typeof topic === "string" ? topic.trim() : "";
  const requestGoal = typeof goal === "string" ? goal.trim() : "";
  const description = typeof legacyDescription === "string" && legacyDescription.trim()
    ? legacyDescription.trim()
    : [
        requestTopic ? `Topic: ${requestTopic}` : "",
        requestGoal ? `Goal: ${requestGoal}` : "",
        preferred_timing ? `Preferred timing: ${preferred_timing}` : "",
        scope ? `Scope: ${scope}` : "",
      ].filter(Boolean).join("\n");
  const preferredFormats = Array.isArray(legacyPreferredFormats)
    ? legacyPreferredFormats
    : legacyPreferredFormats
      ? [legacyPreferredFormats]
      : [];
  if (preferred_format) preferredFormats.push(preferred_format);
  const otherNotes = [legacyOtherNotes, notes].filter(Boolean).join("\n") || null;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: "DESCRIPTION_REQUIRED" });
  }

  await query(
    `INSERT INTO ld_requests
     (user_id, skills_needed, description, preferred_formats, weekly_hours, preferred_trainers, other_notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      req.user.id,
      requestTopic && normalizedSkills.length === 0 ? [requestTopic] : normalizedSkills,
      description,
      preferredFormats,
      weekly_hours,
      preferred_trainers,
      otherNotes,
      "pending",
    ]
  );
  const result = await query(
    `SELECT * FROM ld_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [req.user.id]
  );
  res.status(201).json({ request: result.rows[0] });
});

ldRequestsRouter.get("/mine", async (req, res) => {
  const result = await query(
    `SELECT * FROM ld_requests
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ requests: result.rows });
});
