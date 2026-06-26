/* =============================================================
   Admin screens 3 — Policy, Admin Accounts, Testimonials
   Exports: window.ADMScreens3 = { PolicyScreen, AccountsScreen, TestimonialsScreen }
   ============================================================= */
(function () {
  "use strict";
  const { Icon } = window.GLHUI;
  const { Badge, PageHeader, Modal, Toggle } = window.ADMComponents;
  const D = window.ADM_DATA;

  /* ===================== POLICY ===================== */
  function PolicyScreen() {
    const [policies, setPolicies] = React.useState(D.ADMIN_POLICIES);
    const [importModal, setImportModal] = React.useState(false);
    const [editEntry,   setEditEntry]   = React.useState(null);

    function toggleEntry(catId, entryId) {
      setPolicies(cats => cats.map(cat =>
        cat.id !== catId ? cat : {
          ...cat,
          entries: cat.entries.map(e => e.id === entryId ? { ...e, is_active: !e.is_active } : e),
        }
      ));
    }

    return (
      <div data-screen-label="Policy">
        <PageHeader
          title="Quản lý Chính sách"
          subtitle="Import, chỉnh sửa, sắp xếp policy L&D"
          action={
            <button className="adm-btn adm-btn--primary" onClick={() => setImportModal(true)}>
              <Icon name="file-plus" size={14} /> Import policy
            </button>
          }
        />

        {policies.map(cat => (
          <div key={cat.id} className="adm-policy-category">
            <div className="adm-policy-cat-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="adm-drag-handle"><Icon name="sliders-horizontal" size={13} /></span>
                <h3 className="adm-policy-cat-title">{cat.category}</h3>
                <span style={{ fontSize: 11, color: "var(--rpg-faint)" }}>{cat.entries.length} entries</span>
              </div>
            </div>
            {cat.entries.map(entry => (
              <div key={entry.id} className="adm-policy-entry">
                <span className="adm-drag-handle"><Icon name="sliders" size={12} color="var(--rpg-faint)" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: entry.is_active ? "#fff" : "var(--rpg-muted)", fontSize: 13 }}>
                      {entry.title}
                    </span>
                    {!entry.is_active && <Badge status="inactive" />}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--rpg-muted)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                    {entry.preview}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--rpg-faint)", marginTop: 4 }}>Cập nhật: {entry.updated_at}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                  <Toggle value={entry.is_active} onChange={() => toggleEntry(cat.id, entry.id)} />
                  <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => setEditEntry(entry)}>
                    <Icon name="edit-3" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Import modal */}
        <Modal open={importModal} onClose={() => setImportModal(false)} title="Import Policy" width={560}>
          <PolicyImport onClose={() => setImportModal(false)} />
        </Modal>

        {/* Edit modal */}
        <Modal open={!!editEntry} onClose={() => setEditEntry(null)} title={editEntry ? `Chỉnh sửa: ${editEntry.title}` : ""} width={680}>
          {editEntry && <PolicyEditor entry={editEntry} onClose={() => setEditEntry(null)} />}
        </Modal>
      </div>
    );
  }

  function PolicyImport({ onClose }) {
    const [step, setStep]       = React.useState(1);
    const [fileName, setFileName] = React.useState(null);
    const PREVIEW_MD = `# Chính sách học phí & tài trợ khóa học\n\n## 1. Phạm vi áp dụng\n\nÁp dụng cho nhân viên chính thức Garena Việt Nam từ **6 tháng** trở lên.\n\n## 2. Mức hỗ trợ\n\n- Khóa học trong danh mục L&D: **100% học phí**\n- Ngoài danh mục (đã được duyệt): tối đa **5,000,000 VNĐ/năm**\n\n## 3. Quy trình\n\n1. Đăng nhập Learning Hub → chọn khóa học → đặt chỗ\n2. Nhận xác nhận qua email trong **24 giờ**`;

    return (
      <div>
        {/* Step indicator */}
        <div style={{ display: "flex", marginBottom: 22 }}>
          {["Upload file", "Preview nội dung", "Xác nhận lưu"].map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: "center", padding: "7px 0", fontSize: 12, fontWeight: 700,
              color: step === i+1 ? "#E41E26" : step > i+1 ? "#2BB6A3" : "var(--rpg-faint)",
              borderBottom: `2px solid ${step === i+1 ? "#E41E26" : step > i+1 ? "#2BB6A3" : "var(--rpg-border)"}`,
            }}>
              {step > i+1 ? "✓ " : ""}{s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="adm-upload-zone" onClick={() => { setFileName("policy_hoc_phi_2026.docx"); }}>
              <Icon name="file-plus" size={28} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>
                {fileName ? fileName : "Kéo thả hoặc click để chọn file"}
              </div>
              <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Hỗ trợ .DOCX và .PDF</div>
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
              <button className="adm-btn adm-btn--primary" onClick={() => setStep(2)} disabled={!fileName}>
                Parse nội dung →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: 16, maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
              <pre style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 13, color: "var(--rpg-text)", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.75 }}>
                {PREVIEW_MD}
              </pre>
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button className="adm-btn adm-btn--sec" onClick={() => setStep(1)}>← Quay lại</button>
              <button className="adm-btn adm-btn--primary" onClick={() => setStep(3)}>Nội dung OK →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="adm-form-group">
              <label className="adm-label">Tiêu đề policy</label>
              <input className="adm-input" defaultValue="Chính sách học phí & tài trợ khóa học" />
            </div>
            <div className="adm-form-group">
              <label className="adm-label">Danh mục</label>
              <select className="adm-select">
                {D.ADMIN_POLICIES.map(c => <option key={c.id} value={c.id}>{c.category}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button className="adm-btn adm-btn--sec" onClick={() => setStep(2)}>← Quay lại</button>
              <button className="adm-btn adm-btn--primary" onClick={onClose}>
                <Icon name="check" size={13} /> Lưu policy
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  function PolicyEditor({ entry, onClose }) {
    const [content, setContent] = React.useState(`# ${entry.title}\n\n${entry.preview}\n\n(Tiếp tục nội dung đầy đủ...)`);
    return (
      <div>
        <div className="adm-form-group">
          <label className="adm-label">Nội dung Markdown</label>
          <textarea
            className="adm-textarea"
            style={{ minHeight: 260, fontFamily: "monospace", fontSize: 13, lineHeight: 1.65 }}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={onClose}>
            <Icon name="check" size={13} /> Lưu thay đổi
          </button>
        </div>
      </div>
    );
  }

  /* ===================== ADMIN ACCOUNTS ===================== */
  function AccountsScreen() {
    const [accounts, setAccounts] = React.useState(D.ADMIN_ACCOUNTS);
    const [addModal, setAddModal] = React.useState(false);

    function toggle(id) {
      setAccounts(as => as.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a));
    }

    return (
      <div data-screen-label="Admin Accounts">
        <PageHeader
          title="Admin Accounts"
          subtitle="Whitelist email đăng nhập admin · Chỉ Super Admin thấy trang này"
          action={
            <button className="adm-btn adm-btn--primary" onClick={() => setAddModal(true)}>
              <Icon name="user" size={14} /> Thêm admin
            </button>
          }
        />

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
                  <td style={{ fontWeight: 600, color: "#fff" }}>{a.full_name}</td>
                  <td><Badge status={a.role} /></td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.created_at}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Toggle
                        value={a.is_active}
                        onChange={() => toggle(a.id)}
                        disabled={a.email === "vananh.le@garena.vn"}
                      />
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
          <AddAdminForm onClose={() => setAddModal(false)} />
        </Modal>
      </div>
    );
  }

  function AddAdminForm({ onClose }) {
    return (
      <div>
        <div className="adm-form-group">
          <label className="adm-label">Email (@garena.vn)</label>
          <input className="adm-input" type="email" placeholder="email@garena.vn" />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Họ tên</label>
          <input className="adm-input" placeholder="Nguyễn Văn A" />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Role</label>
          <select className="adm-select">
            <option value="ld_admin">L&D Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div className="adm-info-banner adm-info-banner--amber" style={{ marginBottom: 18 }}>
          <Icon name="info" size={13} color="#F5A623" style={{ flexShrink: 0, marginTop: 1 }} />
          Chỉ chấp nhận email @garena.vn. User sẽ nhận email hướng dẫn đăng nhập lần đầu qua Google OAuth.
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={onClose}>
            <Icon name="check" size={13} /> Thêm vào whitelist
          </button>
        </div>
      </div>
    );
  }

  /* ===================== TESTIMONIALS ===================== */
  function TestimonialsScreen() {
    const [testimonials, setTestimonials] = React.useState(D.ADMIN_TESTIMONIALS);
    const [filterCourse, setFilterCourse] = React.useState("all");

    const courses = [...new Set(testimonials.map(t => t.course_id))].map(id => ({
      id, title: testimonials.find(t => t.course_id === id).course_title,
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
                  <Icon key={i} name="star" size={13}
                    color={i < t.rating ? "var(--amber)" : "var(--rpg-faint)"}
                    fill={i < t.rating ? "var(--amber)" : "none"}
                  />
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--rpg-text)", lineHeight: 1.65, margin: "0 0 11px" }}>
                "{t.content}"
              </p>
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

  window.ADMScreens3 = { PolicyScreen, AccountsScreen, TestimonialsScreen };
})();
