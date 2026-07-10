-- Reset user & course data for launch
-- Keeps: policies, admin_accounts, app_settings, faqs

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE enrollments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE testimonials;
TRUNCATE TABLE site_feedback;
TRUNCATE TABLE ld_requests;
TRUNCATE TABLE course_sessions;
TRUNCATE TABLE courses;
TRUNCATE TABLE staging_catalog;
TRUNCATE TABLE staging_users;
TRUNCATE TABLE staging_courses;
TRUNCATE TABLE staging_sessions;
TRUNCATE TABLE staging_policies;
TRUNCATE TABLE staging_admin_accounts;
TRUNCATE TABLE data_batches;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
