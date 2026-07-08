"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { ADMComponents } from './ADMComponents';

const { Icon } = GLHUI;
const { Badge, PageHeader, Modal, SearchInput } = ADMComponents;

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { credentials: "include", ...opts });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || res.status); }
  return res.json();
}

export function FaqsScreen() {
  const [faqs, setFaqs]               = React.useState([]);
  const [loading, setLoading]         = React.useState(true);
  const [search, setSearch]           = React.useState("");
  const [topicFilter, setTopicFilter] = React.useState("all");
  const [editModal, setEditModal]     = React.useState(false);
  const [editTarget, setEditTarget]   = React.useState(null);
  const [saving, setSaving]           = React.useState(false);
  const [formError, setFormError]     = React.useState("");

  function reload() {
    return apiFetch("/admin/api/faqs")
      .then(data => { if (data.faqs) setFaqs(data.faqs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  React.useEffect(() => { reload(); }, []);

  const topics = [...new Set(faqs.map(f => f.topic).filter(Boolean))];

  const filtered = faqs.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || [f.topic, f.question, f.answer].some(v => (v || "").toLowerCase().includes(q));
    const matchTopic  = topicFilter === "all" || f.topic === topicFilter;
    return matchSearch && matchTopic;
  });

  function openCreate() {
    setEditTarget(null);
    setFormError("");
    setEditModal(true);
  }

  function openEdit(faq) {
    setEditTarget(faq);
    setFormError("");
    setEditModal(true);
  }

  async function handleSave(formData) {
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const data = await apiFetch(`/admin/api/faqs/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (data.faq) setFaqs(fs => fs.map(f => f.id === editTarget.id ? data.faq : f));
      } else {
        const data = await apiFetch("/admin/api/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (data.faq) setFaqs(fs => [...fs, data.faq]);
      }
      setEditModal(false);
    } catch (e) {
      setFormError(e.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(faq) {
    if (!window.confirm(`Xóa FAQ "${faq.question.slice(0, 60)}..."?`)) return;
    try {
      await apiFetch(`/admin/api/faqs/${faq.id}`, { method: "DELETE" });
      setFaqs(fs => fs.filter(f => f.id !== faq.id));
    } catch (e) {
      alert("Xóa thất bại: " + e.message);
    }
  }

  return (
    <div data-screen-label="FAQs">
      <PageHeader
        title="Quản lý FAQs"
        subtitle={`${faqs.length} câu hỏi`}
        action={
          <button className="adm-btn adm-btn--primary" onClick={openCreate}>
            <Icon name="file-plus" size={14} /> Thêm FAQ
          </button>
        }
      />

      {loading && (
        <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải FAQs...</div>
      )}

      <div className="adm-filter-row">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm topic, câu hỏi, nội dung..." />
        <div className="adm-tab-filter">
          <button className={`adm-tab-filter__item${topicFilter === "all" ? " is-active" : ""}`} onClick={() => setTopicFilter("all")}>
            Tất cả
          </button>
          {topics.map(t => (
            <button key={t} className={`adm-tab-filter__item${topicFilter === t ? " is-active" : ""}`} onClick={() => setTopicFilter(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Topic</th>
              <th>Câu hỏi</th>
              <th>Status</th>
              <th>Cập nhật</th>
              <th>Bởi</th>
              <th style={{ width: 96 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id}>
                <td style={{ color: "var(--rpg-muted)", textAlign: "center" }}>{f.display_order}</td>
                <td>
                  <span style={{ fontWeight: 700, color: "var(--rpg-text)" }}>{f.topic}</span>
                </td>
                <td style={{ maxWidth: 340 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--rpg-text)" }}>
                    {f.question}
                  </div>
                </td>
                <td>
                  <Badge status={f.status === "Published" ? "active" : "inactive"} />
                </td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                  {(f.updated_at || "").slice(0, 10)}
                </td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>
                  {f.last_updated_by || "-"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => openEdit(f)}>
                      <Icon name="edit-3" size={13} />
                    </button>
                    <button className="adm-btn adm-btn--sm" style={{ color: "var(--rpg-danger, #C0504D)" }} onClick={() => handleDelete(f)}>
                      <Icon name="trash-2" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="adm-empty" style={{ marginTop: 28 }}>
          {search || topicFilter !== "all" ? "Không tìm thấy FAQ nào." : "Chưa có FAQ nào. Bấm «Thêm FAQ» để tạo."}
        </div>
      )}

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editTarget ? "Chỉnh sửa FAQ" : "Thêm FAQ mới"}
        width={640}
      >
        <FaqForm
          faq={editTarget}
          onSave={handleSave}
          onClose={() => setEditModal(false)}
          saving={saving}
          error={formError}
        />
      </Modal>
    </div>
  );
}

function FaqForm({ faq, onSave, onClose, saving, error }) {
  const [form, setForm] = React.useState({
    topic:         faq?.topic         || "",
    question:      faq?.question      || "",
    answer:        faq?.answer        || "",
    status:        faq?.status        || "Published",
    display_order: faq?.display_order ?? 0,
  });

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, display_order: Number(form.display_order) || 0 });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      {error && (
        <div style={{ background: "rgba(192,80,77,.13)", border: "1px solid rgba(192,80,77,.35)", borderRadius: 6, padding: "10px 14px", color: "#C0504D", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="adm-form-group">
          <label className="adm-label">Topic <span style={{ color: "#C0504D" }}>*</span></label>
          <input className="adm-input" value={form.topic} onChange={e => set("topic", e.target.value)} placeholder="Vd: Đăng ký khoá học" required />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Thứ tự hiển thị</label>
          <input className="adm-input" type="number" min={0} value={form.display_order} onChange={e => set("display_order", e.target.value)} />
        </div>
      </div>

      <div className="adm-form-group">
        <label className="adm-label">Câu hỏi <span style={{ color: "#C0504D" }}>*</span></label>
        <textarea className="adm-textarea" rows={2} value={form.question} onChange={e => set("question", e.target.value)} placeholder="Nhập câu hỏi..." required />
      </div>

      <div className="adm-form-group">
        <label className="adm-label">Câu trả lời <span style={{ color: "#C0504D" }}>*</span></label>
        <textarea className="adm-textarea" rows={5} value={form.answer} onChange={e => set("answer", e.target.value)} placeholder="Nhập câu trả lời..." required />
      </div>

      <div className="adm-form-group">
        <label className="adm-label">Trạng thái</label>
        <select className="adm-select" value={form.status} onChange={e => set("status", e.target.value)}>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid var(--rpg-border)" }}>
        <button type="button" className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>
          Huỷ
        </button>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
          {saving ? "Đang lưu..." : faq ? "Lưu thay đổi" : "Tạo FAQ"}
        </button>
      </div>
    </form>
  );
}
