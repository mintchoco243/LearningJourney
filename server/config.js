import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "gLh2xK9mNpQrVwYzA4bDfJtSuCeHiOkR7vXnMqWsZyBcFjUlPdTgEaImKoNhLw",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "95451265968-167cilthcjgg01n06ac6qgq2b405qoru.apps.googleusercontent.com",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "https://garena-lhub-v3.demo.ffol4.vn/auth/callback",
  },
  devAuthEnabled:
    (process.env.DEV_AUTH_ENABLED || "true").toLowerCase() === "true" ||
    (process.env.NODE_ENV || "development") !== "production",
};

export function assertRuntimeConfig() {
  const warnings = [];
  if (!config.databaseUrl) warnings.push("DATABASE_URL is not set; DB-backed API routes will fail.");
  return warnings;
}
