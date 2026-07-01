-- Use the unique course row id for completion/testimonials.
-- course_code is now only a display/grouping code and may repeat.

ALTER TABLE enrollments CHANGE course_code course_id CHAR(36) NOT NULL;
UPDATE enrollments e
JOIN (
  SELECT course_code, MIN(id) AS id
  FROM courses
  GROUP BY course_code
) c ON c.course_code = e.course_id
SET e.course_id = c.id;
ALTER TABLE enrollments ADD CONSTRAINT fk_enroll_course_row
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE testimonials CHANGE course_code course_id CHAR(36) NOT NULL;
UPDATE testimonials t
JOIN (
  SELECT course_code, MIN(id) AS id
  FROM courses
  GROUP BY course_code
) c ON c.course_code = t.course_id
SET t.course_id = c.id;
ALTER TABLE testimonials ADD CONSTRAINT fk_test_course_row
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
