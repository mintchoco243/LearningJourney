-- New players start at zero. Plays are earned through login and mission rewards.
ALTER TABLE users ALTER COLUMN minigame_plays SET DEFAULT 0;

-- Preserve active participants while correcting untouched accounts created with
-- the previous three-play default.
UPDATE users
SET minigame_plays = 0
WHERE minigame_total_runs = 0
  AND minigame_high_score = 0
  AND minigame_plays = 3
  AND minigame_task_claims IS NULL;
