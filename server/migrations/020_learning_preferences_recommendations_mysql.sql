-- Persist Learning Compass preferences and recommendation metadata.
-- Runtime identity is courses.id (CHAR(36)); course_code remains display-only.

ALTER TABLE users
  ADD COLUMN focus_skills JSON NULL;

ALTER TABLE courses
  ADD COLUMN is_hr_recommended BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE staging_catalog
  ADD COLUMN is_hr_recommended BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE staging_courses
  ADD COLUMN is_hr_recommended BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS skill_catalog (
  id VARCHAR(80) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  icon VARCHAR(80) NULL,
  color VARCHAR(30) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_favorites (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_course_favorite (user_id, course_id),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_favorite_user_created (user_id, created_at),
  INDEX idx_favorite_course (course_id)
);

-- Backfill every existing skill tag so old catalog data remains selectable.
INSERT IGNORE INTO skill_catalog (id, label, display_order)
SELECT DISTINCT jt.skill_id, jt.skill_id, 0
FROM courses c
JOIN JSON_TABLE(
  COALESCE(c.skill_tags, JSON_ARRAY()),
  '$[*]' COLUMNS (skill_id VARCHAR(80) PATH '$')
) jt
WHERE jt.skill_id IS NOT NULL AND TRIM(jt.skill_id) <> '';

-- Keep the onboarding taxonomy selectable even when a skill has no current course.
INSERT IGNORE INTO skill_catalog (id, label, display_order) VALUES
  ('foundations', 'Foundations', 10),
  ('data', 'Data', 20),
  ('communication', 'Communication', 30),
  ('product', 'Product', 40),
  ('ai', 'AI', 50),
  ('analytics', 'Analytics', 60),
  ('leadership', 'Leadership', 70),
  ('facilitation', 'Facilitation', 80),
  ('strategy', 'Strategy', 90),
  ('ops_excellence', 'Operations Excellence', 100),
  ('mentoring', 'Mentoring', 110);
