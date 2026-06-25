CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  `rank` VARCHAR(100),
  `role` VARCHAR(100),
  class_archetype VARCHAR(50),
  learning_formats JSON,
  weekly_hours VARCHAR(20),
  preferred_trainers JSON,
  learning_goals TEXT,
  xp_total INT DEFAULT 0,
  hours_total DECIMAL(6,1) DEFAULT 0,
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  trainer VARCHAR(255) NOT NULL,
  trainer_type VARCHAR(20) DEFAULT 'internal',
  format VARCHAR(50) NOT NULL,
  duration_hours DECIMAL(5,1) NOT NULL,
  skill_tags JSON,
  rank_targets JSON,
  role_targets JSON,
  rating DECIMAL(3,1) DEFAULT 0,
  enrolled_count INT DEFAULT 0,
  type VARCHAR(20) NOT NULL,
  min_participants INT,
  registration_url TEXT,
  description TEXT,
  xp_reward INT NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  course_id VARCHAR(20) NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME,
  location VARCHAR(255),
  max_participants INT,
  current_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  course_id VARCHAR(20) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(20) NOT NULL,
  xp_earned INT NOT NULL,
  hours_earned DECIMAL(5,1) NOT NULL,
  UNIQUE KEY uniq_enrollment (user_id, course_id),
  CONSTRAINT fk_enroll_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  session_id CHAR(36) NOT NULL,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  notified_at TIMESTAMP NULL,
  UNIQUE KEY uniq_reservation (user_id, session_id),
  CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_session FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS testimonials (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  course_id VARCHAR(20) NOT NULL,
  user_id CHAR(36) NOT NULL,
  rating INT NOT NULL,
  content TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_test_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ld_requests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  skills_needed JSON,
  description TEXT NOT NULL,
  preferred_formats JSON,
  weekly_hours VARCHAR(20),
  preferred_trainers TEXT,
  other_notes TEXT,
  status VARCHAR(20) DEFAULT 'new',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ld_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS policies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source_file VARCHAR(255),
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_accounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  `role` VARCHAR(50) NOT NULL DEFAULT 'ld_admin',
  is_active BOOLEAN DEFAULT TRUE,
  added_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
