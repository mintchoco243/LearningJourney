-- Separate "đã tổ chức xong" (still visible, shows materials) from is_active
-- (hard hide). Previously is_active=false was overloaded for both meanings.
ALTER TABLE courses ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'open';
ALTER TABLE courses ADD COLUMN material_url TEXT NULL;

ALTER TABLE staging_courses ADD COLUMN status VARCHAR(20) DEFAULT 'open';
ALTER TABLE staging_courses ADD COLUMN material_url TEXT NULL;
