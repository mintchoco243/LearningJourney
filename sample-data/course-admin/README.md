# Course Admin Data Template

This folder is for preparing row-level course data while the admin site remains the source of truth.

Important invariant:
- One CSV row = one `courses` row = one learning item.
- `course_code` may repeat and is only for display/grouping.
- The database `courses.id` is the only action identity for reserve/complete/import/review.
- Do not split data back into separate course master and session files.

Use `courses-single-source-template.csv` as the quick CSV sample.
Use `courses-single-source-template.xlsx` for easier editing with option lists.

Data notes:
- `type=interest` can leave `session_date`, `session_time`, and `location` blank.
- `type=scheduled` may have a date/time/location, but draft future rows can be filled later in admin.
- `type=elearning` and `type=material_only` usually do not need booking fields.
- `rank_targets` should use normal rank names: `Associate`, `Senior Associate`, `Assistant Manager`, `Manager`, `Senior Manager`; not internal ids like `rank_01`.
- `current_count` and `enrolled_count` are not input fields. The app calculates them from reservations/enrollments.
- Avoid changing meaning by reusing the same row after users have booked/completed it; edit details, but do not repurpose it into a different course.
