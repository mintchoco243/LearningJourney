CREATE TABLE IF NOT EXISTS data_batches (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  entity_type VARCHAR(50) NOT NULL,
  source VARCHAR(255),
  row_count INT NOT NULL DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staging_courses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  batch_id CHAR(36) NOT NULL,
  course_id VARCHAR(80) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  trainer VARCHAR(255),
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staging_courses_batch FOREIGN KEY (batch_id) REFERENCES data_batches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staging_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  batch_id CHAR(36) NOT NULL,
  course_id VARCHAR(80) NOT NULL,
  session_date DATE,
  session_time VARCHAR(100),
  location VARCHAR(255),
  trainer VARCHAR(255),
  min_participants INT,
  max_participants INT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staging_sessions_batch FOREIGN KEY (batch_id) REFERENCES data_batches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staging_policies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  batch_id CHAR(36) NOT NULL,
  category VARCHAR(100),
  title VARCHAR(255),
  content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staging_policies_batch FOREIGN KEY (batch_id) REFERENCES data_batches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staging_admin_accounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  batch_id CHAR(36) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staging_admin_accounts_batch FOREIGN KEY (batch_id) REFERENCES data_batches(id) ON DELETE CASCADE
);

INSERT INTO admin_accounts (email, full_name, role, is_active)
VALUES
  ('demo@garena.vn', 'Demo Admin', 'super_admin', TRUE),
  ('minhngoc.phamnguyen@garena.vn', 'Minh Ngoc Pham Nguyen', 'super_admin', TRUE)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = TRUE;
