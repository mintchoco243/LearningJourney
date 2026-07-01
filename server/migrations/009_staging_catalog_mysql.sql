-- Single unified staging table for the merged courses+sessions CSV import.
-- One row per (course_code, session) combo; session_date empty = master/catalog-only row.
CREATE TABLE IF NOT EXISTS staging_catalog (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  batch_id CHAR(36) NOT NULL,
  course_code VARCHAR(80) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  trainer VARCHAR(255),
  trainer_type VARCHAR(20),
  format VARCHAR(50),
  duration_hours DECIMAL(6,1),
  skill_tags TEXT,
  rank_targets TEXT,
  role_targets TEXT,
  type VARCHAR(50),
  min_participants INT,
  registration_url TEXT,
  xp_reward INT,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20),
  material_url TEXT,
  session_date DATE,
  session_time VARCHAR(20),
  location VARCHAR(255),
  max_participants INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staging_catalog_batch FOREIGN KEY (batch_id) REFERENCES data_batches(id) ON DELETE CASCADE
);
