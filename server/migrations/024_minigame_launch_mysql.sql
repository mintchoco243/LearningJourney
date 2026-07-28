ALTER TABLE users ADD COLUMN minigame_high_score INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN minigame_total_runs INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN minigame_plays INT NOT NULL DEFAULT 3;
ALTER TABLE users ADD COLUMN minigame_last_played_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN minigame_suspicious BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN minigame_task_claims JSON NULL;
ALTER TABLE users ADD COLUMN minigame_test_high_score INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN minigame_test_total_runs INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN minigame_test_plays INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN minigame_test_task_claims JSON NULL;

CREATE TABLE IF NOT EXISTS minigame_runs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  mode VARCHAR(20) NOT NULL DEFAULT 'production',
  run_token_hash CHAR(64) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_minigame_run_token (run_token_hash),
  KEY idx_minigame_runs_user (user_id, mode, created_at),
  CONSTRAINT fk_minigame_runs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES
  ('minigame_enabled', 'false'),
  ('minigame_started_at', ''),
  ('minigame_ended_at', '');
