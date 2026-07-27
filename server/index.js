import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertRuntimeConfig, config } from "./config.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { authRouter } from "./routes/auth.js";
import { coursesRouter } from "./routes/courses.js";
import { ldRequestsRouter } from "./routes/ldRequests.js";
import { meRouter } from "./routes/me.js";
import { policiesRouter } from "./routes/policies.js";
import { siteFeedbackRouter } from "./routes/siteFeedback.js";
import { sessionsRouter } from "./routes/sessions.js";
import { adminDataPrepRouter } from "./routes/admin/dataPrep.js";
import { adminStatsRouter } from "./routes/admin/stats.js";
import { adminCoursesRouter } from "./routes/admin/courses.js";
import { adminSessionsRouter } from "./routes/admin/sessions.js";
import { adminUsersRouter } from "./routes/admin/users.js";
import { adminLdRequestsRouter } from "./routes/admin/ldRequests.js";
import { adminPoliciesRouter } from "./routes/admin/policies.js";
import { adminSiteFeedbackRouter } from "./routes/admin/siteFeedback.js";
import { adminAccountsRouter } from "./routes/admin/accounts.js";
import { adminTestimonialsRouter } from "./routes/admin/testimonials.js";
import { adminAnalyticsRouter } from "./routes/admin/analytics.js";
import { adminSettingsRouter } from "./routes/admin/settings.js";
import { adminMinigameRouter } from "./routes/admin/minigame.js";
import { botRouter } from "./routes/bot.js";
import { faqsRouter } from "./routes/faqs.js";
import { minigameRouter } from "./routes/minigame.js";
import { adminFaqsRouter } from "./routes/admin/faqs.js";
import { localMockApiRouter, localMockAuthRouter } from "./local-mock.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..", "frontend");
// ponytail: require next from frontend's own node_modules instead of duplicating
// the dependency at the root — frontend/package.json already owns this version.
let nextApp = null;
let handleNextRequest = null;
if (!config.apiOnly) {
  const requireFromFrontend = createRequire(path.join(frontendDir, "package.json"));
  nextApp = requireFromFrontend("next")({ dev: config.nodeEnv !== "production", dir: frontendDir });
  handleNextRequest = nextApp.getRequestHandler();
}

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "garena-learning-hub", env: config.nodeEnv });
});

app.get("/api/config/public", async (req, res) => {
  let gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  try {
    const { query } = await import("./db.js");
    const result = await query("SELECT setting_value FROM app_settings WHERE setting_key = $1", ["ga_measurement_id"]);
    if (result && result.rows && result.rows[0]?.setting_value) {
      gaMeasurementId = result.rows[0].setting_value;
    }
  } catch (_) {}
  res.json({ ga_measurement_id: gaMeasurementId });
});

app.get("/api/minigame/status", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const { query } = await import("./db.js");
    const result = await query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('minigame_enabled', 'minigame_started_at', 'minigame_ended_at')");
    const values = Object.fromEntries(result.rows.map((row) => [row.setting_key, row.setting_value]));
    res.json({ enabled: values.minigame_enabled === "true", started_at: values.minigame_started_at || null, ended_at: values.minigame_ended_at || null });
  } catch (error) {
    res.status(503).json({ enabled: false, error: "MINIGAME_STATUS_UNAVAILABLE" });
  }
});

if (process.env.LOCAL_MOCK_MODE === "true") {
  app.use("/auth", localMockAuthRouter);
  app.use("/api", localMockApiRouter);
  console.warn("[local-mock] LOCAL_MOCK_MODE is enabled; data is in-memory and resets on restart.");
} else {
  app.use("/auth", authRouter);
  app.use("/api/me", requireAuth, meRouter);
  app.use("/api/courses", requireAuth, coursesRouter);
  app.use("/api/sessions", requireAuth, sessionsRouter);
  app.use("/api/ld-requests", requireAuth, ldRequestsRouter);
  app.use("/api/policies", requireAuth, policiesRouter);
  app.use("/api/site-feedback", requireAuth, siteFeedbackRouter);
  app.use("/api/bot", requireAuth, botRouter);
  app.use("/api/faqs", requireAuth, faqsRouter);
  app.use("/api/minigame", requireAuth, minigameRouter);
}
app.get("/admin/api/me", requireAuth, requireAdmin, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
    },
    role: req.adminRole,
  });
});
app.use("/admin/api/data-prep", requireAuth, requireAdmin, adminDataPrepRouter);
app.use("/admin/api/stats", requireAuth, requireAdmin, adminStatsRouter);
app.use("/admin/api/courses", requireAuth, requireAdmin, adminCoursesRouter);
app.use("/admin/api/sessions", requireAuth, requireAdmin, adminSessionsRouter);
app.use("/admin/api/users", requireAuth, requireAdmin, adminUsersRouter);
app.use("/admin/api/ld-requests", requireAuth, requireAdmin, adminLdRequestsRouter);
app.use("/admin/api/policies", requireAuth, requireAdmin, adminPoliciesRouter);
app.use("/admin/api/faqs", requireAuth, requireAdmin, adminFaqsRouter);
app.use("/admin/api/site-feedback", requireAuth, requireAdmin, adminSiteFeedbackRouter);
app.use("/admin/api/accounts", requireAuth, requireAdmin, adminAccountsRouter);
app.use("/admin/api/testimonials", requireAuth, requireAdmin, adminTestimonialsRouter);
app.use("/admin/api/analytics", requireAuth, requireAdmin, adminAnalyticsRouter);
app.use("/admin/api/settings", requireAuth, requireAdmin, adminSettingsRouter);
app.use("/admin/api/minigame", requireAuth, requireAdmin, adminMinigameRouter);

// Keep the public iframe URL stable while avoiding static-HTML deployment detection.
app.get("/minigame/snake.html", (req, res, next) => {
  res.type("html");
  res.sendFile(path.join(frontendDir, "public", "minigame", "snake.game"), (error) => {
    if (error) next(error);
  });
});

// Next.js (App Router, includes /admin) handles every remaining route.
if (config.apiOnly) {
  app.use((req, res) => res.status(404).json({ error: "NOT_FOUND" }));
} else {
  app.all("*", (req, res) => handleNextRequest(req, res));
}

app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: error.message || "INTERNAL_SERVER_ERROR" });
});

for (const warning of assertRuntimeConfig()) {
  console.warn(`[config] ${warning}`);
}

function startServer() {
  app.listen(config.port, () => {
    console.log(`Garena Learning Compass listening on :${config.port}`);
  });
}

if (config.apiOnly) {
  startServer();
} else {
  nextApp.prepare().then(startServer);
}
