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
// Single-source invariant: UI actions use the unique DB row id. `course_code`
// is display/grouping only and may repeat across multiple learning rows.
const displayCourseCode = (row) => row.course_code || row.code || row.id;
const courseRowId = (row) => row.id || row._id || row.course_row_id || row.course_id || displayCourseCode(row);
const courseType = (row) => String(row.type || "").trim().toLowerCase();
const isExternalCourse = (row) => {
  const type = courseType(row);
  const source = String(row.course_source || row.trainer_type || "").trim().toLowerCase();
  return type === "external" || source === "external" || row.trainer === "External";
};

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return text.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function daysUntil(dateStr, today = new Date()) {
  if (!dateStr) return null;
  const baseDate = today instanceof Date && !Number.isNaN(today.getTime()) ? today : new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return Math.round((target - base) / 86400000);
}

function sessionTimes(value) {
  return String(value || "").match(/\d{1,2}:\d{2}/g) || [];
}

function normalizeSessionStatus(status) {
  return String(status || "open").trim().toLowerCase();
}

export function hasFeaturedTestimonial(row) {
  if (!row) return false;
  return row.has_featured_testimonial === true || Number(row.featured_testimonial_count || 0) > 0;
}

export function publicCourseRating(row) {
  if (!hasFeaturedTestimonial(row)) return null;
  const rating = Number(row.rating);
  return Number.isFinite(rating) && rating > 0 ? rating : null;
}

function effectiveLifecycle(status, date, today = new Date()) {
  const normalized = normalizeSessionStatus(status);
  const remainingDays = daysUntil(date, today);
  if (date && remainingDays != null && remainingDays >= 0 && normalized === "ended") {
    return "open";
  }
  if (date && remainingDays != null && remainingDays < 0 && normalized !== "cancelled") {
    return "ended";
  }
  return normalized;
}

export function mapSessionToUpcoming(s, today = new Date()) {
  const date = dateOnly(s.session_date);
  const times = sessionTimes(s.session_time);
  const sessionStatus = normalizeSessionStatus(s.status);
  const courseStatus = effectiveLifecycle(s.course_status, date, today);
  const countdown = daysUntil(date, today);
  return {
    session_id: s.id || s.session_id || null,
    course_id: courseRowId(s),
    course_code: displayCourseCode(s),
    _id: courseRowId(s),
    title: s.title,
    type: courseType(s) || "scheduled",
    format: normalizeFormat(s.format),
    location: s.location || null,
    description: s.description || "",
    trainer: s.trainer || "",
    duration_minutes: s.duration_hours != null ? Math.round(Number(s.duration_hours) * 60) : null,
    xp_reward: s.xp_reward,
    rating: publicCourseRating(s),
    featured_testimonial_count: Number(s.featured_testimonial_count || 0),
    has_featured_testimonial: hasFeaturedTestimonial(s),
    status: sessionStatus,
    material_url: s.material_url || s.materials_url || null,
    min_participants: s.min_participants ?? null,
    max_participants: s.max_participants ?? null,
    current_count: s.current_count ?? null,
    class_ids: listValue(s.class_ids || s.role_targets),
    rank_ids: listValue(s.rank_ids || s.rank_targets),
    target_ranks: listValue(s.target_ranks || s.rank_ids || s.rank_targets),
    trainer_type: String(s.trainer_type || s.course_source || (normalizeFormat(s.format) === "elearning" || s.trainer === "External" ? "external" : "internal")).trim().toLowerCase(),
    skill_tags: listValue(s.skill_tags),
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
    countdown_days: countdown,
    url: s.registration_url || "#",
    audience: s.audience || "Mọi cấp độ",
  };
}

export const mapSessionToCourse = mapSessionToUpcoming;

export function mapCourseToCard(c, today = new Date()) {
  const date = dateOnly(c.session_date);
  const times = sessionTimes(c.session_time);
  const status = effectiveLifecycle(c.status, date, today);
  const type = courseType(c) || (normalizeFormat(c.format) === "elearning" ? "elearning" : "scheduled");
  const usesReservationFlow = type === "scheduled" || type === "interest";
  const rowId = courseRowId(c);
  return {
    course_id: rowId,
    course_code: displayCourseCode(c),
    _id: rowId,
    course_row_id: rowId,
    title: c.title,
    type,
    description: c.description || "",
    trainer: c.trainer || "",
    format: normalizeFormat(c.format),
    duration_minutes: c.duration_hours != null ? Math.round(Number(c.duration_hours) * 60) : null,
    xp_reward: c.xp_reward,
    skill_tags: listValue(c.skill_tags),
    class_ids: listValue(c.class_ids || c.role_targets),
    rank_ids: listValue(c.rank_ids || c.rank_targets),
    target_ranks: listValue(c.target_ranks || c.rank_ids || c.rank_targets),
    trainer_type: String(c.trainer_type || c.course_source || (normalizeFormat(c.format) === "elearning" || c.trainer === "External" ? "external" : "internal")).trim().toLowerCase(),
    url: c.registration_url || "#",
    fit_tag: c.fit_tag || null,
    course_status: status === "ended" ? "ended" : status === "full" ? "upcoming_closed" : date ? "upcoming_open" : status === "cancelled" ? "cancelled" : status,
    session_id: usesReservationFlow ? rowId : null,
    session_status: c.session_status || null,
    start_date: date,
    start_time: times[0] || null,
    end_time: times[1] || null,
    location: c.location || null,
    max_participants: c.max_participants ?? null,
    current_count: c.current_count ?? null,
    status,
    material_url: c.material_url || c.materials_url || null,
    min_participants: c.min_participants ?? null,
    audience: c.audience || "Mọi cấp độ",
    rating: publicCourseRating(c),
    featured_testimonial_count: Number(c.featured_testimonial_count || 0),
    has_featured_testimonial: hasFeaturedTestimonial(c),
  };
}

export function getCourseCta(course, user = {}) {
  const c = course || {};
  const type = isExternalCourse(c) ? "external" : (courseType(c) || (c.format === "elearning" ? "elearning" : "scheduled"));
  const rowId = c._id || c.id || c.course_row_id;
  const completed = rowId
    ? (user.completed_courses || []).includes(rowId)
    : (user.completed_courses || []).includes(c.course_id);
  const reserved = c.session_id && (user.registered_events || []).includes(c.session_id);
  const hasMaterial = Boolean(c.material_url);
  const hasUrl = Boolean(c.url && c.url !== "#");
  const status = effectiveLifecycle(c.course_status, c.start_date);

  if (completed) {
    if ((type === "elearning" || c.format === "elearning") && hasUrl) {
      return { key: "review", text: "Xem lại →", modalText: "Xem lại", tone: "purple", action: "url", disabled: false };
    }
    return hasMaterial
      ? { key: "completed_material", text: "Xem tài liệu →", modalText: "Xem tài liệu", tone: "purple", action: "material", disabled: false }
      : { key: "completed", text: "Đã hoàn thành", modalText: "Đã hoàn thành", tone: "success", action: "none", disabled: true };
  }
  if (status === "cancelled" || c.session_status === "cancelled") {
    return { key: "cancelled", text: "Đã hủy", modalText: "Khóa đã hủy", tone: "muted", action: "none", disabled: true };
  }
  if (status === "ended") {
    if (type === "elearning" || c.format === "elearning") {
      return hasUrl
        ? { key: "learn", text: "Học ngay →", modalText: "Học ngay", tone: "purple", action: "url", disabled: false }
        : { key: "complete", text: "Đánh dấu đã hoàn thành", modalText: "Đánh dấu đã hoàn thành", tone: "success", action: "complete", disabled: false };
    }
    if (hasMaterial) {
      return { key: "material", text: "Xem tài liệu →", modalText: "Xem tài liệu", tone: "muted", action: "material", disabled: false };
    }
    if (type === "external") {
      return { key: "complete", text: "Đánh dấu đã hoàn thành", modalText: "Đánh dấu đã hoàn thành", tone: "success", action: "complete", disabled: false };
    }
    return { key: "ended", text: "Đã kết thúc", modalText: "Đã kết thúc", tone: "muted", action: "none", disabled: true };
  }
  if (reserved) {
    return { key: "reserved", text: type === "interest" ? "Đã đặt chỗ" : "Đã đăng ký", modalText: type === "interest" ? "Đã đặt chỗ" : "Đã đăng ký", tone: "success", action: "none", disabled: true };
  }
  if (type === "material_only") {
    return hasMaterial
      ? { key: "material", text: "Xem tài liệu →", modalText: "Xem tài liệu", tone: "muted", action: "material", disabled: false }
      : { key: "detail", text: "Xem chi tiết →", modalText: "Xem chi tiết", tone: "muted", action: "none", disabled: true };
  }
  if (type === "elearning" || c.format === "elearning") {
    return { key: "learn", text: "Học ngay →", modalText: "Học ngay", tone: "purple", action: hasUrl ? "url" : "none", disabled: !hasUrl };
  }
  if (type === "external") {
    return { key: "external_register", text: "Đăng ký →", modalText: "Đăng ký", tone: "accent", action: hasUrl ? "url" : "none", disabled: !hasUrl };
  }
  if (type === "interest") {
    if (status === "upcoming_closed" || status === "full" || c.session_status === "full") {
      return { key: "interest_full", text: "Đã đủ nhu cầu", modalText: "Đã đủ nhu cầu", tone: "warning", action: "none", disabled: true };
    }
    return { key: "interest", text: "Đặt chỗ →", modalText: "Đặt chỗ", tone: "accent", action: "reserve", disabled: !c.session_id };
  }
  if (status === "upcoming_closed" || c.session_status === "full") {
    return { key: "full", text: "Đã đủ slot", modalText: "Đã đủ slot", tone: "warning", action: "none", disabled: true };
  }
  if (status === "upcoming_open" || c.session_id) {
    return { key: "register", text: "Đăng ký →", modalText: "Đăng ký tham gia", tone: "accent", action: "reserve", disabled: !c.session_id };
  }
  if (c.format === "online" || c.format === "offline") {
    return { key: "register", text: "Đăng ký →", modalText: "Đăng ký tham gia", tone: "accent", action: hasUrl ? "url" : "none", disabled: !hasUrl };
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
  const byCourse = new Map();
  for (const course of (courses || []).map((item) => mapCourseToCard(item))) {
    const existing = byCourse.get(course.course_id);
    if (!existing) {
      byCourse.set(course.course_id, course);
      continue;
    }
    const existingScore = (existing.start_date ? 0 : 2) + (FIT_RANK[existing.fit_tag] != null ? 1 : 0);
    const nextScore = (course.start_date ? 0 : 2) + (FIT_RANK[course.fit_tag] != null ? 1 : 0);
    if (nextScore > existingScore) byCourse.set(course.course_id, course);
  }
  return [...byCourse.values()]
    .sort((a, b) => (FIT_RANK[a.fit_tag] ?? 2) - (FIT_RANK[b.fit_tag] ?? 2))
    .slice(0, 6);
}

export function sortCoursesByStatusPriority(courses = [], user = {}) {
  const completedIds = new Set(user.completed_courses || []);
  const registeredIds = new Set(user.registered_events || []);
  const today = new Date();

  const getPriorityGroup = (course) => {
    const rowId = course._id || course.id || course.course_row_id || course.course_id;
    const sessionId = course.session_id || rowId;
    const isCompleted = rowId && completedIds.has(rowId);
    if (isCompleted) return 3; // Group 3: Khóa đã học

    const date = course.start_date || (course.session_date ? String(course.session_date).split("T")[0] : null);
    const status = effectiveLifecycle(course.course_status || course.status, date, today);

    if (status === "ended" || status === "cancelled") {
      return 4; // Group 4: Khóa đã kết thúc
    }

    const isRegistered = sessionId && registeredIds.has(sessionId);
    if (isRegistered) return 1; // Group 1: Khóa sắp diễn ra đã đăng ký

    return 2; // Group 2: Khóa sắp diễn ra chưa đăng ký
  };

  return [...(courses || [])].sort((a, b) => {
    const gA = getPriorityGroup(a);
    const gB = getPriorityGroup(b);
    if (gA !== gB) return gA - gB;
    const timeA = a.start_date ? new Date(a.start_date).getTime() : Number.POSITIVE_INFINITY;
    const timeB = b.start_date ? new Date(b.start_date).getTime() : Number.POSITIVE_INFINITY;
    return timeA - timeB;
  });
}
