# 🛠️ 06 — Admin & Ops

## Admin Site

Trang web riêng (`/admin` hoặc subdomain — xem OQ4). Cùng backend, route khác. Google OAuth tương tự user, nhưng check thêm `admin_accounts`. Nếu email không trong whitelist → 403.

### Module 1 — Dashboard

Data từ `GET /admin/api/stats`: user onboard, enrollments tháng này (breakdown source), top 5 khóa, pending L&D requests.

### Module 2 — Quản lý Khóa học

* Bảng danh sách kể cả `is_active = false`
* Tạo/sửa: chọn `rank_targets` → gọi `suggest-xp` → hiển thị gợi ý range. Admin override được.
* Import participants: upload CSV/Excel → báo cáo (matched / not_found / existed)
* Toggle `is_active`

### Module 3 — Quản lý Sessions

* CRUD sessions gắn với course
* Xem DS user đặt chỗ từng session
* Nút **"Xác nhận mở lớp"** → `POST /admin/api/sessions/:id/confirm` → tự email tất cả users
* Status flow: `open → full (auto) → confirmed (manual) → cancelled`

### Module 4 — Quản lý L&D Requests

* Bảng filter theo status
* Click row → xem chi tiết + sửa status + ghi `admin_note`
* Update status → trigger email notify user tự động

### Module 5 — Quản lý Policy

* Import `.docx` / `.pdf` → parse → preview Markdown → confirm lưu
* Markdown editor inline sau import
* Drag-drop `order_index` trong category
* Toggle `is_active`

### Module 6 — Quản lý Admin Accounts (chỉ super_admin)

* Whitelist: add email (`@garena.vn`), assign role (`ld_admin` / `super_admin`)
* Toggle `is_active` — không xóa, giữ log

### Module 7 — Quản lý Testimonials

* Xem theo course, toggle `is_featured`


---

## Notification & Email Automation

Tất cả qua `server/services/mail.js`, SMTP nội bộ Garena.

| Trigger | Người nhận | Subject |
|---------|------------|---------|
| User đặt chỗ thành công | User       | "Xác nhận đặt chỗ: \[Tên khóa\]" |
| `current_count >= min_participants` | Tất cả user đặt chỗ session đó | "Lớp \[Tên khóa\] đã đủ người!" |
| Admin confirm session | Tất cả reservations của session | "Lớp \[Tên khóa\] chính thức mở!" |
| Session date - 48h (cron job) | User reservation confirmed | "Nhắc nhở: \[Tên khóa\] sau 2 ngày" |
| Enrollment self_reported | User       | "Hoàn thành: +\[X\] XP" |
| Admin import → user được thêm | User       | "\[Tên khóa\] đã được ghi nhận ✅" |
| `POST /api/ld-requests` | L&D Admin group email | "L&D Request mới từ \[Tên user\]" |
| Admin update ld_request status | User gửi request | "Yêu cầu của bạn: \[status mới\]" |

> Cron job reminder: chạy 8:00 sáng mỗi ngày, query `session_date = CURRENT_DATE + 2`.


---

## Seed Data

```sql
-- Super admin đầu tiên (email do Van Anh Lê xác nhận)
INSERT INTO admin_accounts (email, full_name, role)
VALUES ('<email TBD>', 'L&D Admin', 'super_admin');
```

* **12 khóa học:** lấy từ prototype, convert sang INSERT statements
* **3 sessions:** 1 loại `scheduled`, 2 loại `waitlist`
* **Policy placeholder:** 3 categories, 2 entries mỗi category


---

## Open Questions

| #   | Câu hỏi | Blocking Session | Ai xác nhận |
|-----|---------|------------------|-------------|
| OQ1 | Google OAuth Client ID + Secret cho `@garena.vn` | ✅ Session 1      | Anh Kiên    |
| OQ2 | SMTP config: host, port, credentials | ✅ Session 3      | Anh Kiên    |
| OQ3 | Backend stack: Node.js OK? | ✅ Session 1      | Anh Kiên    |
| OQ4 | Admin Site: subdomain riêng hay `/admin` path? | Session 4        | Anh Kiên    |
| OQ5 | File import participants: tên cột email trong file? | Session 3        | Van Anh Lê  |
| OQ6 | Super Admin email đầu tiên để seed | Session 4        | Van Anh Lê  |
| OQ7 | Alpha Intelligence API endpoint + auth method | Session 3        | Mint cung cấp |