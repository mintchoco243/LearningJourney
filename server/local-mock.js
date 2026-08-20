import express from "express";
import crypto from "node:crypto";
import { setAuthCookie, signToken, verifyToken } from "./auth.js";
import { config } from "./config.js";
import { SKILL_OPTIONS, canonicalSkill, canonicalizeFocusSkills } from "./lib/skillCatalog.js";
import { isAllowedGarenaEmail } from "./lib/emailPolicy.js";

const now = () => new Date().toISOString();
const demoUser = {
  id: "mock-user-0001",
  email: "demo@garena.vn",
  full_name: "Nguyễn Minh Ngọc",
  role: "strategist",
  team: "Product",
  rank: "rank_02",
  focus_skills: ["Analysis", "Team and Talent Management"],
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
    trainer_type: "internal", format: "online", duration_hours: 1.5, skill_tags: ["data"], rank_targets: ["rank_01", "rank_02"], role_targets: ["strategist", "operator"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-08-12", session_time: "10:00", location: "Online", max_participants: 30, current_count: 12, total_learners: 240, xp_reward: 60, rating: 4.8, is_active: true, is_hr_recommended: true, description: "Khóa mock để review recommendation, filter và flow đăng ký.", registration_url: "#",
  },
  {
    id: "mock-course-002", course_code: "MOCK-LEAD-002", title: "Mock · Nền tảng lãnh đạo", trainer: "L&D Team",
    trainer_type: "regional", format: "offline", duration_hours: 2, skill_tags: ["leadership"], rank_targets: ["rank_02", "rank_03"], role_targets: ["strategist", "manager"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-08-20", session_time: "09:00-11:00", location: "HCM Office", max_participants: 24, current_count: 8, xp_reward: 80, rating: 4.7, is_active: true, is_hr_recommended: true, description: "Khóa mock cho HR Recommend, Regional trainer và Calendar board.", registration_url: "#",
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
  {
    id: "mock-course-007", course_code: "MOCK-PROD-007", title: "Mock · Tư duy sản phẩm cho người mới", trainer: "Product Guild",
    trainer_type: "internal", format: "online", duration_hours: 1.5, skill_tags: ["product"], rank_targets: ["rank_01"], role_targets: ["operator"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-08-05", session_time: "14:00-15:30", location: "Online", max_participants: 40, current_count: 39, xp_reward: 50, rating: 4.5, is_active: true, is_hr_recommended: false, description: "Khóa mock sắp đầy chỗ, dùng để test cảnh báo sắp hết slot.", registration_url: "#",
  },
  {
    id: "mock-course-008", course_code: "MOCK-ANALYTICS-008", title: "Mock · Phân tích số liệu nâng cao", trainer: "Data Team",
    trainer_type: "internal", format: "offline", duration_hours: 4, skill_tags: ["analytics", "data"], rank_targets: ["rank_02", "rank_03"], role_targets: ["strategist", "manager"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-10-15", session_time: "08:30-12:30", location: "HCM Office", max_participants: 20, current_count: 3, xp_reward: 100, rating: 4.9, is_active: true, is_hr_recommended: true, description: "Khóa mock dài ngày, XP cao, để test hiển thị khóa nâng cao.", registration_url: "#",
  },
  {
    id: "mock-course-009", course_code: "MOCK-FACIL-009", title: "Mock · Điều phối workshop hiệu quả", trainer: "External Trainer",
    trainer_type: "external", format: "offline", duration_hours: 2.5, skill_tags: ["facilitation", "communication"], rank_targets: ["rank_02"], role_targets: ["manager"], type: "scheduled", status: "cancelled", session_status: "cancelled", session_date: "2026-07-30", session_time: "13:00", location: "HN Office", max_participants: 15, current_count: 2, xp_reward: 60, rating: null, is_active: true, is_hr_recommended: false, description: "Khóa mock bị hủy để test trạng thái cancelled.", registration_url: "#",
  },
  {
    id: "mock-course-010", course_code: "MOCK-OPS-010", title: "Mock · Vận hành xuất sắc mỗi ngày", trainer: "Ops Excellence Team",
    trainer_type: "internal", format: "online", duration_hours: 1, skill_tags: ["ops_excellence"], rank_targets: ["rank_01", "rank_02", "rank_03"], role_targets: ["all"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-07-01", session_time: "10:00", location: "Online", max_participants: 50, current_count: 44, xp_reward: 45, rating: 4.1, is_active: true, is_hr_recommended: false, description: "Khóa mock đã diễn ra trong quá khứ so với ngày hiện tại, test lịch sử.", registration_url: "#",
  },
  {
    id: "mock-course-011", course_code: "MOCK-MENTOR-011", title: "Mock · Kỹ năng mentoring 1:1", trainer: "Leadership Academy",
    trainer_type: "external", format: "online", duration_hours: 1.5, skill_tags: ["mentoring", "leadership"], rank_targets: ["rank_03"], role_targets: ["manager"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-11-02", session_time: "16:00", location: "Online", max_participants: 12, current_count: 0, xp_reward: 65, rating: 4.0, is_active: true, is_hr_recommended: false, description: "Khóa mock chưa ai đăng ký, test trạng thái current_count = 0.", registration_url: "#",
  },
  {
    id: "mock-course-012", course_code: "MOCK-STRAT-012", title: "Mock · Chiến lược cạnh tranh thị trường", trainer: "Strategy Office",
    trainer_type: "internal", format: "offline", duration_hours: 3, skill_tags: ["strategy", "product"], rank_targets: ["rank_03"], role_targets: ["manager", "strategist"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-09-18", session_time: "09:00-12:00", location: "HCM Office", max_participants: 18, current_count: 18, xp_reward: 90, rating: 4.85, is_active: true, is_hr_recommended: true, description: "Khóa mock cao cấp dành cho rank_03, đã đủ chỗ.", registration_url: "#",
  },
  {
    id: "mock-course-013", course_code: "MOCK-DRAFT-013", title: "Mock · Khóa học đang soạn thảo", trainer: "L&D Team",
    trainer_type: "internal", format: "online", duration_hours: 1, skill_tags: ["foundations"], rank_targets: ["rank_01"], role_targets: ["all"], type: "scheduled", status: "draft", session_status: "draft", session_date: null, session_time: null, location: "Online", max_participants: 30, current_count: 0, xp_reward: 40, rating: null, is_active: true, is_hr_recommended: false, description: "Khóa mock ở trạng thái draft để test là không hiển thị công khai.", registration_url: "#",
  },
  {
    id: "mock-course-014", course_code: "MOCK-INACTIVE-014", title: "Mock · Khóa học ngừng hoạt động", trainer: "External Trainer",
    trainer_type: "external", format: "offline", duration_hours: 2, skill_tags: ["communication"], rank_targets: ["rank_02"], role_targets: ["all"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-08-01", session_time: "10:00", location: "HN Office", max_participants: 20, current_count: 5, xp_reward: 55, rating: 3.9, is_active: false, is_hr_recommended: false, description: "Khóa mock is_active=false để test bị ẩn khỏi danh sách.", registration_url: "#",
  },
  {
    id: "mock-course-015", course_code: "MOCK-AI-015", title: "Mock · AI cho phân tích dữ liệu", trainer: "AI Enablement",
    trainer_type: "internal", format: "elearning", duration_hours: 2, skill_tags: ["ai", "analytics"], rank_targets: ["rank_02", "rank_03"], role_targets: ["strategist"], type: "elearning", status: "open", session_status: "open", session_date: null, session_time: null, location: null, max_participants: null, current_count: 0, xp_reward: 70, rating: 4.65, is_active: true, is_hr_recommended: true, description: "Khóa mock elearning nâng cao, kèm HR recommend, test đa dạng combo cờ.", registration_url: "https://learning.garena.vn/mock-ai-015",
  },
  {
    id: "mock-course-016", course_code: "MOCK-COMM-016", title: "Mock · Giao tiếp hiệu quả trong nhóm đa văn hóa", trainer: "External Trainer",
    trainer_type: "external", format: "offline", duration_hours: 2, skill_tags: ["communication"], rank_targets: ["rank_01", "rank_02"], role_targets: ["operator", "strategist"], type: "interest", status: "open", session_status: "open", session_date: null, session_time: null, location: "HCM Office", max_participants: null, current_count: 11, xp_reward: 55, rating: 4.35, is_active: true, is_hr_recommended: false, description: "Khóa mock gom nhu cầu với số lượng quan tâm lớn, test ngưỡng mở lớp.", registration_url: "#",
  },
  {
    id: "mock-course-017", course_code: "MOCK-MATERIAL-017", title: "Mock · Tài liệu Onboarding tự học", trainer: "L&D Team",
    trainer_type: "internal", format: "online", duration_hours: 0.5, skill_tags: ["foundations"], rank_targets: ["rank_01"], role_targets: ["all"], type: "material_only", status: "ended", session_status: "ended", session_date: null, session_time: null, location: "Online", max_participants: null, current_count: 0, xp_reward: 20, rating: 4.0, is_active: true, is_hr_recommended: false, material_url: "https://learning.garena.vn/mock-material-017", description: "Khóa mock tài liệu ngắn, XP thấp, test khóa siêu nhẹ.", registration_url: "#",
  },
  {
    id: "mock-course-018", course_code: "MOCK-DATA-018", title: "Mock · Trực quan hóa dữ liệu với Dashboard", trainer: "Data Team",
    trainer_type: "internal", format: "offline", duration_hours: 3, skill_tags: ["data", "analytics"], rank_targets: ["rank_01", "rank_02", "rank_03"], role_targets: ["all"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-12-10", session_time: "13:00-16:00", location: "HCM Office", max_participants: 25, current_count: 1, xp_reward: 75, rating: 4.55, is_active: true, is_hr_recommended: false, description: "Khóa mock lịch xa trong tương lai, test sắp xếp theo ngày.", registration_url: "#",
  },
  {
    id: "mock-course-019", course_code: "MOCK-NEGO-019", title: "Mock · Kỹ năng đàm phán trong công việc", trainer: "External Trainer",
    trainer_type: "external", format: "offline", duration_hours: 2, skill_tags: ["communication", "leadership"], rank_targets: ["rank_02", "rank_03"], role_targets: ["manager", "strategist"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-08-28", session_time: "13:30-15:30", location: "Đà Nẵng Office", max_participants: 16, current_count: 6, xp_reward: 65, rating: 4.45, is_active: true, is_hr_recommended: false, description: "Khóa mock tại văn phòng Đà Nẵng, test địa điểm mới.", registration_url: "#",
  },
  {
    id: "mock-course-020", course_code: "MOCK-OPS-020", title: "Mock · Quản lý dự án tinh gọn (Lean)", trainer: "Ops Excellence Team",
    trainer_type: "internal", format: "offline", duration_hours: 2.5, skill_tags: ["ops_excellence", "mentoring"], rank_targets: ["rank_02"], role_targets: ["operator", "manager"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-09-25", session_time: "08:00-10:30", location: "HN Office", max_participants: 22, current_count: 20, rating: 4.6, xp_reward: 70, is_active: true, is_hr_recommended: true, description: "Khóa mock kết hợp Ops + Mentoring, sắp đầy chỗ.", registration_url: "#",
  },
  {
    id: "mock-course-021", course_code: "MOCK-AI-021", title: "Mock · Prompt Engineering cơ bản", trainer: "AI Enablement",
    trainer_type: "internal", format: "elearning", duration_hours: 1, skill_tags: ["ai"], rank_targets: ["rank_01", "rank_02", "rank_03"], role_targets: ["all"], type: "elearning", status: "open", session_status: "open", session_date: null, session_time: null, location: null, max_participants: null, current_count: 0, xp_reward: 45, rating: 4.7, is_active: true, is_hr_recommended: true, description: "Khóa mock elearning phổ biến, dành cho mọi rank.", registration_url: "https://learning.garena.vn/mock-ai-021",
  },
  {
    id: "mock-course-022", course_code: "MOCK-FOUND-022", title: "Mock · Văn hóa & giá trị cốt lõi Garena", trainer: "L&D Team",
    trainer_type: "internal", format: "offline", duration_hours: 1.5, skill_tags: ["foundations"], rank_targets: ["rank_01"], role_targets: ["all"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-07-28", session_time: "09:00-10:30", location: "HCM Office", max_participants: 60, current_count: 55, xp_reward: 35, rating: 4.25, is_active: true, is_hr_recommended: false, description: "Khóa mock onboarding văn hóa công ty, quy mô lớn.", registration_url: "#",
  },
  {
    id: "mock-course-023", course_code: "MOCK-STRAT-023", title: "Mock · Ra quyết định dựa trên dữ liệu", trainer: "Strategy Office",
    trainer_type: "internal", format: "online", duration_hours: 1.5, skill_tags: ["strategy", "data"], rank_targets: ["rank_02", "rank_03"], role_targets: ["strategist"], type: "scheduled", status: "open", session_status: "open", session_date: "2026-10-30", session_time: "15:00-16:30", location: "Online", max_participants: 35, current_count: 9, xp_reward: 60, rating: 4.5, is_active: true, is_hr_recommended: true, description: "Khóa mock chiến lược kết hợp data, test đa kỹ năng.", registration_url: "#",
  },
  {
    id: "mock-course-024", course_code: "MOCK-INTEREST-024", title: "Mock · Kỹ năng thuyết trình trước đám đông", trainer: "Leadership Academy",
    trainer_type: "external", format: "offline", duration_hours: 2, skill_tags: ["communication", "facilitation"], rank_targets: ["rank_01", "rank_02"], role_targets: ["all"], type: "interest", status: "open", session_status: "open", session_date: null, session_time: null, location: "HCM Office", max_participants: null, current_count: 1, xp_reward: 50, rating: null, is_active: true, is_hr_recommended: false, description: "Khóa mock gom nhu cầu vừa mở, chỉ mới có 1 người quan tâm.", registration_url: "#",
  },
];

const state = {
  users: new Map([[demoUser.id, { ...demoUser }]]),
  favorites: new Set([`${demoUser.id}:mock-course-008`, `${demoUser.id}:mock-course-015`]),
  reservations: new Map([
    [`${demoUser.id}:mock-course-002`, { id: "mock-reservation-001", user_id: demoUser.id, session_id: "mock-course-002", course_id: "mock-course-002", status: "confirmed", reserved_at: "2026-07-10T03:00:00.000Z", ...courses.find((c) => c.id === "mock-course-002") }],
    [`${demoUser.id}:mock-course-007`, { id: "mock-reservation-002", user_id: demoUser.id, session_id: "mock-course-007", course_id: "mock-course-007", status: "pending", reserved_at: "2026-07-18T08:30:00.000Z", ...courses.find((c) => c.id === "mock-course-007") }],
    [`${demoUser.id}:mock-course-004`, { id: "mock-reservation-003", user_id: demoUser.id, session_id: "mock-course-004", course_id: "mock-course-004", status: "pending", reserved_at: "2026-07-22T04:30:00.000Z", ...courses.find((c) => c.id === "mock-course-004") }],
  ]),
  enrollments: new Map([
    [`${demoUser.id}:mock-course-006`, { id: "mock-enrollment-001", course_id: "mock-course-006", completed_at: "2026-06-15T02:00:00.000Z", xp_earned: 30, hours_earned: 1, ...courses.find((c) => c.id === "mock-course-006") }],
    [`${demoUser.id}:mock-course-010`, { id: "mock-enrollment-002", course_id: "mock-course-010", completed_at: "2026-07-02T01:00:00.000Z", xp_earned: 45, hours_earned: 1, ...courses.find((c) => c.id === "mock-course-010") }],
  ]),
  requests: [
    { id: "mock-request-001", user_id: demoUser.id, status: "approved", created_at: "2026-06-20T04:00:00.000Z", course_title: "Chứng chỉ Scrum Master quốc tế", reason: "Cần chứng chỉ để dẫn dắt team Agile.", budget_estimate: 8000000 },
    { id: "mock-request-002", user_id: demoUser.id, status: "pending", created_at: "2026-07-15T06:00:00.000Z", course_title: "Khóa Excel nâng cao cho phân tích", reason: "Hỗ trợ báo cáo dữ liệu hằng tuần.", budget_estimate: 1500000 },
    { id: "mock-request-003", user_id: demoUser.id, status: "rejected", created_at: "2026-05-05T04:00:00.000Z", course_title: "Hội thảo quốc tế tại Singapore", reason: "Mong muốn mở rộng network ngành.", budget_estimate: 25000000, rejection_reason: "Vượt ngân sách đào tạo năm nay." },
    { id: "mock-request-004", user_id: demoUser.id, status: "in_review", created_at: "2026-07-20T02:00:00.000Z", course_title: "Khóa PMP Certification", reason: "Chuẩn bị lộ trình lên quản lý dự án.", budget_estimate: 12000000 },
    { id: "mock-request-005", user_id: demoUser.id, status: "new", created_at: "2026-07-23T09:00:00.000Z", course_title: "Workshop Design Thinking nội bộ", reason: "Muốn tổ chức cho cả team Product.", budget_estimate: 5000000 },
  ],
};

const skillCatalog = SKILL_OPTIONS.map((skill, index) => ({
  id: skill,
  label: skill,
  display_order: index + 1,
  is_active: true,
}));

const faqs = [
  { id: "mock-faq-1", topic: "Đăng ký & Lịch học", question: "Đăng ký khóa học mock hoạt động thế nào?", answer: "Chọn khóa học, xem chi tiết rồi xác nhận Đăng ký hoặc Đặt chỗ.", keywords: "đăng ký lịch học", status: "Published", display_order: 1 },
  { id: "mock-faq-2", topic: "Chính sách đào tạo", question: "Có hỗ trợ khóa học bên ngoài không?", answer: "Bạn có thể gửi L&D Request để team xem xét theo chính sách hiện hành.", keywords: "policy sponsor", status: "Published", display_order: 2 },
  { id: "mock-faq-3", topic: "Đăng ký & Lịch học", question: "Nếu lớp đã đủ chỗ (full) thì sao?", answer: "Bạn có thể bấm Quan tâm để được ưu tiên khi có lớp mở thêm hoặc có người hủy chỗ.", keywords: "full đủ chỗ waitlist", status: "Published", display_order: 3 },
  { id: "mock-faq-4", topic: "Đăng ký & Lịch học", question: "Tôi có thể hủy đặt chỗ đã xác nhận không?", answer: "Có, vào mục Lịch của tôi và chọn Hủy đặt chỗ trước thời gian diễn ra ít nhất 24 giờ.", keywords: "hủy cancel đặt chỗ", status: "Published", display_order: 4 },
  { id: "mock-faq-5", topic: "XP & Thành tích", question: "XP dùng để làm gì?", answer: "XP tích lũy giúp mở khóa trang phục nhân vật và ghi nhận thành tích học tập cá nhân.", keywords: "xp điểm thưởng nhân vật", status: "Published", display_order: 5 },
  { id: "mock-faq-6", topic: "Chính sách đào tạo", question: "Khóa học elearning có tính giờ đào tạo không?", answer: "Có, số giờ của khóa elearning được cộng vào tổng giờ học sau khi bạn bấm Hoàn thành.", keywords: "elearning giờ đào tạo hoàn thành", status: "Published", display_order: 6 },
  { id: "mock-faq-7", topic: "Hỗ trợ kỹ thuật", question: "Không đăng nhập được vào hệ thống thì liên hệ ai?", answer: "Gửi yêu cầu hỗ trợ qua kênh IT Helpdesk hoặc liên hệ trực tiếp L&D Team.", keywords: "lỗi đăng nhập hỗ trợ", status: "Published", display_order: 7 },
  { id: "mock-faq-8", topic: "Hỗ trợ kỹ thuật", question: "Câu hỏi này đang được soạn thảo, chưa công khai.", answer: "Nội dung nháp dùng để test trạng thái Draft không hiển thị cho người dùng.", keywords: "draft nháp", status: "Draft", display_order: 8 },
  { id: "mock-faq-9", topic: "XP & Thành tích", question: "Làm sao để mở khóa trang phục mới cho nhân vật?", answer: "Mỗi mốc XP nhất định sẽ mở khóa một trang phục hoặc kiểu tóc mới cho nhân vật của bạn.", keywords: "trang phục nhân vật mở khóa", status: "Published", display_order: 9 },
  { id: "mock-faq-10", topic: "Đăng ký & Lịch học", question: "Khóa 'Quan tâm' (interest) khi nào sẽ mở lớp chính thức?", answer: "Khi đủ số lượng đăng ký quan tâm tối thiểu, L&D Team sẽ lên lịch và gửi thông báo qua email.", keywords: "quan tâm interest mở lớp", status: "Published", display_order: 10 },
  { id: "mock-faq-11", topic: "Chính sách đào tạo", question: "Gửi L&D Request mất bao lâu để được duyệt?", answer: "Thông thường 3-5 ngày làm việc, tùy vào ngân sách và mức độ ưu tiên của yêu cầu.", keywords: "l&d request duyệt thời gian", status: "Published", display_order: 11 },
];

const testimonials = new Map([
  ["mock-course-001", [
    { id: "mock-testimonial-1", user_name: "Trần Thị Bích", rating: 5, content: "Nội dung dễ hiểu, áp dụng ngay được vào công việc phân tích hằng ngày.", created_at: "2026-06-01T02:00:00.000Z" },
    { id: "mock-testimonial-2", user_name: "Lê Văn Hùng", rating: 4, content: "Trainer nhiệt tình nhưng thời lượng hơi ngắn so với nội dung.", created_at: "2026-06-03T07:00:00.000Z" },
  ]],
  ["mock-course-002", [
    { id: "mock-testimonial-3", user_name: "Phạm Anh Khoa", rating: 5, content: "Bài tập tình huống thực tế rất sát với công việc quản lý team.", created_at: "2026-06-25T01:30:00.000Z" },
  ]],
  ["mock-course-008", [
    { id: "mock-testimonial-4", user_name: "Nguyễn Thu Hà", rating: 5, content: "Khóa nâng cao nhưng giảng viên hướng dẫn từng bước rất kỹ, đáng để dành nguyên buổi sáng.", created_at: "2026-07-01T03:00:00.000Z" },
    { id: "mock-testimonial-5", user_name: "Đỗ Minh Quân", rating: 4, content: "Case study hay, mong có thêm phần thực hành với data thật của phòng ban.", created_at: "2026-07-05T09:00:00.000Z" },
    { id: "mock-testimonial-6", user_name: "Vũ Ngọc Lan", rating: 3, content: "Nội dung ổn nhưng phòng học hơi xa, mất thời gian di chuyển.", created_at: "2026-07-06T04:00:00.000Z" },
  ]],
  ["mock-course-012", [
    { id: "mock-testimonial-7", user_name: "Hoàng Gia Bảo", rating: 5, content: "Khóa chiến lược cao cấp, giảng viên đưa ra ví dụ thực chiến từ đối thủ cạnh tranh rất sát.", created_at: "2026-09-20T02:00:00.000Z" },
  ]],
  ["mock-course-020", [
    { id: "mock-testimonial-8", user_name: "Trịnh Bảo Ngọc", rating: 5, content: "Áp dụng Lean vào dự án của mình ngay tuần sau, hiệu quả rõ rệt.", created_at: "2026-09-27T06:00:00.000Z" },
    { id: "mock-testimonial-9", user_name: "Lâm Thảo Vy", rating: 4, content: "Nội dung chắc tay nhưng hơi nhiều lý thuyết ở phần đầu.", created_at: "2026-09-28T03:00:00.000Z" },
  ]],
  ["mock-course-021", [
    { id: "mock-testimonial-10", user_name: "Ngô Tấn Phát", rating: 5, content: "Ngắn gọn, dễ hiểu, áp dụng prompt ngay vào công việc viết báo cáo.", created_at: "2026-07-10T01:00:00.000Z" },
    { id: "mock-testimonial-11", user_name: "Đặng Hải Yến", rating: 2, content: "Nội dung khá cơ bản, mong có phần nâng cao hơn cho người đã biết AI.", created_at: "2026-07-12T08:00:00.000Z" },
  ]],
]);

function publicUser(user) {
  return { ...user, focus_skills: [...(user.focus_skills || [])], character: user.character || null };
}

function currentUser(req) {
  try {
    const token = req.cookies?.glh_token;
    const payload = token ? verifyToken(token) : null;
    const legacy = payload && !payload.ver;
    const current = payload && String(payload.ver) === config.authTokenVersion;
    if (payload && !current && !(legacy && config.authAcceptLegacyTokens)) return null;
    return payload ? state.users.get(payload.userId) : null;
  } catch {
    return null;
  }
}

function requireMockUser(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
  try {
    const payload = verifyToken(req.cookies?.glh_token);
    const expiresAt = Number(payload.exp || 0) * 1000;
    if (!payload.ver || (expiresAt > 0 && expiresAt - Date.now() <= config.authRenewBeforeMs)) {
      setAuthCookie(res, signToken(user));
    }
  } catch {
    return res.status(401).json({ error: "AUTH_REQUIRED" });
  }
  req.user = user;
  next();
}

function courseForUser(course, user) {
  const id = `${user.id}:${course.id}`;
  const courseTestimonials = testimonials.get(course.id) || [];
  return { ...course, is_favorite: state.favorites.has(id), is_reserved: state.reservations.has(id), is_enrolled: state.enrollments.has(id), has_featured_testimonial: courseTestimonials.length > 0, featured_testimonial_count: courseTestimonials.length };
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
  if (!isAllowedGarenaEmail(email)) return res.status(403).json({ error: "EMAIL_NOT_ALLOWED" });
  const id = email === demoUser.email ? demoUser.id : `mock-${crypto.createHash("sha1").update(email).digest("hex").slice(0, 12)}`;
  if (!state.users.has(id)) state.users.set(id, { ...demoUser, id, email, full_name: email.split("@")[0].replace(/[._-]/g, " ") });
  const user = state.users.get(id);
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ token, user: publicUser(user) });
});
localMockAuthRouter.post("/logout", (_req, res) => {
  res.clearCookie("glh_token", { path: "/" });
  res.json({ ok: true });
});
localMockAuthRouter.post("/refresh", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });
  setAuthCookie(res, signToken(user));
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
  const rawSkills = Array.isArray(req.body.focus_skills)
    ? [...new Set(req.body.focus_skills.map((skill) => String(skill || "").trim()).filter(Boolean))]
    : [];
  if (rawSkills.length > 3) return res.status(400).json({ error: "FOCUS_SKILLS_MAX_3" });
  const focusSkills = canonicalizeFocusSkills(rawSkills);
  if (rawSkills.some((skill) => !canonicalSkill(skill))) return res.status(400).json({ error: "UNKNOWN_FOCUS_SKILL" });
  Object.assign(req.user, {
    learning_formats: req.body.learning_formats || [], weekly_hours: req.body.weekly_hours || null,
    preferred_trainers: req.body.preferred_trainers || [], focus_skills: focusSkills, onboarding_done: true,
  });
  res.json({ user: publicUser(req.user), xp_earned: 50 });
});
localMockApiRouter.delete("/me/onboarding", (req, res) => {
  Object.assign(req.user, {
    onboarding_done: false, learning_formats: [], weekly_hours: null, preferred_trainers: [], focus_skills: [],
  });
  res.json({ user: publicUser(req.user) });
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
  ranks: ["rank_01", "rank_02", "rank_03"], roles: ["strategist", "operator", "manager"], trainers: ["Data Team", "L&D Team", "AI Enablement", "Leadership Academy", "Product Guild", "External Trainer", "Ops Excellence Team", "Strategy Office"], locations: ["Online", "HN Office", "HCM Office", "Đà Nẵng Office"], skills: skillCatalog,
}));
localMockApiRouter.get("/courses/recommendations", (req, res) => {
  const available = courses.filter((course) => course.is_active && course.status !== "draft" && course.status !== "ended");
  const quiz = (req.user.focus_skills || []).map((skill) => available.find((course) => course.skill_tags.some((tag) => canonicalSkill(tag) === canonicalSkill(skill)) && !courseForUser(course, req.user).is_enrolled && !courseForUser(course, req.user).is_reserved)).filter(Boolean).slice(0, 3);
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
localMockApiRouter.get("/courses/:id/testimonials", (req, res) => res.json({ testimonials: testimonials.get(req.params.id) || [] }));
localMockApiRouter.post("/courses/:id/testimonials", (req, res) => {
  const testimonial = { id: crypto.randomUUID(), user_name: req.user.full_name, rating: req.body?.rating || 5, content: req.body?.content || "", created_at: now() };
  const list = testimonials.get(req.params.id) || [];
  list.unshift(testimonial);
  testimonials.set(req.params.id, list);
  res.status(201).json({ testimonial });
});

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
localMockApiRouter.get("/policies", (_req, res) => res.json({
  policies: {
    "Chính sách đào tạo": [
      { id: "mock-policy-1", title: "Hỗ trợ học tập", content: "Nội dung mock để review FAQ và policy." },
      { id: "mock-policy-2", title: "Ngân sách đào tạo bên ngoài", content: "Mỗi nhân viên có ngân sách tối đa/năm cho khóa học bên ngoài, cần gửi L&D Request trước khi đăng ký." },
      { id: "mock-policy-3", title: "Quy định vắng mặt", content: "Nếu đã đặt chỗ nhưng vắng mặt không báo trước 2 lần liên tiếp, tài khoản sẽ tạm khóa quyền đặt chỗ 30 ngày." },
    ],
    "Chứng chỉ & Ghi nhận": [
      { id: "mock-policy-4", title: "Cấp chứng chỉ hoàn thành", content: "Khóa học từ 2 giờ trở lên sẽ có chứng chỉ hoàn thành gửi qua email trong vòng 3 ngày làm việc." },
    ],
  },
}));
localMockApiRouter.post("/bot/chat", (req, res) => res.json({ reply: "Đây là Hộ Giá mock. Bạn có thể hỏi về khóa học, đăng ký hoặc chính sách L&D.", citations: [], images: [], course_links: courses.slice(0, 3) }));
localMockApiRouter.get("/config/public", (_req, res) => res.json({ ga_measurement_id: "" }));
