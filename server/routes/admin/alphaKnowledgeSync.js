import express from "express";
import { query } from "../../db.js";
import { checkAlphaSyncConnection, planAlphaSync, startAlphaSync, pollAlphaRun } from "../../services/alphaKnowledgeSync.js";
import { getSetting, saveSetting } from "../../lib/integrationSecrets.js";

export const adminAlphaSyncRouter = express.Router();

function canRun(req, res, next) {
  if (["super_admin", "ld_admin"].includes(req.adminRole)) return next();
  return res.status(403).json({ error: "ALPHA_SYNC_ADMIN_REQUIRED" });
}

adminAlphaSyncRouter.get("/status", async (_req, res) => {
  try { res.json(await checkAlphaSyncConnection()); }
  catch (error) { res.status(502).json({ connected: false, error: error.message }); }
});

adminAlphaSyncRouter.post("/check-connection", canRun, async (_req, res) => {
  try { res.json(await checkAlphaSyncConnection()); }
  catch (error) { res.status(502).json({ connected: false, error: error.message }); }
});

adminAlphaSyncRouter.get("/schedule", async (_req, res, next) => {
  try {
    const groups = {};
    for (const group of ["courses", "users", "guidelines"]) groups[group] = await getSetting(`alpha_sync_auto_${group}`, "false") === "true";
    res.json({ groups });
  } catch (error) { next(error); }
});

adminAlphaSyncRouter.post("/schedule", canRun, async (req, res, next) => {
  try {
    const group = String(req.body.group || "");
    if (!["courses", "users", "guidelines"].includes(group)) return res.status(400).json({ error: "INVALID_SYNC_GROUP" });
    await saveSetting(`alpha_sync_auto_${group}`, req.body.enabled === true ? "true" : "false");
    res.json({ group, enabled: req.body.enabled === true });
  } catch (error) { next(error); }
});

adminAlphaSyncRouter.post("/preview", canRun, async (req, res) => {
  try {
    const plan = await planAlphaSync(req.body.group, { allowStale: Boolean(req.body.allowStale) });
    res.json({ group: plan.group, snapshotHash: plan.snapshotHash, counts: plan.counts,
      items: plan.items.map((item) => ({ sourceType: item.sourceType, sourceKey: item.sourceKey, displayName: item.displayName, filename: item.filename, action: item.action, knowledgeId: item.knowledgeId, remoteStatus: item.remoteStatus, error: item.error, markdown: item.markdown })) });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

adminAlphaSyncRouter.post("/sync", canRun, async (req, res) => {
  try {
    const result = await startAlphaSync(req.body.group, req.body.snapshotHash, req.user.email, { allowStale: Boolean(req.body.allowStale) });
    res.status(202).json(result);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

adminAlphaSyncRouter.post("/items/:sourceType/:sourceKey/sync", canRun, async (req, res) => {
  try {
    const { sourceType, sourceKey } = req.params;
    const plan = await planAlphaSync(sourceType, { allowStale: Boolean(req.body.allowStale) });
    const result = await startAlphaSync(sourceType, plan.snapshotHash, req.user.email, { onlyKeys: [sourceKey], allowStale: Boolean(req.body.allowStale) });
    res.status(202).json(result);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

adminAlphaSyncRouter.post("/items/:sourceType/:sourceKey/retry", canRun, async (req, res) => {
  try {
    const { sourceType, sourceKey } = req.params;
    const previous = await query(
      "SELECT i.status FROM alpha_sync_run_items i JOIN alpha_sync_runs r ON r.id=i.run_id WHERE i.source_type=$1 AND i.source_key=$2 ORDER BY r.started_at DESC LIMIT 1",
      [sourceType, sourceKey],
    );
    if (!previous.rowCount || previous.rows[0].status !== "error") return res.status(400).json({ error: "ITEM_NOT_FAILED" });
    const plan = await planAlphaSync(sourceType, { allowStale: Boolean(req.body.allowStale) });
    const result = await startAlphaSync(sourceType, plan.snapshotHash, req.user.email, { onlyKeys: [sourceKey], allowStale: Boolean(req.body.allowStale) });
    res.status(202).json(result);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

adminAlphaSyncRouter.get("/runs", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM alpha_sync_runs ORDER BY started_at DESC LIMIT 30");
    res.json({ runs: result.rows });
  } catch (error) { next(error); }
});

adminAlphaSyncRouter.get("/runs/:runId", async (req, res, next) => {
  try {
    await pollAlphaRun(req.params.runId);
    const [run, items] = await Promise.all([
      query("SELECT * FROM alpha_sync_runs WHERE id=$1", [req.params.runId]),
      query("SELECT * FROM alpha_sync_run_items WHERE run_id=$1 ORDER BY action, display_name", [req.params.runId]),
    ]);
    if (!run.rowCount) return res.status(404).json({ error: "RUN_NOT_FOUND" });
    res.json({ run: run.rows[0], items: items.rows });
  } catch (error) { next(error); }
});
