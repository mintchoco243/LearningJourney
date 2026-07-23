-- Conservative title cleanup for legacy catalog suffixes.
-- Only the approved location/brand suffixes are removed; all other titles stay unchanged.

UPDATE courses
SET title = TRIM(REGEXP_REPLACE(title, '\\s*\\((Academy|HN|HCM)\\)\\s*$', ''))
WHERE title REGEXP '\\((Academy|HN|HCM)\\)[[:space:]]*$';
