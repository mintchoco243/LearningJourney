import express from "express";
import { config } from "../../config.js";
import { getSetting, saveSetting, getSecret, saveSecret } from "../../lib/integrationSecrets.js";
import { checkGigiConnection, syncGigiBudget } from "../../services/gigiBudget.js";

export const adminSettingsRouter = express.Router();

function canManageIntegrations(req, res, next) {
  if (["super_admin", "ld_admin"].includes(req.adminRole)) return next();
  return res.status(403).json({ error: "INTEGRATION_ADMIN_REQUIRED" });
}

// GET /admin/api/settings/bot
adminSettingsRouter.get("/bot", async (req, res, next) => {
  try {
    const baseUrl = await getSetting("alpha_base_url", "https://knowledge.alpha.insea.io/api/");
    const apiKey = await getSecret("alpha_api_key", process.env.ALPHA_KNOWLEDGE_API_KEY || "");
    const expertId = await getSetting("alpha_expert_id", "");

    res.json({
      baseUrl,
      hasApiKey: Boolean(apiKey),
      expertId
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/settings/bot
adminSettingsRouter.post("/bot", canManageIntegrations, async (req, res, next) => {
  try {
    const { baseUrl, apiKey, expertId } = req.body;

    if (baseUrl !== undefined) await saveSetting("alpha_base_url", baseUrl.trim());
    if (apiKey !== undefined && String(apiKey).trim()) await saveSecret("alpha_api_key", String(apiKey).trim());
    if (expertId !== undefined) await saveSetting("alpha_expert_id", expertId.trim());

    res.json({ success: true, message: "Đã cập nhật cấu hình AI Bot thành công." });
  } catch (error) {
    next(error);
  }
});

// Separate Alpha Knowledge ingestion from the chat bot connection.
adminSettingsRouter.get("/alpha-sync", async (_req, res, next) => {
  try {
    const baseUrl = await getSetting("alpha_sync_base_url", "https://knowledge.alpha.insea.io/api/");
    const legacyExpertId = await getSetting("alpha_expert_id", "");
    const expertId = await getSetting("alpha_sync_expert_id", process.env.ALPHA_SYNC_EXPERT_ID || legacyExpertId || process.env.ALPHA_KNOWLEDGE_EXPERT_ID || "");
    const legacyKey = await getSecret("alpha_api_key", process.env.ALPHA_KNOWLEDGE_API_KEY || "");
    const key = await getSecret("alpha_sync_api_key", process.env.ALPHA_SYNC_API_KEY || legacyKey);
    if (key && !await getSetting("alpha_sync_api_key", "")) {
      await saveSecret("alpha_sync_api_key", key);
      if (expertId) await saveSetting("alpha_sync_expert_id", expertId);
    }
    res.json({ baseUrl, expertId, hasApiKey: Boolean(key) });
  } catch (error) { next(error); }
});

adminSettingsRouter.post("/alpha-sync", canManageIntegrations, async (req, res, next) => {
  try {
    const { baseUrl, expertId, apiKey } = req.body;
    if (baseUrl !== undefined) await saveSetting("alpha_sync_base_url", String(baseUrl).trim());
    if (expertId !== undefined) await saveSetting("alpha_sync_expert_id", String(expertId).trim());
    if (apiKey !== undefined && String(apiKey).trim()) await saveSecret("alpha_sync_api_key", String(apiKey).trim());
    res.json({ success: true });
  } catch (error) { next(error); }
});

adminSettingsRouter.get("/gigi", async (_req, res, next) => {
  try {
    const key = await getSecret("gigi_client_key", process.env.GIGI_CLIENT_KEY || "");
    res.json({ hasApiKey: Boolean(key) });
  } catch (error) { next(error); }
});

adminSettingsRouter.post("/gigi", canManageIntegrations, async (req, res, next) => {
  try {
    const key = String(req.body.apiKey || "").trim();
    if (!key) return res.status(400).json({ error: "GIGI_KEY_REQUIRED" });
    await saveSecret("gigi_client_key", key);
    res.json({ success: true });
  } catch (error) { next(error); }
});

adminSettingsRouter.post("/gigi/check", canManageIntegrations, async (_req, res) => {
  try { res.json(await checkGigiConnection()); }
  catch (error) { res.status(502).json({ error: error.message }); }
});

adminSettingsRouter.post("/gigi/sync", canManageIntegrations, async (_req, res) => {
  try { res.json(await syncGigiBudget()); }
  catch (error) { res.status(502).json({ error: error.message }); }
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

