# Implementation Notes

These notes are intentional constraints for Phase 1. Use the IDs below when
testing or reporting a result that differs from the expected behavior.

## NOTE-001 — No real Google Calendar sync

The Phase 1 success flow confirms the reservation and uses the existing email
flow. It does not create a Google Calendar event. A real Calendar integration
requires OAuth scopes, token storage, event ownership, retry handling, and is
deferred to Phase 2.

## NOTE-002 — External and e-learning registration is not locally verifiable

Outbound registration links are not counted as “Đã đăng ký” because the app has
no callback from the external provider. The button only opens the configured
`registration_url`.

## NOTE-003 — Course skill tags remain JSON for compatibility

Existing `courses.skill_tags` JSON is retained as the course data source. The
new `skill_catalog` table owns labels, icons, colors, and ordering. A future
phase may normalize course skills into a join table.

## NOTE-004 — No notification center or standalone settings page

The header dropdown only exposes actions with working behavior: Profile,
Theme, About, Rating, and Logout. Notification center and standalone Settings
are deferred.

## NOTE-005 — Recommendation fills up to six valid courses

The recommendation service prioritizes focus-skill and HR-recommended courses,
then fills remaining slots from the catalog with courses that still match the
user's exact rank and role/team. It never fills a slot with an inactive, ended,
completed, reserved, or targeting-mismatched course. Fewer than six results are
expected only when the database has insufficient eligible courses.

## NOTE-006 — Course title cleanup is whitelist-based

Only known presentation suffixes such as `(Academy)`, `(HN)`, and `(HCM)` are
removed. Meaningful parentheses must remain. The cleanup must be reviewed on a
staging database before production use.

## NOTE-007 — Legacy skills receive default metadata

Existing skill IDs discovered during migration are inserted into
`skill_catalog` with the ID as their initial label and default visual metadata.
Admin can refine the label, icon, color, and order later.

## NOTE-008 — Quick stat definitions

“Đã học” comes from `enrollments`; “Đã đăng ký” is an active reservation for a
`scheduled` course; “Đặt chỗ” is an active reservation for an `interest` course;
“Yêu thích” comes from `course_favorites`; “Yêu cầu” counts L&D requests with
status `new` or `in_review`.

## NOTE-009 — Empty focus skills are valid

If a user has no `focus_skills`, the Quiz Skill recommendation group is empty.
The system does not infer skills from role or rank.

## NOTE-010 — Baseline CTA regression

The existing course map test currently expects `register` but receives
`material` for a future-dated course carrying an `ended` status. Resolve this
baseline lifecycle rule before treating the new feature tests as green.

## NOTE-011 — Conservative title cleanup

Migration 021 removes only the approved suffixes `(Academy)`, `(HN)`, and
`(HCM)`. Sample affected titles after migration and confirm the whitelist is
still correct for the live catalog.

## NOTE-012 — Existing FAQ copy needs content review

The legacy FAQ seed still contains wording about automatic Google Calendar
sync. Phase 1 does not implement that integration, so update or hide that FAQ
entry in Admin before user acceptance testing.

## Deferred Phase 2 decisions

- Google Calendar OAuth and event creation.
- Tracking external provider registration callbacks.
- Notification center and notification persistence.
- Separate taxonomy tables for Trainer, Rank, Role, and Location.
- Full normalization of JSON course targeting and skill relations.
- Final editorial copy for policy/FAQ content from the approved FGD.
- Advanced recommendation based on learning history and analytics.
