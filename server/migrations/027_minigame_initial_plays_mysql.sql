-- New campaign participants start with three free plays.
UPDATE users
SET minigame_plays = 3
WHERE minigame_total_runs = 0
  AND minigame_high_score = 0
  AND minigame_plays = 5;
