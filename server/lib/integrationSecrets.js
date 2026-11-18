import crypto from "node:crypto";
import { query } from "../db.js";

const PREFIX = "enc:v2:";
const LEGACY_PREFIX = "enc:v1:";
const KEY_ID = "primary";
const KEY_SALT = "learning-compass-integrations-v2";
const LEGACY_KEY_SALT = "learning-compass-integrations-v1";
let databaseKeyPromise;

function deriveKey(secret, salt) {
  return crypto.scryptSync(secret, salt, 32);
}

async function getDatabaseKey() {
  if (!databaseKeyPromise) {
    databaseKeyPromise = (async () => {
      const generated = crypto.randomBytes(32).toString("base64url");
      await query(
        "INSERT IGNORE INTO integration_crypto_keys (key_id, secret_value) VALUES ($1, $2)",
        [KEY_ID, generated],
      );
      const result = await query(
        "SELECT secret_value FROM integration_crypto_keys WHERE key_id = $1",
        [KEY_ID],
      );
      const secret = result.rows[0]?.secret_value;
      if (!secret) throw new Error("INTEGRATION_CRYPTO_KEY_UNAVAILABLE");
      return deriveKey(secret, KEY_SALT);
    })().catch((error) => {
      databaseKeyPromise = undefined;
      throw error;
    });
  }
  return databaseKeyPromise;
}

function decryptWithKey(value, key, prefix) {
  const [iv, tag, ciphertext] = value.slice(prefix.length).split(":").map((part) => Buffer.from(part, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export async function encryptSecret(value) {
  const envSecret = process.env.INTEGRATION_ENCRYPTION_KEY;
  const keySource = envSecret ? "env:" : "db:";
  const key = envSecret ? deriveKey(envSecret, KEY_SALT) : await getDatabaseKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return `${PREFIX}${keySource}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ciphertext.toString("base64")}`;
}

export async function decryptSecret(value) {
  if (!value?.startsWith(PREFIX) && !value?.startsWith(LEGACY_PREFIX)) return value || "";

  if (value.startsWith(LEGACY_PREFIX)) {
    const legacySecret = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!legacySecret) throw new Error("LEGACY_INTEGRATION_ENCRYPTION_KEY_REQUIRED");
    return decryptWithKey(value, deriveKey(legacySecret, LEGACY_KEY_SALT), LEGACY_PREFIX);
  }

  const dbPrefix = `${PREFIX}db:`;
  const envPrefix = `${PREFIX}env:`;
  if (value.startsWith(dbPrefix)) return decryptWithKey(value, await getDatabaseKey(), dbPrefix);
  if (value.startsWith(envPrefix)) {
    const envSecret = process.env.INTEGRATION_ENCRYPTION_KEY;
    if (!envSecret) throw new Error("INTEGRATION_ENCRYPTION_KEY_REQUIRED_FOR_SAVED_CREDENTIALS");
    return decryptWithKey(value, deriveKey(envSecret, KEY_SALT), envPrefix);
  }
  throw new Error("UNSUPPORTED_INTEGRATION_SECRET_VERSION");
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
  if (!stored.startsWith(PREFIX) && !stored.startsWith(LEGACY_PREFIX)) {
    // Upgrade legacy Alpha credentials on first read without ever returning them to the browser.
    await saveSecret(key, stored);
    return stored;
  }
  const decrypted = await decryptSecret(stored);
  if (stored.startsWith(LEGACY_PREFIX)) await saveSecret(key, decrypted);
  return decrypted;
}

export async function saveSecret(key, value) {
  await saveSetting(key, await encryptSecret(value));
}
