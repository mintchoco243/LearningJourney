import express from "express";
import crypto from "node:crypto";
import { query, withTransaction } from "../db.js";

export const minigameRouter = express.Router();

const TASKS = [
  { id: "task_first_login", title: "Hoàn tất đăng nhập lần đầu", reward: 1, reset: "never" },
  { id: "task_daily_login", title: "Đăng nhập hằng ngày", reward: 1 },
  { id: "task_fav_3", title: "Yêu thích 3 khóa học", reward: 1, path: "/library" },
  { id: "task_1", title: "Khám phá Trang chủ 30s", reward: 1, activity: "home", seconds: 30, path: "/" },
  { id: "task_2", title: "Khám phá Thư viện đào tạo 30s", reward: 1, activity: "library", seconds: 30, path: "/library" },
  { id: "task_3", title: "Xem 1 khóa học bất kỳ 15s", reward: 1, activity: "course", seconds: 15, path: "/library" },
  { id: "task_4", title: "Đánh dấu hoàn thành 1 khóa học", reward: 1, path: "/library" },
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

function todayRange() {
  const today = todayKey();
  const start = new Date(`${today}T00:00:00+07:00`);
  return {
    today,
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
  };
}

function taskStorageKey(task, today = todayKey()) {
  return task.reset === "never" ? task.id : `${task.id}:${today}`;
}

async function taskState(user, mode = "production") {
  const state = claimState(mode === "test" ? user.minigame_test_task_claims : user.minigame_task_claims);
  const claims = state.claims;
  const progress = state.progress;
  const { today, start, end } = todayRange();
  const [favorites, completions] = await Promise.all([
    query(
      "SELECT COUNT(*) AS count FROM course_favorites WHERE user_id = $1 AND created_at >= $2 AND created_at < $3",
      [user.id, start, end],
    ),
    query(
      "SELECT COUNT(*) AS count FROM enrollments WHERE user_id = $1 AND completed_at >= $2 AND completed_at < $3",
      [user.id, start, end],
    ),
  ]);
  const progressFor = (task) => Number(progress[taskStorageKey(task, today)] || 0);
  const available = {
    task_first_login: user.onboarding_done ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_daily_login: "READY_TO_CLAIM",
    task_fav_3: Number(favorites.rows[0]?.count || 0) >= 3 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_1: progressFor(TASKS.find((task) => task.id === "task_1")) >= 30 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_2: progressFor(TASKS.find((task) => task.id === "task_2")) >= 30 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_3: progressFor(TASKS.find((task) => task.id === "task_3")) >= 15 ? "READY_TO_CLAIM" : "NOT_STARTED",
    task_4: Number(completions.rows[0]?.count || 0) >= 1 ? "READY_TO_CLAIM" : "NOT_STARTED",
  };
  return TASKS.map((task) => {
    const key = taskStorageKey(task, today);
    return {
      ...task,
      progress: progress[key] || 0,
      status: claims[key] ? "CLAIMED" : available[task.id],
    };
  });
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
      const key = taskStorageKey(task);
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

export async function syncMinigameTasks(userId, mode = "production") {
  try {
    const campaign = await settings();
    if (!campaign.enabled && mode !== "test") return { states: [], claimed: [] };
    const result = await query("SELECT * FROM users WHERE id = $1", [userId]);
    if (!result.rowCount) return { states: [], claimed: [] };
    return await autoClaimTasks(result.rows[0], mode);
  } catch (_) {
    // Minigame rewards must never make a core Learning Compass action fail.
    return { states: [], claimed: [] };
  }
}

minigameRouter.get("/bootstrap", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");
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

minigameRouter.post("/guest-score", async (req, res, next) => {
  try {
    const score = Number(req.body?.score);
    if (suspiciousScore(score)) return res.status(400).json({ error: "INVALID_SCORE" });
    const result = await withTransaction(async (client) => {
      const locked = await client.query("SELECT * FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
      const user = locked.rows[0];
      if (!user) return null;
      const state = claimState(user.minigame_task_claims);
      if (state.claims.guest_demo_imported) {
        return { high_score: Number(user.minigame_high_score || 0), imported: false };
      }
      state.claims.guest_demo_imported = new Date().toISOString();
      await client.query(
        "UPDATE users SET minigame_high_score = GREATEST(minigame_high_score, $2), minigame_total_runs = minigame_total_runs + 1, minigame_task_claims = $3 WHERE id = $1",
        [req.user.id, score, JSON.stringify(state)],
      );
      return { high_score: Math.max(Number(user.minigame_high_score || 0), score), imported: true };
    });
    if (!result) return res.status(404).json({ error: "USER_NOT_FOUND" });
    res.json(result);
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
    const progressKey = taskStorageKey(task);
    state.progress[progressKey] = Math.min(task.seconds, Number(state.progress[progressKey] || 0) + seconds);
    await query(`UPDATE users SET ${column} = $2 WHERE id = $1`, [req.user.id, JSON.stringify(state)]);
    user[column] = JSON.stringify(state);
    const synced = await autoClaimTasks(user, mode);
    res.json({ task_id: task.id, progress: state.progress[progressKey], status: synced.states.find((item) => item.id === task.id)?.status, claimed: synced.claimed || [] });
  } catch (error) { next(error); }
});

export { TASKS, parseClaims };
