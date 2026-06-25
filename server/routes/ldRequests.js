import express from "express";
import { query } from "../db.js";

export const ldRequestsRouter = express.Router();

ldRequestsRouter.post("/", async (req, res) => {
  const {
    skills_needed = [],
    description,
    preferred_formats = [],
    weekly_hours,
    preferred_trainers,
    other_notes,
  } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: "DESCRIPTION_REQUIRED" });
  }

  await query(
    `INSERT INTO ld_requests
     (user_id, skills_needed, description, preferred_formats, weekly_hours, preferred_trainers, other_notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [req.user.id, skills_needed, description, preferred_formats, weekly_hours, preferred_trainers, other_notes]
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
