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
const courseCode = (row) => row.course_code || row.course_id || row.id;
const courseRowId = (row) => row.id || row.course_id || row.course_code;

export function daysUntil(dateStr, today = new Date()) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - base) / 86400000);
}

function sessionTimes(value) {
  return String(value || "").match(/\d{1,2}:\d{2}/g) || [];
}

function normalizeSessionStatus(status) {
  return String(status || "open").trim().toLowerCase();
}

export function mapSessionToUpcoming(s, today = new Date()) {
  const date = dateOnly(s.session_date);
  const times = sessionTimes(s.session_time);
  const sessionStatus = normalizeSessionStatus(s.status);
  const courseStatus = normalizeSessionStatus(s.course_status);
  return {
    session_id: s.id || s.session_id || null,
    course_id: courseRowId(s),
    course_code: courseCode(s),
    title: s.title,
    format: normalizeFormat(s.format),
    location: s.location || null,
    description: s.description || "",
    trainer: s.trainer || "",
    duration_minutes: s.duration_hours != null ? Math.round(Number(s.duration_hours) * 60) : null,
    xp_reward: s.xp_reward,
    rating: s.rating != null ? Number(s.rating) : null,
    material_url: s.material_url || null,
    min_participants: s.min_participants ?? null,
    max_participants: s.max_participants ?? null,
    current_count: s.current_count ?? null,
    start_date: date,
    start_time: times[0] || null,
    end_time: times[1] || null,
    session_status: sessionStatus,
    course_status: courseStatus === "ended"
      ? "ended"
      : sessionStatus === "cancelled"
      ? "cancelled"
      : sessionStatus === "full"
        ? "upcoming_closed"
        : "upcoming_open",
    countdown_days: daysUntil(date, today),
    url: s.registration_url || "#",
    audience: s.audience || "Mọi cấp độ",
  };
}

export const mapSessionToCourse = mapSessionToUpcoming;

export function mapCourseToCard(c) {
  const status = String(c.status || "").trim().toLowerCase();
  const date = dateOnly(c.session_date);
  const times = sessionTimes(c.session_time);
  return {
    course_id: courseRowId(c),
    course_code: courseCode(c),
    _id: c.id,
    title: c.title,
    description: c.description || "",
    trainer: c.trainer || "",
    format: normalizeFormat(c.format),
    duration_minutes: c.duration_hours != null ? Math.round(Number(c.duration_hours) * 60) : null,
    xp_reward: c.xp_reward,
    skill_tags: c.skill_tags || [],
    url: c.registration_url || "#",
    fit_tag: c.fit_tag || null,
    course_status: status === "ended" ? "ended" : null,
    session_id: date ? c.id : null,
    session_status: c.session_status || null,
    start_date: date,
    start_time: times[0] || null,
    end_time: times[1] || null,
    location: c.location || null,
    max_participants: c.max_participants ?? null,
    current_count: c.current_count ?? null,
    material_url: c.material_url || null,
    audience: c.audience || "Mọi cấp độ",
    rating: c.rating != null ? Number(c.rating) : null,
  };
}

export function getCourseCta(course, user = {}) {
  const c = course || {};
  const completed = (user.completed_courses || []).includes(c.course_id);
  const reserved = c.session_id && (user.registered_events || []).includes(c.session_id);
  const hasMaterial = Boolean(c.material_url);
  const hasUrl = Boolean(c.url && c.url !== "#");
  const status = c.course_status || null;

  if (completed) {
    return hasMaterial
      ? { key: "completed_material", text: "Xem tài liệu →", modalText: "Xem tài liệu", tone: "muted", action: "material", disabled: false }
      : { key: "completed", text: "Đã hoàn thành", modalText: "Đã hoàn thành", tone: "success", action: "none", disabled: true };
  }
  if (status === "cancelled" || c.session_status === "cancelled") {
    return { key: "cancelled", text: "Đã hủy", modalText: "Session đã hủy", tone: "muted", action: "none", disabled: true };
  }
  if (status === "ended") {
    return hasMaterial
      ? { key: "material", text: "Xem tài liệu →", modalText: "Xem tài liệu", tone: "muted", action: "material", disabled: false }
      : { key: "ended", text: "Đã kết thúc", modalText: "Đã kết thúc", tone: "muted", action: "none", disabled: true };
  }
  if (reserved) {
    return { key: "reserved", text: "Đã đăng ký", modalText: "Đã đăng ký", tone: "success", action: "none", disabled: true };
  }
  if (c.format === "elearning" || status === "elearning") {
    return { key: "learn", text: "Học ngay →", modalText: "Học ngay", tone: "purple", action: hasUrl ? "url" : "none", disabled: !hasUrl };
  }
  if (status === "upcoming_closed" || c.session_status === "full") {
    return { key: "waitlist", text: "Đặt chỗ →", modalText: "Đặt chỗ chờ", tone: "warning", action: c.session_id ? "reserve" : hasUrl ? "url" : "none", disabled: !c.session_id && !hasUrl };
  }
  if (status === "upcoming_open" || c.session_id || c.format === "online" || c.format === "offline") {
    return { key: "register", text: "Đăng ký →", modalText: "Đăng ký tham gia", tone: "accent", action: c.session_id ? "reserve" : hasUrl ? "url" : "none", disabled: !c.session_id && !hasUrl };
  }
  return { key: "detail", text: "Xem chi tiết →", modalText: "Xem chi tiết", tone: "muted", action: hasUrl ? "url" : "none", disabled: !hasUrl };
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
