-- Manual, admin-entered "so nguoi da hoc" count. Unlike enrolled_count/current_count,
-- this is not derived from reservations/enrollments -- admin types it in directly
-- (e.g. historical learners from before the system existed).
ALTER TABLE courses ADD COLUMN total_learners INT DEFAULT NULL;
