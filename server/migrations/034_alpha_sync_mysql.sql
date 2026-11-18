CREATE TABLE IF NOT EXISTS alpha_knowledge_mappings (
  source_type VARCHAR(20) NOT NULL,
  source_key VARCHAR(255) NOT NULL,
  knowledge_id BIGINT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  folder_id BIGINT NOT NULL,
  remote_status INT NULL,
  last_synced_at TIMESTAMP NULL,
  PRIMARY KEY (source_type, source_key),
  UNIQUE KEY uniq_alpha_knowledge_id (knowledge_id)
);

CREATE TABLE IF NOT EXISTS alpha_sync_runs (
  id CHAR(36) PRIMARY KEY,
  group_name VARCHAR(20) NOT NULL,
  trigger_type VARCHAR(20) NOT NULL,
  started_by VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  snapshot_hash CHAR(64) NOT NULL,
  created_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  error_message VARCHAR(500) NULL,
  INDEX idx_alpha_runs_group_started (group_name, started_at)
);

CREATE TABLE IF NOT EXISTS alpha_sync_run_items (
  run_id CHAR(36) NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  source_key VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  knowledge_id BIGINT NULL,
  error_message VARCHAR(500) NULL,
  PRIMARY KEY (run_id, source_type, source_key),
  INDEX idx_alpha_items_status (run_id, status)
);

CREATE TABLE IF NOT EXISTS alpha_sync_group_locks (
  group_name VARCHAR(20) PRIMARY KEY,
  run_id CHAR(36) NULL,
  locked_at TIMESTAMP NULL
);

INSERT IGNORE INTO alpha_sync_group_locks (group_name) VALUES ('courses'), ('users'), ('guidelines');
