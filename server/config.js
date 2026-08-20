import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const authSessionDays = Math.max(positiveNumber(process.env.AUTH_SESSION_DAYS, 30), 1);
const authRenewBeforeDays = Math.min(
  Math.max(positiveNumber(process.env.AUTH_RENEW_BEFORE_DAYS, 7), 1),
  authSessionDays,
);

export const config = {
  nodeEnv,
  apiOnly: (process.env.API_ONLY || "false").toLowerCase() === "true",
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "gLh2xK9mNpQrVwYzA4bDfJtSuCeHiOkR7vXnMqWsZyBcFjUlPdTgEaImKoNhLw",
  authSessionDays,
  authRenewBeforeDays,
  authSessionMs: authSessionDays * 24 * 60 * 60 * 1000,
  authRenewBeforeMs: authRenewBeforeDays * 24 * 60 * 60 * 1000,
  authTokenVersion: String(process.env.AUTH_TOKEN_VERSION || "2"),
  authAcceptLegacyTokens:
    (process.env.AUTH_ACCEPT_LEGACY_TOKENS || (nodeEnv === "production" ? "false" : "true")).toLowerCase() === "true",
  jwtExpiresIn: `${authSessionDays}d`,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "95451265968-8rajr2ljr9kf68grc3v7psbg45f2mgtb.apps.googleusercontent.com",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
    // Production uses the canonical domain by default; local/sample deployments
    // should override this with GOOGLE_CALLBACK_URL in their environment.
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      (nodeEnv === "production"
        ? "https://learningcompass.garena.vn/auth/callback"
        : "http://localhost:3000/auth/callback"),
  },
  analytics: {
    propertyId: process.env.GA_PROPERTY_ID || "",
    serviceAccountJson: process.env.GA_SERVICE_ACCOUNT_JSON || "",
    serviceAccountJsonBase64: process.env.GA_SERVICE_ACCOUNT_JSON_BASE64 || "",
    range: process.env.GA_REPORT_RANGE || "30daysAgo",
  },
  devAuthEnabled:
    (process.env.DEV_AUTH_ENABLED || (nodeEnv === "production" ? "false" : "true")).toLowerCase() === "true",
};

export function assertRuntimeConfig() {
  const warnings = [];
  if (!config.databaseUrl) warnings.push("DATABASE_URL is not set; DB-backed API routes will fail.");
  if (config.nodeEnv === "production" && config.authAcceptLegacyTokens) {
    warnings.push("AUTH_ACCEPT_LEGACY_TOKENS is enabled in production; old sessions will not be forced to re-login.");
  }
  return warnings;
}
