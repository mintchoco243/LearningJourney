CREATE TABLE IF NOT EXISTS gigi_budget_tickets (
  ticket_id BIGINT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ticket_year SMALLINT NOT NULL,
  status VARCHAR(40) NOT NULL,
  amount_vnd BIGINT NULL,
  amount_text VARCHAR(500) NULL,
  amount_source VARCHAR(40) NULL,
  source_missing BOOLEAN NOT NULL DEFAULT FALSE,
  created_at_source VARCHAR(32) NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gigi_budget_user_year (email, ticket_year)
);

CREATE TABLE IF NOT EXISTS gigi_budget_sync (
  id TINYINT PRIMARY KEY,
  status VARCHAR(30) NOT NULL DEFAULT 'never',
  started_at TIMESTAMP NULL,
  succeeded_at TIMESTAMP NULL,
  ticket_count INT NOT NULL DEFAULT 0,
  error_message VARCHAR(255) NULL
);

INSERT IGNORE INTO gigi_budget_sync (id) VALUES (1);
