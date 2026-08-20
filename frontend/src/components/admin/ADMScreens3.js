"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { ADMComponents } from './ADMComponents';
import { ADM_DATA } from '@/data/admData';
import { apiFetch as sharedApiFetch } from '@/lib/apiClient';

const { Icon } = GLHUI;
const { Badge, PageHeader, StatCard, SectionCard, Modal, Toggle, SearchInput } = ADMComponents;
const D = ADM_DATA;


  
  

  async function apiFetch(path, opts = {}) {
    return sharedApiFetch(path, opts);
  }

  function groupPolicies(flat) {
    const map = {};
    flat.forEach(p => {
      if (!map[p.category]) map[p.category] = { id: p.category, category: p.category, order_index: p.order_index || 0, entries: [] };
      map[p.category].entries.push({
        id: p.id,
        title: p.title,
        preview: (p.content || "").slice(0, 120),
        is_active: Boolean(p.is_active),
        updated_at: (p.updated_at || "").slice(0, 10),
        content: p.content || "",
      });
    });
    return Object.values(map).sort((a, b) => a.order_index - b.order_index);
  }

  /* ===================== POLICY ===================== */
  export function PolicyScreen() {
    const [policies, setPolicies] = React.useState(groupPolicies(D.ADMIN_POLICIES.flatMap(c => c.entries.map(e => ({ ...e, category: c.category })))));
    const [loading, setLoading]   = React.useState(true);
    const [importModal, setImportModal] = React.useState(false);
    const [editEntry,   setEditEntry]   = React.useState(null);

    React.useEffect(() => {
      apiFetch("/admin/api/policies")
        .then(data => { if (data.policies?.length) setPolicies(groupPolicies(data.policies)); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    async function toggleEntry(entryId, currentVal) {
      const newVal = !currentVal;
      setPolicies(cats => cats.map(cat => ({
        ...cat,
        entries: cat.entries.map(e => e.id === entryId ? { ...e, is_active: newVal } : e),
      })));
      try {
        await apiFetch(`/admin/api/policies/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: newVal }),
        });
      } catch {
        setPolicies(cats => cats.map(cat => ({
          ...cat,
          entries: cat.entries.map(e => e.id === entryId ? { ...e, is_active: currentVal } : e),
        })));
      }
    }

    async function handleSaveEntry(id, { title, content }) {
      try {
        const data = await apiFetch(`/admin/api/policies/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (data.policy) {
          const p = data.policy;
          setPolicies(cats => cats.map(cat => ({
            ...cat,
            entries: cat.entries.map(e => e.id === id ? { ...e, title: p.title, content: p.content, preview: (p.content || "").slice(0, 120), updated_at: (p.updated_at || "").slice(0, 10) } : e),
          })));
        }
        setEditEntry(null);
      } catch (e) {
        alert("Lưu thất bại: " + e.message);
      }
    }

    async function handleCreatePolicy(formData) {
      try {
        const data = await apiFetch("/admin/api/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (data.policy) {
          const p = data.policy;
          setPolicies(cats => {
            const existing = cats.find(c => c.category === p.category);
            const newEntry = { id: p.id, title: p.title, preview: (p.content || "").slice(0, 120), is_active: Boolean(p.is_active), updated_at: (p.updated_at || "").slice(0, 10), content: p.content || "" };
            if (existing) {
              return cats.map(c => c.category === p.category ? { ...c, entries: [...c.entries, newEntry] } : c);
            }
            return [...cats, { id: p.category, category: p.category, order_index: 99, entries: [newEntry] }];
          });
        }
        setImportModal(false);
      } catch (e) {
        alert("Tạo policy thất bại: " + e.message);
      }
    }

    return (
      <div data-screen-label="Policy">
        <PageHeader
          title="Quản lý Chính sách"
          subtitle="Import, chỉnh sửa, sắp xếp policy L&D"
          action={
            <button className="adm-btn adm-btn--primary" onClick={() => setImportModal(true)}>
              <Icon name="file-plus" size={14} /> Thêm policy
            </button>
          }
        />

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải...</div>}

        {policies.map(cat => (
          <div key={cat.id} className="adm-policy-category">
            <div className="adm-policy-cat-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 className="adm-policy-cat-title">{cat.category}</h3>
                <span style={{ fontSize: 11, color: "var(--rpg-faint)" }}>{cat.entries.length} entries</span>
              </div>
            </div>
            {cat.entries.map(entry => (
              <div key={entry.id} className="adm-policy-entry">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: entry.is_active ? "#fff" : "var(--rpg-muted)", fontSize: 13 }}>{entry.title}</span>
                    {!entry.is_active && <Badge status="inactive" />}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--rpg-muted)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                    {entry.preview}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--rpg-faint)", marginTop: 4 }}>Cập nhật: {entry.updated_at}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                  <Toggle value={entry.is_active} onChange={() => toggleEntry(entry.id, entry.is_active)} />
                  <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => setEditEntry(entry)}>
                    <Icon name="edit-3" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {!loading && policies.length === 0 && (
          <div className="adm-empty" style={{ marginTop: 40 }}>Chưa có policy nào. Nhấn &quot;Thêm policy&quot; để tạo mới.</div>
        )}

        <Modal open={importModal} onClose={() => setImportModal(false)} title="Thêm / Import Policy" width={580}>
          <PolicyCreate onClose={() => setImportModal(false)} onSave={handleCreatePolicy} categories={policies.map(c => c.category)} />
        </Modal>

        <Modal open={!!editEntry} onClose={() => setEditEntry(null)} title={editEntry ? `Chỉnh sửa: ${editEntry.title}` : ""} width={700}>
          {editEntry && <PolicyEditor entry={editEntry} onSave={handleSaveEntry} onClose={() => setEditEntry(null)} />}
        </Modal>
      </div>
    );
  }

  function PolicyCreate({ onClose, onSave, categories }) {
    const [form, setForm] = React.useState({ title: "", category: categories[0] || "", content: "", newCategory: "", is_active: true });
    const [useNew, setUseNew] = React.useState(false);

    function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

    function handleSave() {
      onSave({
        title: form.title,
        category: useNew ? form.newCategory : form.category,
        content: form.content,
        is_active: form.is_active,
      });
    }

    return (
      <div>
        <div className="adm-form-group">
          <label className="adm-label">Tiêu đề policy</label>
          <input className="adm-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="VD: Chính sách học phí 2026" />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Danh mục</label>
          {!useNew ? (
            <div style={{ display: "flex", gap: 8 }}>
              <select className="adm-select" style={{ flex: 1 }} value={form.category} onChange={e => set("category", e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setUseNew(true)}>+ Mới</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input className="adm-input" style={{ flex: 1 }} value={form.newCategory} onChange={e => set("newCategory", e.target.value)} placeholder="Tên danh mục mới..." />
              <button type="button" className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setUseNew(false)}>← Chọn có sẵn</button>
            </div>
          )}
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Nội dung (Markdown)</label>
          <textarea className="adm-textarea" style={{ minHeight: 200, fontFamily: "monospace", fontSize: 12, lineHeight: 1.65 }} value={form.content} onChange={e => set("content", e.target.value)} placeholder="# Tiêu đề&#10;&#10;## Phần 1&#10;&#10;Nội dung..." />
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleSave} disabled={!form.title.trim() || (!form.category && !form.newCategory)}>
            <Icon name="check" size={13} /> Lưu policy
          </button>
        </div>
      </div>
    );
  }

  function PolicyEditor({ entry, onSave, onClose }) {
    const [title, setTitle]     = React.useState(entry.title);
    const [content, setContent] = React.useState(entry.content || `# ${entry.title}\n\n${entry.preview}`);
    const [saving, setSaving]   = React.useState(false);

    async function handleSave() {
      setSaving(true);
      await onSave(entry.id, { title, content });
      setSaving(false);
    }

    return (
      <div>
        <div className="adm-form-group">
          <label className="adm-label">Tiêu đề</label>
          <input className="adm-input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Nội dung Markdown</label>
          <textarea
            className="adm-textarea"
            style={{ minHeight: 280, fontFamily: "monospace", fontSize: 13, lineHeight: 1.65 }}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Đang lưu..." : <><Icon name="check" size={13} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>
    );
  }

  /* ===================== ADMIN ACCOUNTS ===================== */
  export function AccountsScreen() {
    const [accounts, setAccounts] = React.useState(D.ADMIN_ACCOUNTS);
    const [loading, setLoading]   = React.useState(true);
    const [addModal, setAddModal] = React.useState(false);
    const [addError, setAddError] = React.useState("");

    React.useEffect(() => {
      apiFetch("/admin/api/accounts")
        .then(data => { if (data.accounts) setAccounts(data.accounts); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    async function toggle(id, currentVal) {
      const newVal = !currentVal;
      setAccounts(as => as.map(a => a.id === id ? { ...a, is_active: newVal } : a));
      try {
        await apiFetch(`/admin/api/accounts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: newVal }),
        });
      } catch {
        setAccounts(as => as.map(a => a.id === id ? { ...a, is_active: currentVal } : a));
      }
    }

    async function handleAdd(formData) {
      setAddError("");
      try {
        const data = await apiFetch("/admin/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (data.account) setAccounts(as => [...as, data.account]);
        setAddModal(false);
      } catch (e) {
        setAddError(e.message || "Thêm thất bại");
      }
    }

    return (
      <div data-screen-label="Admin Accounts">
        <PageHeader
          title="Admin Accounts"
          subtitle="Whitelist email đăng nhập admin · Chỉ Super Admin thấy trang này"
          action={
            <button className="adm-btn adm-btn--primary" onClick={() => { setAddError(""); setAddModal(true); }}>
              <Icon name="user" size={14} /> Thêm admin
            </button>
          }
        />

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải...</div>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Email</th>
                <th style={{ width: 180 }}>Họ tên</th>
                <th style={{ width: 130 }}>Role</th>
                <th style={{ width: 110 }}>Ngày thêm</th>
                <th style={{ width: 140 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} style={{ opacity: a.is_active ? 1 : 0.45 }}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{a.email}</td>
                  <td style={{ fontWeight: 600, color: "#fff" }}>{a.full_name || "—"}</td>
                  <td><Badge status={a.role} /></td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{(a.created_at || "").slice(0, 10)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Toggle value={Boolean(a.is_active)} onChange={() => toggle(a.id, a.is_active)} />
                      <span style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.is_active ? "Hoạt động" : "Tạm khoá"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="adm-info-banner adm-info-banner--blue" style={{ marginTop: 14 }}>
          <Icon name="info" size={13} color="#6aa3e0" style={{ flexShrink: 0, marginTop: 1 }} />
          Chỉ toggle hoạt động / tạm khoá — không xoá account. Log đầy đủ được giữ lại cho audit.
        </div>

        <Modal open={addModal} onClose={() => setAddModal(false)} title="Thêm admin mới" width={460}>
          <AddAdminForm onClose={() => setAddModal(false)} onAdd={handleAdd} error={addError} />
        </Modal>
      </div>
    );
  }

  function AddAdminForm({ onClose, onAdd, error }) {
    const [form, setForm] = React.useState({ email: "", full_name: "", role: "ld_admin" });
    const [saving, setSaving] = React.useState(false);
    const emailAllowed = /^[^@]+@garena\.vn$/i.test(form.email.trim()) && !/(?:_ctv|_ext)@garena\.vn$/i.test(form.email.trim());
    function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
    async function handleAdd() { setSaving(true); await onAdd(form); setSaving(false); }

    return (
      <div>
        {error && <div style={{ background: "rgba(228,30,38,.1)", border: "1px solid rgba(228,30,38,.3)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
        <div className="adm-form-group">
          <label className="adm-label">Email (@garena.vn)</label>
          <input className="adm-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@garena.vn" />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Họ tên</label>
          <input className="adm-input" value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Nguyễn Văn A" />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Role</label>
          <select className="adm-select" value={form.role} onChange={e => set("role", e.target.value)}>
            <option value="ld_admin">L&D Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div className="adm-info-banner adm-info-banner--amber" style={{ marginBottom: 18 }}>
          <Icon name="info" size={13} color="#F5A623" style={{ flexShrink: 0, marginTop: 1 }} />
          Chỉ chấp nhận email @garena.vn. User sẽ đăng nhập bằng Google OAuth.
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleAdd} disabled={saving || !emailAllowed}>
            {saving ? "Đang lưu..." : <><Icon name="check" size={13} /> Thêm vào whitelist</>}
          </button>
        </div>
      </div>
    );
  }

  /* ===================== TESTIMONIALS ===================== */
  function normalizeTestimonial(t) {
    return {
      id: t.id,
      course_id: t.course_id,
      course_code: t.course_code || t.course_id,
      course_title: t.course_title || t.title || t.course_code || t.course_id,
      course_type: t.course_type || t.type || "",
      user_name: t.user_name || t.full_name || "Người dùng",
      user_role: t.user_role || "Learner",
      user_team: t.user_team || "",
      rating: Number(t.rating || 0),
      content: t.content || "",
      aspect_ratings: parseJsonMaybe(t.aspect_ratings, {}),
      applied_learning: t.applied_learning || "",
      improvement_feedback: t.improvement_feedback || "",
      is_featured: Boolean(t.is_featured),
      created_at: String(t.created_at || "").slice(0, 10),
    };
  }

  function parseJsonMaybe(value, fallback = {}) {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try { return JSON.parse(value); } catch { return fallback; }
  }

  export function SiteFeedbackScreen() {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [dateFilter, setDateFilter] = React.useState("");
    const [ratingFilter, setRatingFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [commentFilter, setCommentFilter] = React.useState("all");
    const [detailItem, setDetailItem] = React.useState(null);

    const normalize = React.useCallback((item) => {
      return {
        ...item,
        aspect_ratings: parseJsonMaybe(item.aspect_ratings),
        aspect_feedback: parseJsonMaybe(item.aspect_feedback),
        status: item.status || "open",
        created_at: String(item.created_at || "").slice(0, 16).replace("T", " "),
      };
    }, []);

    const reload = React.useCallback(() => {
      return apiFetch("/admin/api/site-feedback")
        .then(data => {
          const rows = Array.isArray(data.feedback) ? data.feedback : [];
          setItems(rows.map(normalize));
        })
        .finally(() => setLoading(false));
    }, [normalize]);

    React.useEffect(() => {
      reload().catch(() => setLoading(false));
    }, [reload]);

    async function updateStatus(item, status) {
      const data = await apiFetch(`/admin/api/site-feedback/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated = normalize(data.feedback);
      setItems(rows => rows.map(row => row.id === updated.id ? updated : row));
      setDetailItem(current => current?.id === updated.id ? updated : current);
    }

    const ratingOf = (item, key) => item.aspect_ratings?.[key] || "-";
    const userLabel = (item) => item.is_anonymous ? "Anonymous" : (item.user_name || "User");
    const teamRole = (item) => item.is_anonymous ? "-" : ([item.user_team, item.user_role].filter(Boolean).join(" / ") || "-");
    const hasComment = (item) => Boolean(String(item.additional_feedback || "").trim());
    const filtered = items.filter(item => {
      if (dateFilter && !String(item.created_at || "").startsWith(dateFilter)) return false;
      if (ratingFilter !== "all" && Number(item.overall_rating) !== Number(ratingFilter)) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (commentFilter === "yes" && !hasComment(item)) return false;
      if (commentFilter === "no" && hasComment(item)) return false;
      return true;
    });

    return (
      <div data-screen-label="Site Feedback">
        <PageHeader
          title="Site Feedback"
          subtitle={`${filtered.length}/${items.length} feedback entries`}
        />

        <div className="adm-filter-row">
          <input className="adm-input" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ maxWidth: 170 }} />
          <select className="adm-select" value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={{ maxWidth: 150 }}>
            <option value="all">All ratings</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} stars</option>)}
          </select>
          <select className="adm-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 150 }}>
            <option value="all">All status</option>
            {["open", "reviewed", "resolved"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="adm-select" value={commentFilter} onChange={e => setCommentFilter(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="all">All comments</option>
            <option value="yes">Has comment</option>
            <option value="no">No comment</option>
          </select>
        </div>

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Loading feedback...</div>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>Date</th>
                <th style={{ minWidth: 150 }}>User</th>
                <th style={{ minWidth: 150 }}>Team/Role</th>
                <th style={{ width: 90 }}>Overall</th>
                <th style={{ width: 80 }}>UI</th>
                <th style={{ width: 90 }}>Content</th>
                <th style={{ width: 105 }}>Navigation</th>
                <th style={{ width: 110 }}>Performance</th>
                <th>Additional feedback</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>{item.created_at}</td>
                  <td style={{ color: "#fff", fontWeight: 700 }}>{userLabel(item)}</td>
                  <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>{teamRole(item)}</td>
                  <td style={{ color: "var(--amber)", fontWeight: 800 }}>{item.overall_rating}/5</td>
                  <td>{ratingOf(item, "visual")}</td>
                  <td>{ratingOf(item, "content")}</td>
                  <td>{ratingOf(item, "usability")}</td>
                  <td>{ratingOf(item, "usefulness")}</td>
                  <td style={{ maxWidth: 280, color: "var(--rpg-muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.additional_feedback || "-"}
                  </td>
                  <td>
                    <select className="adm-select" value={item.status} onChange={e => updateStatus(item, e.target.value)} style={{ minWidth: 112, fontSize: 12, padding: "6px 28px 6px 10px" }}>
                      {["open", "reviewed", "resolved"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setDetailItem(item)}>Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="adm-empty">No feedback matches the filters.</div>}
        </div>

        <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Feedback detail" width={700}>
          {detailItem && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  ["Date", detailItem.created_at],
                  ["User", userLabel(detailItem)],
                  ["Team/Role", teamRole(detailItem)],
                  ["Overall", `${detailItem.overall_rating}/5`],
                  ["Status", detailItem.status],
                  ["Has comment", hasComment(detailItem) ? "Yes" : "No"],
                ].map(([label, value]) => (
                  <div key={label} style={{ border: "1px solid var(--rpg-border)", borderRadius: 8, padding: 10, background: "rgba(255,255,255,.03)" }}>
                    <div style={{ color: "var(--rpg-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{label}</div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{value || "-"}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  ["UI", "visual"],
                  ["Content", "content"],
                  ["Navigation", "usability"],
                  ["Performance", "usefulness"],
                ].map(([label, key]) => (
                  <div key={key} style={{ border: "1px solid var(--rpg-border)", borderRadius: 8, padding: 10, background: "rgba(255,255,255,.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: detailItem.aspect_feedback?.[key] ? 8 : 0 }}>
                      <span style={{ color: "var(--rpg-muted)", fontSize: 12, fontWeight: 700 }}>{label}</span>
                      <span style={{ color: "#fff", fontWeight: 800 }}>{ratingOf(detailItem, key)}/5</span>
                    </div>
                    {detailItem.aspect_feedback?.[key] && <div style={{ color: "var(--rpg-text)", fontSize: 12, lineHeight: 1.5 }}>{detailItem.aspect_feedback[key]}</div>}
                  </div>
                ))}
              </div>
              <div style={{ border: "1px solid var(--rpg-border)", borderRadius: 8, padding: 12, background: "rgba(255,255,255,.03)", color: "var(--rpg-text)", fontSize: 13, lineHeight: 1.6 }}>
                {detailItem.additional_feedback || "No additional feedback."}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                {["open", "reviewed", "resolved"].map(s => (
                  <button key={s} className={`adm-btn adm-btn--sm${detailItem.status === s ? " adm-btn--primary" : " adm-btn--sec"}`} onClick={() => updateStatus(detailItem, s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  export function TestimonialsScreen() {
    const [testimonials, setTestimonials] = React.useState(() => D.ADMIN_TESTIMONIALS.map(normalizeTestimonial));
    const [filterCourse, setFilterCourse] = React.useState("all");
    const [filterType, setFilterType] = React.useState("all");
    const [selected, setSelected] = React.useState(null);
    const [editingId, setEditingId] = React.useState(null);
    const [editDraft, setEditDraft] = React.useState(null);
    const [savingId, setSavingId] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const aspectLabels = {
      overall: "Tổng thể",
      content: "Nội dung",
      trainer: "Giảng viên",
      organization_support: "Tổ chức & hỗ trợ",
    };

    React.useEffect(() => {
      apiFetch("/admin/api/testimonials")
        .then(data => {
          if (data.testimonials) setTestimonials(data.testimonials.map(normalizeTestimonial));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const courses = [...new Set(testimonials.map(t => t.course_id))].map(id => ({
      id, title: (testimonials.find(t => t.course_id === id) || {}).course_title || id,
    }));

    const typeOptions = [...new Set(testimonials.map(t => t.course_type).filter(Boolean))].sort();
    const filteredTestimonials = testimonials.filter(t =>
      (filterCourse === "all" || t.course_id === filterCourse)
      && (filterType === "all" || t.course_type === filterType)
    );

    async function toggleFeatured(id) {
      const current = testimonials.find(t => t.id === id);
      if (!current) return;
      const nextVal = !current.is_featured;
      setTestimonials(ts => ts.map(t => t.id === id ? { ...t, is_featured: nextVal } : t));
      try {
        const data = await apiFetch(`/admin/api/testimonials/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_featured: nextVal }),
        });
        if (data.testimonial) {
          const updated = normalizeTestimonial(data.testimonial);
          setTestimonials(ts => ts.map(t => t.id === id ? updated : t));
        }
      } catch {
        setTestimonials(ts => ts.map(t => t.id === id ? { ...t, is_featured: current.is_featured } : t));
      }
    }

    function startEdit(testimonial) {
      setEditingId(testimonial.id);
      setEditDraft({
        rating: testimonial.rating,
        content: testimonial.content,
        applied_learning: testimonial.applied_learning,
        improvement_feedback: testimonial.improvement_feedback,
      });
    }

    async function saveEdit(id) {
      if (!editDraft) return;
      setSavingId(id);
      try {
        const data = await apiFetch(`/admin/api/testimonials/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editDraft),
        });
        if (data.testimonial) {
          const updated = normalizeTestimonial(data.testimonial);
          setTestimonials(ts => ts.map(t => t.id === id ? updated : t));
          setSelected(current => current?.id === id ? updated : current);
        }
        setEditingId(null);
        setEditDraft(null);
      } finally {
        setSavingId(null);
      }
    }

    return (
      <div data-screen-label="Testimonials">
        <PageHeader
          title="Testimonials"
          subtitle={`${testimonials.filter(t => t.is_featured).length} nổi bật · ${testimonials.length} tổng cộng`}
        />

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải testimonials...</div>}

        <div className="adm-filter-row">
          <select className="adm-select" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ minWidth: 280 }}>
            <option value="all">Tất cả khóa học</option>
            {courses.sort((a, b) => a.title.localeCompare(b.title, "vi")).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select className="adm-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: 180 }}>
            <option value="all">Tất cả loại khóa</option>
            {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table adm-testimonials-table">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th>Người gửi</th>
                <th>Tổng thể</th>
                <th>Nội dung</th>
                <th>Giảng viên</th>
                <th>Tổ chức & hỗ trợ</th>
                <th>Điều áp dụng được</th>
                <th>Góp ý cải thiện</th>
                <th>Ngày gửi</th>
                <th>Nổi bật</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTestimonials.map(t => {
                const isEditing = editingId === t.id;
                return <tr key={t.id}>
                  <td className="adm-testimonial-sticky-left">
                    <div style={{ fontWeight: 700, color: "#fff" }}>{t.course_title}</div>
                    <div style={{ color: "var(--rpg-faint)", fontSize: 11 }}>{t.course_code} · {t.course_type || "-"}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#fff" }}>{t.user_name}</div>
                    <div style={{ color: "var(--rpg-muted)", fontSize: 11 }}>{[t.user_team, t.user_role].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td style={{ color: "var(--amber)", fontWeight: 800 }}>
                    {isEditing ? <input className="adm-input adm-testimonial-rating-input" type="number" min="1" max="5" value={editDraft.rating} onChange={e => setEditDraft(d => ({ ...d, rating: e.target.value }))} /> : `${t.aspect_ratings.overall || t.rating}/5`}
                  </td>
                  <td>{t.aspect_ratings.content || "-"}/5</td>
                  <td>{t.aspect_ratings.trainer || "-"}/5</td>
                  <td>{t.aspect_ratings.organization_support || "-"}/5</td>
                  <td style={{ maxWidth: 220 }}>
                    {isEditing ? <textarea className="adm-input adm-testimonial-edit-textarea" value={editDraft.applied_learning} onChange={e => setEditDraft(d => ({ ...d, applied_learning: e.target.value }))} /> : <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.applied_learning || "-"}</div>}
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    {isEditing ? <textarea className="adm-input adm-testimonial-edit-textarea" value={editDraft.improvement_feedback} onChange={e => setEditDraft(d => ({ ...d, improvement_feedback: e.target.value }))} /> : <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.improvement_feedback || t.content || "-"}</div>}
                  </td>
                  <td>{t.created_at}</td>
                  <td className="adm-testimonial-sticky-right adm-testimonial-featured-cell">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {t.is_featured && <Badge status="featured" />}
                      <Toggle value={t.is_featured} onChange={() => toggleFeatured(t.id)} />
                    </div>
                  </td>
                  <td className="adm-testimonial-sticky-right adm-testimonial-actions-cell">
                    {isEditing ? <>
                      <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => saveEdit(t.id)} disabled={savingId === t.id}>{savingId === t.id ? "Đang lưu" : "Lưu"}</button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => { setEditingId(null); setEditDraft(null); }}>Huỷ</button>
                    </> : <>
                      <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => startEdit(t)}>Sửa</button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setSelected(t)}><Icon name="eye" size={13} /> Xem</button>
                    </>}
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        {!loading && filteredTestimonials.length === 0 && (
          <div className="adm-empty" style={{ marginTop: 28 }}>Chưa có testimonial nào từ user.</div>
        )}

        <Modal open={!!selected} onClose={() => setSelected(null)} title="Chi tiết đánh giá khóa học" width={720}>
          {selected && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{selected.course_title}</div>
                <div style={{ color: "var(--rpg-muted)", fontSize: 12, marginTop: 4 }}>
                  {selected.user_name} · {[selected.user_team, selected.user_role].filter(Boolean).join(" · ") || "Learner"} · {selected.created_at}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                {Object.entries(aspectLabels).map(([key, label]) => (
                  <div key={key} style={{ border: "1px solid var(--rpg-border)", borderRadius: 6, padding: 10, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ color: "var(--rpg-muted)", fontSize: 12, fontWeight: 700 }}>{label}</div>
                    <div style={{ color: key === "overall" ? "var(--amber)" : "#fff", fontWeight: 900, fontSize: 18, marginTop: 4 }}>{selected.aspect_ratings[key] || (key === "overall" ? selected.rating : "-")}/5</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ color: "var(--rpg-muted)", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Điều học được và có thể áp dụng</div>
                <p style={{ margin: 0, color: "var(--rpg-text)", lineHeight: 1.65 }}>{selected.applied_learning || "Không có phản hồi."}</p>
              </div>
              <div>
                <div style={{ color: "var(--rpg-muted)", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Phản hồi / gợi ý cải thiện</div>
                <p style={{ margin: 0, color: "var(--rpg-text)", lineHeight: 1.65 }}>{selected.improvement_feedback || selected.content || "Không có phản hồi."}</p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  export function IntegrationsScreen() {
    const [activeTab, setActiveTab] = React.useState("ga");
    const [msg, setMsg] = React.useState("");

    // Bot states
    const [baseUrl, setBaseUrl] = React.useState("");
    const [apiKey, setApiKey] = React.useState("");
    const [expertId, setExpertId] = React.useState("");
    const [loadingBot, setLoadingBot] = React.useState(true);
    const [savingBot, setSavingBot] = React.useState(false);

    // GA states
    const [propertyId, setPropertyId] = React.useState("");
    const [measurementId, setMeasurementId] = React.useState("");
    const [serviceAccountJson, setServiceAccountJson] = React.useState("");
    const [hasServiceAccount, setHasServiceAccount] = React.useState(false);
    const [serviceAccountEmail, setServiceAccountEmail] = React.useState("");
    const [loadingGa, setLoadingGa] = React.useState(true);
    const [savingGa, setSavingGa] = React.useState(false);

    React.useEffect(() => {
      apiFetch("/admin/api/settings/bot")
        .then(data => {
          setBaseUrl(data.baseUrl || "");
          setApiKey(data.apiKey || "");
          setExpertId(data.expertId || "");
        })
        .catch(() => {})
        .finally(() => setLoadingBot(false));

      apiFetch("/admin/api/settings/analytics")
        .then(data => {
          setPropertyId(data.propertyId || "");
          setMeasurementId(data.measurementId || "");
          setHasServiceAccount(Boolean(data.hasServiceAccount));
          setServiceAccountEmail(data.serviceAccountEmail || "");
        })
        .catch(() => {})
        .finally(() => setLoadingGa(false));
    }, []);

    async function handleSaveBot(e) {
      e.preventDefault();
      setSavingBot(true);
      setMsg("");
      try {
        const res = await apiFetch("/admin/api/settings/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseUrl, apiKey, expertId })
        });
        setMsg(res.message || "Đã lưu cấu hình AI Bot thành công!");
      } catch (err) {
        alert("Lỗi khi lưu cấu hình AI Bot: " + err.message);
      } finally {
        setSavingBot(false);
      }
    }

    async function handleSaveGa(e) {
      e.preventDefault();
      setSavingGa(true);
      setMsg("");
      try {
        const res = await apiFetch("/admin/api/settings/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, measurementId, serviceAccountJson })
        });
        setMsg(res.message || "Đã lưu cấu hình Google Analytics thành công!");
        setServiceAccountJson("");
        const updated = await apiFetch("/admin/api/settings/analytics");
        setPropertyId(updated.propertyId || "");
        setMeasurementId(updated.measurementId || "");
        setHasServiceAccount(Boolean(updated.hasServiceAccount));
        setServiceAccountEmail(updated.serviceAccountEmail || "");
      } catch (err) {
        alert("Lỗi khi lưu cấu hình GA: " + err.message);
      } finally {
        setSavingGa(false);
      }
    }

    if (loadingBot && loadingGa) {
      return <div style={{ color: "var(--rpg-muted)", padding: 40, textAlign: "center" }}>Đang tải cấu hình hệ thống...</div>;
    }

    return (
      <div style={{ maxWidth: 720 }}>
        <PageHeader
          title="Cấu hình Hệ thống (Integrations)"
          sub="Thiết lập kết nối với các dịch vụ bên ngoài (Google Analytics & AI Bot Alpha Knowledge)."
        />

        <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--rpg-border)", paddingBottom: 12, marginBottom: 24, marginTop: 20 }}>
          <button
            type="button"
            className={`adm-btn ${activeTab === "ga" ? "adm-btn--primary" : ""}`}
            onClick={() => { setActiveTab("ga"); setMsg(""); }}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            Google Analytics (GA4)
          </button>
          <button
            type="button"
            className={`adm-btn ${activeTab === "bot" ? "adm-btn--primary" : ""}`}
            onClick={() => { setActiveTab("bot"); setMsg(""); }}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            AI Bot (Alpha Knowledge)
          </button>
        </div>

        {activeTab === "ga" ? (
          <div className="adm-section">
            <form onSubmit={handleSaveGa} style={{ display: "grid", gap: 20 }}>
              <div style={{ padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  Trạng thái kết nối Google Analytics Data API
                </div>
                <div style={{ fontSize: 13, color: "var(--rpg-text)" }}>
                  Service Account: <strong style={{ color: hasServiceAccount ? "#2BB6A3" : "#F5A623" }}>
                    {hasServiceAccount ? (serviceAccountEmail || "Đã cấu hình Key JSON") : "Chưa cấu hình"}
                  </strong>
                </div>
                {hasServiceAccount && serviceAccountEmail && (
                  <div style={{ fontSize: 12, color: "var(--rpg-muted)", lineHeight: 1.5 }}>
                    💡 <em>Hãy chắc chắn bạn đã thêm email <strong>{serviceAccountEmail}</strong> vào mục <strong>Property Access Management</strong> trên GA4 với quyền <strong>Viewer</strong>.</em>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  GA4 Measurement ID <span style={{ color: "var(--rpg-muted)", fontWeight: 400 }}>(Dành cho tracking Frontend, ví dụ: G-XXXXXXXXXX)</span>
                </label>
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%", padding: "10px 14px" }}
                  value={measurementId}
                  onChange={e => setMeasurementId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  GA4 Property ID <span style={{ color: "var(--amber)" }}>*</span> <span style={{ color: "var(--rpg-muted)", fontWeight: 400 }}>(Dành cho Data API Backend, ví dụ: 123456789)</span>
                </label>
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%", padding: "10px 14px" }}
                  value={propertyId}
                  onChange={e => setPropertyId(e.target.value)}
                  placeholder="123456789"
                />
                <div style={{ color: "var(--rpg-muted)", fontSize: 12, marginTop: 4 }}>
                  Lấy từ GA4 -&gt; Admin -&gt; Property Details.
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Service Account JSON Key <span style={{ color: "var(--rpg-muted)", fontWeight: 400 }}>{hasServiceAccount ? "(Để trống nếu giữ nguyên key cũ)" : "(Dán toàn bộ nội dung file .json tải từ Google Cloud)"}</span>
                </label>
                <textarea
                  className="adm-input"
                  style={{ width: "100%", padding: "10px 14px", minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
                  value={serviceAccountJson}
                  onChange={e => setServiceAccountJson(e.target.value)}
                  placeholder={hasServiceAccount ? "•••••••••••••••• (Đã lưu trong Database - Để trống để giữ nguyên)" : '{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  "private_key": "...",\n  "client_email": "..."\n}'}
                />
                <div style={{ color: "var(--rpg-muted)", fontSize: 12, marginTop: 4 }}>
                  Tải file JSON từ Google Cloud Console -&gt; IAM &amp; Admin -&gt; Service Accounts -&gt; Keys. Nội dung sẽ được lưu vào Database production và không bao giờ hiển thị lại ra trình duyệt để bảo mật Private Key.
                </div>
              </div>

              {msg && (
                <div style={{ padding: "10px 14px", background: "rgba(43, 182, 163, 0.15)", border: "1px solid #2bb6a3", color: "#2bb6a3", borderRadius: 6, fontWeight: 600, fontSize: 13 }}>
                  {msg}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" className="adm-btn adm-btn--primary" disabled={savingGa} style={{ minWidth: 160 }}>
                  {savingGa ? "Đang lưu GA..." : "Lưu Cấu Hình GA"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="adm-section">
            <form onSubmit={handleSaveBot} style={{ display: "grid", gap: 20 }}>
              <div>
                <label style={{ display: "block", color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Alpha Knowledge Base URL <span style={{ color: "var(--rpg-muted)", fontWeight: 400 }}>(Mặc định: https://knowledge.alpha.insea.io/api/)</span>
                </label>
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%", padding: "10px 14px" }}
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://knowledge.alpha.insea.io/api/"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Expert ID <span style={{ color: "var(--amber)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="adm-input"
                  style={{ width: "100%", padding: "10px 14px" }}
                  value={expertId}
                  onChange={e => setExpertId(e.target.value)}
                  placeholder="Ví dụ: 00000000-0000-0000-0000-000000000000"
                  required
                />
                <div style={{ color: "var(--rpg-muted)", fontSize: 12, marginTop: 4 }}>
                  Lấy từ đường dẫn trang chỉnh sửa Bot trên hệ thống Alpha Knowledge.
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  API Key (Bearer Token) <span style={{ color: "var(--amber)" }}>*</span>
                </label>
                <input
                  type="password"
                  className="adm-input"
                  style={{ width: "100%", padding: "10px 14px" }}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Nhập API Key của bot..."
                />
                <div style={{ color: "var(--rpg-muted)", fontSize: 12, marginTop: 4 }}>
                  Lấy trong phần Cài đặt Bot -&gt; Khóa API trên hệ thống Alpha Knowledge. Key sẽ được mã hóa và lưu an toàn trong Database của server production.
                </div>
              </div>

              {msg && (
                <div style={{ padding: "10px 14px", background: "rgba(43, 182, 163, 0.15)", border: "1px solid #2bb6a3", color: "#2bb6a3", borderRadius: 6, fontWeight: 600, fontSize: 13 }}>
                  {msg}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" className="adm-btn adm-btn--primary" disabled={savingBot} style={{ minWidth: 140 }}>
                  {savingBot ? "Đang lưu Bot..." : "Lưu Cấu Hình Bot"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  export const ADMScreens3 = { PolicyScreen, AccountsScreen, TestimonialsScreen, SiteFeedbackScreen, BotSettingsScreen: IntegrationsScreen, IntegrationsScreen };

