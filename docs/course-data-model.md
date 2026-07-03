# Course Data Model

Runtime invariant: one row in `courses` is one learning item.

That item can be a scheduled class, an interest/demand pool, an e-learning item,
an external course, or material/recording. Do not split runtime data back into a
course master table plus a session table.

## Identity

- `courses.id` is the only action identity for reserve, complete, import,
  testimonial, attendee list, and confirm.
- `course_code` may repeat. Use it only for display, grouping, search, and human
  reporting.
- `session_date` is an optional schedule field on the row. It is not an entity
  boundary.

## Transaction Tables

- `reservations.session_id` points to `courses.id`.
- `enrollments.course_id` points to `courses.id`.
- `testimonials.course_id` points to `courses.id`.

Counts shown in admin should come from these transaction tables or be refreshed
from them after writes:

- `current_count` from non-cancelled reservations.
- `enrolled_count` from enrollments.

## Allowed Views

- `/api/courses` and `/admin/api/courses` are the course source of truth.
- `/api/sessions` is only a calendar/upcoming filtered view of `courses` rows
  with `session_date`.

## Forbidden Patterns

- Do not use `session_date IS NULL` as the course list.
- Do not clone a course row just to schedule it unless the product explicitly
  adds a split-class workflow.
- Do not use `course_code` for update, delete, complete, reserve, import, or
  review actions.

## Examples

- E-learning: `type=elearning`, no date, user can learn/complete the row.
- Scheduled class: `type=scheduled`, has date/time/location, user reserves and
  completes that row.
- Repeated class: two rows can share `course_code`; each row is completed
  independently.
- Interest pool: `type=interest`, no date while collecting demand. Admin later
  edits the same row to add date/time/location and confirms the class.
