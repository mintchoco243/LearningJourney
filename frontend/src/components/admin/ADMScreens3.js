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
          <div className="adm-empty" style={{ marginTop: 40 }}>Chưa có policy nào. Nhấn "Thêm policy" để tạo mới.</div>
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
          <button className="adm-btn adm-btn--primary" onClick={handleAdd} disabled={saving || !form.email.includes("@garena.vn")}>
            {saving ? "Đang lưu..." : <><Icon name="check" size={13} /> Thêm vào whitelist</>}
          </button>
        </div>
      </div>
    );
  }

  /* ===================== TESTIMONIALS ===================== */
  export function TestimonialsScreen() {
    const [testimonials, setTestimonials] = React.useState(D.ADMIN_TESTIMONIALS);
    const [filterCourse, setFilterCourse] = React.useState("all");

    const courses = [...new Set(testimonials.map(t => t.course_id))].map(id => ({
      id, title: (testimonials.find(t => t.course_id === id) || {}).course_title || id,
    }));

    const filtered = filterCourse === "all" ? testimonials : testimonials.filter(t => t.course_id === filterCourse);

    function toggleFeatured(id) {
      setTestimonials(ts => ts.map(t => t.id === id ? { ...t, is_featured: !t.is_featured } : t));
    }

    return (
      <div data-screen-label="Testimonials">
        <PageHeader
          title="Testimonials"
          subtitle={`${testimonials.filter(t => t.is_featured).length} nổi bật · ${testimonials.length} tổng cộng`}
        />

        <div className="adm-filter-row">
          <div className="adm-tab-filter">
            <button className={`adm-tab-filter__item${filterCourse==="all"?" is-active":""}`} onClick={()=>setFilterCourse("all")}>Tất cả</button>
            {courses.map(c => (
              <button key={c.id} className={`adm-tab-filter__item${filterCourse===c.id?" is-active":""}`} onClick={()=>setFilterCourse(c.id)}>
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-testimonial-grid">
          {filtered.map(t => (
            <div key={t.id} className={`adm-testimonial-card${t.is_featured?" is-featured":""}`}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{t.user_name}</div>
                  <div style={{ fontSize: 11, color: "var(--rpg-muted)", marginTop: 2 }}>{t.user_role}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {t.is_featured && <Badge status="featured" />}
                  <Toggle value={t.is_featured} onChange={() => toggleFeatured(t.id)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 2, marginBottom: 9 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Icon key={i} name="star" size={13} color={i < t.rating ? "var(--amber)" : "var(--rpg-faint)"} fill={i < t.rating ? "var(--amber)" : "none"} />
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--rpg-text)", lineHeight: 1.65, margin: "0 0 11px" }}>"{t.content}"</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--rpg-faint)" }}>
                <span>{t.course_title}</span>
                <span>{t.created_at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  export const ADMScreens3 = { PolicyScreen, AccountsScreen, TestimonialsScreen };