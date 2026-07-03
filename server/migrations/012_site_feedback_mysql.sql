CREATE TABLE IF NOT EXISTS site_feedback (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  user_name VARCHAR(255),
  user_team VARCHAR(100),
  user_role VARCHAR(100),
  overall_rating INT NOT NULL,
  aspect_ratings JSON NOT NULL,
  aspect_feedback JSON NOT NULL,
  additional_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_site_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
