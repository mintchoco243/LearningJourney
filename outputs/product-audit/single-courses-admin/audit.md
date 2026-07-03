# Single Courses Admin UI Audit

Date: 2026-07-03

Scope: Admin "Khoa hoc" screen after consolidating courses/sessions into one row-level course model.

Evidence:
- `npm run check` passed.
- `npm --prefix frontend run lint` passed.
- `npm --prefix frontend run build` passed.
- `node frontend/src/lib/courseMap.test.mjs` passed.
- `http://localhost:3000/admin` returned HTTP 200 from the built frontend.

Visual capture note:
- In-app browser and local Playwright capture were attempted, but browser automation timed out while the admin page waited on missing backend APIs.
- The root server could not start locally because root dependencies are not installed in this checkout (`cookie-parser` missing).
- No new dependency was installed just for screenshots.

Findings:
- Pass: The admin navigation no longer exposes an independent "Lich hoc" page; legacy `sessions` navigation is redirected to `courses`.
- Pass: `CoursesScreen` is now the owner for row actions: edit, safe delete, attendee list, confirm opening class, and import participants.
- Pass: The courses table includes row-level booking and completion counts so admin can see demand and completed learners from the same screen.
- Pass: The import modal targets a course row id and locks the row when opened from a row action.
- Pass: User course mapping uses `courses.id` as action identity; `course_code` remains display/grouping only.
- Risk: Without backend running, full modal visual QA and API-backed attendee data could not be screenshot-tested in this run.
- Risk: Existing mojibake in admin copy makes future text-based patches harder; avoid broad copy refactors unless the app copy itself is being cleaned.

Ponytail decision:
- No extra UI route, no Google Sheet sync, no new API layer, and no screenshot dependency were added.
