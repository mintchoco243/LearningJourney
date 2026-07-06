import express from "express";
import { GoogleAuth } from "google-auth-library";
import { config } from "../../config.js";

export const adminAnalyticsRouter = express.Router();

const GA_DATA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA_DATA_ENDPOINT = "https://analyticsdata.googleapis.com/v1beta";

function emptyAnalytics(reason, message = null) {
  return {
    implemented: false,
    empty_reason: reason,
    message,
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

function parseServiceAccountCredentials() {
  const raw =
    config.analytics.serviceAccountJson ||
    (config.analytics.serviceAccountJsonBase64
      ? Buffer.from(config.analytics.serviceAccountJsonBase64, "base64").toString("utf8")
      : "");

  if (!raw) return null;

  const credentials = JSON.parse(raw);
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }
  return credentials;
}

async function getGaAccessToken() {
  const credentials = parseServiceAccountCredentials();
  if (!credentials) return null;

  const auth = new GoogleAuth({
    credentials,
    scopes: [GA_DATA_SCOPE],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return typeof token === "string" ? token : token?.token;
}

async function runReport(accessToken, body) {
  const propertyId = config.analytics.propertyId;
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

async function eventCount(accessToken, eventName) {
  const report = await runReport(accessToken, {
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
  if (!config.analytics.propertyId) {
    res.json(emptyAnalytics("GA_PROPERTY_ID_NOT_CONFIGURED"));
    return;
  }

  let accessToken = null;
  try {
    accessToken = await getGaAccessToken();
  } catch (error) {
    res.json(emptyAnalytics("GA_SERVICE_ACCOUNT_INVALID", error.message));
    return;
  }

  if (!accessToken) {
    res.json(emptyAnalytics("GA_SERVICE_ACCOUNT_NOT_CONFIGURED"));
    return;
  }

  try {
    const [summary, today, topPages, courseViews, registerClicks] = await Promise.all([
      runReport(accessToken, {
        dateRanges: [{ startDate: config.analytics.range, endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      runReport(accessToken, {
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      }),
      runReport(accessToken, {
        dateRanges: [{ startDate: config.analytics.range, endDate: "today" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 5,
      }),
      eventCount(accessToken, "course_view"),
      eventCount(accessToken, "course_register_click"),
    ]);

    const users = metricValue(summary, 0);
    const sessions = metricValue(summary, 1);
    const pageviews = metricValue(summary, 2);

    res.json({
      implemented: true,
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
    res.json(emptyAnalytics("GA_DATA_API_FAILED", error.message));
  }
});
