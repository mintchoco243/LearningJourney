"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { ADMComponents } from './ADMComponents';
import { ADM_DATA } from '@/data/admData';

const { Icon } = GLHUI;
const { Badge, PageHeader, StatCard, SectionCard, Modal, Toggle, SearchInput } = ADMComponents;
const D = ADM_DATA;


  
  

  async function apiFetch(path, opts = {}) {
    const res = await fetch(path, { credentials: "include", ...opts });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || res.status); }
    return res.json();
  }

  function mapSession(s) {
    return {
      id: s.id,
      course_id: s.course_code,
      course_title: s.course_title || s.title || s.course_code,
      date: s.session_date || s.date || "",
      time: s.session_time || s.time || "",
      location: s.location || "",
      trainer: s.trainer || "",
      min_participants: s.min_participants || 0,
      max_participants: s.max_participants || 0,
      current_count: s.current_count || 0,
      status: s.status || "open",
    };
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value !== "string") return [value];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }

  function normalizeRequestStatus(status) {
    if (status === "new") return "pending";
    if (status === "in_review") return "in_progress";
    return status || "pending";
  }

  function mapRequest(r) {
    const skills = toArray(r.skills_needed).join(", ");
    return {
      id: r.id,
      user_name: r.full_name || r.email || "—",
      email: r.email || "",
      dept: "",
      title: skills || r.description?.slice(0, 60) || "L&D Request",
      reason: r.description || "",
      submitted_at: (r.created_at || "").slice(0, 10),
      status: normalizeRequestStatus(r.status),
      admin_note: r.admin_note || "",
    };
  }

  /* ===================== SESSIONS ===================== */
  export function SessionsScreen() {
    const [sessions, setSessions] = React.useState(D.ADMIN_SESSIONS.map(mapSession));
    const [loading, setLoading]   = React.useState(true);
    const [filterCourse, setFilterCourse] = React.useState("all");
    const [filterStatus, setFilterStatus] = React.useState("all");
    const [attendeesModal, setAttendeesModal] = React.useState(null);
    const [createModal, setCreateModal]     = React.useState(false);
    const [confirmId, setConfirmId]         = React.useState(null);
    const [confirming, setConfirming]       = React.useState(false);
    const [createError, setCreateError]     = React.useState("");
    const [creating, setCreating]           = React.useState(false);

    React.useEffect(() => {
      apiFetch("/admin/api/sessions")
        .then(data => { if (data.sessions) setSessions(data.sessions.map(mapSession)); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const courseOptions = [...new Set(sessions.map(s => s.course_id))].map(id => {
      const s = sessions.find(x => x.course_id === id);
      return { id, title: s?.course_title || id };
    });

    const filtered = sessions.filter(s => {
      if (filterCourse !== "all" && s.course_id !== filterCourse) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      return true;
    });

    async function confirmSession(id) {
      setConfirming(true);
      try {
        await apiFetch(`/admin/api/sessions/${id}/confirm`, { method: "POST" });
        setSessions(ss => ss.map(s => s.id === id ? { ...s, status: "confirmed" } : s));
        setConfirmId(null);
      } catch (e) {
        alert("Lỗi: " + e.message);
      } finally {
        setConfirming(false);
      }
    }

    async function handleCreate(formData) {
      setCreating(true); setCreateError("");
      try {
        const data = await apiFetch("/admin/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (data.session) setSessions(ss => [mapSession(data.session), ...ss]);
        setCreateModal(false);
      } catch (e) {
        setCreateError(e.message || "Tạo buổi học thất bại");
      } finally {
        setCreating(false);
      }
    }

    function fmtDate(d) {
      if (!d) return "—";
      try { return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); }
      catch { return d; }
    }

    return (
      <div data-screen-label="Sessions">
        <PageHeader
          title="Lịch học / Đặt chỗ"
          subtitle={`${sessions.length} buổi học · ${sessions.filter(s => s.status === "open").length} đang mở đăng ký`}
          action={
            <button className="adm-btn adm-btn--primary" onClick={() => { setCreateError(""); setCreateModal(true); }}>
              <Icon name="file-plus" size={14} /> Tạo buổi học
            </button>
          }
        />

        <div className="adm-filter-row">
          <select className="adm-select" style={{ width: "auto", fontSize: 12, padding: "7px 30px 7px 12px" }} value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
            <option value="all">Tất cả khóa học</option>
            {courseOptions.map(c => (
              <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
            ))}
          </select>
          <div className="adm-tab-filter">
            {[["all","Tất cả"],["open","Mở"],["full","Đủ chỗ"],["confirmed","Xác nhận"],["cancelled","Huỷ"]].map(([v,l]) => (
              <button key={v} className={`adm-tab-filter__item${filterStatus===v?" is-active":""}`} onClick={()=>setFilterStatus(v)}>{l}</button>
            ))}
          </div>
        </div>

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải...</div>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th style={{ width: 108 }}>Ngày</th>
                <th style={{ width: 100 }}>Giờ</th>
                <th>Địa điểm</th>
                <th style={{ width: 110 }}>Đăng ký</th>
                <th style={{ width: 118 }}>Trạng thái</th>
                <th style={{ width: 170 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const pct = s.max_participants > 0 ? Math.min(Math.round((s.current_count / s.max_participants) * 100), 100) : 0;
                const enoughForMin = s.min_participants === 0 || s.current_count >= s.min_participants;
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{s.course_title}</div>
                      <div style={{ fontSize: 10, color: "var(--rpg-faint)", fontFamily: "monospace" }}>{s.id}</div>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{fmtDate(s.date)}</td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{s.time || "—"}</td>
                    <td style={{ fontSize: 12 }}>{s.location || "—"}</td>
                    <td>
                      <div style={{ marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, color: enoughForMin ? "#2BB6A3" : "#F5A623" }}>{s.current_count}</span>
                        <span style={{ color: "var(--rpg-muted)", fontSize: 11 }}>/{s.max_participants || "∞"}</span>
                      </div>
                      {s.max_participants > 0 && (
                        <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 999, transition: "width .5s", width: `${pct}%`, background: pct >= 100 ? "#F5A623" : "#2BB6A3" }} />
                        </div>
                      )}
                    </td>
                    <td><Badge status={s.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setAttendeesModal(s)}>
                          <Icon name="users" size={13} /> DS
                        </button>
                        {(s.status === "open" || s.status === "full") && (
                          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setConfirmId(s.id)}>
                            Xác nhận mở lớp
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="adm-empty">Không có buổi học nào phù hợp</div>}
        </div>

        <Modal open={!!attendeesModal} onClose={() => setAttendeesModal(null)} title={attendeesModal ? `Danh sách đặt chỗ · ${attendeesModal.id}` : ""} width={600}>
          {attendeesModal && <AttendeesView session={attendeesModal} />}
        </Modal>

        <Modal open={createModal} onClose={() => setCreateModal(false)} title="Tạo buổi học mới" width={560}>
          <SessionForm onClose={() => setCreateModal(false)} onCreate={handleCreate} creating={creating} error={createError} />
        </Modal>

        <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Xác nhận mở lớp" width={420}>
          {confirmId && (() => {
            const sess = sessions.find(s => s.id === confirmId);
            return (
              <div>
                <p style={{ color: "var(--rpg-text)", marginBottom: 18, lineHeight: 1.7, fontSize: 14 }}>
                  Xác nhận sẽ đổi trạng thái buổi học <strong style={{ color: "#fff" }}>{confirmId}</strong> thành <Badge status="confirmed" />{" "}
                  và gửi email tự động đến <strong style={{ color: "#fff" }}>{sess?.current_count} người</strong> đã đặt chỗ.
                </p>
                <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
                  <button className="adm-btn adm-btn--sec" onClick={() => setConfirmId(null)} disabled={confirming}>Huỷ</button>
                  <button className="adm-btn adm-btn--primary" onClick={() => confirmSession(confirmId)} disabled={confirming}>
                    {confirming ? "Đang xử lý..." : <><Icon name="send" size={13} /> Xác nhận & Gửi email</>}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    );
  }

  function AttendeesView({ session }) {
    const [list, setList]   = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      apiFetch(`/admin/api/sessions/${session.id}/reservations`)
        .then(data => { if (data.reservations) setList(data.reservations); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [session.id]);

    return (
      <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {[
            { l: "Đặt chỗ",  v: session.current_count,   c: "#2BB6A3" },
            { l: "Tối thiểu", v: session.min_participants, c: "#F5A623" },
            { l: "Sức chứa", v: session.max_participants || "∞", c: "#8A93A8" },
          ].map(i => (
            <div key={i.l} style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "12px 8px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: i.c }}>{i.v}</div>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{i.l}</div>
            </div>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--rpg-muted)", padding: 24 }}>Đang tải...</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Tên</th><th>Email</th><th>Ngày đặt</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--rpg-muted)" }}>Chưa có ai đặt chỗ</td></tr>}
                {list.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.full_name || a.email}</td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.email}</td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{(a.reserved_at || "").slice(0, 10)}</td>
                    <td><Badge status={a.status || "reserved"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function SessionForm({ onClose, onCreate, creating, error }) {
    const [courses, setCourses] = React.useState(D.ADMIN_COURSES.filter(c => c.is_active));
    const [form, setForm] = React.useState({
      course_id: "",
      session_date: "",
      session_time: "09:00–12:00",
      location: "",
      max_participants: 25,
      min_participants: 10,
    });

    React.useEffect(() => {
      apiFetch("/admin/api/courses")
        .then(data => { if (data.courses) setCourses(data.courses.filter(c => c.is_active)); })
        .catch(() => {});
    }, []);

    function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

    return (
      <div>
        {error && <div style={{ background: "rgba(228,30,38,.1)", border: "1px solid rgba(228,30,38,.3)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
        <div className="adm-form-group">
          <label className="adm-label">Khóa học</label>
          <select className="adm-select" value={form.course_id} onChange={e => set("course_id", e.target.value)}>
            <option value="">-- Chọn khóa học --</option>
            {courses.map(c => (
              <option key={c.id} value={c.course_code || c.id}>{c.course_code || c.id} — {c.title}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Ngày</label>
            <input className="adm-input" type="date" value={form.session_date} onChange={e => set("session_date", e.target.value)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Khung giờ</label>
            <input className="adm-input" placeholder="09:00–12:00" value={form.session_time} onChange={e => set("session_time", e.target.value)} />
          </div>
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Địa điểm</label>
          <input className="adm-input" placeholder="VD: HCM Office – P.501 hoặc Online – Zoom" value={form.location} onChange={e => set("location", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Tối thiểu (người)</label>
            <input className="adm-input" type="number" min="1" value={form.min_participants} onChange={e => set("min_participants", parseInt(e.target.value) || 0)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Sức chứa tối đa</label>
            <input className="adm-input" type="number" min="1" value={form.max_participants} onChange={e => set("max_participants", parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={creating}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={() => onCreate(form)} disabled={creating || !form.course_id || !form.session_date}>
            {creating ? "Đang tạo..." : <><Icon name="check" size={13} /> Tạo buổi học</>}
          </button>
        </div>
      </div>
    );
  }

  /* ===================== L&D REQUESTS ===================== */
  export function RequestsScreen() {
    const [requests, setRequests] = React.useState(D.ADMIN_REQUESTS);
    const [loading, setLoading]   = React.useState(true);
    const [filterStatus, setFilterStatus] = React.useState("all");
    const [search, setSearch]   = React.useState("");
    const [selected, setSelected] = React.useState(null);

    React.useEffect(() => {
      apiFetch("/admin/api/ld-requests")
        .then(data => { if (data.requests) setRequests(data.requests.map(mapRequest)); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const counts = {
      all: requests.length,
      pending:     requests.filter(r => r.status === "pending").length,
      in_progress: requests.filter(r => r.status === "in_progress").length,
      approved:    requests.filter(r => r.status === "approved").length,
      rejected:    requests.filter(r => r.status === "rejected").length,
    };

    const filtered = requests.filter(r => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.user_name.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    async function updateRequest(id, patch) {
      setRequests(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
      setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev);
      try {
        await apiFetch(`/admin/api/ld-requests/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: patch.status, admin_note: patch.admin_note }),
        });
      } catch (e) {
        console.error("Failed to update request:", e.message);
      }
    }

    return (
      <div data-screen-label="L&D Requests">
        <PageHeader title="L&D Requests" subtitle={`${counts.pending} chờ duyệt · ${counts.in_progress} đang xử lý`} />

        <div className="adm-filter-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc tiêu đề..." />
        </div>

        <div className="adm-tab-filter" style={{ marginBottom: 16 }}>
          {[["all","Tất cả"],["pending","Chờ duyệt"],["in_progress","Đang xử lý"],["approved","Đã duyệt"],["rejected","Từ chối"]].map(([v,l]) => (
            <button key={v} className={`adm-tab-filter__item${filterStatus===v?" is-active":""}`} onClick={()=>setFilterStatus(v)}>
              {l}
              {counts[v] > 0 && (
                <span style={{ marginLeft: 5, background: filterStatus===v ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.09)", borderRadius: 999, padding: "0 6px", fontSize: 10 }}>
                  {counts[v]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải...</div>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 76 }}>ID</th>
                <th style={{ width: 180 }}>Người gửi</th>
                <th>Yêu cầu đào tạo</th>
                <th style={{ width: 80 }}>Ngày</th>
                <th style={{ width: 118 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={`is-clickable${r.status==="pending"?" is-pending":""}`} onClick={() => setSelected(r)}>
                  <td><code style={{ fontSize: 10 }}>{(r.id || "").slice(0, 8)}</code></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{r.user_name}</div>
                    <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{r.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--rpg-text)" }}>{r.title}</div>
                    {r.admin_note && (
                      <div style={{ fontSize: 11, color: "var(--rpg-faint)", marginTop: 2, fontStyle: "italic" }}>
                        {r.admin_note.length > 60 ? r.admin_note.slice(0, 60) + "…" : r.admin_note}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--rpg-faint)", fontVariantNumeric: "tabular-nums" }}>{(r.submitted_at || "").slice(5).replace("-", "/")}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="adm-empty">Không có requests nào phù hợp</div>}
        </div>

        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết yêu cầu` : ""} width={640}>
          {selected && <RequestDetail request={selected} onUpdate={updateRequest} onClose={() => setSelected(null)} />}
        </Modal>
      </div>
    );
  }

  function RequestDetail({ request, onUpdate, onClose }) {
    const [status, setStatus] = React.useState(request.status);
    const [note, setNote]     = React.useState(request.admin_note || "");
    const [saving, setSaving] = React.useState(false);

    async function save() {
      setSaving(true);
      await onUpdate(request.id, { status, admin_note: note });
      setSaving(false);
      onClose();
    }

    return (
      <div>
        <div className="adm-detail-panel">
          {[
            { l: "Người gửi", v: request.user_name },
            { l: "Email",     v: request.email },
            { l: "Ngày gửi",  v: request.submitted_at },
          ].filter(f => f.v).map(f => (
            <div key={f.l} className="adm-detail-field">
              <div className="adm-detail-field__label">{f.l}</div>
              <div className="adm-detail-field__val">{f.v}</div>
            </div>
          ))}
        </div>

        <div className="adm-form-group">
          <label className="adm-label">Kỹ năng / yêu cầu</label>
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {request.title}
          </div>
        </div>

        {request.reason && (
          <div className="adm-form-group">
            <label className="adm-label">Mô tả chi tiết</label>
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--rpg-text)", lineHeight: 1.65 }}>
              {request.reason}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Cập nhật trạng thái</label>
            <select className="adm-select" value={status} onChange={e => setStatus(e.target.value)}>
              {[["pending","Chờ duyệt"],["in_progress","Đang xử lý"],["approved","Đã duyệt"],["rejected","Từ chối"]].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Admin note</label>
            <textarea className="adm-textarea" style={{ minHeight: 72 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú lý do hoặc hướng dẫn tiếp theo..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>Đóng</button>
          <button className="adm-btn adm-btn--primary" onClick={save} disabled={saving}>
            {saving ? "Đang lưu..." : <><Icon name="send" size={13} /> Lưu & Gửi thông báo</>}
          </button>
        </div>
      </div>
    );
  }

  export const ADMScreens2 = { SessionsScreen, RequestsScreen };
