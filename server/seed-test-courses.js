import { pool, query } from "./db.js";
import { config } from "./config.js";

if (!config.databaseUrl) {
  console.error("DATABASE_URL is not set. Start/configure a real database before seeding test courses.");
  process.exit(1);
}

const testCourses = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    course_code: "MOCK-COMPLETE",
    title: "Mock: Test xác nhận hoàn thành",
    trainer: "Mock L&D",
    format: "online",
    duration_hours: 0.5,
    skill_tags: ["product"],
    rank_targets: ["rank_02"],
    role_targets: ["strategist"],
    type: "external",
    min_participants: null,
    registration_url: "#",
    description: "Khóa mock DB thật để test popup xác nhận Mark as completed trên trang home.",
    xp_reward: 20,
    status: "ended",
    material_url: null,
    session_date: null,
    session_time: null,
    location: null,
    max_participants: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    course_code: "MOCK-REVIEW",
    title: "Mock: Test hoàn tác & gửi đánh giá",
    trainer: "Mock L&D",
    format: "online",
    duration_hours: 0.5,
    skill_tags: ["communication"],
    rank_targets: ["rank_02"],
    role_targets: ["strategist"],
    type: "external",
    min_participants: null,
    registration_url: "#",
    description: "Khóa mock DB thật để test hoàn thành, hoàn tác và gửi đánh giá lên admin.",
    xp_reward: 20,
    status: "ended",
    material_url: null,
    session_date: null,
    session_time: null,
    location: null,
    max_participants: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    course_code: "MOCK-REGISTER",
    title: "Mock: Test xác nhận đăng ký",
    trainer: "Mock Trainer",
    format: "online",
    duration_hours: 1,
    skill_tags: ["data"],
    rank_targets: ["rank_02"],
    role_targets: ["strategist"],
    type: "interest",
    min_participants: 10,
    registration_url: "#",
    description: "Khóa mock DB thật để test popup xác nhận Đăng ký và lưu reservation lên admin.",
    xp_reward: 30,
    status: "open",
    material_url: null,
    session_date: "2026-07-20",
    session_time: "10:00",
    location: "Google Meet",
    max_participants: null,
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    course_code: "MOCK-SCHEDULED",
    title: "Mock: Test filter co lich sap toi",
    trainer: "Mock L&D",
    format: "offline",
    duration_hours: 2,
    skill_tags: ["leadership"],
    rank_targets: ["rank_02"],
    role_targets: ["strategist"],
    type: "scheduled",
    min_participants: 8,
    registration_url: "#",
    description: "Mock course for testing the upcoming scheduled join-method filter.",
    xp_reward: 40,
    status: "open",
    material_url: null,
    session_date: "2026-08-20",
    session_time: "09:00-11:00",
    location: "HCM Office",
    max_participants: 24,
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    course_code: "MOCK-SELF-LEARN",
    title: "Mock: Test filter tu hoc",
    trainer: "Mock L&D",
    format: "elearning",
    duration_hours: 0.75,
    skill_tags: ["ai"],
    rank_targets: ["rank_02"],
    role_targets: ["strategist"],
    type: "elearning",
    min_participants: null,
    registration_url: "https://learning.garena.vn/mock-self-learn",
    description: "Mock course for testing the self-learning join-method filter.",
    xp_reward: 25,
    status: "open",
    material_url: null,
    session_date: null,
    session_time: null,
    location: null,
    max_participants: null,
  },
];

for (const course of testCourses) {
  const existing = await query("SELECT id FROM courses WHERE id = $1", [course.id]);
  if (existing.rowCount) {
    await query(
      `UPDATE courses
       SET course_code = $2,
           title = $3,
           trainer = $4,
           trainer_type = 'internal',
           format = $5,
           duration_hours = $6,
           skill_tags = $7,
           rank_targets = $8,
           role_targets = $9,
           type = $10,
           min_participants = $11,
           registration_url = $12,
           description = $13,
           xp_reward = $14,
           is_active = TRUE,
           status = $15,
           material_url = $16,
           session_date = $17,
           session_time = $18,
           location = $19,
           max_participants = $20,
           session_status = $15,
           updated_at = NOW()
       WHERE id = $1`,
      [
        course.id, course.course_code, course.title, course.trainer, course.format,
        course.duration_hours, course.skill_tags, course.rank_targets, course.role_targets,
        course.type, course.min_participants, course.registration_url, course.description,
        course.xp_reward, course.status, course.material_url, course.session_date,
        course.session_time, course.location, course.max_participants,
      ],
    );
    continue;
  }

  await query(
    `INSERT INTO courses
       (id, course_code, title, trainer, trainer_type, format, duration_hours,
        skill_tags, rank_targets, role_targets, type, min_participants,
        registration_url, description, xp_reward, is_active, status, material_url,
        session_date, session_time, location, max_participants, current_count, session_status)
     VALUES ($1, $2, $3, $4, 'internal', $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, TRUE, $15, $16, $17, $18, $19, $20, 0, $15)`,
    [
      course.id, course.course_code, course.title, course.trainer, course.format,
      course.duration_hours, course.skill_tags, course.rank_targets, course.role_targets,
      course.type, course.min_participants, course.registration_url, course.description,
      course.xp_reward, course.status, course.material_url, course.session_date,
      course.session_time, course.location, course.max_participants,
    ],
  );
}

const seeded = await query(
  `SELECT COUNT(*) AS count FROM courses WHERE id IN (${testCourses.map((_, index) => `$${index + 1}`).join(", ")})`,
  testCourses.map((course) => course.id),
);
const seededCount = Number(seeded.rows[0]?.count || 0);
if (seededCount !== testCourses.length) {
  console.error(`Expected ${testCourses.length} test courses, found ${seededCount}. Check database connectivity.`);
  process.exit(1);
}

await pool.end();
console.log(`Seeded ${testCourses.length} test courses.`);
