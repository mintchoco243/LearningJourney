-- Keep existing course skill_tags untouched while making the shared taxonomy
-- available to onboarding, filters, admin forms and API validation.
INSERT INTO skill_catalog (id, label, display_order, is_active) VALUES
  ('it_dev', 'IT / Dev', 10, TRUE),
  ('game_dev_game_design', 'Game Dev & Game Design', 20, TRUE),
  ('people', 'People', 30, TRUE),
  ('product', 'Product', 40, TRUE),
  ('marketing_esports', 'Marketing & Esports', 50, TRUE),
  ('creative', 'Creative', 60, TRUE),
  ('data_ba', 'Data / BA', 70, TRUE),
  ('management', 'Management', 80, TRUE),
  ('communication', 'Communication', 90, TRUE),
  ('problem_solving', 'Problem Solving', 100, TRUE),
  ('language', 'Language', 110, TRUE),
  ('ai_adoption', 'AI Adoption', 120, TRUE),
  ('other', 'Other', 130, TRUE)
ON DUPLICATE KEY UPDATE label = VALUES(label), display_order = VALUES(display_order), is_active = TRUE;
