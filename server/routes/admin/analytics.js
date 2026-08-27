import express from "express";
import { GoogleAuth } from "google-auth-library";
import { config } from "../../config.js";
import { query } from "../../db.js";
import { bucketWeekly, ISO_DATE_RE } from "../../lib/weeklyBucket.js";

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
      avg_session_duration: null,
      avg_time_per_view: null,
      course_views: null,
      register_clicks: null,
      conversion_rate: null,
    },
    onboarding_funnel: null,
    top_pages: [],
    timeline: [],
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

async function eventCount(accessToken, propertyId, eventName, startDate, endDate) {
  const report = await runReport(accessToken, propertyId, {
    dateRanges: [{ startDate, endDate }],
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

// Staff browsing the admin dashboard itself generate real GA sessions that would
// otherwise inflate "site" traffic numbers, so every visitor-facing query excludes them.
const EXCLUDE_ADMIN_TRAFFIC_FILTER = {
  notExpression: {
    filter: {
      fieldName: "pagePath",
      stringFilter: { matchType: "CONTAINS", value: "/admin" },
    },
  },
};

function formatDuration(seconds) {
  const total = Math.round(Number(seconds) || 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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

  const startDate = req.query.startDate || config.analytics.range;
  const endDate = req.query.endDate || "today";

  try {
    const [summary, dailySeries, topPages, courseViews, registerClicks] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "userEngagementDuration" },
        ],
        dimensionFilter: EXCLUDE_ADMIN_TRAFFIC_FILTER,
      }),
      // Day-by-day breakdown, bucketed into weeks below for the timeline chart.
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        dimensionFilter: EXCLUDE_ADMIN_TRAFFIC_FILTER,
        limit: 370,
      }),
      // One row per pagePath only (no pageTitle) so a page whose title changed
      // mid-range doesn't get split across duplicate rows.
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "totalUsers" },
          { name: "userEngagementDuration" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        dimensionFilter: EXCLUDE_ADMIN_TRAFFIC_FILTER,
        limit: 10,
      }),
      eventCount(accessToken, propertyId, "course_view", startDate, endDate),
      eventCount(accessToken, propertyId, "course_register_click", startDate, endDate),
    ]);

    const [onboardingStart, characterCreated, onboardingComplete, materialViews] = await Promise.all([
      eventCount(accessToken, propertyId, "onboarding_start", startDate, endDate),
      eventCount(accessToken, propertyId, "character_creation_complete", startDate, endDate),
      eventCount(accessToken, propertyId, "onboarding_complete", startDate, endDate),
      eventCount(accessToken, propertyId, "material_view", startDate, endDate),
    ]);

    const users = metricValue(summary, 0);
    const sessions = metricValue(summary, 1);
    const pageviews = metricValue(summary, 2);
    const avgSessionDurationSeconds = metricValue(summary, 3);
    const totalEngagementSeconds = metricValue(summary, 4);
    const avgTimePerViewSeconds = pageviews ? totalEngagementSeconds / pageviews : 0;

    const dailyByDate = {};
    for (const row of dailySeries.rows || []) {
      const raw = row.dimensionValues?.[0]?.value || "";
      if (raw.length !== 8) continue;
      const isoDate = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      dailyByDate[isoDate] = {
        users: Number(row.metricValues?.[0]?.value || 0),
        sessions: Number(row.metricValues?.[1]?.value || 0),
        pageviews: Number(row.metricValues?.[2]?.value || 0),
      };
    }
    const timeline = ISO_DATE_RE.test(startDate) && ISO_DATE_RE.test(endDate)
      ? bucketWeekly(startDate, endDate, dailyByDate, ["users", "sessions", "pageviews"])
      : [];

    res.json({
      implemented: true,
      measurement_id: measurementId,
      date_range: { start: startDate, end: endDate },
      metrics: {
        users,
        sessions,
        pageviews,
        avg_session_duration: formatDuration(avgSessionDurationSeconds),
        avg_time_per_view: formatDuration(avgTimePerViewSeconds),
        course_views: courseViews,
        register_clicks: registerClicks,
        conversion_rate: formatPercent(registerClicks, courseViews),
        material_views: materialViews,
      },
      timeline,
      onboarding_funnel: {
        start: onboardingStart,
        avatar_created: characterCreated,
        completed: onboardingComplete,
      },
      top_pages: (topPages.rows || []).map((row) => {
        const views = Number(row.metricValues?.[0]?.value || 0);
        const pageUsers = Number(row.metricValues?.[1]?.value || 0);
        const engagementSeconds = Number(row.metricValues?.[2]?.value || 0);
        const avgTimePerViewSeconds = views ? engagementSeconds / views : 0;
        return {
          path: row.dimensionValues?.[0]?.value || "",
          views,
          users: pageUsers,
          avg_time_per_view_seconds: Math.round(avgTimePerViewSeconds),
          avg_time_per_view: formatDuration(avgTimePerViewSeconds),
        };
      }),
    });
  } catch (error) {
    console.error("[admin/analytics] GA Data API failed", error);
    res.json(emptyAnalytics("GA_DATA_API_FAILED", error.message, measurementId));
  }
});
