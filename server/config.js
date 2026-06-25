import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/callback",
  },
  devAuthEnabled:
    (process.env.DEV_AUTH_ENABLED || "").toLowerCase() === "true" ||
    (process.env.NODE_ENV || "development") !== "production",
};

export function assertRuntimeConfig() {
  const warnings = [];
  if (!config.databaseUrl) warnings.push("DATABASE_URL is not set; DB-backed API routes will fail.");
  if (!process.env.JWT_SECRET || config.jwtSecret.includes("dev-only")) {
    warnings.push("JWT_SECRET is using a development fallback.");
  }
  if (!config.google.clientId || !config.google.clientSecret) {
    warnings.push("Google OAuth env vars are not complete; /auth/google will return 503.");
  }
  return warnings;
}
