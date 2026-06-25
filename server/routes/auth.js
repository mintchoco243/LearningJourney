import express from "express";
import { clearAuthCookie, config, devLoginUser, getGoogleProfile, googleAuthUrl, setAuthCookie, signToken, upsertUser } from "../route-deps.js";
import { query } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = express.Router();

// GET /auth/me -> Get current authenticated user details
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/google", (req, res) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(503).json({ error: "GOOGLE_OAUTH_NOT_CONFIGURED" });
  }
  res.redirect(googleAuthUrl());
});

authRouter.get("/callback", async (req, res, next) => {
  try {
    const profile = await getGoogleProfile(req.query.code);
    const user = await upsertUser(profile);
    const token = signToken(user);
    setAuthCookie(res, token);
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.post("/dev-login", async (req, res, next) => {
  try {
    const email = (req.body?.email || "demo@garena.vn").toLowerCase();
    if (!config.devAuthEnabled) {
      const admin = await query("SELECT email FROM admin_accounts WHERE email = $1 AND is_active = TRUE", [email]);
      if (!admin.rowCount) return res.status(403).json({ error: "ADMIN_REQUIRED" });
    }
    const user = await devLoginUser(email);
    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});
