# 🚀 07 — Promote to Live Flow (Data Prep → Production)

## Context

Admin Data Prep lưu dữ liệu import vào **staging tables** (`staging_courses`, `staging_sessions`, `staging_policies`, `staging_admin_accounts`) nhóm theo batch (`data_batches`). Document này mô tả flow để promote staging data đã review vào production tables.

---

## Trạng thái hiện tại

### ✅ Đã có
- Admin upload/paste data qua Data Prep UI
- Validate: kiểu cột, required fields, foreign key checks
- Data hợp lệ được lưu thành batch vào staging tables
- Export draft thành CSV

### ❌ Chưa có
- "Promote" action để đẩy staging data vào live tables
- Review/approval workflow trước khi promote
- Rollback capability sau promote

---

## Proposed Promote Flow

### Step 1 — Admin Review Draft

1. Admin mở Data Prep → chọn data type (courses/sessions/policies/admin-accounts)
2. Review batch data mới nhất trong preview table
3. Fix issues bằng cách re-import data đã sửa

### Step 2 — Admin Click "Promote to Live"

- **New API:** `POST /admin/api/data-prep/:type/promote`
- Quyền: `super_admin` cho `admin-accounts`, `ld_admin` cho các loại khác
- Body (optional): `{ "batchId": "uuid" }` — nếu không truyền, dùng batch mới nhất

### Step 3 — Backend Promotes Data

#### Courses (`staging_courses` → `courses`)

```sql
INSERT INTO courses (id, title, description, trainer, format, duration_hours,
  skill_tags, rank_targets, role_targets, type, min_participants,
  registration_url, xp_reward, is_active)
SELECT course_id, title, description, trainer, format, duration_hours,
  skill_tags, rank_targets, role_targets, type, min_participants,
  registration_url, xp_reward, is_active
FROM staging_courses
WHERE batch_id = :batchId
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  trainer = VALUES(trainer),
  format = VALUES(format),
  duration_hours = VALUES(duration_hours),
  skill_tags = VALUES(skill_tags),
  rank_targets = VALUES(rank_targets),
  role_targets = VALUES(role_targets),
  type = VALUES(type),
  min_participants = VALUES(min_participants),
  registration_url = VALUES(registration_url),
  xp_reward = VALUES(xp_reward),
  is_active = VALUES(is_active),
  updated_at = NOW();
```

#### Sessions (`staging_sessions` → `course_sessions`)

```sql
INSERT INTO course_sessions (course_id, session_date, session_time, location,
  max_participants, status)
SELECT course_id, session_date, session_time, location,
  max_participants, COALESCE(status, 'open')
FROM staging_sessions
WHERE batch_id = :batchId;
```

> ⚠️ Sessions không có upsert logic — mỗi promote tạo sessions mới.

#### Policies (`staging_policies` → `policies`)

```sql
INSERT INTO policies (category, title, content, is_active, order_index)
SELECT category, title, content, is_active, order_index
FROM staging_policies
WHERE batch_id = :batchId;
```

> Admin có thể chọn "Replace" mode: deactivate toàn bộ policies cũ trước khi insert.

#### Admin Accounts (`staging_admin_accounts` → `admin_accounts`)

```sql
INSERT INTO admin_accounts (email, full_name, role, is_active)
SELECT email, full_name, role, is_active
FROM staging_admin_accounts
WHERE batch_id = :batchId
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = VALUES(is_active);
```

### Step 4 — Ghi nhận Promotion

Thêm column vào `data_batches`:

```sql
ALTER TABLE data_batches
ADD COLUMN promoted_at TIMESTAMP NULL,
ADD COLUMN promoted_by VARCHAR(255) NULL;
```

Update sau promote thành công:

```sql
UPDATE data_batches
SET promoted_at = NOW(), promoted_by = :adminEmail
WHERE id = :batchId;
```

### Step 5 — Response

```json
{
  "ok": true,
  "batchId": "abc-123",
  "type": "courses",
  "promoted": 15,
  "promoted_at": "2026-07-01T10:00:00Z"
}
```

---

## Rollback Strategy

| Cấp độ | Mô tả |
|---------|--------|
| **Soft rollback** | Deactivate promoted records (`is_active = FALSE`) |
| **Hard rollback** | Snapshot live records trước promote, restore từ snapshot |

### Implementation gợi ý

1. Trước promote, INSERT affected live records vào `promotion_snapshots` table
2. Admin có nút "Undo Last Promotion" (trong 24h)
3. Undo = restore từ snapshot + clear `promoted_at`

---

## Frontend UI Gợi ý

1. Thêm nút **"Promote to Live"** bên cạnh "Save Draft"
2. Hiển thị confirmation dialog: "Bạn sắp đẩy {N} records vào production. Tiếp tục?"
3. Sau promote: hiển thị kết quả (promoted / skipped / errors)
4. Badge cho batch đã promote: `[LIVE]`

---

## Open Questions

| #  | Câu hỏi | Quyết định |
|----|---------|-----------|
| P1 | Promote overwrite ALL hay merge (upsert)? | Gợi ý: **merge (upsert)** cho courses/admin, **append** cho sessions |
| P2 | Cần approval step (admin khác confirm)? | Gợi ý: bắt đầu không cần, thêm sau |
| P3 | Sessions đã có reservations → xử lý thế nào khi re-promote? | Gợi ý: skip existing sessions, chỉ thêm mới |
| P4 | Có cần audit log cho mỗi promote? | Gợi ý: yes — `data_batches.promoted_at` + `promoted_by` là minimum |
