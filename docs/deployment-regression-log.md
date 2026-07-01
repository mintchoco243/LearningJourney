# Deployment Regression Log

## 2026-07-01 - MySQL migration 008 failed on orphan reservations

Project: `cmqud20bj2l7pgc3g4p20ocdm`

Deploy failed while running `008_merge_courses_sessions_mysql.sql`.

Error:

```text
ER_NO_REFERENCED_ROW_2: Cannot add or update a child row
CONSTRAINT fk_res_session FOREIGN KEY (session_id) REFERENCES courses_new(id)
```

Root cause:

Old `reservations.session_id` rows pointed at sessions that were not copied into
`courses_new`, so MySQL refused to add `fk_res_session`.

Permanent guard:

- `server/migrate.js` deletes orphan reservations before adding `fk_res_session`.
- `server/scripts/smoke-check.js` fails if that cleanup no longer appears before
  the FK creation.
- `server/migrations/008_merge_courses_sessions_mysql.sql` documents the deploy
  failure beside the FK step.

