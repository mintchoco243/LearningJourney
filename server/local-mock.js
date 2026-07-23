import express from "express";
import crypto from "node:crypto";
import { setAuthCookie, signToken, verifyToken } from "./auth.js";

const now = () => new Date().toISOString();
const demoUser = {
  id: "mock-user-0001",
  email: "demo@garena.vn",
  full_name: "Nguyễn Minh Ngọc",
  role: "strategist",
  team: "Product",
  rank: "rank_02",
  focus_skills: ["data", "leadership"],
  learning_formats: ["online", "offline"],
  weekly_hours: "1to2",
  preferred_trainers: ["L&D Team"],
  onboarding_done: true,
  xp_total: 240,
  hours_total: 8.5,
  is_active: true,
  character: { hair: "short", outfit: "red", rank: 2 },
};

const courses = [
  {
    id: "mock-course-001", course_code: "MOCK-DATA-001", title: "Mock · Tư duy dữ liệu cho công việc", trainer: "Data Team",
    trainer_type: "internal", format: "online", duration_hours: 1.5, skill_tags: ["data"], rank_targets: ["rank_01", "rank_02"], role_targets: ["strategist", "operator"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-08-12", session_time: "10:00", location: "Online", max_participants: 30, current_count: 12, xp_reward: 60, rating: 4.8, is_active: true, is_hr_recommended: true, description: "Khóa mock để review recommendation, filter và flow đăng ký.", registration_url: "#",
  },
  {
    id: "mock-course-002", course_code: "MOCK-LEAD-002", title: "Mock · Nền tảng lãnh đạo", trainer: "L&D Team",
    trainer_type: "internal", format: "offline", duration_hours: 2, skill_tags: ["leadership"], rank_targets: ["rank_02", "rank_03"], role_targets: ["strategist", "manager"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-08-20", session_time: "09:00-11:00", location: "HCM Office", max_participants: 24, current_count: 8, xp_reward: 80, rating: 4.7, is_active: true, is_hr_recommended: true, description: "Khóa mock cho HR Recommend và Calendar board.", registration_url: "#",
  },
  {
    id: "mock-course-003", course_code: "MOCK-AI-003", title: "Mock · Ứng dụng AI hằng ngày", trainer: "AI Enablement",
    trainer_type: "internal", format: "elearning", duration_hours: 0.75, skill_tags: ["ai"], rank_targets: ["rank_01", "rank_02"], role_targets: ["all"], type: "elearning", status: "open", session_status: "open", session_date: null, session_time: null, location: null, max_participants: null, current_count: 0, xp_reward: 40, rating: 4.6, is_active: true, is_hr_recommended: false, description: "Khóa mock tự học để review CTA Học ngay và link ngoài.", registration_url: "https://learning.garena.vn/mock-ai-003",
  },
  {
    id: "mock-course-004", course_code: "MOCK-INTEREST-004", title: "Mock · Workshop chưa có lịch", trainer: "External Trainer",
    trainer_type: "external", format: "offline", duration_hours: 3, skill_tags: ["communication"], rank_targets: ["rank_01", "rank_02"], role_targets: ["all"], type: "interest", status: "open", session_status: "open", session_date: null, session_time: null, location: "HN Office", max_participants: null, current_count: 4, xp_reward: 70, rating: 4.4, is_active: true, is_hr_recommended: true, description: "Khóa mock gom nhu cầu để review Đặt chỗ.", registration_url: "#",
  },
  {
    id: "mock-course-005", course_code: "MOCK-FULL-005", title: "Mock · Lớp đã đủ slot", trainer: "Leadership Academy",
    trainer_type: "external", format: "offline", duration_hours: 2, skill_tags: ["strategy"], rank_targets: ["rank_02", "rank_03"], role_targets: ["strategist"], type: "scheduled", status: "full", session_status: "full", session_date: "2026-09-05", session_time: "14:00", location: "HN Office", max_participants: 10, current_count: 10, xp_reward: 80, rating: 4.3, is_active: true, is_hr_recommended: false, description: "Khóa mock để review trạng thái full.", registration_url: "#",
  },
  {
    id: "mock-course-006", course_code: "MOCK-MATERIAL-006", title: "Mock · Recording xem lại", trainer: "L&D Team",
    trainer_type: "internal", format: "online", duration_hours: 1, skill_tags: ["foundations"], rank_targets: ["rank_01", "rank_02"], role_targets: ["all"], type: "material_only", status: "ended", session_status: "ended", session_date: null, session_time: null, location: "Online", max_participants: null, current_count: 0, xp_reward: 30, rating: 4.2, is_active: true, is_hr_recommended: false, material_url: "https://learning.garena.vn/mock-material-006", description: "Khóa mock đã kết thúc có tài liệu.", registration_url: "#",
  },
];

const state = {
  users: new Map([[demoUser.id, { ...demoUser }]]),
  favorites: new Set(),
  reservations: new Map(),
  enrollments: new Map(),
  requests: [],
};

const skillCatalog = [
  ["foundations", "Nền tảng Garena"], ["data", "Tư duy dữ liệu"], ["communication", "Giao tiếp"], ["product", "Tư duy sản phẩm"],
  ["ai", "Ứng dụng AI"], ["analytics", "Phân tích"], ["leadership", "Kỹ năng lãnh đạo"], ["facilitation", "Điều phối"],
  ["strategy", "Chiến lược"], ["ops_excellence", "Vận hành"], ["mentoring", "Dẫn dắt"],
].map(([id, label], index) => ({ id, label, display_order: index + 1, is_active: true }));

const faqs = [
  { id: "mock-faq-1", topic: "Đăng ký & Lịch học", question: "Đăng ký khóa học mock hoạt động thế nào?", answer: "Chọn khóa học, xem chi tiết rồi xác nhận Đăng ký hoặc Đặt chỗ.", keywords: "đăng ký lịch học", status: "Published", display_order: 1 },
  { id: "mock-faq-2", topic: "Chính sách đào tạo", question: "Có hỗ trợ khóa học bên ngoài không?", answer: "Bạn có thể gửi L&D Request để team xem xét theo chính sách hiện hành.", keywords: "policy sponsor", status: "Published", display_order: 2 },
];

function publicUser(user) {
  return { ...user, focus_skills: [...(user.focus_skills || [])], character: user.character || null };
}

function currentUser(req) {
  try {
    const token = req.cookies?.glh_token;
    const payload = token ? verifyToken(token) : null;
    return payload ? state.users.get(payload.userId) : null;
  } catch {
    return null;
  }
}

function requireMockUser(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
  req.user = user;
  next();
}

function courseForUser(course, user) {
  const id = `${user.id}:${course.id}`;
  return { ...course, is_favorite: state.favorites.has(id), is_reserved: state.reservations.has(id), is_enrolled: state.enrollments.has(id), has_featured_testimonial: false, featured_testimonial_count: 0 };
}

function userSnapshot(user) {
  const reservations = [...state.reservations.entries()]
    .filter(([key]) => key.startsWith(`${user.id}:`))
    .map(([, item]) => ({ ...item, reservation_id: item.id, reservation_status: item.status, session_id: item.course_id, course_id: item.course_id }));
  const enrollments = [...state.enrollments.entries()]
    .filter(([key]) => key.startsWith(`${user.id}:`))
    .map(([, item]) => ({ ...item, enrollment_id: item.id, course_id: item.course_id }));
  const favorites = courses.filter((course) => state.favorites.has(`${user.id}:${course.id}`)).map((course) => courseForUser(course, user));
  return { user: publicUser(user), reservations, enrollments, favorites };
}

export const localMockAuthRouter = express.Router();
localMockAuthRouter.post("/dev-login", (req, res) => {
  const email = String(req.body?.email || "demo@garena.vn").trim().toLowerCase();
  const id = email === demoUser.email ? demoUser.id : `mock-${crypto.createHash("sha1").update(email).digest("hex").slice(0, 12)}`;
  if (!state.users.has(id)) state.users.set(id, { ...demoUser, id, email, full_name: email.split("@")[0].replace(/[._-]/g, " ") });
  const user = state.users.get(id);
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ token, user: publicUser(user) });
});
localMockAuthRouter.post("/logout", (_req, res) => {
  res.clearCookie("glh_token");
  res.json({ ok: true });
});

export const localMockApiRouter = express.Router();
localMockApiRouter.use(requireMockUser);

localMockApiRouter.get("/me", (req, res) => res.json(userSnapshot(req.user)));
localMockApiRouter.put("/me", (req, res) => {
  Object.assign(req.user, req.body.character !== undefined ? { character: req.body.character } : {});
  res.json({ user: publicUser(req.user) });
});
localMockApiRouter.post("/me/onboarding", (req, res) => {
  Object.assign(req.user, {
    learning_formats: req.body.learning_formats || [], weekly_hours: req.body.weekly_hours || null,
    preferred_trainers: req.body.preferred_trainers || [], focus_skills: req.body.focus_skills || [], onboarding_done: true,
  });
  res.json({ user: publicUser(req.user), xp_earned: 50 });
});

localMockApiRouter.get("/courses", (req, res) => {
  let list = courses.filter((course) => course.is_active && course.status !== "draft");
  if (req.query.search) {
    const term = String(req.query.search).toLowerCase();
    list = list.filter((course) => `${course.title} ${course.trainer} ${course.description}`.toLowerCase().includes(term));
  }
  res.json({ courses: list.map((course) => courseForUser(course, req.user)), page: 1, limit: 100 });
});
localMockApiRouter.get("/courses/options", (_req, res) => res.json({
  ranks: ["rank_01", "rank_02", "rank_03"], roles: ["strategist", "operator", "manager"], trainers: ["Data Team", "L&D Team", "AI Enablement", "Leadership Academy"], locations: ["Online", "HN Office", "HCM Office"], skills: skillCatalog,
}));
localMockApiRouter.get("/courses/recommendations", (req, res) => {
  const available = courses.filter((course) => course.is_active && course.status !== "draft" && course.status !== "ended");
  const quiz = (req.user.focus_skills || []).map((skill) => available.find((course) => course.skill_tags.includes(skill) && !courseForUser(course, req.user).is_enrolled && !courseForUser(course, req.user).is_reserved)).filter(Boolean).slice(0, 3);
  const used = new Set(quiz.map((course) => course.id));
  const hr = available.filter((course) => course.is_hr_recommended && !used.has(course.id)).slice(0, 3);
  res.json({ quiz_skill_courses: quiz.map((course) => courseForUser(course, req.user)), hr_recommended_courses: hr.map((course) => courseForUser(course, req.user)), courses: [...quiz, ...hr].map((course) => courseForUser(course, req.user)) });
});
localMockApiRouter.get("/courses/:id", (req, res) => {
  const course = courses.find((item) => item.id === req.params.id);
  if (!course) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
  res.json({ course: courseForUser(course, req.user) });
});
localMockApiRouter.post("/courses/:id/favorite", (req, res) => {
  const course = courses.find((item) => item.id === req.params.id);
  if (!course) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
  state.favorites.add(`${req.user.id}:${course.id}`);
  res.status(201).json({ is_favorite: true, favorite: { id: crypto.randomUUID(), course_id: course.id } });
});
localMockApiRouter.delete("/courses/:id/favorite", (req, res) => {
  state.favorites.delete(`${req.user.id}:${req.params.id}`);
  res.json({ is_favorite: false });
});
localMockApiRouter.post("/courses/:id/complete", (req, res) => {
  const course = courses.find((item) => item.id === req.params.id);
  if (!course) return res.status(404).json({ error: "COURSE_NOT_FOUND" });
  const key = `${req.user.id}:${course.id}`;
  if (state.enrollments.has(key)) return res.status(409).json({ error: "ALREADY_COMPLETED", user: publicUser(req.user) });
  state.enrollments.set(key, { id: crypto.randomUUID(), course_id: course.id, completed_at: now(), xp_earned: course.xp_reward, hours_earned: course.duration_hours, ...course });
  req.user.xp_total += course.xp_reward;
  req.user.hours_total += course.duration_hours;
  res.status(201).json({ course: courseForUser(course, req.user), user: publicUser(req.user) });
});
localMockApiRouter.delete("/courses/:id/complete", (req, res) => {
  state.enrollments.delete(`${req.user.id}:${req.params.id}`);
  res.json({ ok: true, user: publicUser(req.user) });
});
localMockApiRouter.get("/courses/:id/testimonials", (_req, res) => res.json({ testimonials: [] }));
localMockApiRouter.post("/courses/:id/testimonials", (_req, res) => res.status(201).json({ testimonial: { id: crypto.randomUUID() } }));

localMockApiRouter.post("/sessions/:id/reserve", (req, res) => {
  const course = courses.find((item) => item.id === req.params.id);
  if (!course) return res.status(404).json({ error: "SESSION_NOT_FOUND" });
  if (course.status === "full" || course.session_status === "full") return res.status(409).json({ error: "SESSION_FULL" });
  const key = `${req.user.id}:${course.id}`;
  if (state.reservations.has(key)) return res.status(409).json({ error: "ALREADY_RESERVED" });
  const reservation = { id: crypto.randomUUID(), user_id: req.user.id, session_id: course.id, course_id: course.id, status: "pending", reserved_at: now(), ...course };
  state.reservations.set(key, reservation);
  course.current_count = Number(course.current_count || 0) + 1;
  res.status(201).json({ reservation, session: courseForUser(course, req.user) });
});

localMockApiRouter.get("/sessions", (req, res) => res.json({ sessions: courses.filter((course) => course.session_date).map((course) => courseForUser(course, req.user)) }));
localMockApiRouter.get("/ld-requests/mine", (req, res) => res.json({ requests: state.requests.filter((item) => item.user_id === req.user.id) }));
localMockApiRouter.post("/ld-requests", (req, res) => {
  const request = { id: crypto.randomUUID(), user_id: req.user.id, status: "new", created_at: now(), ...req.body };
  state.requests.unshift(request);
  res.status(201).json({ request });
});
localMockApiRouter.get("/faqs", (_req, res) => res.json({ faqs }));
localMockApiRouter.get("/policies", (_req, res) => res.json({ policies: { "Chính sách đào tạo": [{ id: "mock-policy-1", title: "Hỗ trợ học tập", content: "Nội dung mock để review FAQ và policy." }] } }));
localMockApiRouter.post("/bot/chat", (req, res) => res.json({ reply: "Đây là Hộ Giá mock. Bạn có thể hỏi về khóa học, đăng ký hoặc chính sách L&D.", citations: [], images: [], course_links: courses.slice(0, 3) }));
localMockApiRouter.get("/config/public", (_req, res) => res.json({ ga_measurement_id: "" }));
