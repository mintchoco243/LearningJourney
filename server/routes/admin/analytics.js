import express from "express";
import { GoogleAuth } from "google-auth-library";
import { config } from "../../config.js";
import { query } from "../../db.js";

export const adminAnalyticsRouter = express.Router();

const GA_DATA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA_DATA_ENDPOINT = "https://analyticsdata.googleapis.com/v1beta";

async function getAnalyticsConfig() {
  let propertyId = config.analytics.propertyId;
  let serviceAccountRaw =
    config.analytics.serviceAccountJson ||
    (config.analytics.serviceAccountJsonBase64
      ? Buffer.from(config.analytics.serviceAccountJsonBase64, "base64").toString("utf8")
      : "");
  let measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

  try {
    const res = await query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ($1, $2, $3)", [
      "ga_property_id",
      "ga_service_account_json",
      "ga_measurement_id"
    ]);
    if (res && res.rows) {
      for (const row of res.rows) {
        if (row.setting_key === "ga_property_id" && row.setting_value) propertyId = row.setting_value;
        if (row.setting_key === "ga_service_account_json" && row.setting_value) serviceAccountRaw = row.setting_value;
        if (row.setting_key === "ga_measurement_id" && row.setting_value) measurementId = row.setting_value;
      }
    }
  } catch (e) {
    console.warn("[admin/analytics] Could not read GA settings from db:", e.message);
  }

  return { propertyId, serviceAccountRaw, measurementId };
}

function emptyAnalytics(reason, message = null, measurementId = "") {
  return {
    implemented: false,
    empty_reason: reason,
    message,
    measurement_id: measurementId,
    metrics: {
      users: null,
      sessions: null,
      pageviews: null,
      active_users_today: null,
      course_views: null,
      register_clicks: null,
      conversion_rate: null,
    },
    top_pages: [],
  };
}

function parseServiceAccountCredentials(raw) {
  if (!raw) return null;
  try {
    const credentials = JSON.parse(raw);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }
    return credentials;
  } catch (_) {
    return null;
  }
}

async function getGaAccessToken(raw) {
  const credentials = parseServiceAccountCredentials(raw);
  if (!credentials) return null;

  const auth = new GoogleAuth({
    credentials,
    scopes: [GA_DATA_SCOPE],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return typeof token === "string" ? token : token?.token;
}

async function runReport(accessToken, propertyId, body) {
  const response = await fetch(`${GA_DATA_ENDPOINT}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA_DATA_API_${response.status}: ${errorText}`);
  }

  return response.json();
}

function metricValue(report, index = 0) {
  const raw = report?.rows?.[0]?.metricValues?.[index]?.value;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function formatPercent(numerator, denominator) {
  if (!denominator) return "0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

async function eventCount(accessToken, propertyId, eventName) {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate: config.analytics.range, endDate: "today" }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: { matchType: "EXACT", value: eventName },
      },
    },
  });
  return metricValue(report);
}

adminAnalyticsRouter.get("/", async (req, res) => {
  const { propertyId, serviceAccountRaw, measurementId } = await getAnalyticsConfig();

  if (!propertyId) {
    res.json(emptyAnalytics("GA_PROPERTY_ID_NOT_CONFIGURED", null, measurementId));
    return;
  }

  let accessToken = null;
  try {
    accessToken = await getGaAccessToken(serviceAccountRaw);
  } catch (error) {
    res.json(emptyAnalytics("GA_SERVICE_ACCOUNT_INVALID", error.message, measurementId));
    return;
  }

  if (!accessToken) {
    res.json(emptyAnalytics("GA_SERVICE_ACCOUNT_NOT_CONFIGURED", null, measurementId));
    return;
  }

  try {
    const [summary, today, topPages, courseViews, registerClicks] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: config.analytics.range, endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: config.analytics.range, endDate: "today" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 5,
      }),
      eventCount(accessToken, propertyId, "course_view"),
      eventCount(accessToken, propertyId, "course_register_click"),
    ]);

    const users = metricValue(summary, 0);
    const sessions = metricValue(summary, 1);
    const pageviews = metricValue(summary, 2);

    res.json({
      implemented: true,
      measurement_id: measurementId,
      date_range: {
        start: config.analytics.range,
        end: "today",
      },
      metrics: {
        users,
        sessions,
        pageviews,
        active_users_today: metricValue(today),
        course_views: courseViews,
        register_clicks: registerClicks,
        conversion_rate: formatPercent(registerClicks, courseViews),
      },
      top_pages: (topPages.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || "",
        title: row.dimensionValues?.[1]?.value || "",
        views: Number(row.metricValues?.[0]?.value || 0),
      })),
    });
  } catch (error) {
    console.error("[admin/analytics] GA Data API failed", error);
    res.json(emptyAnalytics("GA_DATA_API_FAILED", error.message, measurementId));
  }
});
