-- Repair deployments where the original onboarding taxonomy was not seeded
-- (or its built-in entries were accidentally disabled).  The quiz submits
-- these stable IDs, so they must always be available to validate preferences.
INSERT INTO skill_catalog (id, label, display_order, is_active) VALUES
  ('foundations', 'Foundations', 10, TRUE),
  ('data', 'Data', 20, TRUE),
  ('communication', 'Communication', 30, TRUE),
  ('product', 'Product', 40, TRUE),
  ('ai', 'AI', 50, TRUE),
  ('analytics', 'Analytics', 60, TRUE),
  ('leadership', 'Leadership', 70, TRUE),
  ('facilitation', 'Facilitation', 80, TRUE),
  ('strategy', 'Strategy', 90, TRUE),
  ('ops_excellence', 'Operations Excellence', 100, TRUE),
  ('mentoring', 'Mentoring', 110, TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;
