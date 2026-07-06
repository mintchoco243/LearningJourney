"use client";

import React from "react";

export const ADMIN_STATS = {
    total_users: 847,
    enrollments_this_month: 124,
    enrollments_delta: 18,
    enrollments_breakdown: [
      { source: "L&D Push", count: 52, color: "#E41E26" },
      { source: "Tự đăng ký", count: 38, color: "#3B6FB0" },
      { source: "Manager gợi ý", count: 21, color: "#2BB6A3" },
      { source: "Import CSV", count: 13, color: "#F5A623" },
    ],
    pending_ld_requests: 0,
    active_courses: 12,
    top_courses: [
      { name: "Giao tiếp hiệu quả", code: "LC-003", enrollments: 94 },
      { name: "Tư duy sản phẩm", code: "LC-004", enrollments: 78 },
      { name: "Excel & Power BI nâng cao", code: "LC-008", enrollments: 71 },
      { name: "Quản lý dự án Agile", code: "LC-011", enrollments: 65 },
      { name: "Leadership Foundation", code: "LC-006", enrollments: 59 },
    ],
  };

  export const ADMIN_COURSES = [
    { id: "LC-001", title: "Garena Onboarding Essentials", format: "elearning", xp: 80,  rank_targets: ["rank_01","rank_02"],                  is_active: true,  enrollments: 423, duration: 120 },
    { id: "LC-002", title: "Tư duy dữ liệu cho non-tech",  format: "workshop", xp: 120, rank_targets: ["rank_02","rank_03"],                  is_active: true,  enrollments: 47,  duration: 180 },
    { id: "LC-003", title: "Giao tiếp hiệu quả",           format: "offline",  xp: 100, rank_targets: ["rank_01","rank_02","rank_03"],         is_active: true,  enrollments: 94,  duration: 240 },
    { id: "LC-004", title: "Tư duy sản phẩm",              format: "online",   xp: 140, rank_targets: ["rank_02","rank_03","rank_04"],         is_active: true,  enrollments: 78,  duration: 300 },
    { id: "LC-005", title: "Garena Culture Deep Dive",      format: "talk",     xp: 60,  rank_targets: ["rank_01"],                            is_active: true,  enrollments: 312, duration: 90  },
    { id: "LC-006", title: "Leadership Foundation",         format: "bootcamp", xp: 200, rank_targets: ["rank_03","rank_04","rank_05"],         is_active: true,  enrollments: 59,  duration: 480 },
    { id: "LC-007", title: "Kỹ năng thuyết trình",         format: "workshop", xp: 100, rank_targets: ["rank_02","rank_03"],                  is_active: true,  enrollments: 55,  duration: 240 },
    { id: "LC-008", title: "Excel & Power BI nâng cao",     format: "online",   xp: 120, rank_targets: ["rank_02","rank_03"],                  is_active: true,  enrollments: 71,  duration: 360 },
    { id: "LC-009", title: "Game Operations 101",           format: "elearning",xp: 80,  rank_targets: ["rank_01","rank_02"],                  is_active: true,  enrollments: 38,  duration: 150 },
    { id: "LC-010", title: "Agile & Scrum Fundamentals",    format: "workshop", xp: 120, rank_targets: ["rank_02","rank_03"],                  is_active: true,  enrollments: 43,  duration: 240 },
    { id: "LC-011", title: "Quản lý dự án Agile",          format: "bootcamp", xp: 180, rank_targets: ["rank_03","rank_04"],                  is_active: true,  enrollments: 65,  duration: 420 },
    { id: "LC-012", title: "Python for Data Analysis",      format: "online",   xp: 160, rank_targets: ["rank_03","rank_04"],                  is_active: false, enrollments: 12,  duration: 480 },
  ];

  export const ADMIN_SESSIONS = [
    { id: "S-001", course_id: "LC-003", course_title: "Giao tiếp hiệu quả",      date: "2026-07-15", time: "09:00–12:00", location: "HCM Office – P.501",          trainer: "Nguyễn Thị Mai",  min_participants: 10, max_participants: 25, current_count: 18, status: "confirmed" },
    { id: "S-002", course_id: "LC-003", course_title: "Giao tiếp hiệu quả",      date: "2026-08-05", time: "14:00–17:00", location: "HN Office – Room A",           trainer: "Nguyễn Thị Mai",  min_participants: 10, max_participants: 20, current_count: 20, status: "full" },
    { id: "S-003", course_id: "LC-006", course_title: "Leadership Foundation",    date: "2026-07-28", time: "08:30–17:30", location: "HCM Office – Training Room",   trainer: "Trần Văn Hùng",   min_participants: 8,  max_participants: 15, current_count: 11, status: "open" },
    { id: "S-004", course_id: "LC-007", course_title: "Kỹ năng thuyết trình",    date: "2026-07-10", time: "09:00–12:00", location: "Online – Zoom",                trainer: "Lê Thị Hoa",      min_participants: 12, max_participants: 30, current_count: 14, status: "confirmed" },
    { id: "S-005", course_id: "LC-002", course_title: "Tư duy dữ liệu non-tech", date: "2026-08-20", time: "13:30–17:00", location: "HCM Office – P.301",           trainer: "Phạm Minh Khoa",  min_participants: 10, max_participants: 20, current_count: 7,  status: "open" },
    { id: "S-006", course_id: "LC-011", course_title: "Quản lý dự án Agile",     date: "2026-09-12", time: "08:00–17:00", location: "HCM Office – Training Room",   trainer: "Đỗ Quốc Bảo",    min_participants: 8,  max_participants: 16, current_count: 16, status: "full" },
    { id: "S-007", course_id: "LC-010", course_title: "Agile & Scrum Fundamentals",date:"2026-06-01",time: "09:00–12:00", location: "Online – Teams",               trainer: "Vũ Minh Tâm",     min_participants: 10, max_participants: 25, current_count: 8,  status: "cancelled" },
    { id: "S-008", course_id: "LC-006", course_title: "Leadership Foundation",    date: "2026-09-22", time: "08:30–17:30", location: "HCM Office – Training Room",   trainer: "Trần Văn Hùng",   min_participants: 8,  max_participants: 15, current_count: 3,  status: "open" },
  ];

  export const SESSION_ATTENDEES = {
    "S-001": [
      { name: "Nguyễn Hoàng Phúc",     email: "hphuc@garena.vn",     dept: "Game Ops",    booked_at: "2026-06-01" },
      { name: "Trần Thị Phương Anh",   email: "phanh@garena.vn",     dept: "Marketing",   booked_at: "2026-06-02" },
      { name: "Lê Văn Minh",           email: "lvminh@garena.vn",    dept: "Engineering", booked_at: "2026-06-03" },
      { name: "Phạm Thị Lan",          email: "ptlan@garena.vn",     dept: "HR",          booked_at: "2026-06-04" },
      { name: "Vũ Đức Thắng",          email: "vdthang@garena.vn",   dept: "Finance",     booked_at: "2026-06-05" },
    ],
  };

  export const ADMIN_REQUESTS = [
    { id: "LDR-001", user_name: "Nguyễn Hoàng Phúc",     email: "hphuc@garena.vn",    dept: "Game Ops",     title: "Advanced SQL for Analysts",           reason: "Cần kỹ năng SQL nâng cao để xử lý dữ liệu game event hàng ngày. Hiện tại phải nhờ team Data mỗi khi query phức tạp.", submitted_at: "2026-06-18", status: "pending",     admin_note: "" },
    { id: "LDR-002", user_name: "Trần Thị Phương Anh",   email: "phanh@garena.vn",    dept: "Marketing",    title: "Google Analytics 4 Certification",    reason: "Platform đã migrate sang GA4 nhưng team chưa được đào tạo bài bản.", submitted_at: "2026-06-17", status: "pending",     admin_note: "" },
    { id: "LDR-003", user_name: "Lê Văn Minh",           email: "lvminh@garena.vn",   dept: "Engineering",  title: "System Design Interview Prep",        reason: "Đang chuẩn bị cho promotion round Q3. Muốn được coaching về system design.", submitted_at: "2026-06-15", status: "in_progress", admin_note: "Đã liên hệ external coach, chờ confirm lịch." },
    { id: "LDR-004", user_name: "Phạm Thị Lan",          email: "ptlan@garena.vn",    dept: "HR",           title: "Facilitation Skills Workshop",        reason: "Cần kỹ năng facilitation để dẫn dắt OKR planning và team workshop.", submitted_at: "2026-06-14", status: "approved",    admin_note: "Đăng ký khóa tháng 7 với Trainer Nguyễn Thị Mai." },
    { id: "LDR-005", user_name: "Vũ Đức Thắng",          email: "vdthang@garena.vn",  dept: "Finance",      title: "Power BI Advanced Dashboard",         reason: "Muốn nâng cấp báo cáo tài chính bằng Power BI thay vì Excel thủ công.", submitted_at: "2026-06-12", status: "approved",    admin_note: "Ghi danh khóa LC-008 tháng 8." },
    { id: "LDR-006", user_name: "Nguyễn Bảo Châu",       email: "nbaochau@garena.vn", dept: "CS",           title: "Conflict Resolution Training",        reason: "Đội CS ngày càng nhận nhiều escalation. Cần toolkit xử lý tốt hơn.", submitted_at: "2026-06-10", status: "rejected",    admin_note: "Nội dung cover trong LC-003 Giao tiếp hiệu quả. Đề nghị tham gia session T7 trước." },
    { id: "LDR-007", user_name: "Hoàng Thị Ngọc Ánh",   email: "htnganh@garena.vn",  dept: "Product",      title: "UX Research Methods",                 reason: "Team Product muốn self-conduct user research thay vì phụ thuộc Design team.", submitted_at: "2026-06-08", status: "pending",     admin_note: "" },
    { id: "LDR-008", user_name: "Đinh Quang Vinh",       email: "dqvinh@garena.vn",   dept: "Business Dev", title: "Negotiation & Deal Structuring",       reason: "Sắp vào mùa partnership renewal Q3. Cần coach về negotiation strategy.", submitted_at: "2026-06-07", status: "pending",     admin_note: "" },
    { id: "LDR-009", user_name: "Cao Thị Hương",         email: "cthuong@garena.vn",  dept: "Marketing",    title: "Content Strategy & SEO",              reason: "Muốn xây dựng content hub cho Garena Việt Nam với SEO-first approach.", submitted_at: "2026-06-05", status: "in_progress", admin_note: "Đang tìm freelance trainer có portfolio phù hợp." },
    { id: "LDR-010", user_name: "Trần Quốc Khánh",      email: "tqkhanh@garena.vn",  dept: "Game Ops",     title: "Event Management Fundamentals",       reason: "Muốn tổ chức LAN party nội bộ nhưng không có kiến thức event ops.", submitted_at: "2026-06-03", status: "rejected",    admin_note: "Vui lòng phối hợp với team Esports — họ có SOP sẵn." },
  ];

  export const ADMIN_POLICIES = [
    {
      id: "cat-1", category: "Học tập & Phát triển", order_index: 1,
      entries: [
        { id: "POL-001", title: "Chính sách học phí & tài trợ khóa học",     order_index: 1, is_active: true,  updated_at: "2026-04-10", preview: "Garena hỗ trợ 100% học phí cho các khóa học nằm trong danh mục L&D đã duyệt. Nhân viên chính thức từ 6 tháng trở lên được tham gia..." },
        { id: "POL-002", title: "Quy định đặt chỗ và tham dự training",      order_index: 2, is_active: true,  updated_at: "2026-05-22", preview: "Mỗi nhân viên có thể đặt chỗ tối đa 3 sessions trong cùng một tháng. Hủy chỗ phải thực hiện trước 48 giờ..." },
        { id: "POL-003", title: "Chính sách self-reported learning",          order_index: 3, is_active: false, updated_at: "2026-03-15", preview: "Nhân viên có thể ghi nhận tối đa 2 khóa học bên ngoài mỗi quý. Cần upload certificate làm bằng chứng..." },
      ],
    },
    {
      id: "cat-2", category: "Phúc lợi", order_index: 2,
      entries: [
        { id: "POL-004", title: "Learning budget cá nhân 2026",               order_index: 1, is_active: true,  updated_at: "2026-01-05", preview: "Mỗi nhân viên chính thức được cấp budget 5,000,000 VNĐ/năm để tham gia các khóa học ngoài danh mục..." },
        { id: "POL-005", title: "Quy định study leave",                       order_index: 2, is_active: true,  updated_at: "2026-02-14", preview: "Nhân viên có thể xin tối đa 3 ngày study leave mỗi quý để thi chứng chỉ chuyên môn được công nhận..." },
      ],
    },
    {
      id: "cat-3", category: "Quy trình nội bộ", order_index: 3,
      entries: [
        { id: "POL-006", title: "Quy trình submit L&D Request",               order_index: 1, is_active: true,  updated_at: "2026-05-30", preview: "Mọi yêu cầu đào tạo ngoài danh mục đều phải submit qua Garena Learning Hub, section L&D Request..." },
        { id: "POL-007", title: "Quy trình xét duyệt nội bộ",                order_index: 2, is_active: true,  updated_at: "2026-05-30", preview: "Team L&D sẽ review request trong vòng 5 ngày làm việc. Request cần có approval của Line Manager..." },
      ],
    },
  ];

  export const ADMIN_ACCOUNTS = [
    { id: "ADM-001", email: "vananh.le@garena.vn",      full_name: "Lê Vân Anh",         role: "super_admin", created_at: "2026-01-01", is_active: true  },
    { id: "ADM-002", email: "minhthu.nguyen@garena.vn", full_name: "Nguyễn Minh Thu",     role: "ld_admin",    created_at: "2026-01-15", is_active: true  },
    { id: "ADM-003", email: "thanh.tran@garena.vn",     full_name: "Trần Văn Thành",      role: "ld_admin",    created_at: "2026-03-01", is_active: true  },
    { id: "ADM-004", email: "hung.pham@garena.vn",      full_name: "Phạm Minh Hùng",      role: "ld_admin",    created_at: "2026-04-10", is_active: false },
  ];

  export const ADMIN_TESTIMONIALS = [
    {
      id: "T-002",
      course_id: "LC-003",
      course_code: "LC-003",
      course_title: "Giao tiếp hiệu quả",
      user_name: "Nguyễn Hoàng Minh",
      user_team: "Product",
      user_role: "PM",
      rating: 4,
      aspect_ratings: { overall: 4, content: 5, trainer: 4, organization_support: 4 },
      applied_learning: "Biết cách close action item cuối buổi họp và xác nhận lại owner/deadline bằng một câu ngắn.",
      improvement_feedback: "Nên có thêm một case về feedback khó giữa cross-functional team.",
      content: "Nên có thêm một case về feedback khó giữa cross-functional team.",
      is_featured: true,
      created_at: "2026-07-05",
    },
    {
      id: "T-003",
      course_id: "LC-006",
      course_code: "LC-006",
      course_title: "Leadership Foundation",
      user_name: "Lê Quang Huy",
      user_team: "Operations",
      user_role: "Senior Manager",
      rating: 5,
      aspect_ratings: { overall: 5, content: 5, trainer: 5, organization_support: 5 },
      applied_learning: "Framework coaching 1-on-1 dùng được ngay cho buổi sync tuần sau với team lead.",
      improvement_feedback: "",
      content: "Framework coaching 1-on-1 dùng được ngay cho buổi sync tuần sau với team lead.",
      is_featured: true,
      created_at: "2026-07-04",
    },
    {
      id: "T-004",
      course_id: "LC-011",
      course_code: "LC-011",
      course_title: "Quản lý dự án Agile",
      user_name: "Cao Thị Bích",
      user_team: "Ops",
      user_role: "Coordinator",
      rating: 3,
      aspect_ratings: { overall: 3, content: 3, trainer: 4, organization_support: 2 },
      applied_learning: "Hiểu rõ hơn cách chia task theo sprint goal thay vì gom task theo người phụ trách.",
      improvement_feedback: "Lịch gửi hơi sát, tài liệu pre-read nên gửi trước ít nhất 2 ngày.",
      content: "Lịch gửi hơi sát, tài liệu pre-read nên gửi trước ít nhất 2 ngày.",
      is_featured: false,
      created_at: "2026-07-03",
    },
    {
      id: "T-005",
      course_id: "LC-004",
      course_code: "LC-004",
      course_title: "Tư duy sản phẩm",
      user_name: "Vũ Thanh Tùng",
      user_team: "Engineering",
      user_role: "Backend Engineer",
      rating: 4,
      aspect_ratings: { overall: 4, content: 4, trainer: 5, organization_support: 4 },
      applied_learning: "Có thể dùng user journey map để trao đổi với PM trước khi estimate technical solution.",
      improvement_feedback: "Muốn có thêm bài tập nhóm nhỏ để thử mapping một feature thật.",
      content: "Muốn có thêm bài tập nhóm nhỏ để thử mapping một feature thật.",
      is_featured: false,
      created_at: "2026-07-02",
    },
    {
      id: "T-006",
      course_id: "LC-008",
      course_code: "LC-008",
      course_title: "Excel & Power BI nâng cao",
      user_name: "Phạm Minh Khoa",
      user_team: "Data",
      user_role: "Analyst",
      rating: 2,
      aspect_ratings: { overall: 2, content: 3, trainer: 3, organization_support: 2 },
      applied_learning: "",
      improvement_feedback: "Nội dung hơi nhanh với người chưa từng dùng Power BI, nên tách beginner và advanced rõ hơn.",
      content: "Nội dung hơi nhanh với người chưa từng dùng Power BI, nên tách beginner và advanced rõ hơn.",
      is_featured: false,
      created_at: "2026-07-01",
    },
  ];

  export const ADMIN_USERS = [
    { id: "U-001", full_name: "Nguyễn Hoàng Phúc",     email: "hphuc@garena.vn",      dept: "Game Ops",     rank: "rank_03", xp: 540,  joined_at: "2024-08-15", last_active: "2026-06-24", status: "active"   },
    { id: "U-002", full_name: "Trần Thị Phương Anh",   email: "phanh@garena.vn",      dept: "Marketing",    rank: "rank_02", xp: 260,  joined_at: "2025-01-10", last_active: "2026-06-23", status: "active"   },
    { id: "U-003", full_name: "Lê Văn Minh",           email: "lvminh@garena.vn",     dept: "Engineering",  rank: "rank_04", xp: 920,  joined_at: "2023-11-20", last_active: "2026-06-22", status: "active"   },
    { id: "U-004", full_name: "Phạm Thị Lan",          email: "ptlan@garena.vn",      dept: "HR",           rank: "rank_03", xp: 480,  joined_at: "2024-03-05", last_active: "2026-06-20", status: "active"   },
    { id: "U-005", full_name: "Vũ Đức Thắng",          email: "vdthang@garena.vn",    dept: "Finance",      rank: "rank_02", xp: 180,  joined_at: "2025-04-18", last_active: "2026-06-18", status: "active"   },
    { id: "U-006", full_name: "Nguyễn Bảo Châu",       email: "nbaochau@garena.vn",   dept: "CS",           rank: "rank_01", xp: 80,   joined_at: "2026-02-01", last_active: "2026-06-15", status: "active"   },
    { id: "U-007", full_name: "Hoàng Thị Ngọc Ánh",   email: "htnganh@garena.vn",    dept: "Product",      rank: "rank_03", xp: 610,  joined_at: "2024-06-12", last_active: "2026-06-24", status: "active"   },
    { id: "U-008", full_name: "Đinh Quang Vinh",       email: "dqvinh@garena.vn",     dept: "Business Dev", rank: "rank_04", xp: 850,  joined_at: "2023-09-01", last_active: "2026-06-21", status: "active"   },
    { id: "U-009", full_name: "Cao Thị Hương",         email: "cthuong@garena.vn",    dept: "Marketing",    rank: "rank_02", xp: 310,  joined_at: "2025-02-20", last_active: "2026-06-10", status: "active"   },
    { id: "U-010", full_name: "Trần Quốc Khánh",       email: "tqkhanh@garena.vn",    dept: "Game Ops",     rank: "rank_02", xp: 220,  joined_at: "2025-05-09", last_active: "2026-05-30", status: "active"   },
    { id: "U-011", full_name: "Nguyễn Hoàng Minh",     email: "nhminh@garena.vn",     dept: "Product",      rank: "rank_03", xp: 570,  joined_at: "2024-07-22", last_active: "2026-06-23", status: "active"   },
    { id: "U-012", full_name: "Trần Bích Ngọc",        email: "tbngoc@garena.vn",     dept: "Creative",     rank: "rank_02", xp: 340,  joined_at: "2024-11-05", last_active: "2026-06-19", status: "active"   },
    { id: "U-013", full_name: "Lê Quang Huy",          email: "lqhuy@garena.vn",      dept: "Ops",          rank: "rank_05", xp: 1240, joined_at: "2022-06-01", last_active: "2026-06-24", status: "active"   },
    { id: "U-014", full_name: "Vũ Thanh Tùng",         email: "vttung@garena.vn",     dept: "Engineering",  rank: "rank_03", xp: 490,  joined_at: "2024-04-14", last_active: "2026-06-22", status: "active"   },
    { id: "U-015", full_name: "Đinh Thị Mai Anh",      email: "dtmanh@garena.vn",     dept: "Data",         rank: "rank_03", xp: 520,  joined_at: "2024-05-30", last_active: "2026-06-17", status: "active"   },
    { id: "U-016", full_name: "Hoàng Quốc Bình",       email: "hqbinh@garena.vn",     dept: "PMO",          rank: "rank_04", xp: 780,  joined_at: "2023-10-11", last_active: "2026-06-20", status: "active"   },
    { id: "U-017", full_name: "Cao Thị Bích",          email: "ctbich@garena.vn",     dept: "Ops",          rank: "rank_02", xp: 190,  joined_at: "2025-03-03", last_active: "2026-06-14", status: "active"   },
    { id: "U-018", full_name: "Phạm Minh Khoa",        email: "pmkhoa@garena.vn",     dept: "Data",         rank: "rank_04", xp: 870,  joined_at: "2023-08-25", last_active: "2026-06-24", status: "active"   },
    { id: "U-019", full_name: "Đỗ Quốc Bảo",          email: "dqbao@garena.vn",      dept: "PMO",          rank: "rank_04", xp: 960,  joined_at: "2023-05-17", last_active: "2026-06-23", status: "active"   },
    { id: "U-020", full_name: "Vũ Minh Tâm",           email: "vmtam@garena.vn",      dept: "Engineering",  rank: "rank_03", xp: 430,  joined_at: "2024-09-08", last_active: "2026-06-16", status: "inactive" },
    { id: "U-021", full_name: "Bùi Thị Thu Hà",        email: "bttha@garena.vn",      dept: "HR",           rank: "rank_02", xp: 240,  joined_at: "2025-01-25", last_active: "2026-04-10", status: "inactive" },
    { id: "U-022", full_name: "Nguyễn Thế Anh",        email: "ntanh@garena.vn",      dept: "Marketing",    rank: "rank_01", xp: 60,   joined_at: "2026-05-15", last_active: "2026-06-01", status: "active"   },
    { id: "U-023", full_name: "Trương Minh Đức",       email: "tmduc@garena.vn",      dept: "Game Ops",     rank: "rank_03", xp: 500,  joined_at: "2024-02-28", last_active: "2026-06-22", status: "active"   },
    { id: "U-024", full_name: "Lý Thị Kim Ngân",       email: "ltkngan@garena.vn",    dept: "Finance",      rank: "rank_02", xp: 280,  joined_at: "2024-12-01", last_active: "2026-06-18", status: "active"   },
    { id: "U-025", full_name: "Phan Văn Hải",          email: "pvhai@garena.vn",      dept: "CS",           rank: "rank_02", xp: 200,  joined_at: "2025-06-01", last_active: "2026-06-24", status: "active"   },
  ];

  // Enrollments per user — user_id → list of course enrollments
  export const USER_ENROLLMENTS = {
    "U-001": [
      { course_id: "LC-003", course_title: "Giao tiếp hiệu quả",        enrolled_at: "2026-05-10", status: "completed", score: 92, xp_earned: 100 },
      { course_id: "LC-005", course_title: "Garena Culture Deep Dive",   enrolled_at: "2026-03-01", status: "completed", score: 88, xp_earned: 60  },
      { course_id: "LC-009", course_title: "Game Operations 101",        enrolled_at: "2026-04-20", status: "completed", score: 95, xp_earned: 80  },
      { course_id: "LC-011", course_title: "Quản lý dự án Agile",       enrolled_at: "2026-06-15", status: "enrolled",  score: null, xp_earned: 0 },
    ],
    "U-002": [
      { course_id: "LC-003", course_title: "Giao tiếp hiệu quả",        enrolled_at: "2026-05-15", status: "completed", score: 85, xp_earned: 100 },
      { course_id: "LC-004", course_title: "Tư duy sản phẩm",           enrolled_at: "2026-06-01", status: "in_progress", score: null, xp_earned: 0 },
    ],
    "U-003": [
      { course_id: "LC-001", course_title: "Garena Onboarding Essentials", enrolled_at: "2023-12-01", status: "completed", score: 97, xp_earned: 80 },
      { course_id: "LC-004", course_title: "Tư duy sản phẩm",             enrolled_at: "2026-02-10", status: "completed", score: 90, xp_earned: 140 },
      { course_id: "LC-006", course_title: "Leadership Foundation",        enrolled_at: "2026-04-05", status: "completed", score: 94, xp_earned: 200 },
      { course_id: "LC-008", course_title: "Excel & Power BI nâng cao",   enrolled_at: "2026-05-20", status: "completed", score: 88, xp_earned: 120 },
      { course_id: "LC-010", course_title: "Agile & Scrum Fundamentals",   enrolled_at: "2026-06-10", status: "in_progress", score: null, xp_earned: 0 },
    ],
    "U-004": [
      { course_id: "LC-003", course_title: "Giao tiếp hiệu quả",        enrolled_at: "2026-05-12", status: "completed", score: 91, xp_earned: 100 },
      { course_id: "LC-006", course_title: "Leadership Foundation",      enrolled_at: "2026-06-01", status: "enrolled",  score: null, xp_earned: 0  },
    ],
    "U-005": [
      { course_id: "LC-008", course_title: "Excel & Power BI nâng cao", enrolled_at: "2026-06-05", status: "enrolled",  score: null, xp_earned: 0  },
      { course_id: "LC-001", course_title: "Garena Onboarding Essentials", enrolled_at: "2025-05-01", status: "completed", score: 82, xp_earned: 80 },
    ],
    "U-006": [
      { course_id: "LC-001", course_title: "Garena Onboarding Essentials", enrolled_at: "2026-02-05", status: "completed", score: 78, xp_earned: 80 },
      { course_id: "LC-005", course_title: "Garena Culture Deep Dive",     enrolled_at: "2026-02-10", status: "completed", score: 84, xp_earned: 60 },
    ],
    "U-007": [
      { course_id: "LC-004", course_title: "Tư duy sản phẩm",           enrolled_at: "2026-03-20", status: "completed", score: 93, xp_earned: 140 },
      { course_id: "LC-007", course_title: "Kỹ năng thuyết trình",      enrolled_at: "2026-05-01", status: "completed", score: 89, xp_earned: 100 },
      { course_id: "LC-011", course_title: "Quản lý dự án Agile",       enrolled_at: "2026-06-10", status: "enrolled",  score: null, xp_earned: 0  },
    ],
    "U-008": [
      { course_id: "LC-006", course_title: "Leadership Foundation",      enrolled_at: "2025-10-01", status: "completed", score: 96, xp_earned: 200 },
      { course_id: "LC-011", course_title: "Quản lý dự án Agile",       enrolled_at: "2026-01-15", status: "completed", score: 91, xp_earned: 180 },
      { course_id: "LC-004", course_title: "Tư duy sản phẩm",           enrolled_at: "2026-04-01", status: "completed", score: 95, xp_earned: 140 },
    ],
    "U-013": [
      { course_id: "LC-001", course_title: "Garena Onboarding Essentials", enrolled_at: "2022-06-10", status: "completed", score: 99, xp_earned: 80 },
      { course_id: "LC-003", course_title: "Giao tiếp hiệu quả",          enrolled_at: "2023-01-05", status: "completed", score: 97, xp_earned: 100 },
      { course_id: "LC-006", course_title: "Leadership Foundation",        enrolled_at: "2023-06-20", status: "completed", score: 98, xp_earned: 200 },
      { course_id: "LC-011", course_title: "Quản lý dự án Agile",         enrolled_at: "2024-03-10", status: "completed", score: 95, xp_earned: 180 },
      { course_id: "LC-008", course_title: "Excel & Power BI nâng cao",   enrolled_at: "2024-09-01", status: "completed", score: 93, xp_earned: 120 },
    ],
  };

  export const ADM_DATA = {
    ADMIN_STATS, ADMIN_COURSES, ADMIN_SESSIONS, SESSION_ATTENDEES,
    ADMIN_REQUESTS, ADMIN_POLICIES, ADMIN_ACCOUNTS, ADMIN_TESTIMONIALS,
    ADMIN_USERS, USER_ENROLLMENTS,
  };
