"use client";

import React from "react";
import { apiFetch } from "@/lib/apiClient";
import { ADMComponents } from "./ADMComponents";

const { PageHeader } = ADMComponents;
const GROUPS = [{ id: "courses", label: "Khóa học" }, { id: "users", label: "Users" }, { id: "guidelines", label: "Hướng dẫn Bot" }];

export function AlphaSyncScreen() {
  const [group, setGroup] = React.useState("courses");
  const [allowStale, setAllowStale] = React.useState(false);
  const [connection, setConnection] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [runs, setRuns] = React.useState([]);
  const [selectedRun, setSelectedRun] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [markdown, setMarkdown] = React.useState("");
  const [schedule, setSchedule] = React.useState({});

  const loadRuns = React.useCallback(() => apiFetch("/admin/api/alpha-knowledge/runs").then(data => setRuns(data.runs || [])).catch(() => {}), []);
  React.useEffect(() => {
    apiFetch("/admin/api/alpha-knowledge/status").then(setConnection).catch(error => setConnection({ connected: false, error: error.message }));
    loadRuns();
    apiFetch("/admin/api/alpha-knowledge/schedule").then(data => setSchedule(data.groups || {})).catch(() => {});
  }, [loadRuns]);

  async function makePreview() {
    setBusy(true); setMessage(""); setPreview(null);
    try {
      const data = await apiFetch("/admin/api/alpha-knowledge/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group, allowStale }) });
      setPreview(data);
    } catch (error) { setMessage("Không xem trước được: " + error.message); }
    finally { setBusy(false); }
  }

  async function runSync() {
    if (!preview || !window.confirm(`Đồng bộ ${preview.counts.create} tài liệu mới và cập nhật ${preview.counts.update} tài liệu trên Alpha?`)) return;
    setBusy(true); setMessage("");
    try {
      const data = await apiFetch("/admin/api/alpha-knowledge/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: preview.group, snapshotHash: preview.snapshotHash, allowStale }) });
      setMessage(`Đã bắt đầu đồng bộ. Mã lần chạy: ${data.runId}`);
      setPreview(null);
      await loadRuns();
      await openRun(data.runId);
    } catch (error) { setMessage("Chưa chạy được: " + error.message); }
    finally { setBusy(false); }
  }

  async function openRun(id) {
    try { setSelectedRun(await apiFetch(`/admin/api/alpha-knowledge/runs/${encodeURIComponent(id)}`)); }
    catch (error) { setMessage("Không tải được lịch sử: " + error.message); }
  }

  async function setAutoSync(enabled) {
    try {
      await apiFetch("/admin/api/alpha-knowledge/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group, enabled }) });
      setSchedule(current => ({ ...current, [group]: enabled }));
      setMessage(enabled ? "Đã bật đồng bộ tự động cho nhóm này." : "Đã tắt đồng bộ tự động cho nhóm này.");
    } catch (error) { setMessage("Không đổi được lịch tự động: " + error.message); }
  }

  async function retryItem(item) {
    setBusy(true); setMessage("");
    try {
      const result = await apiFetch(`/admin/api/alpha-knowledge/items/${encodeURIComponent(item.source_type)}/${encodeURIComponent(item.source_key)}/retry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allowStale }) });
      setMessage(`Đang thử lại mục lỗi. Mã lần chạy: ${result.runId}`);
      await loadRuns();
      await openRun(result.runId);
    } catch (error) { setMessage("Chưa thử lại được: " + error.message); }
    finally { setBusy(false); }
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <PageHeader title="Alpha Knowledge Sync" sub="Xem trước thay đổi rồi cập nhật tài liệu cho bot." />
    <div className="adm-section" style={{ display: "grid", gap: 10 }}>
      <strong style={{ color: "var(--rpg-text)" }}>Kết nối: {connection?.connected ? "Đã kết nối" : connection ? "Chưa kết nối" : "Đang kiểm tra…"}</strong>
      {connection?.connected && <div style={{ color: "var(--rpg-muted)", fontSize: 12 }}>Expert {connection.expertId} · {connection.remoteCount} tài liệu hiện có · Course {connection.folderStatus?.courses ? "✓" : "!"} · Users {connection.folderStatus?.users ? "✓" : "!"} · Guideline {connection.folderStatus?.guidelines ? "✓" : "!"}</div>}
      {connection?.error && <div style={{ color: "var(--amber)" }}>{connection.error}</div>}
    </div>
    <div className="adm-section" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {GROUPS.map(item => <button key={item.id} type="button" className={`adm-btn ${group === item.id ? "adm-btn--primary" : ""}`} onClick={() => { setGroup(item.id); setPreview(null); setMessage(""); }}>{item.label}</button>)}
      </div>
      {group === "users" && <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--rpg-muted)", fontSize: 12 }}><input type="checkbox" checked={allowStale} onChange={e => { setAllowStale(e.target.checked); setPreview(null); }} />Dùng snapshot GiGi gần nhất khi kết nối đang lỗi</label>}
      <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--rpg-muted)", fontSize: 12 }}><input type="checkbox" checked={Boolean(schedule[group])} onChange={e => setAutoSync(e.target.checked)} />Tự đồng bộ mỗi ngày lúc 9:00 nếu có thay đổi</label>
      <div><button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={makePreview}>{busy ? "Đang xử lý…" : "Xem trước thay đổi"}</button></div>
      {message && <div role="status" style={{ color: "var(--rpg-text)" }}>{message}</div>}
      {preview && <>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "var(--rpg-text)" }}><span>Mới: <b>{preview.counts.create}</b></span><span>Cập nhật: <b>{preview.counts.update}</b></span><span>Giữ nguyên: <b>{preview.counts.skip}</b></span><span>Xung đột: <b>{preview.counts.conflict}</b></span></div>
        <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid var(--rpg-border)", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--rpg-text)", fontSize: 12 }}><thead><tr><th style={{ textAlign: "left", padding: 9 }}>Tài liệu</th><th style={{ textAlign: "left", padding: 9 }}>Thao tác</th><th style={{ textAlign: "left", padding: 9 }}>Alpha ID</th><th style={{ textAlign: "left", padding: 9 }}>Xem nội dung</th></tr></thead><tbody>{preview.items.map(item => <tr key={`${item.sourceType}:${item.sourceKey}`} style={{ borderTop: "1px solid var(--rpg-border)" }}><td style={{ padding: 9 }}>{item.displayName}</td><td style={{ padding: 9 }}>{item.action}</td><td style={{ padding: 9 }}>{item.knowledgeId || "—"}</td><td style={{ padding: 9 }}><button type="button" className="adm-btn" onClick={() => setMarkdown(item.markdown)}>Xem</button></td></tr>)}</tbody></table>
        </div>
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy || preview.counts.conflict > 0} onClick={runSync}>Đồng bộ lên Alpha</button>
      </>}
    </div>
    <div className="adm-section" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong style={{ color: "var(--rpg-text)" }}>Lịch sử đồng bộ</strong><button type="button" className="adm-btn" onClick={loadRuns}>Làm mới</button></div>
      {runs.length ? runs.map(run => <button type="button" key={run.id} className="adm-btn" style={{ textAlign: "left" }} onClick={() => openRun(run.id)}>{run.group_name} · {run.status} · {run.started_at} · Mới {run.created_count} / Cập nhật {run.updated_count} / Lỗi {run.error_count}</button>) : <div style={{ color: "var(--rpg-muted)" }}>Chưa có lần đồng bộ nào.</div>}
      {selectedRun && <div style={{ color: "var(--rpg-text)", fontSize: 12 }}><b>Lần chạy {selectedRun.run.id}: {selectedRun.run.status}</b><div style={{ maxHeight: 240, overflow: "auto", marginTop: 8 }}>{selectedRun.items.map(item => <div key={`${item.source_type}:${item.source_key}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>{item.display_name} · {item.action} · {item.status}{item.error_message ? ` · ${item.error_message}` : ""}{item.status === "error" && <button type="button" className="adm-btn" disabled={busy} onClick={() => retryItem(item)}>Thử lại</button>}</div>)}</div></div>}
    </div>
    {markdown && <div role="dialog" aria-label="Nội dung Markdown" style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(0,0,0,.75)", display: "grid", placeItems: "center", padding: 20 }}><div style={{ background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 10, padding: 16, width: "min(900px,100%)", maxHeight: "90vh", display: "grid", gap: 10 }}><button type="button" className="adm-btn" onClick={() => setMarkdown("")}>Đóng</button><pre style={{ whiteSpace: "pre-wrap", overflow: "auto", color: "var(--rpg-text)", fontSize: 12 }}>{markdown}</pre></div></div>}
  </div>;
}
