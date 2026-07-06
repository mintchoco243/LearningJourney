ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS aspect_ratings JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS applied_learning TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS improvement_feedback TEXT;
