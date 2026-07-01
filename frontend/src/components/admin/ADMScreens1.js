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

  function mapCourse(c) {
    return {
      id: c.id,
      title: c.title,
      trainer: c.trainer || "",
      trainer_type: c.trainer_type || "internal",
      format: c.format,
      duration: Math.round((parseFloat(c.duration_hours) || 0) * 60),
      duration_hours: parseFloat(c.duration_hours) || 0,
      rank_targets: Array.isArray(c.rank_targets) ? c.rank_targets : (c.rank_targets ? JSON.parse(c.rank_targets) : []),
      role_targets: Array.isArray(c.role_targets) ? c.role_targets : (c.role_targets ? JSON.parse(c.role_targets) : []),
      skill_tags: Array.isArray(c.skill_tags) ? c.skill_tags : (c.skill_tags ? JSON.parse(c.skill_tags) : []),
      xp: c.xp_reward || 0,
      xp_reward: c.xp_reward || 0,
      is_active: Boolean(c.is_active),
      enrollments: c.enrolled_count || 0,
      description: c.description || "",
      type: c.type || "internal",
      registration_url: c.registration_url || "",
    };
  }

  /* ===================== DASHBOARD ===================== */
  export function Dashboard() {
    const [stats, setStats] = React.useState(D.ADMIN_STATS);
    const [pendingReqs, setPendingReqs] = React.useState(D.ADMIN_REQUESTS.filter(r => r.status === "pending"));

    React.useEffect(() => {
      apiFetch("/admin/api/stats").then(data => {
        setStats(prev => ({
          ...prev,
          total_users: data.total_users ?? prev.total_users,
          enrollments_this_month: data.enrollments_this_month ?? prev.enrollments_this_month,
          pending_ld_requests: data.pending_ld_requests ?? prev.pending_ld_requests,
          active_courses: data.active_courses ?? prev.active_courses,
          top_courses: data.top_courses?.length
            ? data.top_courses.map(c => ({ name: c.title, code: c.id, enrollments: c.enrolled_count || 0 }))
            : prev.top_courses,
        }));
      }).catch(() => {});
      apiFetch("/admin/api/ld-requests?status=pending").then(data => {
        if (data.requests?.length) {
          setPendingReqs(data.requests.map(r => ({
            id: r.id,
            user_name: r.full_name || r.email,
            dept: "",
            title: r.description?.slice(0, 60) || "L&D Request",
            submitted_at: (r.created_at || "").slice(0, 10),
            status: "pending",
          })));
        }
      }).catch(() => {});
    }, []);

    const s = stats;
    const total = (s.enrollments_breakdown || []).reduce((a, i) => a + i.count, 0) || 1;
    const maxE  = Math.max(...(s.top_courses || []).map(c => c.enrollments), 1);

    return (
      <div data-screen-label="Dashboard">
        <PageHeader
          title="Dashboard"
          subtitle={`Tổng quan hệ thống · ${new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`}
        />

        <div className="adm-stat-grid">
          <StatCard label="Người dùng onboard"        value={(s.total_users || 0).toLocaleString("vi-VN")} icon="users"          color="#6aa3e0" iconBg="rgba(59,111,176,.14)" />
          <StatCard label="Enrollments tháng này"     value={s.enrollments_this_month || 0}                icon="trending-up"    color="#2BB6A3" iconBg="rgba(43,182,163,.14)" delta={s.enrollments_delta} />
          <StatCard label="L&D Requests chờ duyệt"   value={s.pending_ld_requests || 0}                   icon="message-square" color="#E41E26" iconBg="rgba(228,30,38,.12)" />
          <StatCard label="Khóa học đang hoạt động"  value={s.active_courses || 0}                        icon="book-open"      color="#9b7fff" iconBg="rgba(124,92,255,.14)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionCard title="Top 5 khóa học · Enrollments tháng này">
              <div className="adm-bar-chart">
                {(s.top_courses || []).map((c, i) => (
                  <div key={i} className="adm-bar-row">
                    <span className="adm-bar-name" title={c.name}>{c.name}</span>
                    <div className="adm-bar-track">
                      <div className="adm-bar-fill" style={{ width: `${(c.enrollments / maxE) * 100}%` }} />
                    </div>
                    <span className="adm-bar-val">{c.enrollments}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {(s.enrollments_breakdown || []).length > 0 && (
              <SectionCard title={`Breakdown theo nguồn · ${total} enrollments`}>
                <div className="adm-source-list">
                  {s.enrollments_breakdown.map((item, i) => (
                    <div key={i} className="adm-source-item">
                      <span className="adm-source-dot" style={{ background: item.color }} />
                      <span className="adm-source-name">{item.source}</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden", maxWidth: 180 }}>
                        <div style={{ height: "100%", background: item.color, borderRadius: 999, width: `${(item.count / total) * 100}%`, transition: "width .7s" }} />
                      </div>
                      <span className="adm-source-count">{item.count}</span>
                      <span className="adm-source-pct">{Math.round((item.count / total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          <SectionCard title="L&D Requests chờ duyệt">
            {pendingReqs.length === 0 && <div style={{ color: "var(--rpg-muted)", fontSize: 13 }}>Không có request nào đang chờ.</div>}
            {pendingReqs.slice(0, 5).map((r, i) => (
              <div key={r.id} style={{ padding: "11px 0", borderBottom: i < Math.min(pendingReqs.length, 5) - 1 ? "1px solid var(--rpg-border)" : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 2 }}>{r.user_name}</div>
                <div style={{ fontSize: 12, color: "var(--rpg-muted)", marginBottom: 6, lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {r.dept && <span style={{ fontSize: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, padding: "2px 7px", color: "var(--rpg-muted)" }}>{r.dept}</span>}
                  <span style={{ fontSize: 11, color: "var(--rpg-faint)" }}>{(r.submitted_at || "").slice(5).replace("-", "/")}</span>
                </div>
              </div>
            ))}
            {pendingReqs.length > 5 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--glh-accent)", fontWeight: 600 }}>
                + {pendingReqs.length - 5} requests khác
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  /* ===================== COURSES ===================== */
  const RANK_NAMES = { rank_01: "Tân Binh", rank_02: "Học Việc", rank_03: "Thành Thạo", rank_04: "Chuyên Gia", rank_05: "Bậc Thầy" };
  const RANKS_ALL  = [
    { id: "rank_01", name: "Tân Binh" }, { id: "rank_02", name: "Học Việc" },
    { id: "rank_03", name: "Thành Thạo" }, { id: "rank_04", name: "Chuyên Gia" },
    { id: "rank_05", name: "Bậc Thầy" },
  ];

  export function CoursesScreen() {
    const [courses, setCourses]   = React.useState(D.ADMIN_COURSES.map(mapCourse));
    const [loading, setLoading]   = React.useState(true);
    const [search, setSearch]     = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [editModal, setEditModal]   = React.useState(false);
    const [importModal, setImportModal] = React.useState(false);
    const [syncModal, setSyncModal] = React.useState(false);
    const [editTarget, setEditTarget] = React.useState(null);
    const [saving, setSaving]     = React.useState(false);
    const [error, setError]       = React.useState("");

    function reloadCourses() {
      return apiFetch("/admin/api/courses")
        .then(data => { if (data.courses) setCourses(data.courses.map(mapCourse)); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    React.useEffect(() => { reloadCourses(); }, []);

    const filtered = courses.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !search || c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
      return matchQ && matchS;
    });

    function openEdit(c) { setEditTarget(c); setError(""); setEditModal(true); }
    function openCreate() { setEditTarget(null); setError(""); setEditModal(true); }

    async function toggleActive(id) {
      const course = courses.find(c => c.id === id);
      if (!course) return;
      const newVal = !course.is_active;
      setCourses(cs => cs.map(c => c.id === id ? { ...c, is_active: newVal } : c));
      try {
        await apiFetch(`/admin/api/courses/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: newVal }),
        });
      } catch (e) {
        setCourses(cs => cs.map(c => c.id === id ? { ...c, is_active: !newVal } : c));
      }
    }

    async function handleSave(formData) {
      setSaving(true); setError("");
      try {
        const isEdit = Boolean(editTarget);
        const payload = {
          title: formData.title,
          trainer: formData.trainer,
          trainer_type: formData.trainer_type || "internal",
          format: formData.format,
          duration_hours: parseFloat(formData.duration_hours) || 1,
          rank_targets: formData.rank_targets,
          role_targets: formData.role_targets || [],
          skill_tags: formData.skill_tags || [],
          type: formData.type || "internal",
          xp_reward: parseInt(formData.xp_reward) || 100,
          description: formData.description || "",
          registration_url: formData.registration_url || "",
          is_active: formData.is_active !== false,
          min_participants: parseInt(formData.min_participants) || null,
        };
        if (!isEdit) payload.id = formData.id;
        const data = await apiFetch(
          isEdit ? `/admin/api/courses/${editTarget.id}` : "/admin/api/courses",
          { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
        const saved = mapCourse(data.course);
        setCourses(cs => isEdit ? cs.map(c => c.id === saved.id ? saved : c) : [saved, ...cs]);
        setEditModal(false);
      } catch (e) {
        setError(e.message || "Lưu thất bại");
      } finally {
        setSaving(false);
      }
    }

    async function handleDelete(id) {
      if (!confirm(`Xoá khoá học ${id}? Hành động này không thể hoàn tác.`)) return;
      try {
        await apiFetch(`/admin/api/courses/${id}`, { method: "DELETE" });
        setCourses(cs => cs.filter(c => c.id !== id));
      } catch (e) {
        alert("Xoá thất bại: " + e.message);
      }
    }

    return (
      <div data-screen-label="Courses">
        <PageHeader
          title="Quản lý Khóa học"
          subtitle={`${courses.filter(c => c.is_active).length} hoạt động · ${courses.filter(c => !c.is_active).length} ẩn`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-btn adm-btn--sec" onClick={() => setSyncModal(true)}>
                <Icon name="refresh-cw" size={14} /> Đồng bộ CSV
              </button>
              <button className="adm-btn adm-btn--sec" onClick={() => setImportModal(true)}>
                <Icon name="users" size={14} /> Import participants
              </button>
              <button className="adm-btn adm-btn--primary" onClick={openCreate}>
                <Icon name="file-plus" size={14} /> Tạo khóa học
              </button>
            </div>
          }
        />

        <div className="adm-filter-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã..." />
          <div className="adm-tab-filter">
            {[["all","Tất cả"],["active","Đang hoạt động"],["inactive","Đã ẩn"]].map(([v,l]) => (
              <button key={v} className={`adm-tab-filter__item${statusFilter===v?" is-active":""}`} onClick={()=>setStatusFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải...</div>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Mã</th>
                <th>Tên khóa học</th>
                <th style={{ width: 108 }}>Format</th>
                <th style={{ width: 60 }}>XP</th>
                <th>Rank targets</th>
                <th style={{ width: 100 }}>Enrollments</th>
                <th style={{ width: 110 }}>Hiển thị</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><code style={{ fontSize: 11 }}>{c.id}</code></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.trainer} · {c.duration} phút</div>
                  </td>
                  <td><Badge status={c.format} /></td>
                  <td><span style={{ fontWeight: 700, color: "var(--amber)" }}>+{c.xp}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(c.rank_targets || []).map(r => (
                        <span key={r} style={{ fontSize: 10, background: "rgba(255,255,255,.05)", border: "1px solid var(--rpg-border)", borderRadius: 4, padding: "2px 6px", color: "var(--rpg-muted)" }}>
                          {RANK_NAMES[r] || r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{c.enrollments}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={c.is_active} onChange={() => toggleActive(c.id)} />
                      <span style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.is_active ? "Hiện" : "Ẩn"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => openEdit(c)} title="Sửa">
                        <Icon name="edit-3" size={14} />
                      </button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => handleDelete(c.id)} title="Xoá" style={{ color: "#E41E26" }}>
                        <Icon name="trash-2" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="adm-empty">Không tìm thấy khóa học nào phù hợp</div>
          )}
        </div>

        <Modal open={editModal} onClose={() => setEditModal(false)} title={editTarget ? `Chỉnh sửa — ${editTarget.id}` : "Tạo khóa học mới"} width={660}>
          <CourseForm course={editTarget} onSave={handleSave} onClose={() => setEditModal(false)} saving={saving} error={error} />
        </Modal>

        <Modal open={importModal} onClose={() => setImportModal(false)} title="Import Participants" width={520}>
          <ImportForm onClose={() => setImportModal(false)} courses={courses} />
        </Modal>

        <Modal open={syncModal} onClose={() => setSyncModal(false)} title="Đồng bộ khóa học từ CSV" width={640}>
          <SyncCoursesForm onClose={() => setSyncModal(false)} onSynced={reloadCourses} />
        </Modal>
      </div>
    );
  }

  function CourseForm({ course, onSave, onClose, saving, error }) {
    const [form, setForm] = React.useState({
      id: course?.id || "",
      title: course?.title || "",
      trainer: course?.trainer || "",
      trainer_type: course?.trainer_type || "internal",
      format: course?.format || "online",
      duration_hours: course ? (course.duration_hours || (course.duration / 60) || 1) : 1,
      rank_targets: course?.rank_targets || [],
      role_targets: course?.role_targets || [],
      skill_tags: course?.skill_tags || [],
      type: course?.type || "internal",
      xp_reward: course?.xp_reward || course?.xp || 100,
      description: course?.description || "",
      registration_url: course?.registration_url || "",
      is_active: course ? course.is_active : true,
      min_participants: course?.min_participants || "",
    });

    function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
    function toggleRank(id) {
      set("rank_targets", form.rank_targets.includes(id) ? form.rank_targets.filter(r => r !== id) : [...form.rank_targets, id]);
    }

    const isEdit = Boolean(course);
    const canSave = form.title.trim() && form.trainer.trim() && (isEdit || form.id.trim());

    return (
      <div>
        {error && <div style={{ background: "rgba(228,30,38,.1)", border: "1px solid rgba(228,30,38,.3)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: isEdit ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
          {!isEdit && (
            <div className="adm-form-group">
              <label className="adm-label">Mã khoá học <span style={{color:"#E41E26"}}>*</span></label>
              <input className="adm-input" value={form.id} onChange={e => set("id", e.target.value)} placeholder="VD: LC-013" />
            </div>
          )}
          <div className="adm-form-group">
            <label className="adm-label">Tên khóa học <span style={{color:"#E41E26"}}>*</span></label>
            <input className="adm-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="VD: Kỹ năng thuyết trình nâng cao" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Trainer <span style={{color:"#E41E26"}}>*</span></label>
            <input className="adm-input" value={form.trainer} onChange={e => set("trainer", e.target.value)} placeholder="Tên trainer" />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Loại trainer</label>
            <select className="adm-select" value={form.trainer_type} onChange={e => set("trainer_type", e.target.value)}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Format</label>
            <select className="adm-select" value={form.format} onChange={e => set("format", e.target.value)}>
              {["online","offline","elearning","webinar","workshop","bootcamp","talk"].map(f => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Thời lượng (giờ)</label>
            <input className="adm-input" type="number" min="0.5" step="0.5" value={form.duration_hours} onChange={e => set("duration_hours", e.target.value)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">XP reward</label>
            <input className="adm-input" type="number" min="0" value={form.xp_reward} onChange={e => set("xp_reward", e.target.value)} />
          </div>
        </div>

        <div className="adm-form-group" style={{ marginBottom: 14 }}>
          <label className="adm-label">Rank targets</label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {RANKS_ALL.map(r => (
              <button key={r.id} type="button" onClick={() => toggleRank(r.id)} style={{
                padding: "5px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: form.rank_targets.includes(r.id) ? "rgba(228,30,38,.15)" : "rgba(255,255,255,.04)",
                border: `1px solid ${form.rank_targets.includes(r.id) ? "var(--glh-accent)" : "var(--rpg-border)"}`,
                color: form.rank_targets.includes(r.id) ? "#E41E26" : "var(--rpg-muted)",
                cursor: "pointer", transition: "all .12s",
              }}>{r.name}</button>
            ))}
          </div>
        </div>

        <div className="adm-form-group" style={{ marginBottom: 14 }}>
          <label className="adm-label">Mô tả</label>
          <textarea className="adm-input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Mô tả ngắn về khoá học..." style={{ resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Link đăng ký</label>
            <input className="adm-input" value={form.registration_url} onChange={e => set("registration_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Số người tối thiểu</label>
            <input className="adm-input" type="number" min="1" value={form.min_participants} onChange={e => set("min_participants", e.target.value)} placeholder="Không bắt buộc" />
          </div>
        </div>

        <div className="adm-form-group" style={{ marginBottom: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Toggle value={form.is_active} onChange={v => set("is_active", v)} />
            <span style={{ fontSize: 13, color: "var(--rpg-muted)" }}>Hiển thị cho người dùng</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={() => onSave(form)} disabled={saving || !canSave}>
            {saving ? <><Icon name="loader" size={13} /> Đang lưu...</> : <><Icon name="check" size={13} /> {isEdit ? "Lưu thay đổi" : "Tạo khóa học"}</>}
          </button>
        </div>
      </div>
    );
  }

  function ImportForm({ onClose, courses }) {
    const [courseId, setCourseId] = React.useState("");
    const [fileName, setFileName] = React.useState(null);
    const [result, setResult]     = React.useState(null);
    const [loading, setLoading]   = React.useState(false);
    const [fileData, setFileData] = React.useState(null);

    function handleFile(e) {
      const f = e.target.files?.[0];
      if (!f) return;
      setFileName(f.name);
      const reader = new FileReader();
      reader.onload = ev => setFileData(ev.target.result);
      reader.readAsText(f);
    }

    async function handleImport() {
      if (!courseId || !fileData) return;
      setLoading(true);
      try {
        const res = await fetch(`/admin/api/courses/${courseId}/import-participants`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: fileData }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        setResult({ error: e.message });
      } finally {
        setLoading(false);
      }
    }

    if (result && !result.error) return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { l: "Enrolled",   v: result.enrolled || 0,   c: "#2BB6A3" },
            { l: "Not found",  v: result.not_found || 0,  c: "#F5A623" },
            { l: "Đã tồn tại", v: result.already_enrolled || 0, c: "#8A93A8" },
          ].map(i => (
            <div key={i.l} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: i.c, marginBottom: 3 }}>{i.v}</div>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{i.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--primary" onClick={onClose}><Icon name="check" size={13} /> Xong</button>
        </div>
      </div>
    );

    return (
      <div>
        <div className="adm-form-group" style={{ marginBottom: 14 }}>
          <label className="adm-label">Khóa học</label>
          <select className="adm-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">-- Chọn khóa học --</option>
            {courses.filter(c => c.is_active).map(c => (
              <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
            ))}
          </select>
        </div>
        <label className="adm-upload-zone" style={{ cursor: "pointer" }}>
          <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFile} />
          <Icon name="file-plus" size={30} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{fileName || "Click để chọn file CSV"}</div>
          <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Cột email: <code>email</code></div>
        </label>
        {result?.error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 10 }}>{result.error}</div>}
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleImport} disabled={!courseId || !fileData || loading}>
            {loading ? "Đang xử lý..." : <><Icon name="refresh-cw" size={13} /> Import</>}
          </button>
        </div>
      </div>
    );
  }

  function SyncCoursesForm({ onClose, onSynced }) {
    const [fileName, setFileName] = React.useState(null);
    const [csvText, setCsvText]   = React.useState(null);
    const [step, setStep]         = React.useState("upload"); // upload | errors | ready | done
    const [batch, setBatch]       = React.useState(null);
    const [errorRows, setErrorRows] = React.useState([]);
    const [loading, setLoading]   = React.useState(false);
    const [error, setError]       = React.useState("");

    function handleFile(e) {
      const f = e.target.files?.[0];
      if (!f) return;
      setFileName(f.name);
      setStep("upload");
      const reader = new FileReader();
      reader.onload = ev => setCsvText(ev.target.result);
      reader.readAsText(f);
    }

    async function handleCheck() {
      if (!csvText) return;
      setLoading(true); setError("");
      try {
        const res = await fetch("/admin/api/data-prep/courses/import-csv", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText, source: `CSV upload — ${fileName}` }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setErrorRows((data.results || []).filter(r => r.errors.length));
          setStep("errors");
          return;
        }
        setBatch({ id: data.batchId, savedRows: data.savedRows });
        setStep("ready");
      } catch (e) {
        setError(e.message || "Kiểm tra thất bại");
      } finally {
        setLoading(false);
      }
    }

    async function handlePromote() {
      if (!batch) return;
      setLoading(true); setError("");
      try {
        const res = await fetch("/admin/api/data-prep/courses/promote", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: batch.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Promote thất bại");
        setStep("done");
        onSynced?.();
      } catch (e) {
        setError(e.message || "Promote thất bại");
      } finally {
        setLoading(false);
      }
    }

    if (step === "done") return (
      <div>
        <div style={{ background: "rgba(43,182,163,.1)", border: "1px solid rgba(43,182,163,.3)", borderRadius: 8, padding: "14px 16px", marginBottom: 18, color: "#2BB6A3", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="check-circle" size={16} /> Đã đồng bộ {batch.savedRows} khóa học lên hệ thống.
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--primary" onClick={onClose}><Icon name="check" size={13} /> Xong</button>
        </div>
      </div>
    );

    if (step === "errors") return (
      <div>
        <div style={{ color: "var(--rpg-muted)", fontSize: 13, marginBottom: 12 }}>
          {errorRows.length} dòng có lỗi — sửa trong Sheet rồi tải lại CSV, chưa có gì được lưu.
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--rpg-border)", borderRadius: 8 }}>
          {errorRows.map(r => (
            <div key={r.index} style={{ padding: "10px 14px", borderBottom: "1px solid var(--rpg-border)", fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>Dòng {r.index + 2} — {r.row.course_id || "(không có mã)"}</div>
              <div style={{ color: "#ff6b6b" }}>{r.errors.join("; ")}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="adm-btn adm-btn--sec" onClick={() => setStep("upload")}>Chọn file khác</button>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );

    if (step === "ready") return (
      <div>
        <div style={{ background: "rgba(43,182,163,.1)", border: "1px solid rgba(43,182,163,.3)", borderRadius: 8, padding: "14px 16px", marginBottom: 18, color: "#2BB6A3", fontSize: 13 }}>
          Đã lưu nháp {batch.savedRows} khóa học, chưa hiển thị cho người dùng. Bấm &quot;Đẩy lên live&quot; để áp dụng.
        </div>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={loading}>Để sau</button>
          <button className="adm-btn adm-btn--primary" onClick={handlePromote} disabled={loading}>
            {loading ? "Đang đẩy lên..." : <><Icon name="upload" size={13} /> Đẩy lên live</>}
          </button>
        </div>
      </div>
    );

    return (
      <div>
        <div style={{ fontSize: 12, color: "var(--rpg-muted)", marginBottom: 12, lineHeight: 1.5 }}>
          Cột cần có: <code>course_id, title, trainer, format, duration_hours, type, xp_reward</code> — các cột khác tuỳ chọn (description, skill_tags, rank_targets, role_targets, min_participants, registration_url, is_active, trainer_type).
        </div>
        <label className="adm-upload-zone" style={{ cursor: "pointer" }}>
          <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
          <Icon name="file-plus" size={30} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{fileName || "Click để chọn file CSV"}</div>
          <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Export từ Google Sheet: File → Download → Comma Separated Values</div>
        </label>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleCheck} disabled={!csvText || loading}>
            {loading ? "Đang kiểm tra..." : <><Icon name="refresh-cw" size={13} /> Kiểm tra & Lưu nháp</>}
          </button>
        </div>
      </div>
    );
  }

  export const ADMScreens1 = { Dashboard, CoursesScreen };