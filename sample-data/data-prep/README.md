# Data Prep Sample Upload Set

Use these CSV files in Admin Data Prep to test import, validate, promote, and
rollback paths. Course and session data is now unified in `catalog`; do not use
the legacy split `courses` + `sessions` flow for upload testing.

Suggested order:

1. `admin-accounts-full-cases.csv`
2. `users-full-cases.csv`
3. `policies-full-cases.csv`
4. `catalog-full-cases.csv`

Coverage:

- active and inactive records
- all current course statuses: `draft`, `open`, `full`, `ended`, `cancelled`
- all current course types: `scheduled`, `interest`, `elearning`, `external`,
  `material_only`
- all current formats: `online`, `offline`, `elearning`, `webinar`, `workshop`,
  `bootcamp`, `talk`
- repeated `course_code` for multi-session courses
- catalog-only courses with no session date
- scheduled rows with full/open/cancelled course status coverage
- admin roles: `super_admin`, `admin`, `editor`
