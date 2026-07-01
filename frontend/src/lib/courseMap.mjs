// Pure mappers: backend API shape -> Dashboard card shape.
// Kept framework-free so courseMap.test.mjs can run under bare `node`.

// Backend `format` is Workshop/Video/Coaching/... — the cards only style
// offline/online/elearning, so collapse to those three buckets.
const FORMAT_MAP = {
  workshop: "offline", coaching: "offline", offline: "offline",
  video: "elearning", elearning: "elearning", "e-learning": "elearning",
  online: "online", webinar: "online",
};
export function normalizeFormat(f) {
  return FORMAT_MAP[String(f || "").toLowerCase()] || "online";
}

const dateOnly = (v) => (v ? String(v).split("T")[0] : null);

export function daysUntil(dateStr, today = new Date()) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - base) / 86400000);
}

export function mapSessionToUpcoming(s, today = new Date()) {
  const date = dateOnly(s.session_date);
  const times = String(s.session_time || "").match(/\d{1,2}:\d{2}/g) || [];
  return {
    course_id: s.course_id,
    title: s.title,
    format: normalizeFormat(s.format),
    location: s.location || null,
    description: s.description || "",
    start_date: date,
    start_time: times[0] || null,
    end_time: times[1] || null,
    course_status: s.status === "open" ? "upcoming_open" : "upcoming_closed",
    countdown_days: daysUntil(date, today),
  };
}

export function mapCourseToCard(c) {
  return {
    course_id: c.id,
    title: c.title,
    description: c.description || "",
    trainer: c.trainer || "",
    format: normalizeFormat(c.format),
    duration_minutes: c.duration_hours != null ? Math.round(Number(c.duration_hours) * 60) : null,
    xp_reward: c.xp_reward,
    skill_tags: c.skill_tags || [],
    url: c.registration_url || "#",
    fit_tag: c.fit_tag || null,
  };
}

// Upcoming = future, non-cancelled sessions, soonest first, max 5.
export function pickUpcoming(sessions, today = new Date()) {
  return (sessions || [])
    .filter((s) => s.status !== "cancelled" && s.session_date)
    .map((s) => mapSessionToUpcoming(s, today))
    .filter((c) => c.countdown_days != null && c.countdown_days >= 0)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 5);
}

const FIT_RANK = { best_fit: 0, for_your_level: 1 };
// Recommended = best-fit courses first, max 6.
export function pickRecommended(courses) {
  return (courses || [])
    .map(mapCourseToCard)
    .sort((a, b) => (FIT_RANK[a.fit_tag] ?? 2) - (FIT_RANK[b.fit_tag] ?? 2))
    .slice(0, 6);
}
