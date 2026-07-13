# 🗄️ 02 — Database Schema

# 02 — Database Schema

## Quan hệ giữa các bảng

```
users ──< enrollments >── courses
users ──< reservations >── course_sessions
courses ──< course_sessions
courses ──< testimonials >── users
users ──< ld_requests
policies (standalone)
admin_accounts (standalone whitelist)
```


---

## `users`

```sql
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              VARCHAR(255) UNIQUE NOT NULL,       -- @garena.vn only
  full_name          VARCHAR(255) NOT NULL,
  avatar_url         TEXT,
  rank               VARCHAR(100),                       -- từ quiz
  role               VARCHAR(100),                       -- từ quiz
  learning_formats   TEXT[]        DEFAULT '{}',         -- ['Video','Workshop','Coaching','Reading']
  weekly_hours       VARCHAR(20),                        -- '<1h' | '1-2h' | '3h+'
  preferred_trainers TEXT[]        DEFAULT '{}',         -- tối đa 3 tên, gõ tự do
  learning_goals     TEXT,
  xp_total           INTEGER       DEFAULT 0,
  hours_total        NUMERIC(6,1)  DEFAULT 0,
  onboarding_done    BOOLEAN       DEFAULT FALSE,
  created_at         TIMESTAMPTZ   DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   DEFAULT NOW()
);
```


---

## `courses`

```sql
CREATE TABLE courses (
  id               VARCHAR(20) PRIMARY KEY,              -- 'LC-001', set bởi admin
  title            VARCHAR(255) NOT NULL,
  trainer          VARCHAR(255) NOT NULL,
  trainer_type     VARCHAR(20)  DEFAULT 'internal',      -- 'internal' | 'external'
  format           VARCHAR(50)  NOT NULL,                -- 'Workshop'|'Video'|'Coaching'|'Reading'
  duration_hours   NUMERIC(5,1) NOT NULL,
  skill_tags       TEXT[]       DEFAULT '{}',
  rank_targets     TEXT[]       DEFAULT '{}',
  role_targets     TEXT[]       DEFAULT '{}',            -- ['All'] hoặc role cụ thể
  rating           NUMERIC(3,1) DEFAULT 0,               -- auto-recalculate từ testimonials
  enrolled_count   INTEGER      DEFAULT 0,               -- cập nhật sau mỗi import
  type             VARCHAR(20)  NOT NULL,                -- 'open'|'scheduled'|'waitlist'
  min_participants INTEGER,                              -- chỉ dùng khi type='waitlist'
  registration_url TEXT,
  description      TEXT,
  xp_reward        INTEGER      NOT NULL DEFAULT 50,     -- admin config, system suggest theo rank_targets
  is_active        BOOLEAN      DEFAULT TRUE,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);
```


---

## `course_sessions`

```sql
CREATE TABLE course_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         VARCHAR(20)  NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_date      DATE         NOT NULL,
  session_time      TIME,
  location          VARCHAR(255),
  max_participants  INTEGER,
  current_count     INTEGER      DEFAULT 0,
  status            VARCHAR(20)  DEFAULT 'open',         -- 'open'|'full'|'confirmed'|'cancelled'
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);
```


---

## `enrollments`

> Ghi nhận **đã hoàn thành** — phân biệt với đăng ký hoặc đặt chỗ.

```sql
CREATE TABLE enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    VARCHAR(20) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  source       VARCHAR(20) NOT NULL,                     -- 'self_reported' | 'admin_import'
  xp_earned    INTEGER     NOT NULL,                     -- snapshot courses.xp_reward lúc hoàn thành
  hours_earned NUMERIC(5,1) NOT NULL,                    -- snapshot courses.duration_hours
  UNIQUE (user_id, course_id)
);
```


---

## `reservations`

```sql
CREATE TABLE reservations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id   UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  reserved_at  TIMESTAMPTZ DEFAULT NOW(),
  status       VARCHAR(20) DEFAULT 'pending',            -- 'pending'|'confirmed'|'cancelled'
  notified_at  TIMESTAMPTZ,
  UNIQUE (user_id, session_id)
);
```


---

## `testimonials`

```sql
CREATE TABLE testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   VARCHAR(20) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     TEXT,
  is_featured BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

> Sau mỗi INSERT/UPDATE: recalculate `courses.rating = ROUND(AVG(rating), 1)` cho course đó.


---

## `ld_requests`

```sql
CREATE TABLE ld_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skills_needed      TEXT[]      DEFAULT '{}',
  description        TEXT        NOT NULL,
  preferred_formats  TEXT[]      DEFAULT '{}',
  weekly_hours       VARCHAR(20),
  preferred_trainers TEXT,
  other_notes        TEXT,
  status             VARCHAR(20) DEFAULT 'new',          -- 'new'|'in_review'|'resolved'|'closed'
  admin_note         TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```


---

## `policies`

```sql
CREATE TABLE policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    VARCHAR(100) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,                     -- lưu dạng Markdown, render ra HTML
  source_file VARCHAR(255),
  order_index INTEGER      DEFAULT 0,
  is_active   BOOLEAN      DEFAULT TRUE,
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
```


---

## `admin_accounts`

```sql
CREATE TABLE admin_accounts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE NOT NULL,               -- @garena.vn only
  full_name  VARCHAR(255),
  role       VARCHAR(50) NOT NULL DEFAULT 'ld_admin',    -- 'super_admin'|'ld_admin'
  is_active  BOOLEAN     DEFAULT TRUE,
  added_by   UUID REFERENCES admin_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

> Whitelist: chỉ email có trong bảng này + `is_active = TRUE` mới vào được Admin Site. `super_admin` có thể thêm/deactivate `ld_admin`. Deactivate, không xóa (giữ log).