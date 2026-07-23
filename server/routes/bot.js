import express from "express";
import { query } from "../db.js";

export const botRouter = express.Router();

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

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function findCourseLinks(messages) {
  const lastUserMessage = [...(messages || [])].reverse().find((message) => message.role === "user");
  const queryText = normalizeSearch(lastUserMessage?.content);
  if (!queryText) return [];
  const rows = await query(
    `SELECT id, course_code, title, description, trainer, format, duration_hours,
            skill_tags, rank_targets, role_targets, type, registration_url,
            material_url, location, session_date, session_time, status, is_active,
            rating, is_hr_recommended
     FROM courses
     WHERE is_active = TRUE AND status NOT IN ('draft', 'cancelled')
     ORDER BY is_hr_recommended DESC, rating DESC, session_date ASC, updated_at DESC
     LIMIT 100`,
  );
  const terms = queryText.split(/\s+/).filter((term) => term.length >= 3);
  const asList = (value) => Array.isArray(value) ? value : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  return rows.rows
    .map((course) => {
      const haystack = normalizeSearch([course.course_code, course.title, course.trainer, ...asList(course.skill_tags)].join(" "));
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { course, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ course }) => course);
}

// POST /api/bot/chat
botRouter.post("/chat", async (req, res) => {
  try {
    const { messages, userEmail, tags, folderIds } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "INVALID_MESSAGES" });
    }

    const baseUrl = (await getSetting("alpha_base_url", "https://knowledge.alpha.insea.io/api/")).replace(/\/?$/, "/");
    const apiKey = await getSetting("alpha_api_key", "");
    const expertId = await getSetting("alpha_expert_id", "");

    if (!apiKey || !expertId) {
      return res.json({
        reply: "⚠️ AI Bot chưa được cấu hình API Key hoặc Expert ID. Quản trị viên vui lòng vào Admin Dashboard -> Cấu hình AI Bot để kết nối.",
        citations: [],
        images: [],
        notConfigured: true
      });
    }

    const payload = {
      messages: messages,
      user: userEmail || req.user?.email || "anonymous@garena.vn",
      stream: false,
      ...(tags && { tags }),
      ...(folderIds && { folderIds })
    };

    const alphaRes = await fetch(`${baseUrl}experts/${expertId}/v2/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!alphaRes.ok) {
      const errText = await alphaRes.text().catch(() => "");
      console.error(`Alpha Knowledge API error (${alphaRes.status}):`, errText);
      return res.status(alphaRes.status).json({
        reply: `⚠️ Lỗi từ máy chủ AI (${alphaRes.status}). Vui lòng kiểm tra lại API Key hoặc Expert ID.`,
        citations: [],
        images: []
      });
    }

    const data = await alphaRes.json();

    // Extract text from choices[0]
    const botText = data.choices?.[0]?.message?.content || "Xin lỗi, mình chưa tìm thấy thông tin giải đáp câu hỏi này.";

    // Extract citations & images metadata from choices[1]
    let metadata = {};
    try {
      if (data.choices?.[1]?.message?.content) {
        metadata = JSON.parse(data.choices[1].message.content);
      }
    } catch (e) {
      console.warn("Could not parse metadata from choices[1]:", e.message);
    }

    let courseLinks = [];
    try {
      courseLinks = await findCourseLinks(messages);
    } catch (error) {
      console.warn("Could not load structured course links:", error.message);
    }

    return res.json({
      reply: botText,
      citations: metadata.citations || [],
      images: metadata.images || [],
      course_links: courseLinks,
    });

  } catch (error) {
    console.error("Bot chat error:", error);
    return res.status(500).json({
      reply: "⚠️ Đã có sự cố xảy ra khi kết nối đến AI Trợ lý. Bạn vui lòng thử lại sau nhé!",
      citations: [],
      images: []
    });
  }
});
