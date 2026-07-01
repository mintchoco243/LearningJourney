import { pool, query } from "./db.js";

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Courses ──────────────────────────────────────────────────────────

const courses = [
  {
    id: "LC-001", title: "Garena Foundations", trainer: "L&D Team",
    format: "Workshop", duration: 2.0,
    skills: ["Foundations"], ranks: ["Associate"], roles: ["All"],
    type: "scheduled", min: null,
    url: "https://learning.garena.vn",
    desc: "Nền tảng văn hóa, cách làm việc và hệ thống nội bộ tại Garena.",
    xp: 50,
  },
  {
    id: "LC-002", title: "Data Thinking for Business", trainer: "Data Guild",
    format: "Video", duration: 1.5,
    skills: ["Data Analysis"], ranks: ["Associate", "Senior"],
    roles: ["Marketing", "Product", "Operations"],
    type: "open", min: null,
    url: "https://learning.garena.vn",
    desc: "Cách đọc dữ liệu và biến insight thành quyết định.",
    xp: 80,
  },
  {
    id: "LC-003", title: "Leadership Quest: 1-1 Coaching", trainer: "People Team",
    format: "Coaching", duration: 3.0,
    skills: ["Leadership", "Coaching"], ranks: ["Lead", "Manager"],
    roles: ["All"],
    type: "waitlist", min: 8,
    url: null,
    desc: "Chương trình coaching dành cho nhân sự chuẩn bị dẫn dắt đội nhóm.",
    xp: 120,
  },
];

for (const c of courses) {
  const existing = await query("SELECT id FROM courses WHERE course_code = $1 AND session_date IS NULL", [c.id]);
  if (!existing.rowCount) {
    await query(
      `INSERT INTO courses
         (id, course_code, title, trainer, format, duration_hours,
          skill_tags, rank_targets, role_targets,
          type, min_participants, registration_url, description, xp_reward, session_date)
       VALUES (UUID(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NULL)`,
      [
        c.id, c.title, c.trainer, c.format, c.duration,
        JSON.stringify(c.skills), JSON.stringify(c.ranks), JSON.stringify(c.roles),
        c.type, c.min, c.url, c.desc, c.xp,
      ],
    );
  }
}

// ── Sessions (only seed if table is empty) ───────────────────────────

const sessionCount = await query("SELECT COUNT(*) AS cnt FROM courses WHERE session_date IS NOT NULL");
if (Number(sessionCount.rows[0]?.cnt ?? 0) === 0) {
  const sessions = [
    ["LC-001", futureDate(7), "10:00", "Garena VN - Training Room", 30],
    ["LC-003", futureDate(21), "14:00", "Online", 12],
  ];
  for (const [course_code, session_date, session_time, location, max_participants] of sessions) {
    await query(
      `INSERT INTO courses
         (id, course_code, title, trainer, trainer_type, format, duration_hours,
          skill_tags, rank_targets, role_targets, type, min_participants, registration_url,
          description, xp_reward, is_active, status,
          session_date, session_time, location, max_participants, current_count, session_status)
       SELECT UUID(), course_code, title, trainer, trainer_type, format, duration_hours,
          skill_tags, rank_targets, role_targets, type, min_participants, registration_url,
          description, xp_reward, is_active, status,
          $2, $3, $4, $5, 0, 'open'
       FROM courses WHERE course_code = $1 AND session_date IS NULL LIMIT 1`,
      [course_code, session_date, session_time, location, max_participants],
    );
  }
}

// ── Policies (only seed if table is empty) ───────────────────────────

const policyCount = await query("SELECT COUNT(*) AS cnt FROM policies");
if (Number(policyCount.rows[0]?.cnt ?? 0) === 0) {
  const policies = [
    ["Loại hình đào tạo", "Workshop nội bộ",
      "Các buổi workshop do L&D team tổ chức định kỳ, dành cho toàn bộ nhân sự.", 1],
    ["Hỗ trợ chi phí học tập", "Quy trình xin hỗ trợ",
      "Nhân sự có thể đề xuất khóa học ngoài và nhận hỗ trợ chi phí theo quy định.", 2],
  ];
  for (const p of policies) {
    await query(
      `INSERT INTO policies (category, title, content, order_index)
       VALUES ($1,$2,$3,$4)`,
      p,
    );
  }
}

await pool.end();
console.log("Seed complete");
