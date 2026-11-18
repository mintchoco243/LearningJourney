import crypto from "node:crypto";
import { query } from "../db.js";
import { getSecret, getSetting, saveSetting, saveSecret } from "../lib/integrationSecrets.js";
import { budgetForEmail } from "./gigiBudget.js";
import { wasCheckedToday } from "../lib/vietnamDailySchedule.js";

const FOLDERS = { courses: { id: 4571, name: "Course" }, users: { id: 4572, name: "Users" }, guidelines: { id: 4593, name: "Guideline" } };
const BASE_URL = "https://learningcompass.garena.vn";
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const md5 = (text) => crypto.createHash("md5").update(text).digest("hex");
const oneLine = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = (value) => {
  if (Array.isArray(value)) return value;
  try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } catch {}
  return value ? String(value).split(",").map((v) => v.trim()).filter(Boolean) : [];
};
const safeSlug = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const line = (key, value) => `- ${key}: ${oneLine(value) || "Chưa có"}`;
const bullets = (items) => items.length ? items.map((item) => `- ${oneLine(item)}`).join("\n") : "- Chưa có";

async function alphaConfig() {
  const legacyKey = await getSecret("alpha_api_key", process.env.ALPHA_KNOWLEDGE_API_KEY || "");
  const legacyExpertId = await getSetting("alpha_expert_id", "");
  const [baseUrl, expertId, key] = await Promise.all([
    getSetting("alpha_sync_base_url", "https://knowledge.alpha.insea.io/api/"),
    getSetting("alpha_sync_expert_id", process.env.ALPHA_SYNC_EXPERT_ID || legacyExpertId || process.env.ALPHA_KNOWLEDGE_EXPERT_ID || ""),
    getSecret("alpha_sync_api_key", process.env.ALPHA_SYNC_API_KEY || legacyKey),
  ]);
  if (!expertId || !key) throw new Error("ALPHA_SYNC_NOT_CONFIGURED");
  if (!await getSetting("alpha_sync_api_key", "")) {
    await saveSecret("alpha_sync_api_key", key);
    await saveSetting("alpha_sync_expert_id", expertId);
  }
  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || base.hostname !== "knowledge.alpha.insea.io") throw new Error("ALPHA_SYNC_URL_NOT_ALLOWED");
  return { baseUrl: `${base.origin}${base.pathname.replace(/\/?$/, "/")}`, expertId, key };
}

async function alphaRequest(config, path, options = {}) {
  const response = await fetch(`${config.baseUrl}experts/${encodeURIComponent(config.expertId)}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${config.key}`, ...options.headers },
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`ALPHA_HTTP_${response.status}`);
  return body;
}

async function remoteInventory(config) {
  const [folders, knowledges] = await Promise.all([
    alphaRequest(config, "/folders"), alphaRequest(config, "/knowledges"),
  ]);
  if (!Array.isArray(folders?.folders) || !Array.isArray(knowledges?.knowledges)) throw new Error("ALPHA_INVENTORY_INVALID");
  return { folders: folders.folders, knowledges: knowledges.knowledges };
}

export async function checkAlphaSyncConnection() {
  const config = await alphaConfig();
  const remote = await remoteInventory(config);
  const folderStatus = Object.fromEntries(Object.entries(FOLDERS).map(([group, folder]) => [group, remote.folders.some((item) => Number(item.id) === folder.id && item.name === folder.name)]));
  return { connected: true, expertId: String(config.expertId), folderStatus, remoteCount: remote.knowledges.length };
}

function courseDocument(course) {
  const id = String(course.id);
  const filename = `course-${id}.md`;
  const tags = ["learning-compass", "course", `course-${safeSlug(id)}`, `format-${safeSlug(course.format)}`, ...list(course.skill_tags).map((tag) => `skill-${safeSlug(tag)}`)];
  const url = `${BASE_URL}/library?courseId=${encodeURIComponent(id)}`;
  const markdown = [`# ${oneLine(course.title)}`, "", line("Course ID", id), line("Course code", course.course_code), line("Loại", course.type), line("Hình thức", course.format), line("Trainer", course.trainer), line("Loại trainer", course.trainer_type), line("Thời lượng (giờ)", course.duration_hours), line("Kỹ năng", list(course.skill_tags).join(", ")), line("Rank", list(course.rank_targets).join(", ")), line("Role", list(course.role_targets).join(", ")), line("XP", course.xp_reward), line("Trạng thái", course.status), line("Ngày học", course.session_date), line("Giờ học", course.session_time), line("Địa điểm", course.location), line("Số chỗ", course.max_participants), line("Đã đăng ký", course.current_count), line("Tài liệu", course.material_url), line("Tham khảo", course.reference_url), line("Đăng ký", course.registration_url), line("Cập nhật", course.updated_at), line("Learning Compass", url), "", "## Mô tả", "", oneLine(course.description) || "Chưa có mô tả", ""].join("\n");
  return { sourceType: "courses", sourceKey: id, displayName: oneLine(course.title), filename, tags, citationURL: url, citationTitle: oneLine(course.title), markdown, updatedAt: course.updated_at };
}

async function userDocuments(users) {
  const [enrollments, favorites, reservations, requests, testimonials] = await Promise.all([
    query("SELECT e.user_id, e.completed_at, c.title, c.id AS course_id FROM enrollments e JOIN courses c ON c.id=e.course_id AND c.session_date IS NULL"),
    query("SELECT f.user_id, c.title FROM course_favorites f JOIN courses c ON c.id=f.course_id"),
    query("SELECT r.user_id, r.status, c.title FROM reservations r JOIN courses c ON c.id=r.session_id"),
    query("SELECT user_id, skills_needed, description, status FROM ld_requests"),
    query("SELECT t.user_id, t.rating, t.content, c.title FROM testimonials t JOIN courses c ON c.id=t.course_id AND c.session_date IS NULL"),
  ]);
  const byUser = (rows) => {
    const result = new Map();
    for (const row of rows) result.set(row.user_id, [...(result.get(row.user_id) || []), row]);
    return result;
  };
  const e = byUser(enrollments.rows), f = byUser(favorites.rows), r = byUser(reservations.rows), l = byUser(requests.rows), t = byUser(testimonials.rows);
  const documents = [];
  for (const user of users) {
    const email = String(user.email).trim().toLowerCase();
    const budget = await budgetForEmail(email);
    const filename = `user-${safeSlug(email)}.md`;
    const tags = ["user-profile", "learning-compass-user", `lc-user-${user.id}`, `email-${safeSlug(email)}`];
    for (const [name, value] of [["team", user.team], ["rank", user.rank], ["role", user.role]]) if (value) tags.push(`${name}-${safeSlug(value)}`);
    const markdown = [
      `# Hồ sơ học tập: ${oneLine(user.full_name)}`, "",
      line("Email định danh", email), line("Khóa tra cứu email", email), line("Khóa tra cứu tên", user.full_name), line("Learning Compass user ID", user.id),
      "", "## Hồ sơ", "", line("Team", user.team), line("Rank", user.rank), line("Role", user.role), line("Kỹ năng ưu tiên", list(user.focus_skills).join(", ")), line("Hình thức học", list(user.learning_formats).join(", ")), line("Mục tiêu học", user.learning_goals),
      "", "## Learning Budget Sponsor", "", line("Năm", budget.year), line("Hạn mức năm (VNĐ)", budget.capVnd), line("Tổng chi phí Form 46 (gồm đang chờ duyệt, VNĐ)", budget.usedVnd), line("Trong đó đang chờ duyệt (VNĐ)", budget.pendingVnd), line("Còn lại (VNĐ)", budget.remainingVnd), line("Ticket cần kiểm tra", budget.unresolvedTickets), line("Nguồn", "GiGi Form 46"), line("Tình trạng nguồn", budget.sourceStatus), line("Fetched at", budget.fetchedAt),
      "", "### Ticket Form 46", "", bullets((budget.tickets || []).map((x) => `#${x.id}: ${x.status}, ${x.amountVnd ?? "chưa xác định"} VNĐ, tạo ${x.createdAt}`)),
      "", "## Khóa học đã hoàn thành", "", bullets((e.get(user.id) || []).map((x) => `${x.title} (${x.completed_at})`)),
      "", "## Khóa học yêu thích", "", bullets((f.get(user.id) || []).map((x) => x.title)),
      "", "## Đăng ký và giữ chỗ", "", bullets((r.get(user.id) || []).map((x) => `${x.title} (${x.status})`)),
      "", "## Nhu cầu L&D", "", bullets((l.get(user.id) || []).map((x) => `${x.description} (${x.status})`)),
      "", "## Đánh giá khóa học", "", bullets((t.get(user.id) || []).map((x) => `${x.title}: ${x.rating}/5 — ${x.content || ""}`)),
      "", "## Nguyên tắc dùng hồ sơ cho bot", "", "Chỉ dùng hồ sơ cho nhân viên đã được xác thực đúng email. Không tự đoán số tiền sponsor.", "",
    ].join("\n");
    documents.push({ sourceType: "users", sourceKey: String(user.id), displayName: email, filename, tags, citationURL: BASE_URL, citationTitle: `Hồ sơ học tập ${user.full_name}`, markdown, updatedAt: user.updated_at });
  }
  return documents;
}

function guidelineDocument() {
  const markdown = `# Hướng dẫn hỗ trợ Form 46\n\nBot giúp nhân viên tìm và nghiên cứu khóa học, chuẩn bị nội dung Form 46. Hỏi nhân viên để viết mục tiêu SMART gồm Specific, Measurable, Achievable, Relevant, Time-bound. Hỏi và viết phần hiệu quả dự kiến. Cho nhân viên xác nhận trước khi tạo bản copy-paste cuối. Không tự đoán giá, lịch học, chứng chỉ, tỷ giá hoặc số tiền sponsor. Không điền các trường nội bộ của L&D.\n`;
  return { sourceType: "guidelines", sourceKey: "gigi-form46-course-prefill", displayName: "Hướng dẫn Form 46", filename: "gigi-form46-course-prefill.md", tags: ["guideline", "gigi-form-46", "bot-instruction", "training-sponsor"], citationURL: "https://gigi.garena.vn/form/46", citationTitle: "Form 46", markdown, updatedAt: "2026-11-17" };
}

async function sourceDocuments(group, allowStale = false) {
  if (group === "courses") {
    const rows = await query("SELECT * FROM courses WHERE is_active=TRUE AND status NOT IN ('draft','cancelled') ORDER BY id");
    return rows.rows.map(courseDocument);
  }
  if (group === "guidelines") return [guidelineDocument()];
  if (group === "users") {
    const state = await query("SELECT status, succeeded_at FROM gigi_budget_sync WHERE id=1");
    if (!state.rows[0]?.succeeded_at || (state.rows[0]?.status !== "success" && !allowStale)) throw new Error("GIGI_BUDGET_UNAVAILABLE_FOR_USERS");
    const rows = await query("SELECT * FROM users WHERE is_active=TRUE AND user_type='staff' ORDER BY id");
    return userDocuments(rows.rows);
  }
  throw new Error("INVALID_SYNC_GROUP");
}

export function findRemote(document, remoteRows, mapping) {
  const identityTags = document.sourceType === "users"
    ? [`lc-user-${document.sourceKey}`, ...document.tags?.filter((tag) => tag.startsWith("email-")) || []]
    : document.sourceType === "courses" ? [`course-${safeSlug(document.sourceKey)}`] : [];
  const matches = remoteRows.filter((item) => item.name === document.filename || identityTags.some((tag) => item.tags?.includes(tag)));
  if (matches.length > 1) return { conflict: "DUPLICATE_REMOTE_DOCUMENTS" };
  if (mapping?.knowledge_id) {
    const mapped = remoteRows.find((item) => Number(item.id) === Number(mapping.knowledge_id));
    if (mapped) {
      if (matches.length && Number(matches[0].id) !== Number(mapped.id)) return { conflict: "DUPLICATE_REMOTE_DOCUMENTS" };
      return { item: mapped };
    }
    if (!matches.length) return { conflict: "MAPPED_REMOTE_MISSING" };
  }
  return { item: matches[0] || null };
}

export async function planAlphaSync(group, { allowStale = false } = {}) {
  const folder = FOLDERS[group];
  if (!folder) throw new Error("INVALID_SYNC_GROUP");
  const config = await alphaConfig();
  const [remote, documents, mappings] = await Promise.all([
    remoteInventory(config), sourceDocuments(group, allowStale), query("SELECT * FROM alpha_knowledge_mappings WHERE source_type=$1", [group]),
  ]);
  if (!remote.folders.some((item) => Number(item.id) === folder.id && item.name === folder.name)) throw new Error(`ALPHA_FOLDER_${folder.name}_MISSING`);
  const map = new Map(mappings.rows.map((item) => [item.source_key, item]));
  const items = documents.map((document) => {
    // Fetched-at alone must not re-upload every user after each GiGi poll.
    const stableMarkdown = document.markdown.replace(/^- Fetched at:.*$/m, "- Fetched at:");
    const hash = sha256(stableMarkdown);
    const match = findRemote(document, remote.knowledges, map.get(document.sourceKey));
    const remoteItem = match.item;
    const same = map.get(document.sourceKey)?.content_hash === hash || (!map.get(document.sourceKey) && remoteItem?.fileMD5Hash?.toLowerCase() === md5(document.markdown));
    const action = match.conflict ? "conflict" : !remoteItem ? "create" : same && Number(remoteItem.folderId) === folder.id && Number(remoteItem.status) === 2 ? "skip" : "update";
    return { ...document, folderId: folder.id, hash, knowledgeId: remoteItem?.id || null, remoteStatus: remoteItem?.status ?? null, action, error: match.conflict || null };
  });
  const claimedIds = new Set(items.map((item) => Number(item.knowledgeId)).filter(Boolean));
  const prefix = group === "courses" ? "course-" : group === "users" ? "user-" : "gigi-form46-";
  for (const item of remote.knowledges) {
    if (Number(item.folderId) !== folder.id || claimedIds.has(Number(item.id)) || !String(item.name || "").startsWith(prefix)) continue;
    items.push({ sourceType: group, sourceKey: `remote-${item.id}`, displayName: item.name, filename: item.name, folderId: folder.id, hash: "", knowledgeId: item.id, remoteStatus: item.status, action: "orphan", error: "Không còn nguồn hợp lệ trong Learning Compass", markdown: "" });
  }
  const snapshotHash = sha256(items.map((item) => `${item.sourceType}:${item.sourceKey}:${item.hash}:${item.knowledgeId || ""}:${item.action}`).join("\n"));
  return { group, snapshotHash, counts: { create: items.filter((x) => x.action === "create").length, update: items.filter((x) => x.action === "update").length, skip: items.filter((x) => x.action === "skip").length, conflict: items.filter((x) => x.action === "conflict").length, orphan: items.filter((x) => x.action === "orphan").length }, items };
}

async function uploadDocument(config, item) {
  if (!item.knowledgeId) {
    const current = await remoteInventory(config);
    const match = findRemote(item, current.knowledges, null);
    if (match.conflict) throw new Error(match.conflict);
    if (match.item) item = { ...item, knowledgeId: match.item.id };
  }
  const form = new FormData();
  form.set("file", new Blob([item.markdown], { type: "text/markdown; charset=utf-8" }), item.filename);
  form.set("backgroundProcessing", "true");
  form.set("folderId", String(item.folderId));
  form.set("tags", item.tags.join(","));
  form.set("citationURL", item.citationURL);
  form.set("citationTitle", item.citationTitle);
  if (item.knowledgeId) form.set("knowledgeId", String(item.knowledgeId));
  const body = await alphaRequest(config, "/knowledges", { method: "POST", body: form });
  let id = item.knowledgeId || body?.knowledge?.id || body?.knowledgeId || body?.id || body?.knowledges?.[0]?.id;
  if (!id) {
    const current = await remoteInventory(config);
    const matched = findRemote(item, current.knowledges, null);
    if (matched.conflict) throw new Error(matched.conflict);
    id = matched.item?.id;
  }
  if (!id) throw new Error("ALPHA_UPLOAD_ID_UNCONFIRMED");
  return Number(id);
}

async function updateRunSummary(runId) {
  const result = await query(
    `SELECT status, action, COUNT(*) AS count FROM alpha_sync_run_items WHERE run_id=$1 GROUP BY status, action`, [runId],
  );
  const tally = { created: 0, updated: 0, skipped: 0, error: 0, processing: 0 };
  for (const row of result.rows) {
    const count = Number(row.count);
    if (row.status === "error") tally.error += count;
    else if (row.status === "processing") tally.processing += count;
    else if (row.status === "ready") {
      if (row.action === "create") tally.created += count;
      if (row.action === "update") tally.updated += count;
      if (row.action === "skip" || row.action === "orphan") tally.skipped += count;
    }
  }
  const status = tally.processing ? "still_processing" : tally.error ? "error" : "success";
  await query(
    `UPDATE alpha_sync_runs SET status=$2, created_count=$3, updated_count=$4, skipped_count=$5,
     error_count=$6, finished_at=CASE WHEN $2='still_processing' THEN NULL ELSE NOW() END WHERE id=$1`,
    [runId, status, tally.created, tally.updated, tally.skipped, tally.error],
  );
  if (status !== "still_processing") await query("UPDATE alpha_sync_group_locks SET run_id=NULL, locked_at=NULL WHERE run_id=$1", [runId]);
  return { status, ...tally };
}

async function processAlphaRun(runId, expectedHash, group, allowStale, onlyKeys) {
  try {
    const plan = await planAlphaSync(group, { allowStale });
    if (plan.snapshotHash !== expectedHash) throw new Error("SOURCE_OR_REMOTE_CHANGED_REPREVIEW_REQUIRED");
    const config = await alphaConfig();
    await query("UPDATE alpha_sync_runs SET status='running' WHERE id=$1", [runId]);
    for (const item of plan.items.filter((candidate) => !onlyKeys || onlyKeys.includes(candidate.sourceKey))) {
      if (["skip", "conflict", "orphan"].includes(item.action)) continue;
      try {
        await query("UPDATE alpha_sync_group_locks SET locked_at=NOW() WHERE run_id=$1", [runId]);
        const knowledgeId = await uploadDocument(config, item);
        await query(
          `INSERT INTO alpha_knowledge_mappings (source_type, source_key, knowledge_id, content_hash, folder_id, remote_status, last_synced_at)
           VALUES ($1,$2,$3,$4,$5,1,NOW())
           ON DUPLICATE KEY UPDATE knowledge_id=VALUES(knowledge_id), content_hash=VALUES(content_hash),
             folder_id=VALUES(folder_id), remote_status=1, last_synced_at=NOW()`,
          [item.sourceType, item.sourceKey, knowledgeId, item.hash, item.folderId],
        );
        await query("UPDATE alpha_sync_run_items SET status='processing', knowledge_id=$3 WHERE run_id=$1 AND source_type=$2 AND source_key=$4", [runId, item.sourceType, knowledgeId, item.sourceKey]);
      } catch (error) {
        await query("UPDATE alpha_sync_run_items SET status='error', error_message=$4 WHERE run_id=$1 AND source_type=$2 AND source_key=$3", [runId, item.sourceType, item.sourceKey, String(error.message).slice(0, 500)]);
      }
    }
    await pollAlphaRun(runId);
  } catch (error) {
    await query("UPDATE alpha_sync_runs SET status='error', error_message=$2, finished_at=NOW() WHERE id=$1", [runId, String(error.message).slice(0, 500)]);
    await query("UPDATE alpha_sync_group_locks SET run_id=NULL, locked_at=NULL WHERE run_id=$1", [runId]);
  }
}

export async function startAlphaSync(group, snapshotHash, startedBy, { allowStale = false, trigger = "manual", onlyKeys = null } = {}) {
  const plan = await planAlphaSync(group, { allowStale });
  if (plan.snapshotHash !== snapshotHash) throw new Error("PREVIEW_EXPIRED");
  const selected = onlyKeys ? plan.items.filter((item) => onlyKeys.includes(item.sourceKey)) : plan.items;
  if (!selected.length) throw new Error("SOURCE_ITEM_NOT_FOUND");
  if (selected.some((item) => item.action === "conflict")) throw new Error("DUPLICATE_REMOTE_DOCUMENTS");
  const runId = crypto.randomUUID();
  const claim = await query(
    `UPDATE alpha_sync_group_locks SET run_id=$1, locked_at=NOW()
     WHERE group_name=$2 AND (run_id IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE))`,
    [runId, group],
  );
  if (!claim.rowCount) throw new Error("GROUP_SYNC_ALREADY_RUNNING");
  try {
    await query("INSERT INTO alpha_sync_runs (id, group_name, trigger_type, started_by, snapshot_hash) VALUES ($1,$2,$3,$4,$5)", [runId, group, trigger, startedBy, snapshotHash]);
    for (const item of selected) {
      await query(
        "INSERT INTO alpha_sync_run_items (run_id, source_type, source_key, display_name, action, status, knowledge_id, error_message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [runId, item.sourceType, item.sourceKey, item.displayName.slice(0, 255), item.action, ["skip", "orphan"].includes(item.action) ? "ready" : item.action === "conflict" ? "error" : "queued", item.knowledgeId, item.error],
      );
    }
    setImmediate(() => processAlphaRun(runId, snapshotHash, group, allowStale, onlyKeys).catch((error) => console.error("[alpha-sync]", error.message)));
    return { runId, status: "queued" };
  } catch (error) {
    await query("UPDATE alpha_sync_group_locks SET run_id=NULL, locked_at=NULL WHERE run_id=$1", [runId]);
    throw error;
  }
}

export async function pollAlphaRun(runId) {
  const rows = await query("SELECT group_name, status, TIMESTAMPDIFF(MINUTE, started_at, NOW()) AS elapsed_minutes FROM alpha_sync_runs WHERE id=$1", [runId]);
  if (!rows.rowCount || !["running", "still_processing"].includes(rows.rows[0].status)) return null;
  if (Number(rows.rows[0].elapsed_minutes) > 1440) {
    await query("UPDATE alpha_sync_run_items SET status='error', error_message='ALPHA_PROCESSING_TIMEOUT' WHERE run_id=$1 AND status='processing'", [runId]);
    return updateRunSummary(runId);
  }
  const pending = await query("SELECT source_type, source_key, knowledge_id FROM alpha_sync_run_items WHERE run_id=$1 AND status='processing'", [runId]);
  if (pending.rowCount) {
    await query("UPDATE alpha_sync_group_locks SET locked_at=NOW() WHERE run_id=$1", [runId]);
    const config = await alphaConfig();
    const remote = await remoteInventory(config);
    for (const item of pending.rows) {
      const knowledge = remote.knowledges.find((row) => Number(row.id) === Number(item.knowledge_id));
      if (!knowledge) continue;
      const expectedFolder = FOLDERS[rows.rows[0].group_name].id;
      if (Number(knowledge.status) === 2 && Number(knowledge.folderId) === expectedFolder) {
        await query("UPDATE alpha_sync_run_items SET status='ready' WHERE run_id=$1 AND source_type=$2 AND source_key=$3", [runId, item.source_type, item.source_key]);
        await query("UPDATE alpha_knowledge_mappings SET remote_status=2 WHERE source_type=$1 AND source_key=$2", [item.source_type, item.source_key]);
      } else if (Number(knowledge.status) === 3 || Number(knowledge.folderId) !== expectedFolder) {
        await query("UPDATE alpha_sync_run_items SET status='error', error_message=$4 WHERE run_id=$1 AND source_type=$2 AND source_key=$3", [runId, item.source_type, item.source_key, Number(knowledge.status) === 3 ? "ALPHA_INDEX_ERROR" : "ALPHA_WRONG_FOLDER"]);
      }
    }
  }
  return updateRunSummary(runId);
}

export async function pollProcessingAlphaRuns() {
  const runs = await query("SELECT id FROM alpha_sync_runs WHERE status='still_processing' ORDER BY started_at LIMIT 20");
  for (const run of runs.rows) {
    try { await pollAlphaRun(run.id); } catch (error) { console.warn("[alpha-sync-poll]", error.message); }
  }
}

export async function runScheduledAlphaSyncs() {
  for (const group of Object.keys(FOLDERS)) {
    try {
      if (await getSetting(`alpha_sync_auto_${group}`, "false") !== "true") continue;
      const lastCheck = await getSetting(`alpha_sync_last_check_${group}`, "");
      if (wasCheckedToday(lastCheck)) continue;
      const plan = await planAlphaSync(group);
      if (plan.counts.conflict) continue;
      if (!plan.counts.create && !plan.counts.update) {
        await saveSetting(`alpha_sync_last_check_${group}`, new Date().toISOString());
        continue;
      }
      await startAlphaSync(group, plan.snapshotHash, "scheduler", { trigger: "scheduled" });
      await saveSetting(`alpha_sync_last_check_${group}`, new Date().toISOString());
    } catch (error) { console.warn(`[alpha-sync-schedule:${group}]`, error.message); }
  }
}
