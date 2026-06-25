import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
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
import { sessionsRouter } from "./routes/sessions.js";
import { adminDataPrepRouter } from "./routes/admin/dataPrep.js";
import { adminStatsRouter } from "./routes/admin/stats.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "garena-learning-hub", env: config.nodeEnv });
});

app.use("/auth", authRouter);
app.use("/api/me", requireAuth, meRouter);
app.use("/api/courses", requireAuth, coursesRouter);
app.use("/api/sessions", requireAuth, sessionsRouter);
app.use("/api/ld-requests", requireAuth, ldRequestsRouter);
app.use("/api/policies", requireAuth, policiesRouter);
app.use("/admin/api/data-prep", requireAuth, requireAdmin, adminDataPrepRouter);
app.use("/admin/api/stats", requireAuth, requireAdmin, adminStatsRouter);

app.use(express.static(path.join(__dirname, "..", "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: error.message || "INTERNAL_SERVER_ERROR" });
});

for (const warning of assertRuntimeConfig()) {
  console.warn(`[config] ${warning}`);
}

app.listen(config.port, () => {
  console.log(`Garena Learning Hub listening on :${config.port}`);
});
