import express from "express";
import { query, withTransaction } from "../../db.js";

export const adminMinigameRouter = express.Router();

async function saveSetting(key, value) {
  await query("INSERT INTO app_settings (setting_key, setting_value) VALUES ($1, $2) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [key, String(value)]);
}

adminMinigameRouter.get("/campaign", async (req, res, next) => {
  try {
    const result = await query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('minigame_enabled', 'minigame_started_at', 'minigame_ended_at')");
    const values = Object.fromEntries(result.rows.map((row) => [row.setting_key, row.setting_value]));
    res.json({ enabled: values.minigame_enabled === "true", started_at: values.minigame_started_at || null, ended_at: values.minigame_ended_at || null });
  } catch (error) { next(error); }
});

adminMinigameRouter.get("/leaderboard", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.team, u.minigame_high_score AS score,
              u.minigame_total_runs AS total_runs, u.minigame_last_played_at AS last_played_at,
              u.minigame_suspicious AS suspicious
       FROM users u
       WHERE u.minigame_total_runs > 0
       ORDER BY u.minigame_high_score DESC, u.minigame_total_runs ASC, u.full_name ASC`,
    );
    res.json({ leaderboard: result.rows });
  } catch (error) { next(error); }
});

adminMinigameRouter.post("/campaign/toggle", async (req, res, next) => {
  try {
    const enabled = req.body?.enabled === true;
    const current = await query("SELECT setting_value FROM app_settings WHERE setting_key = 'minigame_started_at'");
    if (enabled && current.rows[0]?.setting_value) return res.status(409).json({ error: "MINIGAME_CAMPAIGN_ALREADY_STARTED" });
    await saveSetting("minigame_enabled", enabled ? "true" : "false");
    if (enabled) {
      await saveSetting("minigame_started_at", new Date().toISOString());
      await saveSetting("minigame_ended_at", "");
    } else {
      await saveSetting("minigame_ended_at", new Date().toISOString());
    }
    res.json({ enabled });
  } catch (error) { next(error); }
});

adminMinigameRouter.post("/users/:id/reset", async (req, res, next) => {
  try {
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET
          minigame_high_score = 0, minigame_total_runs = 0, minigame_plays = 0,
          minigame_last_played_at = NULL, minigame_suspicious = FALSE,
          minigame_task_claims = NULL, minigame_test_high_score = 0,
          minigame_test_total_runs = 0, minigame_test_plays = 0,
          minigame_test_task_claims = NULL WHERE id = $1`,
        [req.params.id],
      );
      await client.query("DELETE FROM minigame_runs WHERE user_id = $1", [req.params.id]);
    });
    res.json({ ok: true });
  } catch (error) { next(error); }
});
