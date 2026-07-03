# Course Admin Data Upload List

Use these CSV files to prepare existing data. The admin site remains the source of truth.

## Upload Now

1. `courses-single-source-template.csv`
   - One row = one `courses` row = one learning item.
   - Put schedule fields on the same row. Do not create a separate sessions CSV.

2. `users-template.csv`
   - Import path: Admin Users CSV import.
   - Upload before participants/completions so emails can be matched.
   - `rank` values: `Associate`, `Senior Associate`, `Assistant Manager`, `Manager`, `Senior Manager`.

3. `participants-for-selected-course-template.csv`
   - Import path: Course row action -> Import participants.
   - This file is per course row. Select the exact course row in admin, then upload emails.
   - It records completion/enrollment and adds XP/hours once for that selected row.
   - Do not add `course_code` here; the selected `courses.id` is the target.

4. `policies-template.csv`
   - Import path: Data prep policies CSV, if you want to seed policy content in bulk.

5. `admin-accounts-template.csv`
   - Import path: Data prep admin accounts CSV.
   - Roles currently accepted by data-prep: `super_admin`, `admin`, `editor`.

## Prepare Only, Do Not Upload Yet

6. `optional-reservations-migration.csv`
   - For historical active bookings/demand.
   - There is no safe bulk import UI for reservations yet.
   - If needed later, import must use `course_row_id` -> `reservations.session_id`.

7. `optional-testimonials-migration.csv`
   - For historical reviews/testimonials.
   - Runtime testimonials should normally come from user reviews.
   - If migrated later, use `course_row_id`, not `course_code`.

8. `optional-ld-requests-migration.csv`
   - For historical training requests.
   - Not needed for launch unless you already have backlog requests to preserve.

## Order

1. Courses
2. Users
3. Participants/completions per selected course row
4. Policies/admin accounts if needed
5. Optional migration-only data after we add/confirm safe import paths
