CREATE TABLE IF NOT EXISTS site_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  user_name VARCHAR(255),
  user_team VARCHAR(100),
  user_role VARCHAR(100),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  aspect_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  aspect_feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  additional_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_feedback_created_at ON site_feedback(created_at);
