import express from "express";
import crypto from "node:crypto";
import { query, withTransaction } from "../db.js";

export const minigameRouter = express.Router();

const TASKS = [
  { id: "task_daily_login", title: "Đăng nhập hằng ngày", reward: 1 },
  { id: "task_fav_3", title: "Yêu thích 3 khóa học", reward: 1, path: "/library" },
  { id: "task_1", title: "Lướt Trang chủ 30s", reward: 1, activity: "home", seconds: 30, path: "/" },
  { id: "task_2", title: "Lướt Thư viện đào tạo 30s", reward: 1, activity: "library", seconds: 30, path: "/library" },
  { id: "task_3", title: "Xem 1 khóa học bất kỳ 15s", reward: 1, activity: "course", seconds: 15, path: "/library" },
  { id: "task_4", title: "Đánh dấu hoàn thành 1 khóa học", reward: 2, path: "/library" },
  { id: "task_onboarding", title: "Hoàn thành Onboarding Quiz", reward: 1, path: "/" },
];

function parseClaims(value) {
  if (!value) return {};
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return {}; }
}

function claimState(value) {
  const parsed = parseClaims(value);
  if (parsed.claims || parsed.progress) return { claims: parsed.claims || {}, progress: parsed.progress || {} };
  return { claims: parsed, progress: {} };
}

async function settings() {
  const result = await query(
    "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('minigame_enabled', 'minigame_started_at', 'minigame_ended_at')",
  );
  const values = Object.fromEntries(result.rows.map((row) => [row.setting_key, row.setting_value]));
  return {
    enabled: values.minigame_enabled !== "false",
    started_at: values.minigame_started_at || null,
    ended_at: values.minigame_ended_at || null,
  };
}

async function requestMode(req) {
  if (req.get("x-minigame-mode") !== "test") return "production";
  const admin = await query("SELECT 1 FROM admin_accounts WHERE email = $1 AND is_active = TRUE", [req.user.email]);
  return admin.rowCount ? "test" : "production";
}

function suspiciousScore(score) {
  return !Number.isInteger(score) || score < 0 || score > 10000;
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

async function taskState(user, mode = "production") {
  const state = claimState(mode === "test" ? user.minigame_test_task_claims : user.minigame_task_claims);
  const claims = state.claims;
  const progress = state.progress;
  const today = todayKey();
  const [favorites, completions] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM course_favorites WHERE user_id = $1", [user.id]),
    query("SELECT COUNT(*) AS count FROM enrollments WHERE user_id = $1 AND completed_at IS NOT NULL", [user.id]),
  ]);
  const available = {
    task_daily_login: claims[`task_daily_login:${today}`] ? "CLAIMED" : "READY_TO_CLAIM",
    task_fav_3: Number(favorites.rows[0]?.count || 0) >= 3 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_1: Number(progress.task_1 || 0) >= 30 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_2: Number(progress.task_2 || 0) >= 30 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_3: Number(progress.task_3 || 0) >= 15 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_4: Number(completions.rows[0]?.count || 0) >= 1 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_onboarding: user.onboarding_done ? "READY_TO_CLAIM" : "NOT_STARTED",
  };
  return TASKS.map((task) => ({ ...task, progress: progress[task.id] || 0, status: claims[task.id] || available[task.id] }));
}

async function autoClaimTasks(user, mode = "production") {
  const column = mode === "test" ? "minigame_test_task_claims" : "minigame_task_claims";
  const playsColumn = mode === "test" ? "minigame_test_plays" : "minigame_plays";
  return withTransaction(async (client) => {
    const locked = await client.query("SELECT * FROM users WHERE id = $1 FOR UPDATE", [user.id]);
    const currentUser = locked.rows[0] || user;
    const state = claimState(currentUser[column]);
    const states = await taskState(currentUser, mode);
    let reward = 0;
    const claimed = [];
    const now = new Date().toISOString();
    for (const task of states) {
      const key = task.id === "task_daily_login" ? `${task.id}:${todayKey()}` : task.id;
      if (task.status === "READY_TO_CLAIM" && !state.claims[key]) {
        state.claims[key] = now;
        reward += task.reward;
        claimed.push({ id: task.id, title: task.title, reward: task.reward });
      }
    }
    if (!reward) return { state, states, claimed };
    await client.query(`UPDATE users SET ${column} = $2, ${playsColumn} = ${playsColumn} + $3 WHERE id = $1`, [user.id, JSON.stringify(state), reward]);
    currentUser[column] = JSON.stringify(state);
    currentUser[playsColumn] = Number(currentUser[playsColumn] || 0) + reward;
    return { state, states: await taskState(currentUser, mode), claimed };
  });
}

minigameRouter.get("/bootstrap", async (req, res, next) => {
  try {
    const campaign = await settings();
    if (!campaign.started_at && campaign.enabled) {
      const startedAt = new Date().toISOString();
      await query("INSERT INTO app_settings (setting_key, setting_value) VALUES ('minigame_started_at', $1) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [startedAt]);
      campaign.started_at = startedAt;
    }
    const mode = await requestMode(req);
    const userResult = await query(
      "SELECT id, full_name, email, team, onboarding_done, minigame_high_score, minigame_total_runs, minigame_plays, minigame_task_claims, minigame_test_high_score, minigame_test_total_runs, minigame_test_plays, minigame_test_task_claims FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];
    const scoreColumn = mode === "test" ? "minigame_test_high_score" : "minigame_high_score";
    const leaderboard = await query(
      `SELECT id, full_name, email, team, ${scoreColumn} AS score FROM users WHERE ${scoreColumn} > 0 ORDER BY ${scoreColumn} DESC, full_name ASC LIMIT 100`,
    );
    const synced = campaign.enabled || mode === "test"
      ? await autoClaimTasks(user, mode)
      : { states: await taskState(user, mode) };
    res.json({
      campaign,
      mode,
      user: { id: user.id, full_name: user.full_name, email: user.email, team: user.team, high_score: mode === "test" ? (user.minigame_test_high_score || 0) : (user.minigame_high_score || 0), total_runs: mode === "test" ? (user.minigame_test_total_runs || 0) : (user.minigame_total_runs || 0), plays: mode === "test" ? "∞" : (user.minigame_plays ?? 0) },
      tasks: synced.states,
      claimed: synced.claimed || [],
      leaderboard: leaderboard.rows,
    });
  } catch (error) { next(error); }
});

minigameRouter.post("/runs", async (req, res, next) => {
  try {
    const mode = await requestMode(req);
    const campaign = await settings();
    if (!campaign.enabled && mode !== "test") return res.status(410).json({ error: "MINIGAME_CLOSED" });
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const remaining = await withTransaction(async (client) => {
      if (mode === "production") {
        const updated = await client.query("UPDATE users SET minigame_plays = minigame_plays - 1, minigame_last_played_at = NOW() WHERE id = $1 AND minigame_plays > 0", [req.user.id]);
        if (!updated.rowCount) return null;
      }
      await client.query("INSERT INTO minigame_runs (id, user_id, mode, run_token_hash) VALUES ($1, $2, $3, $4)", [crypto.randomUUID(), req.user.id, mode, hash]);
      if (mode === "test") return "∞";
      const current = await client.query("SELECT minigame_plays FROM users WHERE id = $1", [req.user.id]);
      return Number(current.rows[0]?.minigame_plays || 0);
    });
    if (remaining === null) return res.status(409).json({ error: "NO_PLAYS_LEFT" });
    res.json({ run_token: token, plays: remaining });
  } catch (error) { next(error); }
});

minigameRouter.post("/runs/finish", async (req, res, next) => {
  try {
    const score = Number(req.body?.score);
    const token = String(req.body?.run_token || "");
    const mode = await requestMode(req);
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const result = await withTransaction(async (client) => {
      const run = await client.query("SELECT * FROM minigame_runs WHERE user_id = $1 AND run_token_hash = $2 AND mode = $3 FOR UPDATE", [req.user.id, hash, mode]);
      if (!run.rowCount || run.rows[0].score !== null) return null;
      const flagged = suspiciousScore(score);
      await client.query("UPDATE minigame_runs SET score = $1, suspicious = $2 WHERE id = $3", [Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0, flagged, run.rows[0].id]);
      const prefix = mode === "test" ? "minigame_test_" : "minigame_";
      await client.query(`UPDATE users SET ${prefix}total_runs = ${prefix}total_runs + 1, ${prefix}high_score = GREATEST(${prefix}high_score, $2)${mode === "production" ? ", minigame_suspicious = minigame_suspicious OR $3" : ""} WHERE id = $1`, mode === "production" ? [req.user.id, Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0, flagged] : [req.user.id, Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0]);
      return { score, suspicious: flagged };
    });
    if (!result) return res.status(409).json({ error: "RUN_ALREADY_FINISHED" });
    res.json(result);
  } catch (error) { next(error); }
});

minigameRouter.post("/activity", async (req, res, next) => {
  try {
    const mode = await requestMode(req);
    const campaign = await settings();
    if (!campaign.enabled && mode !== "test") return res.status(410).json({ error: "MINIGAME_CLOSED" });
    const activity = String(req.body?.activity || "");
    const seconds = Math.max(0, Math.min(Number(req.body?.seconds || 0), 10));
    const task = TASKS.find((item) => item.activity === activity);
    if (!task || !seconds) return res.status(400).json({ error: "INVALID_ACTIVITY" });
    const userResult = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0];
    const column = mode === "test" ? "minigame_test_task_claims" : "minigame_task_claims";
    const state = claimState(user[column]);
    state.progress[task.id] = Math.min(task.seconds, Number(state.progress[task.id] || 0) + seconds);
    await query(`UPDATE users SET ${column} = $2 WHERE id = $1`, [req.user.id, JSON.stringify(state)]);
    user[column] = JSON.stringify(state);
    const synced = await autoClaimTasks(user, mode);
    res.json({ task_id: task.id, progress: state.progress[task.id], status: synced.states.find((item) => item.id === task.id)?.status, claimed: synced.claimed || [] });
  } catch (error) { next(error); }
});

export { TASKS, parseClaims };
