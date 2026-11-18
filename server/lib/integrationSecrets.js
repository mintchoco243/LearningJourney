import crypto from "node:crypto";
import { query } from "../db.js";

const PREFIX = "enc:v1:";

function encryptionKey() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error("INTEGRATION_ENCRYPTION_KEY_OR_JWT_SECRET_REQUIRED");
  return crypto.scryptSync(secret, "learning-compass-integrations-v1", 32);
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptSecret(value) {
  if (!value?.startsWith(PREFIX)) return value || ""; // Existing Alpha settings may be plaintext.
  const [iv, tag, ciphertext] = value.slice(PREFIX.length).split(":").map((part) => Buffer.from(part, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export async function getSetting(key, fallback = "") {
  const result = await query("SELECT setting_value FROM app_settings WHERE setting_key = $1", [key]);
  return result.rows[0]?.setting_value || fallback;
}

export async function saveSetting(key, value) {
  await query(
    `INSERT INTO app_settings (setting_key, setting_value) VALUES ($1, $2)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, String(value)],
  );
}

export async function getSecret(key, fallback = "") {
  const result = await query("SELECT setting_value FROM app_settings WHERE setting_key = $1", [key]);
  const stored = result.rows[0]?.setting_value;
  if (!stored) return fallback;
  if (!stored.startsWith(PREFIX)) {
    // Upgrade legacy Alpha credentials on first read without ever returning them to the browser.
    await saveSecret(key, stored);
    return stored;
  }
  return decryptSecret(stored);
}

export async function saveSecret(key, value) {
  await saveSetting(key, encryptSecret(value));
}
