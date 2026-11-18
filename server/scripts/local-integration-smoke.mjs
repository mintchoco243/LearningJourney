import assert from "node:assert/strict";
import { config } from "../config.js";
import { query, pool } from "../db.js";
import { saveSecret, saveSetting } from "../lib/integrationSecrets.js";
import { syncGigiBudget, budgetForEmail } from "../services/gigiBudget.js";
import { planAlphaSync, startAlphaSync } from "../services/alphaKnowledgeSync.js";

const database = new URL(config.databaseUrl);
assert.equal(database.hostname, "127.0.0.1", "Local smoke test requires a loopback database");
assert.equal(database.pathname, "/lc_local_integration_test", "Local smoke test requires the isolated test schema");

const userId = "11111111-1111-4111-8111-111111111111";
const courseId = "22222222-2222-4222-8222-222222222222";
const email = "budget-smoke@garena.vn";
const filename = "user-budget-smoke-garena-vn.md";
const year = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));
let uploads = 0;
let uploadedMarkdown = "";
let uploadedKnowledgeId = "";
const remote = {
  folders: [
    { id: 4571, name: "Course" },
    { id: 4572, name: "Users" },
    { id: 4593, name: "Guideline" },
  ],
  knowledges: [{ id: 999, name: filename, folderId: 4572, status: 2, tags: [] }],
};

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(input);
  if (url.hostname === "gigi.garena.vn") {
    assert.equal(options.headers["Client-ID"], "local-gigi-test-key");
    assert.equal(url.searchParams.get("form_ids"), "46");
    return Response.json({ status: "successful", payload: { tickets: [
      { id: 81001, email, form_id: 46, status: "closed", create_time: `${year}-02-01 09:00:00`, form_data: { courseFee: 3000000, courseCurrency: "VND", docFee: 1000000, docCurrency: "VND" } },
      { id: 81002, email, form_id: 46, status: "approving", create_time: `${year}-05-02 09:00:00`, form_data: { courseFee: 2000000, courseCurrency: "VND" } },
    ], limit: 100, offset: 0, has_more: false } });
  }
  assert.equal(url.hostname, "knowledge.alpha.insea.io");
  if (options.method === "POST") {
    uploads++;
    uploadedKnowledgeId = options.body.get("knowledgeId");
    uploadedMarkdown = await options.body.get("file").text();
    return Response.json({ knowledge: { id: 999 } });
  }
  if (url.pathname.endsWith("/folders")) return Response.json({ folders: remote.folders });
  if (url.pathname.endsWith("/knowledges")) return Response.json({ knowledges: remote.knowledges });
  throw new Error(`Unexpected local test request: ${url.pathname}`);
};

try {
  await query("INSERT INTO users (id, email, full_name, is_active, onboarding_done) VALUES ($1,$2,$3,TRUE,TRUE) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), onboarding_done=TRUE", [userId, email, "Local Budget Test"]);
  await query("INSERT INTO admin_accounts (email, full_name, role, is_active) VALUES ($1,$2,'super_admin',TRUE) ON DUPLICATE KEY UPDATE role='super_admin', is_active=TRUE", [email, "Local Budget Test"]);
  await query("INSERT INTO courses (id, course_code, title, trainer, format, duration_hours, type, is_active, status) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8) ON DUPLICATE KEY UPDATE title=VALUES(title)", [courseId, "TEST-46", "Local Course", "Local Trainer", "online", 2, "elearning", "open"]);
  await query("INSERT INTO enrollments (id, user_id, course_id, source, xp_earned, hours_earned) VALUES ($1,$2,$3,$4,$5,$6) ON DUPLICATE KEY UPDATE xp_earned=VALUES(xp_earned)", ["33333333-3333-4333-8333-333333333333", userId, courseId, "manual", 10, 2]);
  await query("INSERT INTO testimonials (id, user_id, course_id, rating, content) VALUES ($1,$2,$3,$4,$5) ON DUPLICATE KEY UPDATE content=VALUES(content)", ["44444444-4444-4444-8444-444444444444", userId, courseId, 5, "Local review"]);
  await query("DELETE FROM alpha_knowledge_mappings WHERE source_type='users' AND source_key=$1", [userId]);
  await saveSecret("gigi_client_key", "local-gigi-test-key");
  await saveSecret("alpha_sync_api_key", "local-alpha-test-key");
  await saveSetting("alpha_sync_expert_id", "local-expert");

  const sync = await syncGigiBudget();
  assert.equal(sync.status, "success");
  const budget = await budgetForEmail(email);
  assert.equal(budget.usedVnd, 6000000);
  assert.equal(budget.pendingVnd, 2000000);
  assert.equal(budget.remainingVnd, 14000000);
  assert.match(budget.fetchedAt, /Z$/);

  const preview = await planAlphaSync("users");
  const item = preview.items.find((row) => row.sourceKey === userId);
  assert.equal(item.action, "update");
  assert.equal(item.knowledgeId, 999);
  const run = await startAlphaSync("users", preview.snapshotHash, "local-smoke", { onlyKeys: [userId] });
  let state;
  for (let i = 0; i < 50; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    state = (await query("SELECT status, updated_count, error_message FROM alpha_sync_runs WHERE id=$1", [run.runId])).rows[0];
    if (state?.status === "success" || state?.status === "error") break;
  }
  assert.equal(state?.status, "success", state?.error_message || "Alpha run did not finish");
  assert.equal(Number(state.updated_count), 1);
  assert.equal(uploads, 1);
  assert.equal(uploadedKnowledgeId, "999");
  assert.match(uploadedMarkdown, /Local Course/);
  assert.match(uploadedMarkdown, /Local review/);
  assert.match(uploadedMarkdown, /Còn lại \(VNĐ\): 14000000/);
  assert.equal((await planAlphaSync("users")).items.find((row) => row.sourceKey === userId).action, "skip");
  console.log("Local GiGi → budget → Alpha update smoke test passed (no external API calls)");
} finally {
  await query("DELETE FROM app_settings WHERE setting_key IN ('gigi_client_key','alpha_sync_api_key','alpha_sync_expert_id')");
  await query("DELETE FROM alpha_sync_run_items");
  await query("DELETE FROM alpha_sync_runs");
  await query("UPDATE alpha_sync_group_locks SET run_id=NULL, locked_at=NULL");
  await query("DELETE FROM alpha_knowledge_mappings WHERE source_type='users' AND source_key=$1", [userId]);
  await pool.end();
}
