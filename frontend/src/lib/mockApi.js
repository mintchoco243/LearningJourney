"use client";

// Mock data layer — swap to real fetch() in Phase 2.
// Field names match CourseModal + API spec in 03-api-endpoints.md.

const UPCOMING = [
  {
    course_id: "c001", title: "Leadership Fundamentals cho Team Lead",
    trainer: "Nguyễn Thành Đạt", format: "offline",
    location: "HCM — Phòng Hội thảo A3",
    audience: "Team Lead, Senior IC",
    description: "Khóa học cung cấp nền tảng kỹ năng lãnh đạo cho Team Lead mới: ra quyết định, giao tiếp nhóm, xây dựng tâm lý an toàn và xử lý tình huống khó. Học viên thực hành qua case study thực tế từ các team tại Garena.",
    duration_minutes: 480,
    course_status: "upcoming_open",
    start_date: "2026-07-05", start_time: "09:00", end_time: "17:00",
    xp_reward: 120, countdown_days: 4,
    description_short: "Kỹ năng dẫn dắt nhóm, ra quyết định và giao tiếp hiệu quả cho Team Lead mới.",
    skill_tags: ["leadership", "communication"],
    is_suggested: true, url: "#",
  },
  {
    course_id: "c002", title: "Data Storytelling với Python",
    trainer: "Trần Minh Khôi", format: "online",
    location: "Zoom", audience: "Data Analyst, Business Analyst",
    description: "Học cách biến dữ liệu thô thành câu chuyện trực quan thuyết phục. Khóa học bao gồm Matplotlib, Seaborn và các nguyên tắc thiết kế chart phù hợp với từng loại dữ liệu.",
    duration_minutes: 150,
    course_status: "upcoming_open",
    start_date: "2026-07-10", start_time: "14:00", end_time: "16:30",
    xp_reward: 80, countdown_days: 9,
    description_short: "Biến dữ liệu thô thành câu chuyện trực quan thuyết phục bằng Python và Matplotlib.",
    skill_tags: ["data", "analytics"],
    is_suggested: false, url: "#",
  },
  {
    course_id: "c003", title: "Presentation Skills: Thuyết trình cấp C-level",
    trainer: "Lê Hoàng Phương", format: "offline",
    location: "HCM — Phòng Đào tạo B1", audience: "Manager, Senior IC",
    description: "Workshop chuyên sâu về cách cấu trúc bài thuyết trình, kiểm soát ngôn ngữ cơ thể và xử lý câu hỏi khó từ ban lãnh đạo. Học viên thực hành với feedback video.",
    duration_minutes: 210,
    course_status: "upcoming_closed",
    start_date: "2026-07-18", start_time: "08:30", end_time: "12:00",
    xp_reward: 60, countdown_days: 17,
    description_short: "Kỹ thuật cấu trúc bài thuyết trình và xử lý câu hỏi khó từ ban lãnh đạo.",
    skill_tags: ["communication"],
    is_suggested: true, url: "#",
  },
  {
    course_id: "c004", title: "Excel nâng cao: PivotTable & Power Query",
    trainer: "Phạm Quốc Bảo", format: "elearning",
    location: null, audience: "Tất cả",
    description: "Thành thạo PivotTable, Power Query và tự động hoá báo cáo. Khóa học gồm 12 video ngắn, bài tập thực hành với dataset thực tế và quiz kiểm tra từng chương.",
    duration_minutes: 180,
    course_status: "elearning",
    start_date: null, start_time: null, end_time: null,
    xp_reward: 45, countdown_days: null,
    elearning_url: "#",
    description_short: "Thành thạo PivotTable, Power Query và tự động hoá báo cáo với Excel.",
    skill_tags: ["data"],
    is_suggested: false, url: "#",
  },
  {
    course_id: "c005", title: "OKR Workshop: Thiết lập mục tiêu Q3",
    trainer: "Vũ Thanh Hà", format: "offline",
    location: "HN — Phòng Innovation", audience: "Manager, Team Lead",
    description: "Workshop thực hành viết OKR chuẩn và căn chỉnh mục tiêu cá nhân với team. Buổi học kết hợp lý thuyết (30%) và thực hành nhóm (70%) với facilitator.",
    duration_minutes: 240,
    course_status: "upcoming_open",
    start_date: "2026-07-22", start_time: "13:30", end_time: "17:30",
    xp_reward: 90, countdown_days: 21,
    description_short: "Workshop thực hành viết OKR và căn chỉnh mục tiêu cá nhân với team.",
    skill_tags: ["leadership"],
    is_suggested: false, url: "#",
  },
];

const RECOMMENDED = [
  ...UPCOMING.filter(c => c.is_suggested),
  {
    course_id: "c006", title: "Conflict Resolution & Feedback",
    trainer: "Hoàng Lan Anh", format: "online",
    location: "Zoom", audience: "Tất cả",
    description: "Học cách đưa phản hồi khó một cách xây dựng và giải quyết xung đột trong nhóm. Khóa học dựa trên mô hình SBI (Situation–Behavior–Impact) và Nonviolent Communication.",
    duration_minutes: 120,
    course_status: "upcoming_open",
    start_date: "2026-07-14", start_time: "10:00", end_time: "12:00",
    xp_reward: 55, countdown_days: 13,
    description_short: "Cách đưa phản hồi khó và giải quyết xung đột trong nhóm.",
    skill_tags: ["communication"],
    is_suggested: false, url: "#",
  },
  {
    course_id: "c007", title: "Product Thinking cho Non-PM",
    trainer: "Đỗ Hữu Nghĩa", format: "elearning",
    location: null, audience: "Developer, Designer, Analyst",
    description: "Tư duy sản phẩm căn bản cho các role không phải PM: hiểu user need, prioritization framework, và cách làm việc hiệu quả hơn với Product team.",
    duration_minutes: 90,
    course_status: "elearning",
    start_date: null, start_time: null, end_time: null,
    xp_reward: 70, countdown_days: null,
    elearning_url: "#",
    description_short: "Tư duy sản phẩm căn bản cho developer, designer và các role không phải PM.",
    skill_tags: ["product"],
    is_suggested: false, url: "#",
  },
  {
    course_id: "c008", title: "Agile Scrum Masterclass",
    trainer: "Nguyễn Thị Thu", format: "offline",
    location: "HCM — Phòng Hội thảo A1", audience: "Developer, PM, Designer",
    description: "Toàn bộ framework Scrum từ Sprint Planning đến Retrospective. Học viên thực hành Scrum simulation và nhận chứng chỉ nội bộ sau khi hoàn thành.",
    duration_minutes: 480,
    course_status: "ended",
    start_date: "2026-06-20", start_time: "09:00", end_time: "17:00",
    xp_reward: 100, countdown_days: null,
    record_url: "#",
    description_short: "Toàn bộ framework Scrum từ Sprint Planning đến Retrospective.",
    skill_tags: ["agile"],
    is_suggested: false, url: "#",
  },
];

export async function getUpcomingCourses() {
  return UPCOMING.filter(c => (c.format === "offline" || c.format === "online") && c.course_status !== "ended" && c.start_date && c.start_time).slice(0, 5);
}
export async function getRecommendedCourses() {
  const ended = RECOMMENDED.filter(c => c.course_status === "ended");
  const rest   = RECOMMENDED.filter(c => c.course_status !== "ended");
  return [...rest, ...ended].slice(0, 6);
}
