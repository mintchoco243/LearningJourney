-- Merge courses + course_sessions into one table.
-- Design:
--   session_date IS NULL  -> master/course row (one per course_code, catalog entry)
--   session_date IS NOT NULL -> session row (zero to many per course_code)
--   id         CHAR(36) UUID  - unique per row (PK)
--   course_code VARCHAR(20)   - LC-001 style, repeatable, indexed
-- enrollments/testimonials now reference course_code (string, no FK since course_code is non-unique)
-- reservations.session_id still references courses.id (UUID of session rows)

-- Step 1: Create merged table (drop leftover scratch table from a prior failed run)
DROP TABLE IF EXISTS courses_new;
CREATE TABLE courses_new (
  id CHAR(36) PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  trainer VARCHAR(255) NOT NULL,
  trainer_type VARCHAR(20) DEFAULT 'internal',
  format VARCHAR(50) NOT NULL,
  duration_hours DECIMAL(5,1) NOT NULL,
  skill_tags JSON,
  rank_targets JSON,
  role_targets JSON,
  rating DECIMAL(3,1) DEFAULT 0,
  enrolled_count INT DEFAULT 0,
  type VARCHAR(20) NOT NULL,
  min_participants INT,
  registration_url TEXT,
  description TEXT,
  xp_reward INT NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  material_url TEXT,
  -- session columns (NULL = master/course row)
  session_date DATE,
  session_time TIME,
  location VARCHAR(255),
  max_participants INT,
  current_count INT DEFAULT 0,
  session_status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_course_code (course_code),
  INDEX idx_session_date (session_date)
);

-- Step 2: Insert master rows (courses without sessions + master rows for courses with sessions)
INSERT INTO courses_new (id, course_code, title, trainer, trainer_type, format, duration_hours,
  skill_tags, rank_targets, role_targets, rating, enrolled_count, type, min_participants,
  registration_url, description, xp_reward, is_active, status, material_url,
  session_date, session_time, location, max_participants, current_count, session_status,
  created_at, updated_at)
SELECT
  UUID(), c.id, c.title, c.trainer, c.trainer_type, c.format, c.duration_hours,
  c.skill_tags, c.rank_targets, c.role_targets, c.rating, c.enrolled_count, c.type, c.min_participants,
  c.registration_url, c.description, c.xp_reward, c.is_active, c.status, c.material_url,
  NULL, NULL, NULL, NULL, 0, 'open',
  c.created_at, c.updated_at
FROM courses c;

-- Step 3: Insert session rows (preserving session UUIDs for reservations FK)
INSERT INTO courses_new (id, course_code, title, trainer, trainer_type, format, duration_hours,
  skill_tags, rank_targets, role_targets, rating, enrolled_count, type, min_participants,
  registration_url, description, xp_reward, is_active, status, material_url,
  session_date, session_time, location, max_participants, current_count, session_status,
  created_at)
SELECT
  s.id, c.id, c.title, c.trainer, c.trainer_type, c.format, c.duration_hours,
  c.skill_tags, c.rank_targets, c.role_targets, c.rating, c.enrolled_count, c.type, c.min_participants,
  c.registration_url, c.description, c.xp_reward, c.is_active, c.status, c.material_url,
  s.session_date, s.session_time, s.location, s.max_participants, s.current_count, s.status,
  s.created_at
FROM course_sessions s
JOIN courses c ON c.id = s.course_id;

-- Step 4: Update enrollments - drop FK, rename course_id -> course_code
ALTER TABLE enrollments DROP FOREIGN KEY fk_enroll_course;
ALTER TABLE enrollments CHANGE course_id course_code VARCHAR(20) NOT NULL;
-- No FK added: course_code is non-unique in courses_new (intentional)

-- Step 5: Update testimonials - drop FK, rename course_id -> course_code
ALTER TABLE testimonials DROP FOREIGN KEY fk_test_course;
ALTER TABLE testimonials CHANGE course_id course_code VARCHAR(20) NOT NULL;

-- Step 6: Update reservations FK to point to courses_new
ALTER TABLE reservations DROP FOREIGN KEY fk_res_session;
ALTER TABLE reservations ADD CONSTRAINT fk_res_session
  FOREIGN KEY (session_id) REFERENCES courses_new(id) ON DELETE CASCADE;

-- Step 7: Swap tables
DROP TABLE course_sessions;
DROP TABLE courses;
RENAME TABLE courses_new TO courses;
