CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES
  ('alpha_base_url', 'https://knowledge.alpha.insea.io/api/'),
  ('alpha_api_key', ''),
  ('alpha_expert_id', '');
