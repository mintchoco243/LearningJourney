import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { query } from "./db.js";
import { isMysqlUrl } from "./db-mysql.js";

const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl
);

export function isGarenaEmail(email) {
  return typeof email === "string" && email.toLowerCase().endsWith("@garena.vn");
}

export function signToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function setAuthCookie(res, token) {
  res.cookie("glh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie("glh_token");
}

export function googleAuthUrl() {
  return googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
  });
}

export async function getGoogleProfile(code) {
  const { tokens } = await googleClient.getToken(code);
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.google.clientId,
  });
  const payload = ticket.getPayload();
  return {
    email: payload.email,
    fullName: payload.name || payload.email,
    avatarUrl: payload.picture || null,
  };
}

export async function upsertUser(profile) {
  if (!isGarenaEmail(profile.email)) {
    const error = new Error("Only @garena.vn accounts are allowed.");
    error.status = 401;
    throw error;
  }

  const email = profile.email.toLowerCase();
  if (isMysqlUrl()) {
    await query(
      `INSERT INTO users (email, full_name, avatar_url)
       VALUES ($1, $2, $3)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         avatar_url = VALUES(avatar_url),
         updated_at = NOW()`,
      [email, profile.fullName, profile.avatarUrl]
    );
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0];
  }

  const result = await query(
    `INSERT INTO users (email, full_name, avatar_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET full_name = EXCLUDED.full_name,
                   avatar_url = EXCLUDED.avatar_url,
                   updated_at = NOW()
     RETURNING *`,
    [email, profile.fullName, profile.avatarUrl]
  );
  return result.rows[0];
}

export async function devLoginUser(email = "demo@garena.vn") {
  const name = email.split("@")[0].replace(/[._-]/g, " ");
  return upsertUser({
    email,
    fullName: name.replace(/\b\w/g, (c) => c.toUpperCase()),
    avatarUrl: `https://www.gravatar.com/avatar/${crypto.createHash("md5").update(email).digest("hex")}?d=identicon`,
  });
}
