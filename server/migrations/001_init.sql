CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  rank VARCHAR(100),
  role VARCHAR(100),
  class_archetype VARCHAR(50),
  learning_formats TEXT[] DEFAULT '{}',
  weekly_hours VARCHAR(20),
  preferred_trainers TEXT[] DEFAULT '{}',
  learning_goals TEXT,
  xp_total INTEGER DEFAULT 0,
  hours_total NUMERIC(6,1) DEFAULT 0,
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  trainer VARCHAR(255) NOT NULL,
  trainer_type VARCHAR(20) DEFAULT 'internal',
  format VARCHAR(50) NOT NULL,
  duration_hours NUMERIC(5,1) NOT NULL,
  skill_tags TEXT[] DEFAULT '{}',
  rank_targets TEXT[] DEFAULT '{}',
  role_targets TEXT[] DEFAULT '{}',
  rating NUMERIC(3,1) DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,
  type VARCHAR(20) NOT NULL,
  min_participants INTEGER,
  registration_url TEXT,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(20) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME,
  location VARCHAR(255),
  max_participants INTEGER,
  current_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR(20) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(20) NOT NULL,
  xp_earned INTEGER NOT NULL,
  hours_earned NUMERIC(5,1) NOT NULL,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  notified_at TIMESTAMPTZ,
  UNIQUE (user_id, session_id)
);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(20) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ld_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skills_needed TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  preferred_formats TEXT[] DEFAULT '{}',
  weekly_hours VARCHAR(20),
  preferred_trainers TEXT,
  other_notes TEXT,
  status VARCHAR(20) DEFAULT 'new',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source_file VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'ld_admin',
  is_active BOOLEAN DEFAULT TRUE,
  added_by UUID REFERENCES admin_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin (
  to_tsvector('simple', title || ' ' || trainer || ' ' || COALESCE(description, ''))
);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date ON course_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
