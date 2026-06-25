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
  await query(
    `INSERT INTO courses
       (id, title, trainer, format, duration_hours,
        skill_tags, rank_targets, role_targets,
        type, min_participants, registration_url, description, xp_reward)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO NOTHING`,
    [
      c.id, c.title, c.trainer, c.format, c.duration,
      c.skills, c.ranks, c.roles,
      c.type, c.min, c.url, c.desc, c.xp,
    ],
  );
}

// ── Sessions (only seed if table is empty) ───────────────────────────

const sessionCount = await query("SELECT COUNT(*) AS cnt FROM course_sessions");
if (Number(sessionCount.rows[0]?.cnt ?? 0) === 0) {
  const sessions = [
    ["LC-001", futureDate(7), "10:00", "Garena VN - Training Room", 30],
    ["LC-003", futureDate(21), "14:00", "Online", 12],
  ];
  for (const s of sessions) {
    await query(
      `INSERT INTO course_sessions
         (course_id, session_date, session_time, location, max_participants)
       VALUES ($1,$2,$3,$4,$5)`,
      s,
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
