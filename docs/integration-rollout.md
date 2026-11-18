# GiGi budget and Alpha Knowledge rollout

## What is implemented

- Admin → Cấu hình Hệ thống → GiGi Form 46: enter/replace the `Client-ID` key, check access, and refresh tickets. There is no manual money or cap override.
- Dashboard hero: `Learning Budget Sponsor - {year}` above a compact remaining/used bar. Exact used amount, annual cap, pending, and last update appear in the tooltip. A missing or incomplete source does not display a fabricated zero balance.
- Admin → Cấu hình Hệ thống → Alpha Knowledge Sync: separate Expert ID and key from the Bot connection. The first use copies the existing server Alpha credential into the new encrypted setting when no dedicated sync credential exists.
- Admin → Alpha Knowledge Sync: connection check, Create/Update/Skip preview, manual sync, run history, failed item retry, and per-group automatic schedule switches.
- Existing Alpha files are matched by saved Knowledge ID, exact filename, or the stable `lc-user-{id}` tag. Updates include `knowledgeId`; duplicate matches stop the run.

## Deployment sequence

1. Keep a stable `JWT_SECRET` or set a stable `INTEGRATION_ENCRYPTION_KEY` on the server. Changing the encryption secret later makes saved integration keys unreadable unless they are re-entered.
2. Apply migrations `033_gigi_budget_mysql.sql` and `034_alpha_sync_mysql.sql`. Normal production `prestart` runs pending migrations. Check migration history before opening the new Admin pages.
3. In Admin → Cấu hình Hệ thống → GiGi Form 46, enter a key with **Form 46** access. Check the connection, then run **Cập nhật budget ngay**. A successful empty response cannot prove Form 46 access, so the sync refuses to replace balances with zero when no Form 46 ticket is returned.
4. The user chose to total the cost fields from Form 46 tickets created in the current calendar year. The ticket-list S2S key works for this. `courseFee` and `docFee` are counted only with explicit VND currency and numeric values; recommendation prose is ignored. GiGi's `submited`, `approving`, `processing`, and `closed` statuses count toward the used total. `submited` and `approving` also appear as the pending subset in the tooltip. A missing or foreign-currency cost makes only that employee's remaining balance unavailable.
5. Open Alpha Knowledge Sync. Preview each group and check the Alpha ID on every Update row. Run one manual sync for Courses, Guidelines, then Users. Users require a successful GiGi snapshot unless an admin explicitly opts into the last snapshot.
6. Once manual runs are Ready, enable the automatic schedule for each group. At 09:00 Vietnam time each day, the server refreshes GiGi first and then checks Alpha Courses, Users, and Guidelines. Only changed content uploads. The server also catches up after a restart later in the day.

## Current limits and decisions

- GiGi has no webhook or ticket update timestamp in the supplied API. Full Form 46 scans run daily at 09:00 Vietnam time and use two passes to detect unstable offset pagination.
- The ticket year currently follows `create_time`. L&D should confirm how year-end tickets are allocated.
- The 20,000,000 VND cap is a configurable yearly default (`learning_budget_cap_{year}` in `app_settings`). There is no per-user cap override.
- GiGi's own Form 46 screen calls a separate session-only budget API. In one read-only comparison, the three current-year ticket costs (including two `approving` tickets) totaled 10.1 million VND, matching the screen's 9.9 million VND remaining from the 20 million VND cap. This validates the chosen rule for that sample, not every employee. Check more employees after deployment.
- Source records that disappear from GiGi are not automatically deleted from the local snapshot. L&D should investigate missing records rather than silently reducing used budget.
- A read-only GiGi Form 46 API fetch was performed with a temporary key supplied in chat. No real key was saved in the repository. No live Alpha upload was performed.

## Local verification on 18 November 2026

- The isolated worktree uses a separate `lc_local_integration_test` MariaDB schema on this computer. Its `.env` is ignored by Git. Do not copy the main workspace `.env` into this worktree: that file points to a shared database.
- `node server/scripts/local-integration-smoke.mjs` tests GiGi ticket ingestion, annual budget math, course and testimonial joins, adoption of an existing Alpha Knowledge ID, and a second preview that skips unchanged content. The script intercepts both external APIs and refuses to run unless the database is `127.0.0.1/lc_local_integration_test`.
- The smoke script removes its dummy integration keys and Alpha mapping when finished. It leaves a local sample account and budget snapshot for UI review.
- The local frontend and backend run with `npm run dev`; the sample account is `budget-smoke@garena.vn`. The local profile showed 14 million VND remaining, 6 million used, 2 million pending, and the correct Vietnam update time.
- Focused tests: 11 passed. Frontend production build: passed. Real GiGi and Alpha writes still require a separate, explicit live rollout after review.
