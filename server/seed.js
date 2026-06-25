import { pool, query } from "./db.js";

await query(
  `INSERT INTO courses
   (id, title, trainer, format, duration_hours, skill_tags, rank_targets, role_targets, type, min_participants, registration_url, description, xp_reward)
   VALUES
   ('LC-001', 'Garena Foundations', 'L&D Team', 'Workshop', 2.0, ARRAY['Foundations'], ARRAY['Associate'], ARRAY['All'], 'scheduled', NULL, 'https://learning.garena.vn', 'Nền tảng văn hóa, cách làm việc và hệ thống nội bộ tại Garena.', 50),
   ('LC-002', 'Data Thinking for Business', 'Data Guild', 'Video', 1.5, ARRAY['Data Analysis'], ARRAY['Associate','Senior'], ARRAY['Marketing','Product','Operations'], 'open', NULL, 'https://learning.garena.vn', 'Cách đọc dữ liệu và biến insight thành quyết định.', 80),
   ('LC-003', 'Leadership Quest: 1-1 Coaching', 'People Team', 'Coaching', 3.0, ARRAY['Leadership','Coaching'], ARRAY['Lead','Manager'], ARRAY['All'], 'waitlist', 8, NULL, 'Chương trình coaching dành cho nhân sự chuẩn bị dẫn dắt đội nhóm.', 120)
   ON CONFLICT (id) DO NOTHING`
);

await query(
  `INSERT INTO course_sessions
   (course_id, session_date, session_time, location, max_participants)
   VALUES
   ('LC-001', CURRENT_DATE + INTERVAL '7 days', '10:00', 'Garena VN - Training Room', 30),
   ('LC-003', CURRENT_DATE + INTERVAL '21 days', '14:00', 'Online', 12)
   ON CONFLICT DO NOTHING`
);

await query(
  `INSERT INTO policies (category, title, content, order_index)
   VALUES
   ('Loại hình đào tạo', 'Workshop nội bộ', 'Các buổi workshop do L&D team tổ chức định kỳ, dành cho toàn bộ nhân sự.', 1),
   ('Hỗ trợ chi phí học tập', 'Quy trình xin hỗ trợ', 'Nhân sự có thể đề xuất khóa học ngoài và nhận hỗ trợ chi phí theo quy định.', 2)
   ON CONFLICT DO NOTHING`
);

await pool.end();
console.log("Seed complete");
