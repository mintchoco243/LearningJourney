import express from "express";
import { query } from "../../db.js";
import { config } from "../../config.js";

export const adminSettingsRouter = express.Router();

async function getSetting(key, defaultValue = "") {
  try {
    const res = await query("SELECT setting_value FROM app_settings WHERE setting_key = $1", [key]);
    if (res && res.rowCount > 0) {
      return res.rows[0].setting_value || defaultValue;
    }
  } catch (e) {
    console.warn(`Error reading setting ${key}:`, e.message);
  }
  return defaultValue;
}

async function saveSetting(key, value) {
  const check = await query("SELECT setting_key FROM app_settings WHERE setting_key = $1", [key]);
  if (check && check.rowCount > 0) {
    await query("UPDATE app_settings SET setting_value = $2 WHERE setting_key = $1", [key, value]);
  } else {
    await query("INSERT INTO app_settings (setting_key, setting_value) VALUES ($1, $2)", [key, value]);
  }
}

// GET /admin/api/settings/bot
adminSettingsRouter.get("/bot", async (req, res, next) => {
  try {
    const baseUrl = await getSetting("alpha_base_url", "https://knowledge.alpha.insea.io/api/");
    const apiKey = await getSetting("alpha_api_key", "");
    const expertId = await getSetting("alpha_expert_id", "");

    res.json({
      baseUrl,
      apiKey,
      expertId
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/settings/bot
adminSettingsRouter.post("/bot", async (req, res, next) => {
  try {
    const { baseUrl, apiKey, expertId } = req.body;

    if (baseUrl !== undefined) await saveSetting("alpha_base_url", baseUrl.trim());
    if (apiKey !== undefined) await saveSetting("alpha_api_key", apiKey.trim());
    if (expertId !== undefined) await saveSetting("alpha_expert_id", expertId.trim());

    res.json({ success: true, message: "Đã cập nhật cấu hình AI Bot thành công." });
  } catch (error) {
    next(error);
  }
});

// GET /admin/api/settings/analytics
adminSettingsRouter.get("/analytics", async (req, res, next) => {
  try {
    const propertyId = await getSetting("ga_property_id", config.analytics.propertyId || "");
    const measurementId = await getSetting("ga_measurement_id", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "");
    let serviceAccountRaw = await getSetting("ga_service_account_json", "");
    if (!serviceAccountRaw) {
      serviceAccountRaw =
        config.analytics.serviceAccountJson ||
        (config.analytics.serviceAccountJsonBase64
          ? Buffer.from(config.analytics.serviceAccountJsonBase64, "base64").toString("utf8")
          : "");
    }

    let serviceAccountEmail = "";
    if (serviceAccountRaw) {
      try {
        const parsed = JSON.parse(serviceAccountRaw);
        if (parsed && parsed.client_email) {
          serviceAccountEmail = parsed.client_email;
        }
      } catch (_) {
        // invalid json
      }
    }

    res.json({
      propertyId,
      measurementId,
      hasServiceAccount: Boolean(serviceAccountRaw),
      serviceAccountEmail,
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/settings/analytics
adminSettingsRouter.post("/analytics", async (req, res, next) => {
  try {
    const { propertyId, measurementId, serviceAccountJson } = req.body;

    if (propertyId !== undefined) await saveSetting("ga_property_id", String(propertyId).trim());
    if (measurementId !== undefined) await saveSetting("ga_measurement_id", String(measurementId).trim());

    if (serviceAccountJson !== undefined && String(serviceAccountJson).trim() !== "") {
      const raw = String(serviceAccountJson).trim();
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.client_email || !parsed.private_key) {
          return res.status(400).json({ error: "File JSON không hợp lệ: Thiếu client_email hoặc private_key." });
        }
      } catch (e) {
        return res.status(400).json({ error: "Chuỗi Service Account không phải là cú pháp JSON hợp lệ." });
      }
      await saveSetting("ga_service_account_json", raw);
    }

    res.json({ success: true, message: "Đã cập nhật cấu hình Google Analytics thành công!" });
  } catch (error) {
    next(error);
  }
});

