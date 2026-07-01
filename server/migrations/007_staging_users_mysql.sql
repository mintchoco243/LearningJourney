CREATE TABLE IF NOT EXISTS staging_users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  batch_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  rank VARCHAR(100),
  role VARCHAR(100),
  team VARCHAR(100),
  class_archetype VARCHAR(50),
  learning_formats TEXT,
  weekly_hours VARCHAR(20),
  preferred_trainers TEXT,
  learning_goals TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staging_users_batch FOREIGN KEY (batch_id) REFERENCES data_batches(id) ON DELETE CASCADE
);
