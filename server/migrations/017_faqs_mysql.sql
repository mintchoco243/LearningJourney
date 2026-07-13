-- Migration 017: Create faqs table for FAQ & Policy content management
CREATE TABLE IF NOT EXISTS faqs (
  id VARCHAR(36) PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords VARCHAR(500) DEFAULT '',
  status VARCHAR(50) DEFAULT 'Published',
  display_order INT DEFAULT 0,
  last_updated_by VARCHAR(255) DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_topic (topic),
  INDEX idx_status (status),
  INDEX idx_order (display_order)
);

-- Seed initial FAQ items if table is empty
INSERT INTO faqs (id, topic, question, answer, keywords, status, display_order)
SELECT 'faq-001', 'Đăng ký & Lịch học', 'Làm sao để đăng ký một khóa học trên Learning Compass?',
  'Bạn chỉ cần vào Thư viện đào tạo (Course Catalog), chọn khóa học phù hợp, ấn "Xem chi tiết" và chọn "Đăng ký tham gia". Lịch học sẽ được tự động đồng bộ gửi tới Google Calendar qua email Garena của bạn trong tối đa 48h tới.',
  'đăng ký, lịch học, calendar, tham gia, thư viện', 'Published', 1
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE id = 'faq-001');

INSERT INTO faqs (id, topic, question, answer, keywords, status, display_order)
SELECT 'faq-002', 'Đăng ký & Lịch học', 'Tôi có thể hủy đăng ký khóa học nếu có lịch đột xuất không?',
  'Có. Bạn có thể vào phần Profile cá nhân -> Khóa đã đăng ký hoặc nhấp lại vào khóa học trong Thư viện, chọn hủy đăng ký trước thời gian khóa học diễn ra ít nhất 24 giờ để L&D Team sắp xếp chỗ cho các bạn khác.',
  'hủy đăng ký, lịch đột xuất, đổi lịch, hủy khóa học', 'Published', 2
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE id = 'faq-002');

INSERT INTO faqs (id, topic, question, answer, keywords, status, display_order)
SELECT 'faq-003', 'Tài liệu & Bản ghi', 'Tài liệu và bản ghi (recording) của các buổi Workshop ở đâu?',
  'Sau khi khóa học kết thúc và bạn được xác nhận hoàn thành, nút "Xem tài liệu / Recording" trong chi tiết khóa học sẽ được mở khóa. Bạn có thể truy cập bất kỳ lúc nào từ Thư viện hoặc Profile cá nhân.',
  'tài liệu, bản ghi, recording, slide, video học lại', 'Published', 3
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE id = 'faq-003');

INSERT INTO faqs (id, topic, question, answer, keywords, status, display_order)
SELECT 'faq-004', 'Đánh giá & Hoàn thành', 'Làm thế nào để tích lũy XP và ghi nhận giờ học?',
  'Khi hoàn thành khóa học và gửi đánh giá (Feedback / Testimonial) thành công, hệ thống sẽ tự động cập nhật số giờ học tích lũy và cộng XP tương ứng vào hồ sơ nhân vật của bạn.',
  'xp, giờ học, đánh giá, testimonial, feedback, hoàn thành', 'Published', 4
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE id = 'faq-004');

INSERT INTO faqs (id, topic, question, answer, keywords, status, display_order)
SELECT 'faq-005', 'Yêu cầu đào tạo (L&D Request)', 'Quy trình đề xuất hỗ trợ chi phí khóa học bên ngoài (Learning Budget Sponsor) như thế nào?',
  'Nhân sự chính thức từ cấp bậc Associate trở lên có thể xin tài trợ học phí các khóa học hoặc chứng chỉ bên ngoài phục vụ trực tiếp cho công việc. Bạn ấn vào nút "Đăng ký hỗ trợ chi phí đào tạo" trên Thư viện đào tạo để điền form đề xuất trên hệ thống Gigi hoặc liên hệ trực tiếp L&D Team qua Seatalk.',
  'hỗ trợ chi phí, sponsor, khóa ngoài, học phí, đề xuất, gigi', 'Published', 5
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE id = 'faq-005');

INSERT INTO faqs (id, topic, question, answer, keywords, status, display_order)
SELECT 'faq-006', 'Yêu cầu đào tạo (L&D Request)', 'Tôi muốn đề xuất L&D Team tổ chức một chủ đề/workshop mới cho team?',
  'Bạn có thể sử dụng nút "Gửi yêu cầu hỗ trợ đào tạo" ngay trên trang Thư viện hoặc chat với trợ lý Hộ Giá (bot ở góc phải màn hình) để gửi đề xuất. L&D Team sẽ đánh giá nhu cầu chung và liên hệ lại trong 2-3 ngày làm việc.',
  'workshop mới, đề xuất khóa học, yêu cầu đào tạo, hộ giá', 'Published', 6
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE id = 'faq-006');
