# 🔌 03 — API Endpoints

## Auth

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET    | `/auth/google` | —    | Redirect OAuth |
| GET    | `/auth/callback` | —    | Nhận token Google, issue JWT |
| POST   | `/auth/logout` | —    | Logout |
| GET    | `/auth/me` | JWT  | Trả user hiện tại |


---

## User & Onboarding

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET    | `/api/me` | JWT  | Profile đầy đủ (include enrollments, reservations) |
| PUT    | `/api/me` | JWT  | Cập nhật preferences |
| POST   | `/api/me/onboarding` | JWT  | Submit quiz, set `onboarding_done = true` |

**Body** `**POST /api/me/onboarding**`**:**

```json
{
  "rank": "Associate",
  "role": "Marketing",
  "class_archetype": "Strategist",
  "learning_formats": ["Video", "Workshop"],
  "weekly_hours": "1-2h",
  "preferred_trainers": ["Nguyễn Văn A"],
  "learning_goals": "Nâng cao kỹ năng trình bày"
}
```


---

## Courses

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET    | `/api/courses` | JWT  | Danh sách + filter + sort + fit_tag |
| GET    | `/api/courses/:id` | JWT  | Chi tiết 1 khóa |
| POST   | `/api/courses/:id/complete` | JWT  | Self-reported completion |
| GET    | `/api/courses/:id/testimonials` | JWT  | Testimonials của khóa |
| POST   | `/api/courses/:id/testimonials` | JWT  | Gửi testimonial (chỉ nếu đã enrolled) |

**Query params** `**GET /api/courses**`**:**

| Param | Kiểu | Ví dụ |
|-------|------|-------|
| `search` | string | `presentation` — fulltext tên + trainer |
| `rank` | string | `Associate` |
| `role` | string | `Marketing` |
| `format` | string | `Workshop` |
| `trainer` | string | `Nguyễn Văn A` |
| `skill_tag` | string | `Leadership` |
| `rating_min` | number | `4`   |
| `duration_max` | number | `8`   |
| `type` | string | `open\|scheduled\|waitlist` |
| `sort` | string | `relevant\|rating\|popular\|newest` |
| `page` | number | `1`   |
| `limit` | number | `20`  |

**Response item — thêm field** `**fit_tag**` **và** `**is_enrolled**`**:**

```json
{
  "id": "LC-001",
  "title": "...",
  "fit_tag": "best_fit | for_your_level | null",
  "is_enrolled": false
}
```

**Response** `**POST /api/courses/:id/complete**`**:**

```json
{
  "xp_earned": 100,
  "new_total_xp": 350,
  "new_total_hours": 12.5
}
```


---

## Sessions & Reservations

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET    | `/api/sessions` | JWT  | Lịch đào tạo |
| POST   | `/api/sessions/:id/reserve` | JWT  | Đặt chỗ |
| DELETE | `/api/sessions/:id/reserve` | JWT  | Hủy đặt chỗ |

**Query params** `**GET /api/sessions**`**:** `?month=2026-07`, `?course_id=LC-001`

`**POST /api/sessions/:id/reserve**` **— side effects:**


1. INSERT reservations (UNIQUE constraint → 409 nếu đã đặt)
2. UPDATE `course_sessions.current_count += 1`
3. Nếu `current_count >= courses.min_participants` → trigger session-full flow (xem 04 — Business Logic)
4. Gửi email xác nhận cho user


---

## L&D Requests

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST   | `/api/ld-requests` | JWT  | Submit request |
| GET    | `/api/ld-requests/mine` | JWT  | Requests của user hiện tại |

**Body** `**POST /api/ld-requests**`**:**

```json
{
  "skills_needed": ["Leadership", "Data Analysis"],
  "description": "Tôi cần học về...",
  "preferred_formats": ["Workshop"],
  "weekly_hours": "1-2h",
  "preferred_trainers": "Trainer X",
  "other_notes": "Ưu tiên buổi sáng"
}
```


---

## Policies

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET    | `/api/policies` | JWT  | Tất cả policies nhóm theo category |
| GET    | `/api/policies/:id` | JWT  | Chi tiết 1 policy |


---

## Admin API (`/admin/api/*` — requireAdmin)

### Courses

| Method | Path | Mô tả |
|--------|------|-------|
| GET    | `/admin/api/courses` | Danh sách kể cả inactive |
| POST   | `/admin/api/courses` | Tạo mới |
| PUT    | `/admin/api/courses/:id` | Cập nhật |
| DELETE | `/admin/api/courses/:id` | Xóa   |
| POST   | `/admin/api/courses/:id/import-participants` | Upload CSV/Excel → trả báo cáo |
| POST   | `/admin/api/courses/suggest-xp` | Body: `{ rank_targets }` → `{ suggested_min, suggested_max }` |

**Response** `**POST .../import-participants**`**:**

```json
{
  "total_in_file": 30,
  "matched_and_enrolled": 25,
  "already_existed": 3,
  "not_found_in_system": 2,
  "not_found_emails": ["abc@garena.vn"]
}
```

### Sessions

| Method | Path | Mô tả |
|--------|------|-------|
| GET    | `/admin/api/sessions` | Tất cả sessions |
| POST   | `/admin/api/sessions` | Tạo session |
| PUT    | `/admin/api/sessions/:id` | Cập nhật |
| DELETE | `/admin/api/sessions/:id` | Xóa   |
| GET    | `/admin/api/sessions/:id/reservations` | DS user đặt chỗ |
| POST   | `/admin/api/sessions/:id/confirm` | Xác nhận mở lớp → gửi email tất cả |

### Users

| Method | Path | Mô tả |
|--------|------|-------|
| GET    | `/admin/api/users` | Danh sách user + stats |
| GET    | `/admin/api/users/:id` | Chi tiết user + enrollments |

### L&D Requests

| Method | Path | Mô tả |
|--------|------|-------|
| GET    | `/admin/api/ld-requests` | Danh sách (filter: status, date) |
| PUT    | `/admin/api/ld-requests/:id` | Cập nhật status + admin_note |

### Policies

| Method | Path | Mô tả |
|--------|------|-------|
| GET/POST/PUT/DELETE | `/admin/api/policies` | CRUD policies |
| POST   | `/admin/api/policies/import` | Upload docx/pdf → parse → lưu DB |

> Parser: `mammoth` (docx→html→markdown) hoặc `pdf-parse` (pdf→text). Admin review Markdown sau import.

### Admin Accounts (chỉ super_admin)

| Method | Path | Mô tả |
|--------|------|-------|
| GET    | `/admin/api/accounts` | Danh sách whitelist |
| POST   | `/admin/api/accounts` | Thêm email mới (validate `@garena.vn`) |
| PUT    | `/admin/api/accounts/:id` | Sửa role / toggle is_active |

### Stats

| Method | Path | Mô tả |
|--------|------|-------|
| GET    | `/admin/api/stats` | Dashboard tổng hợp |

```json
{
  "total_users": 320,
  "onboarded_users": 210,
  "enrollments_this_month": 87,
  "enrollments_by_source": { "self_reported": 60, "admin_import": 27 },
  "top_courses": [{ "id": "LC-001", "title": "...", "enrolled_count": 45 }],
  "pending_ld_requests": 12
}
```